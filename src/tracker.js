// Everything the reveal reports. Lives in memory only: nothing is stored or sent.
const PX_TO_M = 0.0254 / 96   // one CSS pixel is 1/96 inch

export const session = {
  start: performance.now(),
  events: 0,
  distPx: 0,
  path: [],            // [pageX, pageY] samples, ~25 per second
  captures: 0,         // times a tile was drawn in to the cursor
  flashMs: null,       // time from the second flash to a pick
  flashPick: null,
  built: false,
  ownPrice: null,
  otherPrice: null,
  pulls: 0,
  jackpots: 0,
  seen: 0,
  autoplay: null,      // 'taken' | 'cancelled' | null
  quiz: {},
}

let last = null, lastSample = 0
const MAX_POINTS = 6000

/* ---------- the visible event log: the page prints what it records ---------- */
let logList = null, logOn = true, lastMoveLog = 0, lastScrollLog = 0
const LOG_LINES = 9
const stamp = () => {
  const t = elapsed(), m = Math.floor(t / 60), s = (t % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}
export function log(type, detail = '') {
  if (!logList || !logOn) return
  const li = document.createElement('li')
  li.innerHTML = `${stamp()}  <b>${type}</b>  ${detail}`
  logList.append(li)
  while (logList.children.length > LOG_LINES) logList.firstChild.remove()
}
export function setLogging(on) {
  if (on === logOn) return
  if (!on) log('recording', 'stopped')
  logOn = on
  document.querySelector('[data-log]')?.classList.toggle('hide', !on)
}

export function initTracker() {
  logList = document.querySelector('[data-log-list]')
  log('session', 'start')
  const count = () => { session.events++ }
  for (const t of ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel', 'scroll', 'touchmove'])
    addEventListener(t, count, { passive: true, capture: true })

  addEventListener('pointermove', e => {
    session.events++
    const x = e.clientX, y = e.clientY + scrollY
    if (last) session.distPx += Math.hypot(e.clientX - last[0], e.clientY - last[1])
    last = [e.clientX, e.clientY]
    const now = performance.now()
    if (now - lastMoveLog > 180) { lastMoveLog = now; log('pointermove', `${Math.round(e.clientX)},${Math.round(e.clientY)}`) }
    if (now - lastSample > 40) {
      lastSample = now
      session.path.push([x, y])
      if (session.path.length > MAX_POINTS) session.path = session.path.filter((_, i) => i % 2 === 0)
    }
  }, { passive: true })
  // scrolling with a still hand still moves the cursor down the page
  addEventListener('scroll', () => {
    const now = performance.now()
    if (now - lastScrollLog > 260) { lastScrollLog = now; log('scroll', `y=${Math.round(scrollY)}`) }
    if (!last || now - lastSample < 60) return
    lastSample = now
    session.path.push([last[0], last[1] + scrollY])
  }, { passive: true })

  addEventListener('click', e => {
    const t = e.target.closest?.('button, a')
    if (t) log('click', `"${(t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22)}"`)
  }, { capture: true })

  const clock = document.querySelector('[data-session]')
  setInterval(() => { clock.textContent = fmtClock(elapsed()) }, 1000)
}

export const elapsed = () => (performance.now() - session.start) / 1000
export const metres = () => session.distPx * PX_TO_M

export function fmtClock(s) {
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60)
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

export function fmtMinSec(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
