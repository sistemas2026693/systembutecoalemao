import { chromium } from 'playwright-core'

const BASE = process.env.TEST_URL || 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'
const browser = await chromium.launch()

async function newPage(label) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => console.log(`  [${label}] pageerror: ${e.message}`))
  return page
}

const errors = []
let orderId = null

// --- Cliente faz o pedido ---
const cliente = await newPage('cliente')
await cliente.goto(BASE + '#/cardapio', { waitUntil: 'networkidle' })
await cliente.waitForTimeout(800)

// adiciona itens ao carrinho
await cliente.locator('button', { has: cliente.locator('svg.lucide-plus').first() }).first().click()
await cliente.waitForTimeout(200)
// abre o carrinho
await cliente.getByText('Ver pedido').click()
await cliente.waitForTimeout(500)
// preenche nome e mesa
await cliente.getByPlaceholder('Seu nome').fill('Teste Browser')
await cliente.locator('select').selectOption({ label: 'Mesa 5' })
// envia
await cliente.getByText('Enviar pedido para o balcão').click()
await cliente.waitForTimeout(1500)

const statusText = await cliente.evaluate(() => document.body.innerText)
if (statusText.includes('PEDIDO')) {
  orderId = (statusText.match(/PEDIDO\s*#(\d+)/) || [])[1]
  console.log('OK  cliente enviou pedido #' + orderId)
} else {
  console.log('FALHA cliente: nao achou tela de status. Texto:', statusText.slice(0, 200).replace(/\n/g, ' | '))
  errors.push('cliente nao enviou pedido')
}

// --- Cozinha vê o pedido em tempo real ---
const cozinha = await newPage('cozinha')
await cozinha.goto(BASE + '#/cozinha', { waitUntil: 'networkidle' })
await cozinha.waitForTimeout(1500)
await cozinha.getByPlaceholder('••••').fill('1234')
await cozinha.getByText('Entrar no painel').click()
await cozinha.waitForTimeout(1500)

const kitchenText = await cozinha.evaluate(() => document.body.innerText)
if (orderId && kitchenText.includes('#' + orderId) && kitchenText.includes('Teste Browser')) {
  console.log('OK  cozinha viu o pedido #' + orderId + ' em tempo real')
} else {
  console.log('FALHA cozinha: pedido #' + orderId + ' nao encontrado')
  errors.push('cozinha nao recebeu pedido')
}

// --- Avança: Iniciar preparo -> Marcar pronto -> Entregar ---
if (orderId) {
  const card = cozinha.locator('div.glass', { hasText: '#' + orderId }).first()
  await card.getByText('Iniciar preparo').click()
  await cozinha.waitForTimeout(400)
  await card.getByText('Marcar pronto').click()
  await cozinha.waitForTimeout(400)
  console.log('OK  cozinha avançou pedido até pronto')

  // cliente vê a atualização em tempo real
  await cliente.waitForTimeout(800)
  const clientStatus = await cliente.evaluate(() => document.body.innerText)
  if (clientStatus.includes('pronto')) {
    console.log('OK  cliente viu atualização em tempo real (pedido pronto)')
  } else {
    errors.push('cliente nao viu status pronto')
    console.log('FALHA: cliente nao viu "pronto". Texto:', clientStatus.slice(0, 150).replace(/\n/g, ' | '))
  }

  await card.getByText('Entregar').click()
  await cozinha.waitForTimeout(600)
  const after = await cozinha.evaluate(() => document.body.innerText)
  if (!after.includes('#' + orderId)) {
    console.log('OK  pedido entregue e removido do painel')
  } else {
    errors.push('pedido nao foi removido')
    console.log('FALHA: pedido ainda no painel')
  }
}

await browser.close()
console.log('\n' + (errors.length ? `E2E FALHOU: ${errors.join('; ')}` : 'E2E COMPLETO — tudo funcionando em tempo real'))
process.exit(errors.length ? 1 : 0)
