// The two web pages the flash test shows, drawn in code onto canvases that become the 3D screen's texture.
// Same fictional shop, same lamp, same price. One calm, one loud. Nothing here is a real brand.
export const W = 1600, H = 1000

const SANS = "'Schibsted Grotesk', system-ui, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const LOUD = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif"

function canvas() {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  return [c, c.getContext('2d')]
}
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
const text = (g, s, x, y, font, color, align = 'left') => { g.font = font; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y) }

function lamp(g, cx, cy, s, glow = true) {
  if (glow) {
    const gr = g.createRadialGradient(cx, cy - 40 * s, 10, cx, cy - 40 * s, 260 * s)
    gr.addColorStop(0, 'rgba(255, 233, 186, 0.95)'); gr.addColorStop(1, 'rgba(255, 233, 186, 0)')
    g.fillStyle = gr; g.fillRect(cx - 300 * s, cy - 320 * s, 600 * s, 600 * s)
  }
  g.fillStyle = '#2a2622'
  g.beginPath(); g.ellipse(cx, cy + 230 * s, 110 * s, 22 * s, 0, 0, Math.PI * 2); g.fill()       // base
  g.lineWidth = 12 * s; g.strokeStyle = '#2a2622'; g.lineCap = 'round'
  g.beginPath(); g.moveTo(cx, cy + 225 * s); g.quadraticCurveTo(cx - 10 * s, cy + 40 * s, cx + 30 * s, cy - 30 * s); g.stroke()  // stem
  g.beginPath()                                                                                     // shade
  g.moveTo(cx - 70 * s, cy - 30 * s); g.lineTo(cx + 130 * s, cy - 30 * s); g.lineTo(cx + 80 * s, cy - 150 * s); g.lineTo(cx - 20 * s, cy - 150 * s); g.closePath()
  g.fill()
}

/* ---------- page A: calm ---------- */
export function pageCalm() {
  const [c, g] = canvas()
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H)
  text(g, 'halden', 80, 86, `500 38px ${SANS}`, '#1c1a17')
  ;['Lamps', 'Journal', 'About', 'Cart (0)'].forEach((s, i) => text(g, s, 1060 + i * 128, 84, `400 22px ${SANS}`, '#6b655d'))
  g.fillStyle = '#e2dcd1'; g.fillRect(80, 124, W - 160, 2)
  text(g, 'NEW  ·  THE ARC LAMP', 80, 262, `400 18px ${MONO}`, '#8a837a')
  text(g, 'Light that', 76, 368, `500 92px ${SANS}`, '#1c1a17')
  text(g, 'waits for you.', 76, 466, `500 92px ${SANS}`, '#1c1a17')
  text(g, 'Hand-turned ash, a warm 2700K glow,', 80, 548, `400 28px ${SANS}`, '#5f5a52')
  text(g, 'and a dimmer you can feel.', 80, 590, `400 28px ${SANS}`, '#5f5a52')
  rr(g, 80, 650, 270, 78, 39); g.fillStyle = '#1c1a17'; g.fill()
  text(g, 'Buy  ·  $180', 215, 699, `500 26px ${SANS}`, '#f4f1ea', 'center')
  text(g, 'Read the story', 390, 699, `400 24px ${SANS}`, '#1c1a17')
  g.fillStyle = '#1c1a17'; g.fillRect(390, 708, 162, 2)
  rr(g, 900, 180, 620, 640, 30); g.fillStyle = '#e7e0d3'; g.fill()
  g.save(); rr(g, 900, 180, 620, 640, 30); g.clip(); lamp(g, 1190, 470, 1.15); g.restore()
  text(g, 'Free returns     ·     2-year warranty     ·     Ships in 2 days', 80, 915, `400 21px ${SANS}`, '#8a837a')
  return c
}

/* ---------- page B: loud ---------- */
function burst(g, cx, cy, r1, r2, n, color) {
  g.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r2 : r1
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  g.closePath(); g.fillStyle = color; g.fill()
}
export function pageLoud() {
  const [c, g] = canvas()
  g.fillStyle = '#fff200'; g.fillRect(0, 0, W, H)
  g.fillStyle = '#ff1744'; g.fillRect(0, 0, W, 84)
  text(g, 'FLASH SALE!!! ENDS IN 00:04:59  ·  FLASH SALE!!! ENDS IN 00:04:59', W / 2, 58, `40px ${LOUD}`, '#ffffff', 'center')
  g.fillStyle = '#111'; g.fillRect(0, 84, W, 62)
  ;['DEALS', 'HOT DEALS', 'MEGA DEALS', 'CLEARANCE', 'LAST CHANCE'].forEach((s, i) => text(g, s, 60 + i * 300, 128, `30px ${LOUD}`, i % 2 ? '#00e676' : '#ff4081'))
  g.save(); g.translate(90, 330); g.rotate(-0.07)
  g.lineWidth = 14; g.strokeStyle = '#000'; g.font = `210px ${LOUD}`; g.strokeText('70% OFF', 0, 0)
  text(g, '70% OFF', 0, 0, `210px ${LOUD}`, '#ff1744')
  g.restore()
  text(g, 'TODAY ONLY!!!', 100, 440, `76px ${LOUD}`, '#1e22ff')
  text(g, '$599', 100, 560, `64px ${LOUD}`, '#555')
  g.fillStyle = '#000'; g.fillRect(96, 536, 150, 8)
  text(g, '$180!!', 280, 570, `110px ${LOUD}`, '#ff1744')
  rr(g, 100, 620, 380, 110, 12); g.fillStyle = '#00c853'; g.fill()
  text(g, 'BUY NOW >>>', 290, 695, `56px ${LOUD}`, '#fff', 'center')
  rr(g, 420, 680, 330, 90, 12); g.fillStyle = '#ff4081'; g.fill()
  text(g, 'ADD TO CART', 585, 742, `44px ${LOUD}`, '#fff', 'center')
  burst(g, 1120, 470, 300, 230, 18, '#ff9100')
  burst(g, 1120, 470, 230, 190, 14, '#ff1744')
  lamp(g, 1120, 450, 0.85, false)
  g.save(); g.translate(1370, 250); g.rotate(0.3)
  rr(g, -120, -40, 240, 80, 8); g.fillStyle = '#1e22ff'; g.fill()
  text(g, 'BEST SELLER', 0, 14, `36px ${LOUD}`, '#fff200', 'center'); g.restore()
  g.save(); g.translate(820, 330); g.rotate(-0.25)
  g.beginPath(); g.arc(0, 0, 90, 0, Math.PI * 2); g.fillStyle = '#ff1744'; g.fill()
  text(g, 'ONLY', 0, -12, `34px ${LOUD}`, '#fff', 'center'); text(g, '2 LEFT!', 0, 30, `34px ${LOUD}`, '#fff', 'center'); g.restore()
  // the pop-up
  rr(g, 1010, 560, 520, 250, 16); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#ff1744'; g.stroke()
  text(g, "WAIT! DON'T LEAVE!", 1270, 640, `50px ${LOUD}`, '#111', 'center')
  text(g, 'Take 10% off your first order', 1270, 690, `600 28px ${SANS}`, '#333', 'center')
  rr(g, 1110, 715, 320, 64, 10); g.fillStyle = '#ff1744'; g.fill()
  text(g, 'CLAIM NOW', 1270, 760, `36px ${LOUD}`, '#fff', 'center')
  text(g, 'no thanks, I hate saving money', 1270, 800, `400 15px ${SANS}`, '#999', 'center')
  // ticker, chat, cookies
  g.fillStyle = '#1e22ff'; g.fillRect(0, 838, W, 48)
  text(g, '★ 4,213 PEOPLE ARE LOOKING AT THIS RIGHT NOW ★ 4,213 PEOPLE ARE LOOKING AT THIS RIGHT NOW ★', W / 2, 872, `30px ${LOUD}`, '#fff200', 'center')
  g.fillStyle = '#333'; g.fillRect(0, 886, W, 114)
  text(g, 'We use cookies to improve your experience and also for other things.', 60, 954, `400 24px ${SANS}`, '#ddd')
  rr(g, 1150, 916, 220, 64, 8); g.fillStyle = '#00c853'; g.fill()
  text(g, 'ACCEPT ALL', 1260, 960, `30px ${LOUD}`, '#fff', 'center')
  g.beginPath(); g.arc(1500, 948, 42, 0, Math.PI * 2); g.fillStyle = '#2962ff'; g.fill()
  g.beginPath(); g.arc(1530, 914, 18, 0, Math.PI * 2); g.fillStyle = '#ff1744'; g.fill()
  text(g, '1', 1530, 922, `bold 22px ${SANS}`, '#fff', 'center')
  return c
}

/* ---------- the screen's other states ---------- */
const SCREEN = '#0b0e13', BONE = '#eee7dc', DIM = 'rgba(238, 231, 220, 0.55)', RED = '#ef5a4c'
function dark(g) {
  const gr = g.createLinearGradient(0, 0, 0, H)
  gr.addColorStop(0, '#11151c'); gr.addColorStop(1, SCREEN)
  g.fillStyle = gr; g.fillRect(0, 0, W, H)
}
export function pageIdle() {
  const [c, g] = canvas()
  dark(g)
  g.beginPath(); g.arc(W / 2 - 150, 420, 9, 0, Math.PI * 2); g.fillStyle = RED; g.fill()
  text(g, 'SCREEN READY', W / 2 - 128, 428, `400 26px ${MONO}`, DIM)
  text(g, 'Two pages.', W / 2, 540, `500 92px ${SANS}`, BONE, 'center')
  text(g, '50 ms each.', W / 2, 640, `500 92px ${SANS}`, BONE, 'center')
  return c
}
export function pageBlank() {
  const [c, g] = canvas()
  g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H)
  return c
}
export function pageAsk() {
  const [c, g] = canvas()
  dark(g)
  text(g, '?', W / 2, 600, `500 320px ${SANS}`, BONE, 'center')
  text(g, 'WHICH ONE WOULD YOU TRUST?', W / 2, 720, `400 26px ${MONO}`, DIM, 'center')
  return c
}
// after the pick: both pages, side by side, with yours marked
export function pageCompare(a, b, pick) {
  const [c, g] = canvas()
  dark(g)
  const pw = 700, ph = pw * H / W, y = 230
  ;[[a, 70, 'FIRST', 'a'], [b, 830, 'SECOND', 'b']].forEach(([src, x, label, key]) => {
    g.drawImage(src, x, y, pw, ph)
    if (key === pick) { g.lineWidth = 10; g.strokeStyle = RED; g.strokeRect(x - 5, y - 5, pw + 10, ph + 10) }
    text(g, label + (key === pick ? '  ·  YOUR PICK' : ''), x, y - 34, `400 26px ${MONO}`, key === pick ? RED : DIM)
  })
  text(g, 'This is what you judged in a twentieth of a second.', W / 2, 820, `400 34px ${SANS}`, BONE, 'center')
  return c
}
