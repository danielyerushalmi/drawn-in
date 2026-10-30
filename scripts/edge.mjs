// Edge cases and behaviour checks. Usage: node scripts/edge.mjs [url]
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5411/'
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const results = []
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`)
const errors = []
async function open(opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opts })
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(url + '?bust=' + Date.now(), { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)
  return page
}
const mid = (page, sel, f = 0.5) => page.evaluate(([sel, f]) => { const el = document.querySelector(sel); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f) }, [sel, f])

/* 1. reduced motion at load */
{
  const page = await open({ reducedMotion: 'reduce' })
  check('reduced motion: switched on by the OS setting', await page.evaluate(() => document.documentElement.classList.contains('calm') && document.querySelector('[data-calm]').getAttribute('aria-pressed') === 'true'))
  check('reduced motion: no smooth-scroll library running', await page.evaluate(() => !document.documentElement.classList.contains('lenis')))
  await mid(page, '#ch-flash', 0.05); await page.waitForTimeout(800)
  const op = await page.evaluate(() => getComputedStyle(document.querySelector('#ch-flash .copy')).opacity)
  check('reduced motion: chapter copy fully visible without scroll animation', op === '1', 'opacity ' + op)
  const h = await page.evaluate(() => getComputedStyle(document.querySelector('#ch-flash h2 .split-line, #ch-flash h2 div') || document.querySelector('#ch-flash h2')).transform)
  check('reduced motion: headings not left mid-animation', h === 'none' || h === 'matrix(1, 0, 0, 1, 0, 0)', h)
  // turning it off brings the motion back
  await page.click('[data-calm]'); await page.waitForTimeout(600)
  check('reduced motion off: smooth scroll back on', await page.evaluate(() => document.documentElement.classList.contains('lenis')))
  await page.close()
}

/* 2. full flow with a manual Continue, then going back up */
{
  const page = await open()
  await page.evaluate(() => document.querySelector('#gate .gate-btn').scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(1500)
  await page.click('[data-gate-stay]'); await page.waitForTimeout(2500)
  check('"Wait, I\'m not done" stops the countdown', !(await page.isVisible('#reveal')) && (await page.textContent('[data-gate-n]')).trim() !== '0')
  const before = await page.evaluate(() => scrollY)
  await page.click('[data-continue]')
  await page.waitForTimeout(1500)
  const align = await page.evaluate(() => {
    const a = document.querySelector('.curtain-title').getBoundingClientRect(), b = document.querySelector('.reveal-title').getBoundingClientRect()
    const c = document.querySelector('.curtain-rec').getBoundingClientRect(), d = document.querySelector('.reveal-kicker').getBoundingClientRect()
    return { dTitle: Math.round(Math.abs(a.top - b.top) + Math.abs(a.left - b.left)), dLine: Math.round(Math.abs(c.top - d.top)) }
  })
  check('curtain title lands exactly on the page title', align.dTitle <= 2, `${align.dTitle}px off`)
  check('curtain status line lands on the page line', align.dLine <= 2, `${align.dLine}px off`)
  await page.waitForTimeout(3500)
  check('reveal visible after Continue', await page.isVisible('#reveal'))
  check('Continue button disabled once used', await page.evaluate(() => document.querySelector('[data-continue]').disabled))
  check('event log hidden after recording stops', await page.evaluate(() => document.querySelector('[data-log]').classList.contains('hide')))
  await page.locator('.report').scrollIntoViewIfNeeded(); await page.waitForTimeout(2600)
  check('report says you pressed it yourself', (await page.textContent('[data-r="autoplay"]')) === 'you stopped it' || (await page.textContent('[data-r="autoplay"]')) === 'you pressed first', await page.textContent('[data-r="autoplay"]'))
  // go back up into Part I: the 3D comes back
  await mid(page, '#ch-flash'); await page.waitForTimeout(1800)
  const sc = await page.evaluate(() => window.__stage.state())
  check('scrolling back up: Part I scene active again', sc.scene === 'flash', sc.scene)
  check('scrolling back up: canvas visible again', await page.evaluate(() => !document.querySelector('[data-gl]').classList.contains('off')))
  // and down into Part II: smooth scroll off, paper background, dark nav
  await page.evaluate(() => document.querySelector('#earns').scrollIntoView()); await page.waitForTimeout(1500)
  const p2 = await page.evaluate(() => ({ paper: document.documentElement.classList.contains('on-paper'), lenis: document.documentElement.classList.contains('lenis'), bg: getComputedStyle(document.body).backgroundColor, nav: getComputedStyle(document.querySelector('.nav')).color, ink: getComputedStyle(document.querySelector('.essay-sec h2')).color }))
  check('Part II: paper background', p2.paper && p2.bg === 'rgb(247, 245, 241)', p2.bg)
  check('Part II: nav switches to ink', p2.nav === p2.ink, `${p2.nav} vs essay ${p2.ink}`)
  check('Part II: smooth scroll switched off', !p2.lenis)
  // Part II controls
  for (const f of ['test', 'peer', 'company', 'survey', 'all']) {
    await page.click(`[data-filter="${f}"]`)
    const n = await page.locator('.ledger-list li:not(.off)').count()
    check(`ledger filter "${f}" shows rows`, n > 0, n + ' rows')
  }
  await page.locator('#attn-chart .bar').first().hover(); await page.waitForTimeout(250)
  check('attention bar tooltip appears on hover', await page.evaluate(() => document.querySelector('.tip')?.classList.contains('on')))
  await page.locator('.curve-plot').scrollIntoViewIfNeeded()
  const box = await page.locator('.curve-plot').boundingBox()
  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height / 2)
  check('curve: clicking the plot moves the reading', (await page.textContent('[data-curve-out]')) === 'Low', await page.textContent('[data-curve-out]'))
  await page.click('.curve-fig summary'); await page.waitForTimeout(200)
  check('curve: table view opens with rows', (await page.locator('[data-curve-table] tr').count()) === 7)
  await page.click('.wordmark'); await page.waitForTimeout(2500)
  check('wordmark returns to the top', (await page.evaluate(() => scrollY)) < 5, String(await page.evaluate(() => scrollY)))
  await page.close()
}

/* 3. build: resize with pieces placed; keyboard path */
{
  const page = await open()
  await mid(page, '#ch-build'); await page.waitForTimeout(1500)
  await page.locator('[data-build-auto]').focus()
  await page.keyboard.press('Enter'); await page.waitForTimeout(800)
  check('build: "Place them for me" works from the keyboard', (await page.textContent('[data-build-count]')) === '5')
  check('build: auto-built result is honest about it', /built this one for you/.test(await page.evaluate(() => { document.querySelector('[data-price="own"]').dispatchEvent(new Event('input')); return document.querySelector('[data-build-result]').textContent })))
  await page.setViewportSize({ width: 1100, height: 760 }); await page.waitForTimeout(1200)
  const sl = await page.evaluate(() => { const p = window.__stage.pieceScreens(), s = window.__stage.slotScreens(); return p.map((q, i) => Math.round(Math.hypot(q.x - s[i].x, q.y - s[i].y))) })
  check('build: placed pieces follow their slots after a resize', sl.every(d => d < 40), sl.join(','))
  await page.close()
}

/* 4. feed: drag-to-refresh and trackpad overscroll */
{
  const page = await open()
  await mid(page, '#ch-pull'); await page.waitForTimeout(1500)
  const fb = await page.locator('[data-feed]').boundingBox()
  await page.mouse.move(fb.x + fb.width / 2, fb.y + 80); await page.mouse.down()
  for (let k = 1; k <= 14; k++) await page.mouse.move(fb.x + fb.width / 2, fb.y + 80 + k * 14)
  await page.mouse.up(); await page.waitForTimeout(1400)
  check('feed: dragging down refreshes', (await page.textContent('[data-pulls]')) === '1')
  await page.mouse.move(fb.x + fb.width / 2, fb.y + 200)
  for (let k = 0; k < 8; k++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(30) }
  await page.waitForTimeout(1400)
  check('feed: scrolling up past the top refreshes', +(await page.textContent('[data-pulls]')) >= 2, await page.textContent('[data-pulls]'))
  const y0 = await page.evaluate(() => scrollY)
  for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(40) }
  await page.waitForTimeout(600)
  check('feed: scrolling inside the phone scrolls the feed, not the page', Math.abs((await page.evaluate(() => scrollY)) - y0) < 5)
  await page.close()
}

/* 5. touch phone: tap a piece to place it */
{
  const page = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  await mid(page, '#ch-build'); await page.waitForTimeout(2000)
  const p = await page.evaluate(() => window.__stage.pieceScreens()[0])
  await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(700)
  check('touch: tapping a piece places it', (await page.textContent('[data-build-count]')) === '1', await page.textContent('[data-build-count]'))
  check('touch: labels say tap, not click', /tap/i.test(await page.textContent('.hero-hint')))
  await page.close()
}

console.log(results.join('\n'))
console.log('ERRORS:', errors.length ? [...new Set(errors)].join('\n') : 'none')
await browser.close()
