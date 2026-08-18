import { chromium } from 'playwright-core'

const BASE = process.env.TEST_URL || 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'
const browser = await chromium.launch()
const errors = []

async function newPage(label) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`))
  return page
}

async function placeOrder(page, name, table, qty = 1) {
  const restart = page.getByText('Fazer novo pedido')
  if ((await restart.count()) > 0) {
    await restart.click()
    await page.waitForTimeout(500)
  }
  await page.goto(BASE + '#/cardapio', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  for (let i = 0; i < qty; i++) {
    await page.locator('button', { has: page.locator('svg.lucide-plus').first() }).first().click()
    await page.waitForTimeout(150)
  }
  await page.getByText('Ver pedido').click()
  await page.waitForTimeout(400)
  await page.getByPlaceholder('Seu nome').fill(name)
  await page.locator('select').selectOption({ label: `Mesa ${table}` })
  await page.getByText('Enviar pedido para o balcão').click()
  await page.waitForTimeout(1200)
}

// Cliente A: dois pedidos na mesa 5 (para somar na comanda)
const cliente = await newPage('cliente')
await placeOrder(cliente, 'Comanda Test', 5)
await placeOrder(cliente, 'Comanda Test', 5)
const statusA = await cliente.evaluate(() => document.body.innerText)
const orderId = (statusA.match(/PEDIDO\s*#(\d+)/) || [])[1]
console.log('OK  cliente fez 2 pedidos (mesa 5), último #' + orderId)

// Cozinha: aba Comandas
const cozinha = await newPage('cozinha')
await cozinha.goto(BASE + '#/cozinha', { waitUntil: 'networkidle' })
await cozinha.waitForTimeout(1200)
await cozinha.getByPlaceholder('••••').fill('1234')
await cozinha.getByText('Entrar no painel').click()
await cozinha.waitForTimeout(1200)
await cozinha.getByText('Comandas').click()
await cozinha.waitForTimeout(800)

const kText = await cozinha.evaluate(() => document.body.innerText)
if (kText.toUpperCase().includes('MESA 5') && kText.toUpperCase().includes('EM ABERTO')) {
  console.log('OK  cozinha viu a comanda da mesa 5 agrupando os 2 pedidos')
} else {
  errors.push('comanda nao apareceu na cozinha')
  console.log('FALHA cozinha:', kText.slice(0, 300).replace(/\n/g, ' | '))
}

// Fechar comanda
await cozinha.getByText('Fechar comanda').click()
await cozinha.waitForTimeout(800)

// Cliente vê "Comanda fechada"
const clientText = await cliente.evaluate(() => document.body.innerText)
if (clientText.includes('Comanda fechada')) {
  console.log('OK  cliente viu "Comanda fechada" em tempo real')
} else {
  errors.push('cliente nao viu comanda fechada')
}

// Cozinha confirma pagamento
const c2 = await cozinha.evaluate(() => document.body.innerText)
if (c2.includes('Aguardando pagamento')) {
  console.log('OK  comanda em "aguardando pagamento"')
}
await cozinha.getByText('Confirmar pagamento').click()
await cozinha.waitForTimeout(1000)

// Cliente vê pagamento confirmado
const clientText2 = await cliente.evaluate(() => document.body.innerText)
if (clientText2.includes('Pagamento confirmado')) {
  console.log('OK  cliente viu "Pagamento confirmado" em tempo real')
} else {
  errors.push('cliente nao viu pagamento confirmado')
}

// Comanda limpa no painel
const kText2 = await cozinha.evaluate(() => document.body.innerText)
if (!kText2.includes('Mesa 5') || kText2.includes('Nenhuma comanda aberta')) {
  console.log('OK  comanda encerrada e limpa do painel')
} else {
  errors.push('comanda nao foi limpa')
}

await browser.close()
console.log('\n' + (errors.length ? `FALHOU: ${errors.join('; ')}` : 'FLUXO DE COMANDA COMPLETO — tudo funcionando em tempo real'))
process.exit(errors.length ? 1 : 0)
