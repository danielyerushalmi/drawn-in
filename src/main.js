import '@fontsource/schibsted-grotesk/latin-400.css'
import '@fontsource/schibsted-grotesk/latin-500.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { initTracker, session, setLogging, elapsed, fmtMinSec, log } from './tracker.js'
import { initFlash, initBuild, initFeed, initGate } from './toys.js'
import { initReveal } from './reveal.js'
import { initLedger, initWeight, initBars, initCurve } from './essay.js'

gsap.registerPlugin(ScrollTrigger, SplitText)
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const root = document.documentElement

initTracker()
// blocks of text the 3D tiles can't cover
$$('.scene .copy > *, .hero-foot, .interlude-small, .gate-inner > *').forEach(el => el.setAttribute('data-shield', ''))
if (matchMedia('(pointer: coarse)').matches) $$('[data-touch]').forEach(el => { el.textContent = el.dataset.touch })

/* ---------- smooth scroll, for Part I only ---------- */
// Part II switches it off on purpose: the page stops performing.
let lenis = null, scrollVel = 0, calm = false, inPartTwo = false
function startLenis() {
  if (lenis || calm || inPartTwo) return
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  lenis.on('scroll', e => { scrollVel = e.velocity })
}
function stopLenis() {
  if (!lenis) return
  lenis.destroy(); lenis = null; scrollVel = 0
}
gsap.ticker.add(t => lenis?.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
startLenis()

/* ---------- reduce motion (and prefers-reduced-motion) ---------- */
// every scroll-driven motion is kept in one list, so reduce motion can switch all of it off and back on
const motion = []
let stage = null
const calmBtn = $('[data-calm]')
function setCalm(on) {
  calm = on
  root.classList.toggle('calm', on)
  calmBtn.setAttribute('aria-pressed', String(on))
  stage?.setCalm(on)
  if (on) stopLenis(); else startLenis()
  applyMotion()
  log('motion', on ? 'reduced' : 'full')
}
calmBtn.addEventListener('click', () => setCalm(!calm))
if (matchMedia('(prefers-reduced-motion: reduce)').matches) setCalm(true)

/* ---------- the toys ---------- */
const getStage = () => stage
initFlash({ getStage })
const build = initBuild({ getStage })
initFeed({ getStage })

/* ---------- the stage arrives a beat after the shell ---------- */
import('./stage.js').then(async ({ createStage }) => {
  stage = await createStage({
    getScrollVel: () => scrollVel,
    onGrab: () => lenis?.stop(),
    onRelease: () => lenis?.start(),
    onPlace: n => build.placed(n),
  })
  stage.setCalm(calm)
  stage.setAnchor($('[data-phone]'))
}).catch(err => console.warn('3D stage unavailable', err))

/* ---------- masked headline reveals ---------- */
document.fonts.ready.then(() => {
  if (calm) return
  $$('[data-split]').forEach(el => {
    const split = new SplitText(el, { type: 'lines', mask: 'lines' })
    gsap.from(split.lines, {
      yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.08,
      ...(el.dataset.split === 'now' ? { delay: 0.3 } : { scrollTrigger: { trigger: el, start: 'top 88%' } }),
    })
  })
  ScrollTrigger.refresh()
})

/* ---------- sticky scenes: copy arrives, holds, and leaves on the scroll ---------- */
const scrub = tl => { motion.push(tl); return tl }
$$('.scene').forEach(sec => {
  const copy = $('.copy', sec)
  if (copy) {
    scrub(gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%', end: 'bottom bottom', scrub: 1 } })
      .fromTo(copy, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'none' })
      .to(copy, { y: 0, duration: 0.64 })
      .to(copy, { y: -60, opacity: 0, duration: 0.18, ease: 'none' }))
  }
  const big = $('.interlude-big', sec)
  if (big) {
    scrub(gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: 1 } }))
      .fromTo(big, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'none' })
      .to(big, { scale: 1.08, duration: 0.4, ease: 'none' })
      .to(big, { scale: 1.3, opacity: 0, duration: 0.2, ease: 'none' })
  }
})
// the hero title fades out where it stands, so it never slides under the nav
scrub(gsap.to('.hero-title', {
  opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% bottom', scrub: 1 },
}))
scrub(gsap.to('.hero-foot, .scroll-cue', {
  opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: '35% top', scrub: true },
}))
function applyMotion() {
  for (const tl of motion) {
    if (calm) { tl.scrollTrigger.disable(false); tl.progress(0).pause(); gsap.set(tl.getChildren ? tl.getChildren().map(c => c.targets()).flat() : tl.targets(), { clearProps: 'transform,opacity' }) }
    else { tl.scrollTrigger.enable(); tl.scrollTrigger.refresh() }
  }
}
applyMotion()

/* ---------- which scene is on screen: the innermost [data-scene] under the middle of the viewport ---------- */
const scenes = $$('[data-scene]'), chapters = $$('[data-chapter]')
const navIdx = $('[data-nav-index]'), navTitle = $('[data-nav-title]')
let lastScene = '', lastChapter = null
function underMiddle(list) {
  const mid = innerHeight / 2
  let found = null
  for (const el of list) {
    const r = el.getBoundingClientRect()
    if (r.height && r.top <= mid && r.bottom >= mid) found = el   // later in document order = more inner
  }
  return found
}
gsap.ticker.add(() => {
  const sc = underMiddle(scenes)
  const name = sc ? sc.dataset.scene : 'off'
  if (name !== lastScene && stage) { lastScene = name; stage.setScene(name) }
  const ch = underMiddle(chapters)
  if (ch && ch !== lastChapter) { lastChapter = ch; navIdx.textContent = ch.dataset.chapter; navTitle.textContent = ch.dataset.title }
})

/* ---------- live numbers in the interludes ---------- */
const liveTime = $$('[data-live="time"]'), liveCaps = $$('[data-live="captures"]')
setInterval(() => {
  const t = fmtMinSec(elapsed())
  liveTime.forEach(el => { el.textContent = t })
  liveCaps.forEach(el => { el.textContent = session.captures })
}, 250)

/* ---------- progress bar ---------- */
const bar = $('.progress span')
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { bar.style.transform = `scaleX(${s.progress})` } })

/* ---------- background: each part owns its colour; a text-free band carries you from screen to paper ----------
   The nav switches with whatever is actually under it, so its text and backdrop always match. */
const calmEl = $('#calm')
let onPaper = null
gsap.ticker.add(() => {
  const top = calmEl.offsetParent ? calmEl.getBoundingClientRect().top : Infinity
  const paper = top + innerHeight * 0.55 * 0.5 < 40     // past the middle of the gradient band
  if (paper === onPaper) return
  onPaper = paper
  root.classList.toggle('on-paper', paper)
  const bg = paper ? '#f7f5f1' : '#080b10'
  root.style.setProperty('--page-bg', bg)
  document.body.style.backgroundColor = bg; root.style.backgroundColor = bg
})

/* ---------- the gate, and the curtain: the button becomes the page ---------- */
const after = $('#after-gate'), curtain = $('[data-curtain]')
const cTitle = $('.curtain-title', curtain), cRec = $('.curtain-rec', curtain), cLine = $('[data-curtain-line]', curtain)

async function onContinue(btn) {
  lenis?.stop()
  session.stoppedAt = elapsed()
  setLogging(false)
  root.classList.add('is-revealed')

  // the curtain grows out of the button you pressed
  const r = btn.getBoundingClientRect()
  const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 4px)`
  const titleTop = innerHeight * 0.3
  cTitle.style.top = titleTop + 'px'
  gsap.set([cTitle, cRec], { opacity: 0 })
  curtain.classList.add('on')
  await gsap.fromTo(curtain, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: calm ? 0 : 0.95, ease: 'power3.inOut' })

  // behind the curtain: open the rest of the page and park its title exactly under the curtain's
  after.hidden = false
  stage?.setScene('off')
  ScrollTrigger.refresh()
  const rt = $('.reveal-title')
  scrollTo({ top: rt.getBoundingClientRect().top + scrollY - titleTop, behavior: 'instant' })
  ScrollTrigger.update()

  // what the page says while it covers everything, set on the exact line the page will show after
  const line = `Recording stopped · ${fmtMinSec(session.stoppedAt)} · ${session.events.toLocaleString()} events`
  cLine.textContent = line
  const pageKicker = $('.reveal-kicker')
  pageKicker.lastChild.textContent = ' ' + line
  cRec.style.top = pageKicker.getBoundingClientRect().top + 'px'
  gsap.to(cRec, { opacity: 1, duration: 0.4 })
  const split = new SplitText(cTitle, { type: 'lines', mask: 'lines' })
  gsap.set(cTitle, { opacity: 1 })
  await gsap.from(split.lines, { yPercent: 110, duration: calm ? 0 : 1.1, ease: 'power4.out', stagger: 0.1 })
  await new Promise(res => setTimeout(res, calm ? 300 : 1300))

  // hand off: the same words, in the same place, now on the page
  await gsap.to(curtain, { opacity: 0, duration: calm ? 0 : 0.7, ease: 'power2.out' })
  curtain.classList.remove('on')
  gsap.set(curtain, { opacity: 1, clipPath: 'inset(50% 50% 50% 50% round 4px)' })
  split.revert()
  startLenis()
  lenis?.start()
}
initGate({ ScrollTrigger, onContinue })

/* ---------- Part II: built once it exists on the page, since its triggers measure positions ---------- */
new MutationObserver((_, obs) => {
  if (after.hidden) return
  obs.disconnect()
  ScrollTrigger.create({
    trigger: '#calm', start: 'top 60%',
    onEnter: () => { inPartTwo = true; stopLenis() },
    onLeaveBack: () => { inPartTwo = false; startLenis() },
  })
  initReveal({ gsap, ScrollTrigger })
  initLedger()
  initWeight()
  initBars()
  initCurve()
  ScrollTrigger.refresh()
}).observe(after, { attributes: true, attributeFilter: ['hidden'] })

$('.wordmark').addEventListener('click', e => {
  e.preventDefault()
  if (lenis) lenis.scrollTo('#top', { duration: 1.6 }); else scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
})
addEventListener('load', () => ScrollTrigger.refresh())
