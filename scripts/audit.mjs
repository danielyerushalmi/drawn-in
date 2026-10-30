// Layout + contrast audit across viewports. Usage: node scripts/audit.mjs [url]
import { chromium } from 'playwright'
import { readFileSync } from 'fs'
const url = process.argv[2] || 'http://localhost:5411/'
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const sizes = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [768, 1024], [390, 844], [360, 640]]
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const issues = []
const add = (vp, where, msg) => issues.push(`${vp} | ${where} | ${msg}`)

for (const [w, h] of sizes) {
  const vp = `${w}x${h}`
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' })
  const errs = []
  page.on('pageerror', e => errs.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // generic: horizontal overflow of the document
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  if (hscroll > 1) add(vp, 'page', `document is ${hscroll}px wider than the viewport`)

  // sticky scenes: copy must sit fully between the nav and the bottom of the screen
  const scenes = ['#hero', '#ch-flash', '#ch-build', '#ch-pull']
  const navBottom = await page.evaluate(() => document.querySelector('.nav').getBoundingClientRect().bottom)
  async function checkScene(sel, label) {
    await page.evaluate(sel => { const el = document.querySelector(sel); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.5) }, sel)
    await page.waitForTimeout(1300)
    const r = await page.evaluate(() => {
      const out = []
      const sec = [...document.querySelectorAll('.scene')].find(s => { const b = s.getBoundingClientRect(); return b.top <= innerHeight / 2 && b.bottom >= innerHeight / 2 })
      if (!sec) return out
      // every visible text element in the sticky: must be inside the viewport and not overlapping the nav
      const els = [...sec.querySelectorAll('.sticky *')].filter(e => {
        const cs = getComputedStyle(e)
        return !e.closest('[data-feed]') && e.childElementCount === 0 && e.textContent.trim() && cs.visibility !== 'hidden' && cs.display !== 'none' && e.offsetParent && +cs.opacity > 0.05
      })
      const nb = document.querySelector('.nav').getBoundingClientRect().bottom
      const ph = sec.querySelector('.phone-wrap')
      if (ph) { const b = ph.getBoundingClientRect(); if (b.bottom > innerHeight + 1 || b.top < nb - 2) out.push(`phone + refresh button don't fit (${Math.round(b.top)}..${Math.round(b.bottom)} of ${innerHeight})`) }
      for (const e of els) {
        const b = e.getBoundingClientRect()
        if (!b.width) continue
        const t = e.textContent.trim().slice(0, 34)
        if (b.bottom > innerHeight + 1) out.push(`cut off at bottom by ${Math.round(b.bottom - innerHeight)}px: "${t}"`)
        if (b.top < nb - 2 && b.bottom > 0) out.push(`under the nav (top ${Math.round(b.top)} < ${Math.round(nb)}): "${t}"`)
        if (b.right > innerWidth + 1) out.push(`cut off at right by ${Math.round(b.right - innerWidth)}px: "${t}"`)
        if (b.left < -1) out.push(`cut off at left by ${Math.round(-b.left)}px: "${t}"`)
      }
      return out
    })
    for (const m of r) add(vp, label, m)
  }
  for (const s of scenes) await checkScene(s, s)
  // expanded states
  await page.evaluate(() => {
    const f = document.querySelector('#ch-flash')
    f.querySelector('.flash-ready').hidden = true; f.querySelector('.flash-done').hidden = false; f.querySelector('.copy').classList.add('is-done')
    f.querySelector('[data-flash-result]').textContent = 'The calm one, chosen 1.2 seconds after a look lasting a twentieth of one. Lindgaard\'s participants rated visual appeal at 50 ms, and those verdicts matched what they decided after looking for longer.'
    const b = document.querySelector('#ch-build')
    b.querySelector('.build-price').hidden = false; b.querySelector('.copy').classList.add('is-done')
    b.querySelector('[data-build-result]').textContent = 'You priced yours at 125% more than an identical one you didn\'t make. In Norton, Mochon and Ariely\'s experiments, people valued their own amateur creations nearly as highly as experts\' work. Labour leads to love.'
  })
  await checkScene('#ch-flash', '#ch-flash (after picking)')
  await checkScene('#ch-build', '#ch-build (priced)')
  // interlude numbers
  await page.evaluate(() => { const el = document.querySelector('.scene-interlude'); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * 0.5) })
  await page.waitForTimeout(1200)
  const big = await page.evaluate(() => { const b = document.querySelector('.scene-interlude .interlude-big').getBoundingClientRect(); return { l: b.left, r: b.right, w: innerWidth } })
  if (big.l < 0 || big.r > big.w) add(vp, 'interlude', `big number overflows: left ${Math.round(big.l)} right ${Math.round(big.r)} of ${big.w}`)

  // open Part II without the transition, then check every block
  await page.evaluate(() => { document.querySelector('#after-gate').hidden = false })
  await page.waitForTimeout(800)
  const p2 = await page.evaluate(() => {
    const out = []
    for (const e of document.querySelectorAll('#after-gate *')) {
      const cs = getComputedStyle(e)
      if (cs.display === 'none' || !e.offsetParent) continue
      const b = e.getBoundingClientRect()
      if (b.width && (b.right > innerWidth + 1 || b.left < -1) && e.textContent.trim())
        out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')} spills off-screen (${Math.round(b.left)}..${Math.round(b.right)})`)
      // text clipped by its own box
      if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 2 && e.textContent.trim() && !e.closest('svg'))
        out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')} clips its text horizontally`)
    }
    return [...new Set(out)].slice(0, 12)
  })
  for (const m of p2) add(vp, 'part II', m)
  if (errs.length) add(vp, 'console', errs.join(' / '))
  await page.close()
}

// contrast with axe on desktop, per region, with the right background in place
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => { document.querySelector('#after-gate').hidden = false })
await page.addScriptTag({ content: axe })
const runAxe = async (ctx, bg, label) => {
  const res = await page.evaluate(async ([ctx, bg]) => {
    if (bg) { document.body.style.backgroundColor = bg; document.documentElement.style.backgroundColor = bg }
    const r = await axe.run(ctx, { runOnly: ['color-contrast'] })
    return r.violations.flatMap(v => v.nodes.map(n => `${n.target.join(' ')} :: ${n.any[0]?.message?.slice(0, 110)}`))
  }, [ctx, bg])
  for (const m of res) add('1440x900', `contrast ${label}`, m)
}
await runAxe('main > .scene, .nav, .log, #gate', '#080b10', 'Part I (dark)')
await runAxe('#reveal', '#080b10', 'reveal (dark)')
await runAxe('#calm', '#f7f5f1', 'Part II (paper)')
await browser.close()
console.log(issues.length ? issues.join('\n') : 'no issues')
