import { chromium } from 'playwright-core'
const BASE = 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'
const browser = await chromium.launch()
const errors = []
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', (e) => errors.push(e.message))

// 1. painel mostra tela de PIN
await page.goto(BASE + '#/cozinha', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
let text = await page.evaluate(() => document.body.innerText)
if (text.includes('PIN de acesso')) console.log('OK  tela de PIN exibida')
else { errors.push('sem tela de PIN'); console.log('FALHA:', text.slice(0,150).replace(/\n/g,' | ')) }

// 2. PIN errado -> erro
await page.getByPlaceholder('••••').fill('0000')
await page.getByText('Entrar no painel').click()
await page.waitForTimeout(800)
text = await page.evaluate(() => document.body.innerText)
if (text.includes('PIN incorreto')) console.log('OK  PIN errado mostrou erro')
else { errors.push('sem erro de PIN'); console.log('FALHA:', text.slice(0,150).replace(/\n/g,' | ')) }

// 3. PIN correto -> painel
await page.getByPlaceholder('••••').fill('1234')
await page.getByText('Entrar no painel').click()
await page.waitForTimeout(1200)
text = await page.evaluate(() => document.body.innerText)
if (text.includes('Pedidos') && text.includes('Cardápio') && text.includes('Dispositivos')) console.log('OK  painel desbloqueado com PIN correto')
else { errors.push('painel nao abriu'); console.log('FALHA:', text.slice(0,200).replace(/\n/g,' | ')) }

await browser.close()
console.log(errors.length ? 'PIN FALHOU: ' + errors.join('; ') : 'PIN COMPLETO — autenticação funcionando')
process.exit(errors.length ? 1 : 0)
