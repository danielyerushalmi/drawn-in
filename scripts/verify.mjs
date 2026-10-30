// Screenshots at each scene + numeric probes. Usage: [W=390 H=844] node scripts/verify.mjs [url]
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5411/'
const mobile = !!process.env.W, pre = mobile ? 'm-' : ''
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1440), height: +(process.env.H || 900) }, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile })
const errors = []
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()) })
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const st = () => page.evaluate(() => window.__stage?.state())
const s0 = await st()
console.log('load:', s0 && { scene: s0.scene, frame: s0.frame, maxY: Math.max(...s0.ys), minY: Math.min(...s0.ys) })
await page.screenshot({ path: `shots/${pre}01-hero.png` })
for (let i = 0; i < 60; i++) { await page.mouse.move(500 + 400 * Math.sin(i / 8), 420 + 160 * Math.cos(i / 6)); await page.waitForTimeout(16) }
await page.waitForTimeout(300)
console.log('after wiggle captures:', (await st()).captures)
await page.screenshot({ path: `shots/${pre}02-hero-drawn.png` })
// sticky scenes: scroll to 50% through each
const at = async (sel, f, name) => {
  await page.evaluate(([sel, f]) => { const el = document.querySelector(sel); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f) }, [sel, f])
  await page.waitForTimeout(1600)
  await page.mouse.move(mobile ? 200 : 1000, mobile ? 600 : 450)
  await page.waitForTimeout(400)
  const s = await st()
  console.log(name, 'scene:', s.scene)
  await page.screenshot({ path: `shots/${pre}${name}.png` })
}
await at('#ch-flash', 0.5, '03-flash')
await at('.scene-interlude', 0.5, '04-interlude')
await at('#ch-build', 0.5, '05-build')
await at('#ch-pull', 0.5, '06-feed')
await at('#gate', 0.3, '07-gate')
console.log('ERRORS:\n' + (errors.join('\n') || 'none'))
await browser.close()
