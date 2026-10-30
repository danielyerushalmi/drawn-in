// Real-state screenshots of every section, for a visual pass. Usage: node scripts/review.mjs WxH [url]
import { chromium } from 'playwright'
const [w, h] = (process.argv[2] || '1440x900').split('x').map(Number)
const url = process.argv[3] || 'http://localhost:5411/'
const mobile = w < 900, tag = `${w}x${h}`
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1 })
await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
const shot = n => page.screenshot({ path: `shots/review/${tag}-${n}.png` })
const mid = async (sel, f = 0.5) => { await page.evaluate(([sel, f]) => { const el = document.querySelector(sel); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f) }, [sel, f]); await page.waitForTimeout(1500) }
if (!mobile) for (let i = 0; i < 30; i++) { await page.mouse.move(300 + i * 20, 500); await page.waitForTimeout(16) }
await shot('01-hero')
await mid('#ch-flash'); await page.click('[data-flash-start]'); await page.waitForSelector('.flash-choose:not([hidden])'); await shot('02-flash-choose')
await page.click('[data-flash-pick="a"]'); await page.waitForTimeout(400); await shot('03-flash-done')
await mid('.scene-interlude'); await shot('04-interlude')
await mid('#ch-build'); await page.click('[data-build-auto]'); await page.waitForTimeout(1200)
await page.locator('[data-price="own"]').fill('8'); await page.waitForTimeout(300); await shot('05-build-priced')
await mid('#ch-pull'); for (let i = 0; i < 3; i++) { await page.click('[data-pull-btn]'); await page.waitForTimeout(1100) } await shot('06-feed')
await page.evaluate(() => document.querySelector('#gate .gate-btn').scrollIntoView({ block: 'center' })); await page.waitForTimeout(2200); await shot('07-gate')
await page.click('[data-continue]'); await page.waitForTimeout(2400); await shot('08-curtain'); await page.waitForTimeout(3000)
const at = async (sel, n, block = 'start') => { await page.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b }), [sel, block]); await page.waitForTimeout(1600); await shot(n) }
await at('#reveal', '09-reveal')
await at('.report', '10-report')
await at('.tactics', '11-tactics')
await at('#quiz', '12-quiz-before')
await page.click('.q[data-q="plain"] .opt >> nth=0'); await page.click('.q[data-q="toy"] .opt >> nth=1'); await page.waitForTimeout(900); await at('#quiz', '13-quiz-after', 'center')
await at('.calm-intro', '14-part2')
await at('#ledger', '15-ledger')
await at('#weight', '16-weight', 'center')
await at('#attn-chart', '17-bars', 'center')
await at('.curve-fig', '18-curve', 'center')
await at('#purpose', '19-principles')
await mid('#finale'); await page.waitForTimeout(1500); await shot('20-finale')
await at('#sources', '21-sources')
await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(800); await shot('22-footer')
await browser.close()
