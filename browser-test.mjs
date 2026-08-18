import { chromium } from 'playwright-core'

const BASE = process.env.TEST_URL || 'https://4000-b6eb9f9c747203a6.monkeycode-ai.live/'

const browser = await chromium.launch()
const errors = []

async function check(path, label, unlock) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const localErrors = []
  page.on('console', (msg) => { if (msg.type() === 'error') localErrors.push(`[console] ${msg.text()}`) })
  page.on('pageerror', (err) => localErrors.push(`[pageerror] ${err.message}`))
  page.on('requestfailed', (req) => localErrors.push(`[failed] ${req.url()} :: ${req.failure()?.errorText}`))

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  if (unlock) await unlock(page)

  const rootBytes = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0)
  const text = await page.evaluate(() => document.body.innerText.slice(0, 200))
  console.log(`\n[${label}] root=${rootBytes}B`)
  console.log(`  texto: ${JSON.stringify(text.replace(/\n+/g, ' | ').slice(0, 150))}`)
  if (localErrors.length) {
    console.log('  ERROS:')
    localErrors.forEach((e) => console.log('   ' + e))
    errors.push(...localErrors)
  }
  await page.screenshot({ path: `/tmp/opencode/shot-${label}.png` })
  await page.close()
}

await check('', 'landing')
await check('#/cardapio', 'cardapio')
await check('#/cozinha', 'cozinha', async (page) => {
  await page.getByPlaceholder('••••').fill('1234')
  await page.getByText('Entrar no painel').click()
  await page.waitForTimeout(1200)
})

await browser.close()
console.log('\n' + (errors.length ? `FALHOU com ${errors.length} erro(s)` : 'TUDO OK — nenhum erro de runtime'))
process.exit(errors.length ? 1 : 0)
