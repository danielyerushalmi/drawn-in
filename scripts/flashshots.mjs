// Holds each state of the flash screen and screenshots it. Usage: node scripts/flashshots.mjs WxH [url]
import { chromium } from 'playwright'
const [w, h] = (process.argv[2] || '1440x900').split('x').map(Number)
const url = process.argv[3] || 'http://localhost:5411/'
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 })
await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => { const el = document.querySelector('#ch-flash'); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.5) })
await page.waitForTimeout(2500)
for (const s of ['idle', 'A', 'B', 'ask']) {
  await page.evaluate(s => window.__stage.show(s), s); await page.waitForTimeout(300)
  await page.screenshot({ path: `shots/flash-${w}-${s}.png` })
}
await page.evaluate(() => window.__stage.show('idle'))
await page.click('[data-flash-start]'); await page.waitForSelector('.flash-choose:not([hidden])')
await page.click('[data-flash-pick="a"]'); await page.waitForTimeout(600)
await page.screenshot({ path: `shots/flash-${w}-compare.png` })
await browser.close()
