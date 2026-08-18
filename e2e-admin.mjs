import { chromium } from 'playwright-core'

const BASE = process.env.TEST_URL || 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'
const browser = await chromium.launch()
const errors = []

async function newPage(label) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`))
  return page
}

const cozinha = await newPage('cozinha')
await cozinha.goto(BASE + '#/cozinha', { waitUntil: 'networkidle' })
await cozinha.waitForTimeout(1200)
await cozinha.getByPlaceholder('••••').fill('1234')
await cozinha.getByText('Entrar no painel').click()
await cozinha.waitForTimeout(1200)
await cozinha.getByText('Cardápio', { exact: true }).click()
await cozinha.waitForTimeout(800)

const itemName = `Cerveja Teste ${Date.now() % 1000}`
await cozinha.getByPlaceholder('Nome do item').fill(itemName)
await cozinha.getByPlaceholder('Preço (R$)').fill('19.90')
await cozinha.getByText('Adicionar ao cardápio').click()
await cozinha.waitForTimeout(800)

const kitchenText = await cozinha.evaluate(() => document.body.innerText)
if (kitchenText.includes(itemName)) {
  console.log('OK  cozinha adicionou item "' + itemName + '"')
} else {
  errors.push('item nao apareceu no cardapio do painel')
  console.log('FALHA painel:', kitchenText.slice(0, 200).replace(/\n/g, ' | '))
}

const cliente = await newPage('cliente')
await cliente.goto(BASE + '#/cardapio', { waitUntil: 'networkidle' })
await cliente.waitForTimeout(1200)
const clientText = await cliente.evaluate(() => document.body.innerText)
if (clientText.includes(itemName)) {
  console.log('OK  cliente viu o novo item "' + itemName + '" no cardápio')
} else {
  errors.push('item nao apareceu no cardapio do cliente')
  console.log('FALHA cliente:', clientText.slice(0, 200).replace(/\n/g, ' | '))
}

await cozinha.getByText('Dispositivos').click()
await cozinha.waitForTimeout(800)
const devText = await cozinha.evaluate(() => document.body.innerText)
if (devText.includes('Cliente ·')) {
  console.log('OK  cozinha viu o cliente na lista de dispositivos')
} else {
  errors.push('cliente nao listado')
  console.log('FALHA dispositivos:', devText.slice(0, 200).replace(/\n/g, ' | '))
}

cozinha.on('dialog', (d) => d.accept())
const clientRow = cozinha.locator('div.glass', { hasText: 'Cliente ·' }).first()
await clientRow.getByText('Remover').click()
await cozinha.waitForTimeout(800)

await cliente.waitForTimeout(1200)
const kickedText = await cliente.evaluate(() => document.body.innerText)
if (kickedText.includes('ACESSO ENCERRADO')) {
  console.log('OK  cliente expulso viu o aviso de acesso encerrado')
} else {
  errors.push('cliente nao viu overlay de expulsao')
  console.log('FALHA overlay:', kickedText.slice(0, 150).replace(/\n/g, ' | '))
}

await cozinha.getByText('Cardápio', { exact: true }).click()
await cozinha.waitForTimeout(600)
const testRow = cozinha.locator('div.glass', { hasText: itemName }).first()
await testRow.locator('button').last().click()
await cozinha.waitForTimeout(800)
const afterClean = await cozinha.evaluate(() => document.body.innerText)
if (afterClean.includes(itemName)) {
  errors.push('item de teste nao foi removido do cardapio')
} else {
  console.log('OK  item de teste removido do cardápio')
}

await browser.close()
console.log('\n' + (errors.length ? `ADMIN FALHOU: ${errors.join('; ')}` : 'ADMIN COMPLETO — cardápio e expulsão funcionando'))
process.exit(errors.length ? 1 : 0)
