import { session, elapsed, metres, fmtMinSec } from './tracker.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

export function initReveal({ gsap, ScrollTrigger }) {
  const out = key => $(`[data-r="${key}"]`)
  let live = null, shown = false

  function values() {
    const own = session.ownPrice, other = session.otherPrice
    return {
      time: fmtMinSec(session.stoppedAt ?? elapsed()),
      dist: metres() < 1 ? `${Math.round(metres() * 100)} cm` : `${metres().toFixed(1)} m`,
      captures: session.captures.toLocaleString(),
      flash: session.flashMs == null ? 'skipped' : `${(session.flashMs / 1000).toFixed(1)} s`,
      build: !session.built ? 'not built' : session.builtByPage ? 'the page built it' : own == null ? 'built, unpriced' : `$${own.toFixed(0)} vs $${other.toFixed(0)}`,
      pulls: session.pulls ? `${session.pulls} · ${session.jackpots} good` : '0',
      seen: session.seen.toLocaleString(),
      autoplay: { taken: 'you let it press', clicked: 'you pressed first', cancelled: 'you stopped it' }[session.autoplay] || 'never came up',
      events: session.events.toLocaleString(),
    }
  }
  function paint() {
    const v = values()
    for (const k in v) out(k).textContent = v[k]
  }

  function first() {
    shown = true
    document.documentElement.classList.add('is-revealed')
    const v = values()
    // numbers roll up from zero once, then stay live
    for (const k of ['captures', 'seen', 'events']) {
      const target = +v[k].replace(/,/g, '')
      const o = { n: 0 }
      gsap.to(o, { n: target, duration: 1.6, ease: 'power3.out', onUpdate: () => { out(k).textContent = Math.round(o.n).toLocaleString() } })
    }
    for (const k of ['time', 'dist', 'flash', 'build', 'pulls', 'autoplay']) out(k).textContent = v[k]
    gsap.from('.stat', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 })
    drawTrail()
    setTimeout(() => { live = setInterval(paint, 1000) }, 1700)
  }

  ScrollTrigger.create({
    trigger: '.report', start: 'top 75%',
    onEnter: () => { if (!shown) first(); else if (!live) live = setInterval(paint, 1000) },
    onEnterBack: () => { if (!live) live = setInterval(paint, 1000) },
    onLeave: () => { clearInterval(live); live = null },
    onLeaveBack: () => { clearInterval(live); live = null },
  })

  function drawTrail() {
    const svg = $('[data-trail-svg]')
    const end = $('#reveal').offsetTop
    const W = 100, H = 1000, sy = H / end, sx = W / innerWidth
    const bands = [['#hero', 'Hero'], ['#ch-flash', '01'], ['#ch-build', '02'], ['#ch-pull', '03']]
    let s = '', labels = ''
    for (const [sel, label] of bands) {
      const el = $(sel), y = el.offsetTop * sy, h = el.offsetHeight * sy
      s += `<rect class="sec-band" x="0" y="${y.toFixed(1)}" width="${W}" height="${h.toFixed(1)}"/>`
      labels += `<span style="top:${(y / H * 100).toFixed(2)}%">${label}</span>`
    }
    const pts = session.path.filter(p => p[1] < end)
    if (pts.length > 1) {
      let d = `M${(pts[0][0] * sx).toFixed(2)} ${(pts[0][1] * sy).toFixed(2)}`
      for (let i = 1; i < pts.length; i++) d += `L${(pts[i][0] * sx).toFixed(2)} ${(pts[i][1] * sy).toFixed(2)}`
      s += `<path d="${d}"/>`
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.innerHTML = s
    $('[data-trail-labels]').innerHTML = labels
    // the recording plays back top to bottom
    gsap.fromTo(svg, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 2.4, ease: 'power2.inOut' })
  }

  /* ---------- the recall check ---------- */
  const resultEl = $('[data-quiz-result]')
  $$('.q').forEach(q => {
    $$('.opt', q).forEach(btn => btn.addEventListener('click', () => {
      const right = btn.dataset.a === '1'
      session.quiz[q.dataset.q] = right
      q.classList.add('answered')
      btn.classList.add(right ? 'right' : 'wrong')
      if (!right) $('.opt[data-a="1"]', q).classList.add('right')
      if ('plain' in session.quiz && 'toy' in session.quiz) verdict()
    }))
  })
  function verdict() {
    const { plain, toy } = session.quiz
    resultEl.textContent =
      toy && !plain ? 'You remembered the toy and lost the aside. That is the pattern Xu and Sundar found on an e-commerce site: interactive tools raised memory for what they carried and lowered it for the plain text beside them.'
      : toy && plain ? 'Both right, so you beat the pattern. In Xu and Sundar\'s experiment, interactive tools raised memory for what they carried and lowered it for the plain text beside them. Most sites are not built for readers like you.'
      : !toy && plain ? 'The aside stuck and the toy didn\'t. The usual result runs the other way: in Xu and Sundar\'s experiment, interactive tools raised memory for what they carried and lowered it for the plain text beside them.'
      : 'Neither stuck. Play holds attention without promising that anything is learned. Educational psychologists call entertaining extras that crowd out the point "seductive details".'
    resultEl.hidden = false
    gsap.from(resultEl, { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out' })
  }
}
