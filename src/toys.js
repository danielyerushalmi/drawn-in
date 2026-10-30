import { session, log } from './tracker.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const wait = ms => new Promise(r => setTimeout(r, ms))

/* ---------------- 01 flash test: the tiles become two pages ---------------- */
export function initFlash({ getStage }) {
  const root = $('#ch-flash')
  const ready = $('.flash-ready', root), choose = $('.flash-choose', root), done = $('.flash-done', root)
  const out = $('[data-flash-result]', root), copy = $('.copy', root)
  let t0 = 0

  async function run() {
    const stage = getStage()
    ready.hidden = true; done.hidden = true; choose.hidden = true
    copy.classList.remove('is-done')
    log('flash', 'start')
    if (stage) await stage.flash()
    else await wait(1200)
    choose.hidden = false
    t0 = performance.now()
  }
  $('[data-flash-start]', root).addEventListener('click', run)
  $('[data-flash-again]', root).addEventListener('click', run)
  $$('[data-flash-pick]', root).forEach(btn => btn.addEventListener('click', () => {
    const ms = performance.now() - t0
    session.flashMs = ms
    session.flashPick = btn.dataset.flashPick
    const s = (ms / 1000).toFixed(1)
    log('flash.pick', `${btn.dataset.flashPick} · ${s}s`)
    out.textContent = btn.dataset.flashPick === 'a'
      ? `The calm one, chosen ${s} seconds after a look lasting a twentieth of one. Lindgaard's participants rated visual appeal at 50 ms, and those verdicts matched what they decided after looking for longer.`
      : `The loud one, chosen ${s} seconds after a look lasting a twentieth of one. Whichever you picked, you picked it on looks alone: Lindgaard's participants rated visual appeal at 50 ms, and those verdicts held up after longer looks.`
    choose.hidden = true; done.hidden = false
    copy.classList.add('is-done')
    getStage()?.showCompare(btn.dataset.flashPick)
  }))
}

/* ---------------- 02 build: five 3D pieces into a frame ---------------- */
export function initBuild({ getStage }) {
  const root = $('#ch-build')
  const countEl = $('[data-build-count]', root), price = $('.build-price', root)
  let auto = false

  $('[data-build-auto]', root).addEventListener('click', () => { auto = true; getStage()?.placeAll() })

  const own = $('[data-price="own"]', root), other = $('[data-price="other"]', root)
  const ownOut = $('[data-price-out="own"]', root), otherOut = $('[data-price-out="other"]', root)
  const result = $('[data-build-result]', root)

  function placed(n) {
    countEl.textContent = n
    if (n < 5 || session.built) return
    session.built = true
    session.builtByPage = auto
    price.hidden = false
    $('.copy', root).classList.add('is-done')
  }
  function priced() {
    const o = +own.value, t = +other.value
    session.ownPrice = o; session.otherPrice = t
    ownOut.textContent = `$${o.toFixed(2)}`; otherOut.textContent = `$${t.toFixed(2)}`
    if (auto) {
      result.textContent = `The page built this one for you, so it isn't really yours. The IKEA effect needs the labour: in Norton, Mochon and Ariely's experiments, the extra value disappeared when people didn't finish the job themselves.`
    } else if (o > t) {
      const pct = t > 0 ? Math.round((o / t - 1) * 100) + '% more than' : 'more than'
      result.textContent = `You priced yours at ${pct} an identical one you didn't make. In Norton, Mochon and Ariely's experiments, people valued their own amateur creations nearly as highly as experts' work. Labour leads to love.`
    } else if (o === t) {
      result.textContent = `The same price for both. The IKEA effect is an average, not a law. Companies don't need it to work on everyone: product configurators and onboarding quizzes only need it to work on most.`
    } else {
      result.textContent = `You priced yours lower. Rare, and honest. In Norton, Mochon and Ariely's experiments, people usually valued their own amateur creations nearly as highly as experts' work.`
    }
  }
  own.addEventListener('input', priced)
  other.addEventListener('input', priced)
  own.addEventListener('change', () => log('build.price', `own $${own.value}`))
  other.addEventListener('change', () => log('build.price', `other $${other.value}`))
  return { placed }
}

/* ---------------- 03 feed ---------------- */
const NAMES = ['mara.k', 'olu', 'jules', 'tamsin', 'ben_r', 'noor', 'iggy', 'priya', 'sol', 'theo']
const DULL = [
  'Nothing new since you last looked.',
  'Someone you might know joined.',
  'A post you saw yesterday, again.',
  'An ad for the shoes you already bought.',
  'Weather: about the same as outside.',
  '3 people viewed a thing you posted in 2022.',
  'A video you will not finish.',
  'Suggested for you: more of this.',
]
const GOOD = [
  'Someone you like liked your photo.',
  'You have a new follower.',
  'Your post is doing numbers.',
  'An old friend messaged you.',
]
const TONES = ['#e3d6c4', '#cfd8d3', '#dfc9c3', '#d6d0e0', '#e8dcb5']
const pick = a => a[Math.floor(Math.random() * a.length)]

export function initFeed({ getStage }) {
  const root = $('#pull-toy')
  const scroller = $('[data-feed]', root), list = $('[data-feed-list]', root)
  const hint = $('[data-pull-hint]', root), hintText = $('[data-pull-text]', root)
  const pullsEl = $('[data-pulls]'), jackEl = $('[data-jackpots]'), seenEl = $('[data-seen]')
  scroller.setAttribute('data-lenis-prevent', '')

  const seenIO = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting && !e.target._seen) {
      e.target._seen = true; session.seen++; seenEl.textContent = session.seen
      if (session.seen % 5 === 0) log('feed.seen', session.seen)
    }
  }, { threshold: 0.6 })   // the viewport, clipped by the phone: a post counts only when you can see it

  function post(good = false, fresh = false) {
    const el = document.createElement('article')
    el.className = 'post' + (good ? ' jackpot' : '') + (fresh ? ' fresh' : '')
    const withImg = !good && Math.random() < 0.4
    el.innerHTML = `
      <div class="post-top"><span class="post-av" style="--c:${pick(TONES)}"></span>
        <span class="post-name">${pick(NAMES)}</span><span class="post-time mono">${good ? 'now' : Math.ceil(Math.random() * 50) + 'm'}</span></div>
      <p class="post-body">${good ? pick(GOOD) : pick(DULL)}</p>
      ${withImg ? `<div class="post-img" style="--g:linear-gradient(${Math.random() * 360}deg, ${pick(TONES)}, ${pick(TONES)})"></div>` : ''}`
    seenIO.observe(el)
    return el
  }
  const more = n => { for (let i = 0; i < n; i++) list.append(post(Math.random() < 0.08)) }
  more(6)

  // it never ends
  scroller.addEventListener('scroll', () => {
    if (scroller.scrollTop + scroller.clientHeight > scroller.scrollHeight - 300) more(5)
  }, { passive: true })

  let busy = false
  async function refresh() {
    if (busy) return
    busy = true
    session.pulls++; pullsEl.textContent = session.pulls
    root.classList.add('refreshing')
    hint.style.height = '44px'; hintText.textContent = 'Refreshing'
    await wait(500 + Math.random() * 500)
    // the schedule is variable on purpose: most pulls are dull, about one in four pays
    const good = Math.random() < 0.26
    if (good) { session.jackpots++; jackEl.textContent = session.jackpots }
    getStage()?.pulse(good)
    log('feed.pull', `#${session.pulls}${good ? ' · good' : ''}`)
    list.prepend(post(good, true))
    if (!good && Math.random() < 0.5) list.prepend(post(false, true))
    root.classList.remove('refreshing')
    hint.style.transition = 'height .35s cubic-bezier(.2,.8,.2,1)'
    hint.style.height = '0px'; hintText.textContent = 'Pull to refresh'
    list.style.transform = ''
    setTimeout(() => { hint.style.transition = '' }, 400)
    busy = false
  }
  $('[data-pull-btn]', root).addEventListener('click', refresh)

  // mouse: drag down at the top of the feed
  let startY = null, pulled = 0
  scroller.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || scroller.scrollTop > 0 || busy) return
    startY = e.clientY; pulled = 0
  })
  addEventListener('pointermove', e => {
    if (startY === null) return
    pulled = Math.max(0, Math.min(110, (e.clientY - startY) * 0.55))
    hint.style.height = pulled + 'px'
    root.classList.toggle('pulling', pulled > 8)
    hintText.textContent = pulled > 60 ? 'Release' : 'Pull to refresh'
  })
  addEventListener('pointerup', () => {
    if (startY === null) return
    startY = null
    root.classList.remove('pulling')
    if (pulled > 60) refresh()
    else { hint.style.transition = 'height .3s'; hint.style.height = '0px'; setTimeout(() => { hint.style.transition = '' }, 320) }
  })
  // trackpads: keep scrolling up past the top
  let over = 0, overT = 0
  scroller.addEventListener('wheel', e => {
    if (scroller.scrollTop > 0 || e.deltaY >= 0 || busy) { over = 0; return }
    over += -e.deltaY
    clearTimeout(overT)
    overT = setTimeout(() => { over = 0; if (!busy) hint.style.height = '0px' }, 220)
    hint.style.height = Math.min(70, over * 0.25) + 'px'
    if (over > 260) { over = 0; refresh() }
  }, { passive: true })
}

/* ---------------- the gate: Continue, with a countdown that presses it for you ---------------- */
export function initGate({ ScrollTrigger, onContinue }) {
  const btn = $('[data-continue]'), n = $('[data-gate-n]'), ring = $('#gate .ring-fg'), note = $('[data-gate-note]')
  let timer = null, left = 5, started = false, gone = false

  function go(how) {
    if (gone) return
    gone = true
    clearInterval(timer)
    if (!session.autoplay) session.autoplay = how
    log('continue', how)
    btn.disabled = true
    $('.gate-label', btn).textContent = 'Continued'
    note.textContent = 'You already pressed it. Keep scrolling down.'
    onContinue(btn)
  }
  function start() {
    if (started || gone) return
    started = true
    log('autoplay', 'countdown 5s')
    note.textContent = 'Continuing on its own in 5 seconds'
    timer = setInterval(() => {
      left--
      n.textContent = Math.max(left, 0)
      ring.style.strokeDashoffset = 106.8 * (left / 5)
      note.textContent = left > 0 ? `Continuing on its own in ${left} second${left === 1 ? '' : 's'}` : 'Continuing'
      if (left <= 0) go('taken')
    }, 1000)
  }
  btn.addEventListener('click', () => go('clicked'))
  $('[data-gate-stay]').addEventListener('click', () => {
    clearInterval(timer)
    session.autoplay = 'cancelled'
    btn.classList.add('stopped')
    note.textContent = 'Countdown stopped. The button is still the only way on.'
    log('autoplay', 'cancelled')
  })
  ScrollTrigger.create({ trigger: '#gate .gate-btn', start: 'top 75%', onEnter: start })
}
