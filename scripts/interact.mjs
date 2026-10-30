// Plays through every toy like a visitor, then checks the reveal reports it. Usage: node scripts/interact.mjs [url]
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5411/'
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
const st = () => page.evaluate(() => window.__stage.state())
const sceneAt = async (sel, f = 0.5) => {
  await page.evaluate(([sel, f]) => { const el = document.querySelector(sel); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f) }, [sel, f])
  await page.waitForTimeout(1500)
}
for (let i = 0; i < 40; i++) { await page.mouse.move(300 + i * 18, 450); await page.waitForTimeout(16) }

// flash: the tiles must vanish, become page A, vanish, page B, then come back
await sceneAt('#ch-flash')
await page.click('[data-flash-start]')
const seen = new Set()
for (let i = 0; i < 160; i++) { seen.add((await st()).screen); await page.waitForTimeout(5) }
console.log('flash screen states seen:', [...seen].join(','))
await page.waitForSelector('.flash-choose:not([hidden])', { timeout: 5000 })
await page.click('[data-flash-pick="a"]')
console.log('flash result:', (await page.textContent('[data-flash-result]')).slice(0, 50))

// build: drag each 3D piece onto a free slot of its kind
await sceneAt('#ch-build')
await page.waitForTimeout(1200)
for (let k = 0; k < 5; k++) {
  const { piece, slot } = await page.evaluate(() => {
    const ps = window.__stage.pieceScreens().filter(p => !p.placed)
    const p = ps[0]; if (!p) return {}
    const taken = window.__stage.pieceScreens().filter(q => q.placed).length
    const slots = window.__stage.slotScreens().filter(s => s.kind === p.kind)
    return { piece: p, slot: slots[p.kind === 'badge' ? 0 : Math.min(taken, 3)] }
  })
  if (!piece) break
  await page.mouse.move(piece.x, piece.y); await page.waitForTimeout(80)
  await page.mouse.down()
  for (let s = 1; s <= 14; s++) { await page.mouse.move(piece.x + (slot.x - piece.x) * s / 14, piece.y + (slot.y - piece.y) * s / 14); await page.waitForTimeout(20) }
  await page.mouse.up(); await page.waitForTimeout(500)
}
console.log('build placed (stage/dom):', (await st()).placed, '/', await page.textContent('[data-build-count]'), 'price visible:', await page.isVisible('.build-price'))
if (await page.isVisible('.build-price')) {
  await page.locator('[data-price="own"]').fill('9'); await page.locator('[data-price="other"]').fill('4')
  console.log('build result:', (await page.textContent('[data-build-result]')).slice(0, 60))
}
await page.screenshot({ path: 'shots/i-build.png' })

// feed
await sceneAt('#ch-pull')
for (let i = 0; i < 5; i++) { await page.click('[data-pull-btn]'); await page.waitForTimeout(1100) }
console.log('feed pulls:', await page.textContent('[data-pulls]'), 'good:', await page.textContent('[data-jackpots]'))
await page.screenshot({ path: 'shots/i-feed.png' })

// gate: arrive, let the countdown press the button, watch the curtain
await page.evaluate(() => document.querySelector('#gate .gate-btn').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(2500)
console.log('gate note:', await page.textContent('[data-gate-note]'))
await page.waitForTimeout(4200)
await page.screenshot({ path: 'shots/i-curtain-1.png' })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'shots/i-curtain-2.png' })
await page.waitForTimeout(2500)
console.log('after-gate visible:', await page.isVisible('#reveal'), 'scene:', (await st()).scene)
await page.screenshot({ path: 'shots/i-reveal.png' })
await page.locator('.report').scrollIntoViewIfNeeded(); await page.waitForTimeout(2800)
console.log('report:', JSON.stringify(await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-r]')].map(e => [e.dataset.r, e.textContent])))))
await page.screenshot({ path: 'shots/i-report.png' })
await page.locator('#quiz').scrollIntoViewIfNeeded(); await page.waitForTimeout(600)
await page.click('.q[data-q="plain"] .opt >> nth=0'); await page.click('.q[data-q="toy"] .opt >> nth=1')
console.log('quiz:', (await page.textContent('[data-quiz-result]')).slice(0, 50))
await page.locator('.curve-fig').scrollIntoViewIfNeeded(); await page.waitForTimeout(800)
await page.locator('[data-curve-range]').fill('85')
console.log('curve:', await page.textContent('[data-curve-out]'))
await page.screenshot({ path: 'shots/i-curve.png' })
await page.locator('#weight').scrollIntoViewIfNeeded(); await page.waitForTimeout(1500)
console.log('weight:', await page.textContent('[data-w-total]'))
await sceneAt('#finale'); await page.waitForTimeout(2500)
const b = await st()
await page.mouse.click(720, 780); await page.waitForTimeout(350)
const a = await st()
console.log('finale scene:', a.scene, 'click lifted max y:', Math.max(...b.ys).toFixed(2), '->', Math.max(...a.ys).toFixed(2))
await page.screenshot({ path: 'shots/i-finale.png' })
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
await browser.close()
