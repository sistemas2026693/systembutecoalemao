import { chromium } from 'playwright-core'

const BASE = process.env.TEST_URL || 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

page.on('console', (msg) => console.log(`[console:${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => console.log('[pageerror]', err.message))
page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText))

await page.goto(BASE + '#/cardapio', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

const wsState = await page.evaluate(() => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return { proto, host: location.host, url: `${proto}://${location.host}/ws` }
})
console.log('ws config:', JSON.stringify(wsState))

await page.locator('button', { has: page.locator('svg.lucide-plus').first() }).first().click()
await page.waitForTimeout(300)
await page.getByText('Ver pedido').click()
await page.waitForTimeout(500)
await page.getByPlaceholder('Seu nome').fill('Debug Test')
await page.locator('select').selectOption({ label: 'Mesa 5' })
await page.getByText('Enviar pedido para o balcão').click()
await page.waitForTimeout(3000)

const statusText = await page.evaluate(() => document.body.innerText)
console.log('STATUS TEXT:', JSON.stringify(statusText.slice(0, 300)))

await browser.close()
