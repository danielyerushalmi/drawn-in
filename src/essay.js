// Part II. The only motion here is motion that explains something.
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

/* ---------- evidence ledger filter ---------- */
export function initLedger() {
  const chips = $$('#ledger .chip'), rows = $$('#ledger .ledger-list li')
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('on', x === c))
    const f = c.dataset.filter
    rows.forEach(r => r.classList.toggle('off', f !== 'all' && r.dataset.kind !== f))
  }))
}

/* ---------- this page's own weight ---------- */
const MEDIAN_JS = 558 * 1024   // HTTP Archive Web Almanac 2024, median mobile JavaScript

export function initWeight() {
  const box = $('#weight')
  let done = false
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || done) return
    done = true
    measure()
  }, { threshold: 0.3 }).observe(box)

  function measure() {
    const groups = { JavaScript: 0, Fonts: 0, 'CSS and HTML': 0, Other: 0 }
    let cached = false
    const entries = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')]
    for (const r of entries) {
      let size = r.transferSize || r.encodedBodySize || 0
      if (!r.transferSize && r.decodedBodySize) { size = r.decodedBodySize; cached = true }
      const n = r.name.split('?')[0]
      const g = /\.(m?js|ts|wasm)$/.test(n) || r.initiatorType === 'script' ? 'JavaScript'
        : /fonts\.(gstatic|googleapis)|\.(woff2?|ttf|otf)$/.test(n) ? 'Fonts'
        : r.entryType === 'navigation' || /\.(css|html)$/.test(n) || r.initiatorType === 'link' ? 'CSS and HTML'
        : 'Other'
      groups[g] += size
    }
    const total = Object.values(groups).reduce((a, b) => a + b, 0)
    $('[data-w-total]').textContent = kb(total)
    const max = Math.max(total, MEDIAN_JS, groups.JavaScript)
    const rows = [
      ...Object.entries(groups).filter(([, v]) => v > 0).map(([k, v]) => ({ k, v, cls: k === 'JavaScript' ? 'js' : '' })),
      { k: 'Median page JS', v: MEDIAN_JS, cls: 'median' },
    ]
    const bars = $('[data-w-bars]')
    bars.innerHTML = rows.map(r => `
      <div class="wbar ${r.cls}"><span>${r.k}</span><span class="wbar-track"><span class="wbar-fill" data-w="${(r.v / max) * 100}"></span></span><span class="wbar-v">${kb(r.v)}</span></div>`).join('')
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.wbar-fill', bars).forEach(f => { f.style.width = f.dataset.w + '%' })))
    const slow3g = (total * 8) / 1.6e6
    $('[data-w-note]').textContent =
      `Measured with your browser's Resource Timing API${cached ? ' (some files came from cache, so their uncompressed size is shown)' : ''}. ` +
      (import.meta.env.DEV ? 'This is the unminified development server, which ships far more than the published site; run the production build for the real figure. ' : '') +
      `Most of the JavaScript is the physics engine and the 3D renderer that ran Part I. ` +
      `On a slow 1.6 Mbps connection this page would take about ${slow3g.toFixed(0)} seconds just to download. ` +
      `The dashed bar is the median mobile page's JavaScript in 2024 (HTTP Archive).`
  }
}
const kb = b => b > 1024 * 1024 ? `${(b / 1048576).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`

/* ---------- hover tooltips on the attention bars ---------- */
export function initBars() {
  const tip = document.createElement('div')
  tip.className = 'tip'
  document.body.append(tip)
  $$('.bar[data-tip]').forEach(bar => {
    bar.addEventListener('pointerenter', () => { tip.textContent = bar.dataset.tip; tip.classList.add('on'); bar.classList.add('on') })
    bar.addEventListener('pointermove', e => { tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px' })
    bar.addEventListener('pointerleave', () => { tip.classList.remove('on'); bar.classList.remove('on') })
  })
}

/* ---------- the curve: a conceptual model, labelled as one ---------- */
const SERIES = [
  { key: 'attention', name: 'Attention captured', color: 'var(--s1)', f: x => 0.08 + 0.88 * (1 - Math.exp(-3.2 * x)) },
  { key: 'understand', name: 'What people understand', color: 'var(--s2)', f: x => { const u = x / 0.35; return 0.25 + 0.72 * u * Math.exp(1 - u) } },
  { key: 'sales', name: 'Sales, after the speed cost', color: 'var(--s3)', f: x => 0.3 + 0.5 * (1 - Math.exp(-4 * x)) - 0.6 * Math.max(0, x - 0.3) ** 1.6 },
]
const READS = [
  [15, 'Low', 'Static. Clear, fast and easy to forget. Nothing pulls anyone in, so fewer people stay long enough to buy.'],
  [45, 'Moderate', 'The sweet spot. The interaction carries the message: attention is up, understanding peaks, and the page is still fast.'],
  [72, 'High', 'Diminishing returns. Attention still climbs, but people remember less of what is not interactive, and the weight starts to cost sales.'],
  [101, 'Extreme', 'Over-interactive. The site holds people longer and teaches them less. The company books the time on site; the person pays for it.'],
]

export function initCurve() {
  const host = $('[data-curve]'), range = $('[data-curve-range]')
  const outEl = $('[data-curve-out]'), readEl = $('[data-curve-read]')
  const M = { l: 12, r: 150, t: 16, b: 34 }
  let W = 0, H = 0

  const X = x => M.l + x * (W - M.l - M.r)
  const Y = y => M.t + (1 - y) * (H - M.t - M.b)

  function render() {
    W = host.clientWidth; H = host.clientHeight
    if (innerWidth < 900) M.r = 16; else M.r = 150
    const x = +range.value / 100
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Conceptual model: attention keeps rising, understanding peaks at moderate interactivity, sales fall once the page gets heavy.">`
    s += '<g class="grid">'
    for (let i = 0; i <= 4; i++) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${Y(i / 4)}" y2="${Y(i / 4)}"/>`
    s += '</g><g class="axis">'
    s += `<text x="${M.l}" y="${H - 8}">None</text><text x="${W - M.r}" y="${H - 8}" text-anchor="end">Everything moves</text>`
    s += '</g><g class="series">'
    for (const ser of SERIES) {
      let d = ''
      for (let i = 0; i <= 100; i++) d += (i ? 'L' : 'M') + X(i / 100).toFixed(1) + ' ' + Y(ser.f(i / 100)).toFixed(1)
      s += `<path d="${d}" stroke="${ser.color}"/>`
    }
    s += '</g>'
    if (innerWidth >= 900) {
      // direct labels at the right end, nudged apart so they never collide
      const ends = SERIES.map(ser => ({ ser, y: Y(ser.f(1)) })).sort((a, b) => a.y - b.y)
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16
      for (const e of ends) s += `<text class="lab" x="${X(1) + 10}" y="${e.y + 4}">${e.ser.name}</text>`
    }
    s += `<line class="cursor-line" x1="${X(x)}" x2="${X(x)}" y1="${M.t}" y2="${H - M.b}"/>`
    for (const ser of SERIES) s += `<circle class="dot" cx="${X(x)}" cy="${Y(ser.f(x))}" r="5" fill="${ser.color}"/>`
    s += '</svg>'
    host.innerHTML = s
    const [, label, read] = READS.find(r => +range.value < r[0])
    outEl.textContent = label
    readEl.textContent = read
  }
  range.addEventListener('input', render)
  new ResizeObserver(render).observe(host)

  // scrub the plot directly, too
  const fromPointer = e => {
    const r = host.getBoundingClientRect()
    const x = (e.clientX - r.left - M.l) / (r.width - M.l - M.r)
    range.value = Math.round(Math.max(0, Math.min(1, x)) * 100)
    render()
  }
  let down = false
  host.addEventListener('pointerdown', e => { down = true; fromPointer(e) })
  addEventListener('pointermove', e => { if (down) fromPointer(e) })
  addEventListener('pointerup', () => { down = false })

  const table = $('[data-curve-table]')
  let t = '<tr><th>Interactivity</th>' + SERIES.map(s => `<th>${s.name}</th>`).join('') + '</tr>'
  for (let i = 0; i <= 100; i += 20) t += `<tr><td>${i}</td>` + SERIES.map(s => `<td>${Math.round(s.f(i / 100) * 100)}</td>`).join('') + '</tr>'
  table.innerHTML = t
}
