// The one WebGL canvas: fixed, full screen, above the scene text and never catching the pointer.
// The same tiles play every scene of Part I. Each sticky scene gives them a different job:
//   hero, interlude  drawn to your cursor
//   flash            a floating 3D screen flashes two web pages for 50 ms each; the tiles drift in a ring around it
//   build            five pieces you grab in 3D and drop into a wireframe frame
//   feed             red badges orbiting the phone, diving into it when a refresh pays out
//   gate, finale     gravity only; in the finale they move only when you click
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import * as RAPIER from '@dimforge/rapier3d'
import { session, log } from './tracker.js'
import { pageCalm, pageLoud, pageIdle, pageBlank, pageAsk, pageCompare } from './pages.js'

const COL = { bone: 0xeee7dc, graphite: 0x2a2e34, red: 0xde3d30 }
const FOV = 32, SLAB = 1.2, TILE = 1.42
const small = matchMedia('(max-width: 900px)').matches
const COUNTS = small ? { tile: 11, pill: 4, badge: 5 } : { tile: 15, pill: 6, badge: 7 }

const SCENES = {
  hero:      { g: -6,   lure: true,  push: true },
  interlude: { g: -6,   lure: true,  push: true },
  flash:     { g: 0,    form: 'cloud', push: true, park: true },
  build:     { g: -9.8, form: 'build', push: true, park: true },
  feed:      { g: -9.8, form: 'orbit', push: true, park: true },
  gate:      { g: -9.8, push: true },
  finale:    { g: -9.8 },
  off:       { g: -9.8 },
}

// deterministic per-index randomness, so formations are stable across resizes
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x) }

export async function createStage({ getScrollVel, onGrab, onRelease, onPlace }) {
  const canvas = document.querySelector('[data-gl]')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120)
  scene.environment = coolEnvironment(renderer)
  const key = new THREE.DirectionalLight(0xfff4e6, 1.7)
  key.position.set(-4, 7, 9)
  scene.add(key)
  const rig = new THREE.Group()      // leans toward the pointer; physics stays in world space
  scene.add(rig)

  /* ---------- bodies ---------- */
  const mat = color => new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.5,
  })
  const geo = {
    tile: new RoundedBoxGeometry(1.25, 1.25, 0.34, 5, 0.28),
    pill: new THREE.CapsuleGeometry(0.3, 0.95, 8, 20),
    badge: new THREE.SphereGeometry(0.36, 32, 20),
  }
  const mats = { bone: mat(COL.bone), graphite: mat(COL.graphite), red: mat(COL.red) }

  const world = new RAPIER.World({ x: 0, y: -6, z: 0 })
  const bodies = []
  const kinds = []
  for (let i = 0; i < COUNTS.tile; i++) kinds.push(['tile', i % 3 === 2 ? 'graphite' : 'bone'])
  for (let i = 0; i < COUNTS.pill; i++) kinds.push(['pill', 'bone'])
  for (let i = 0; i < COUNTS.badge; i++) kinds.push(['badge', 'red'])
  kinds.forEach(([kind, color], i) => {
    const mesh = new THREE.Mesh(geo[kind], mats[color])
    rig.add(mesh)
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setLinearDamping(0.9).setAngularDamping(1.1).setCcdEnabled(true))
    const desc =
      kind === 'tile' ? RAPIER.ColliderDesc.roundCuboid(0.5, 0.5, 0.06, 0.12)
      : kind === 'pill' ? RAPIER.ColliderDesc.capsule(0.475, 0.3)
      : RAPIER.ColliderDesc.ball(0.36)
    world.createCollider(desc.setRestitution(0.3).setFriction(0.7).setDensity(kind === 'badge' ? 1.6 : 1), body)
    bodies.push({ i, mesh, body, kind, color, near: false, piece: null, dive: 0 })
  })
  const byMesh = new Map(bodies.map(b => [b.mesh, b]))

  // the cursor is a physical object too
  const cursorBody = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -300, 0))
  world.createCollider(RAPIER.ColliderDesc.ball(0.75), cursorBody)

  /* ---------- the build frame: dashed outlines, drawn in 3D ---------- */
  const frame = new THREE.Group()
  const dash = (color, op) => new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.09, transparent: true, opacity: op })
  const rounded = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
    return new THREE.BufferGeometry().setFromPoints(s.getPoints(12))
  }
  const outline = (g, m) => { const l = new THREE.Line(g, m); l.computeLineDistances(); return l }
  const frameMats = [dash(COL.bone, 0.5), dash(COL.bone, 0.28), dash(COL.red, 0.8)]
  frame.add(outline(rounded(2 * TILE + 0.34, 2 * TILE + 0.34, 0.6), frameMats[0]))
  for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const l = outline(rounded(1.25, 1.25, 0.28), frameMats[1]); l.position.set(x * TILE / 2, y * TILE / 2, 0); frame.add(l)
  }
  const ring = new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 0.4, 0, Math.PI * 2).getPoints(40))
  const dotRing = outline(ring, frameMats[2]); dotRing.position.set(TILE - 0.12, TILE - 0.12, 0.35); frame.add(dotRing)
  scene.add(frame)
  let frameAlpha = 0

  /* ---------- the flash screen: a floating display, with the two pages drawn onto it ---------- */
  const screen = new THREE.Group()
  const bezelMat = mat(COL.graphite); bezelMat.transparent = true
  const displayMat = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true })
  const bezel = new THREE.Mesh(new THREE.BufferGeometry(), bezelMat)
  const display = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), displayMat)
  screen.add(bezel, display)
  scene.add(screen)
  const texOf = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t }
  const screenTex = {}
  function drawPages() {
    // drawn once the web fonts are in, and uploaded up front so a 50 ms swap costs nothing
    const src = { idle: pageIdle(), blank: pageBlank(), A: pageCalm(), B: pageLoud(), ask: pageAsk() }
    for (const k in src) { screenTex[k]?.dispose(); screenTex[k] = texOf(src[k]); renderer.initTexture(screenTex[k]) }
    screenTex._srcA = src.A; screenTex._srcB = src.B
    show(S?.screen || 'idle')
  }
  function show(name) {
    if (!screenTex[name]) return
    S.screen = name
    displayMat.map = screenTex[name]
    displayMat.needsUpdate = true
  }
  // the screen is solid: tiles bump off it instead of covering it
  const screenBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -300, 0))
  const screenCol = world.createCollider(RAPIER.ColliderDesc.cuboid(1, 1, 0.4), screenBody)
  let screenAlpha = 0, SW = 4, SH = 2.5, screenBaseY = 0
  const fit = { y: 0, s: 1, colS: 1 }   // on a phone the screen fits itself under the text
  // where a tile belongs around the screen
  function ringTarget(b, t, out) {
    const R = F.ring
    if (R.portrait) {
      // a phone has no room beside the screen: two rows above it and one below, spaced to the real tile size,
      // the three kinds mixed across the slots; whatever doesn't fit waits just below the screen's edge
      const GAP = 1.45, per = Math.max(3, Math.floor((R.maxX * 2 + 0.3) / GAP))
      // rows that fit between the text and the screen, and between the screen and the bottom edge
      const sh = SH * fit.s, cy = fit.y
      const top = Math.min(textFloor, halfH - 1.2), firstAbove = cy + sh / 2 + 0.95, firstBelow = cy - sh / 2 - 0.95
      const above = THREE.MathUtils.clamp(Math.floor((top - 0.1 - (firstAbove + 0.75)) / 1.4) + 1, 0, 2)
      const below = THREE.MathUtils.clamp(Math.floor((firstBelow - 0.75 - (-halfH + 0.7)) / 1.4) + 1, 0, 2)
      const slot = (b.i * 7) % bodies.length, row = Math.floor(slot / per), col = slot % per
      const x = R.cx + (col - (per - 1) / 2) * GAP + Math.sin(t * 0.5 + row) * 0.15
      if (row < below) return out.set(x, firstBelow - row * 1.4, (rnd(b.i, 3) - 0.5) * 0.8)
      if (row < below + above) return out.set(x, firstAbove + (row - below) * 1.4, (rnd(b.i, 3) - 0.5) * 0.8)
      return out.set(x, -halfH - 4, 0)
    }
    // a slow ring, the three kinds of tile spread evenly around it
    const a = ((b.i * 0.618034) % 1) * Math.PI * 2 + t * 0.06, j = 1.08 + rnd(b.i, 2) * 0.3
    return out.set(
      THREE.MathUtils.clamp(R.cx + Math.cos(a) * R.rx * j, -R.maxX, R.maxX),
      THREE.MathUtils.clamp(R.cy + Math.sin(a) * R.ry * j, -R.maxY, R.maxY),
      (rnd(b.i, 3) - 0.5) * 1.4)
  }
  // the screen turns solid; anything already where the glass will be is moved to its place on the ring first
  // (a body that starts fully inside a fixed collider can never be pushed out)
  function placeScreen(on) {
    if (on) {
      const t = new THREE.Vector3(), cx = screen.position.x, cy = screen.position.y
      for (const b of bodies) {
        if (b.piece?.slot) continue
        const p = b.body.translation()
        ringTarget(b, performance.now() / 1000, t)
        const inWay = Math.abs(p.x - cx) < SW / 2 + 1 && Math.abs(p.y - cy) < SH / 2 + 1
        const farSide = F.ring.portrait ? Math.sign(p.y - cy) !== Math.sign(t.y - cy) : Math.sign(p.x - cx) !== Math.sign(t.x - cx) && Math.abs(p.y - cy) < SH / 2 + 1
        // on a phone the text spans the full width, so a tile caught above it has no way down
        const aboveText = F.ring.portrait && p.y > cy + SH / 2 + 3.2
        if (inWay || farSide || aboveText) { b.body.setTranslation({ x: t.x, y: t.y, z: t.z }, true); b.body.setLinvel({ x: 0, y: 0, z: 0 }, true) }
      }
    }
    screenBody.setTranslation(on ? { x: screen.position.x, y: screen.position.y, z: 0 } : { x: 0, y: -300, z: 0 }, true)
  }

  /* ---------- formations ---------- */
  const F = { ring: null, frame: new THREE.Vector3(), slots: [], homes: [] }
  const tiles = bodies.filter(b => b.kind === 'tile'), pills = bodies.filter(b => b.kind === 'pill')
  const badges = bodies.filter(b => b.kind === 'badge')
  const pieces = [...tiles.filter(b => b.color === 'bone').slice(0, 4), badges[0]]
  let halfW = 8, halfH = 4.6, camZ = 16, walls = [], floor = null

  // where a scene's 3D lives: the right side on a wide screen, the lower half on a phone
  const region = () => camera.aspect < 0.9
    ? { cx: 0, cy: -halfH * 0.42, w: halfW * 1.8, h: halfH * 0.95 }
    : { cx: halfW * 0.36, cy: halfH * 0.08, w: halfW * 0.84, h: halfH * 1.3 }

  function layout() {
    const r = region()
    // the flash screen, 16:10, in the middle of the scene's space
    SW = Math.min(r.w * 0.7, r.h * 0.62 * 1.6); SH = SW / 1.6
    screen.position.set(r.cx, r.cy, 0)
    fit.y = r.cy; fit.s = 1; fit.colS = 1
    screenBaseY = camera.aspect < 0.9 ? 0 : -0.14
    bezel.geometry.dispose()
    bezel.geometry = new RoundedBoxGeometry(SW + 0.34, SH + 0.34, 0.22, 4, 0.14)
    display.scale.set(SW, SH, 1); display.position.z = 0.116
    screenCol.setHalfExtents({ x: SW / 2 + 0.3, y: SH / 2 + 0.3, z: SLAB + 1 })   // the full depth: nothing can sit in front of the glass
    // the tiles drift in a slow ring around it
    F.ring = { cx: r.cx, cy: r.cy, rx: SW / 2 + 0.95, ry: SH / 2 + 0.85, maxX: halfW - 0.7, maxY: halfH - 1.2, portrait: camera.aspect < 0.9 }
    if (typeof S !== 'undefined' && S.scene === 'flash') placeScreen(true)
    // build: a 2x2 frame with a badge slot on its corner, pieces floating around it
    F.frame.set(r.cx, r.cy + 0.2, 0)
    const fx = F.frame.x, fy = F.frame.y, h = TILE / 2
    const keep = F.slots.map(s => s.p)
    F.slots = [
      { kind: 'tile', p: new THREE.Vector3(fx - h, fy + h, 0) }, { kind: 'tile', p: new THREE.Vector3(fx + h, fy + h, 0) },
      { kind: 'tile', p: new THREE.Vector3(fx - h, fy - h, 0) }, { kind: 'tile', p: new THREE.Vector3(fx + h, fy - h, 0) },
      { kind: 'badge', p: new THREE.Vector3(fx + TILE - 0.12, fy + TILE - 0.12, 0.35) },
    ]
    // a resize moves the slots; placed pieces keep pointing at the same slot index
    for (const b of pieces) if (b.piece?.slot) b.piece.slot = F.slots[keep.indexOf(b.piece.slot.p)] || b.piece.slot
    const spread = Math.min(1, r.w / 7.4)
    F.homes = [[-2.9, 1.4], [-3.0, -1.5], [-0.4, -2.6], [2.9, 1.6], [2.9, -0.3]]
      .map(([x, y]) => new THREE.Vector3(fx + x * spread, fy + y * spread, 0.3))
    frame.position.copy(F.frame)
  }

  function resize() {
    const w = innerWidth, h = innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // on a tall phone the camera steps back, so the same world still fits across
    camZ = camera.aspect < 0.9 ? 16 * Math.min(1.9, 0.9 / camera.aspect) : 16
    camera.position.set(0, 0, camZ)
    camera.updateProjectionMatrix()
    halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camZ
    halfW = halfH * camera.aspect
    for (const c of walls) world.removeCollider(c, false)
    const wall = (hx, hy, hz, x, y, z) => world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z))
    floor = wall(halfW + 2, 0.5, 4, 0, -halfH - 0.5, 0)
    walls = [
      floor,
      wall(halfW + 2, 0.5, 4, 0, halfH + 16, 0),
      wall(0.5, halfH + 16, 4, -halfW - 0.5, 0, 0),
      wall(0.5, halfH + 16, 4, halfW + 0.5, 0, 0),
      wall(halfW + 2, halfH + 16, 0.5, 0, 0, -SLAB - 0.5),
      wall(halfW + 2, halfH + 16, 0.5, 0, 0, SLAB + 0.5),
    ]
    layout()
    placeFloor()
  }
  // in scenes where only some tiles have a job, the floor drops away and the rest wait below the screen
  function placeFloor() {
    floor?.setTranslation({ x: 0, y: SCENES[S.scene]?.park ? -halfH - 9 : -halfH - 0.5, z: 0 })
  }

  /* ---------- state ---------- */
  const S = {
    scene: 'hero', calm: false, t: performance.now() / 1000, lure: new THREE.Vector3(0, -300, 0), lastMove: 0, pausedAttract: 0, frame: 0,
    screen: 'idle', flashing: false, held: null, heldPrev: new THREE.Vector3(), anchor: null, placed: 0, hidden: 0,
  }
  const pointer = { x: -1, y: -1, nx: 0, ny: 0, active: false }

  function dropIn() {
    bodies.forEach(b => {
      if (b.piece?.slot && S.scene === 'build') return
      b.body.setTranslation({ x: (rnd(b.i, 4) - 0.5) * halfW * 1.7, y: halfH + 1 + (b.i % 9) * 1.1 + Math.floor(b.i / 9) * 0.6, z: (rnd(b.i, 5) - 0.5) * SLAB }, true)
      b.body.setRotation(new THREE.Quaternion().random(), true)
      b.body.setLinvel({ x: 0, y: -2, z: 0 }, true)
    })
  }

  function setScene(name) {
    if (!SCENES[name] || S.scene === name) return
    const prev = S.scene
    S.scene = name
    canvas.classList.toggle('off', name === 'off')
    if (name === 'finale' || (prev === 'off' && name !== 'off')) dropIn()
    if (prev === 'build' && S.held) release(null)
    // the icon you built only holds together inside its own scene; elsewhere its pieces are tiles again
    for (const b of pieces) if (b.piece?.slot)
      b.body.setBodyType(name === 'build' ? RAPIER.RigidBodyType.KinematicPositionBased : RAPIER.RigidBodyType.Dynamic, true)
    placeFloor()
    placeScreen(name === 'flash')
    // coming back up from below: the waiting tiles are launched back into view
    if (SCENES[prev]?.park && !SCENES[name].park && name !== 'off')
      for (const b of bodies) if (b.body.translation().y < -halfH) {
        b.body.setTranslation({ x: b.body.translation().x, y: -halfH - 0.2, z: 0 }, true)
        b.body.setLinvel({ x: (rnd(b.i, 6) - 0.5) * 4, y: name === 'gate' ? 3 + rnd(b.i, 7) * 2 : 9 + rnd(b.i, 7) * 5, z: 0 }, true)
      }
    log('scene', name)
  }

  /* ---------- pointer ---------- */
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3()
  const toWorld = (cx, cy, out, z = 0) => {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    plane.constant = -z
    return ray.ray.intersectPlane(plane, out)
  }
  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true
    pointer.nx = e.clientX / innerWidth - 0.5; pointer.ny = e.clientY / innerHeight - 0.5
    if (toWorld(e.clientX, e.clientY, hit)) { S.lure.copy(hit); S.lastMove = performance.now() }
  }, { passive: true })
  document.addEventListener('pointerleave', () => { pointer.active = false })

  const isControl = t => t.closest?.('button, a, input, label, select, [data-feed], .phone, .nav, details')
  const pickPiece = (cx, cy) => {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hits = ray.intersectObjects(pieces.filter(p => !p.piece?.slot).map(p => p.mesh), false)
    return hits[0] ? byMesh.get(hits[0].object) : null
  }

  const freeSlot = b => {
    const taken = new Set(pieces.map(p => p.piece?.slot).filter(Boolean))
    return F.slots.find(s => s.kind === b.kind && !taken.has(s)) || null
  }
  function lockInto(b, slot) {
    if (!slot) return
    b.piece = { slot }
    b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
    S.placed = pieces.filter(p => p.piece?.slot).length
    log('build.place', `${S.placed}/5`)
    onPlace?.(S.placed)
  }
  function release(e) {
    const b = S.held
    if (!b) return
    S.held = null
    document.documentElement.classList.remove('grabbing')
    onRelease?.()
    // snap into the nearest free slot of the right shape, if it was dropped close enough
    const p = b.body.translation()
    const taken = new Set(pieces.map(x => x.piece?.slot).filter(Boolean))
    let best = null, bestD = 1.25
    for (const s of F.slots) {
      if (s.kind !== b.kind || taken.has(s)) continue
      const d = Math.hypot(s.p.x - p.x, s.p.y - p.y)
      if (d < bestD) { best = s; bestD = d }
    }
    if (best) { lockInto(b, best); return }
    b.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
    if (e && toWorld(e.clientX, e.clientY, hit, 0.8)) {
      const v = hit.clone().sub(S.heldPrev).multiplyScalar(30)
      b.body.setLinvel({ x: v.x, y: v.y, z: 0 }, true)
    }
  }
  addEventListener('pointerup', release)
  addEventListener('pointercancel', () => release(null))
  addEventListener('blur', () => release(null))

  addEventListener('pointerdown', e => {
    if (isControl(e.target)) return
    if (S.scene === 'build') {
      const b = pickPiece(e.clientX, e.clientY)
      if (!b) return
      // touch can't drag without fighting the page scroll, so a tap places the piece
      if (e.pointerType === 'touch') { lockInto(b, freeSlot(b)); return }
      e.preventDefault()
      S.held = b
      b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
      toWorld(e.clientX, e.clientY, S.heldPrev, 0.8)
      document.documentElement.classList.add('grabbing')
      onGrab?.()
      log('grab', `piece#${b.i}`)
      return
    }
    if (!['hero', 'interlude', 'finale', 'gate'].includes(S.scene) || !toWorld(e.clientX, e.clientY, hit)) return
    // "let go": a burst out from the click. In the finale this is the only way anything moves.
    const t = new THREE.Vector3()
    for (const { body, i } of bodies) {
      const p = body.translation()
      t.set(p.x - hit.x, p.y - hit.y, 0)
      const d = Math.max(t.length(), 0.5)
      if (d > 5) continue
      t.normalize()
      const m = body.mass(), lift = S.scene === 'finale' || S.scene === 'gate' ? 4.5 : 0
      body.applyImpulse({ x: t.x * m * 9 / d, y: (t.y * 9 / d + lift) * m, z: 0 }, true)
      body.applyTorqueImpulse({ x: (rnd(i, S.frame) - 0.5) * m, y: (rnd(i, S.frame + 1) - 0.5) * m, z: 0.3 * m }, true)
    }
    S.pausedAttract = performance.now() + 700
    log('burst', `${hit.x.toFixed(1)},${hit.y.toFixed(1)}`)
  })

  /* ---------- the flash test, in 3D ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms))
  async function flash() {
    S.flashing = true
    show('blank'); await wait(450)
    show('A'); await wait(50)
    show('blank'); await wait(400)
    show('B'); await wait(50)
    show('blank'); await wait(250)
    show('ask')
    S.flashing = false
  }
  function showCompare(pick) {
    screenTex.compare?.dispose()
    screenTex.compare = texOf(pageCompare(screenTex._srcA, screenTex._srcB, pick))
    show('compare')
  }

  /* ---------- the feed: badges orbit the phone, and dive in when it pays ---------- */
  const anchorPos = new THREE.Vector3(), anchorR = { x: 2, y: 3 }
  function readAnchor() {
    if (!S.anchor) return false
    const r = S.anchor.getBoundingClientRect()
    if (!r.width) return false
    const wpp = (2 * halfH) / innerHeight
    anchorPos.set((r.left + r.width / 2 - innerWidth / 2) * wpp, -(r.top + r.height / 2 - innerHeight / 2) * wpp, 0)
    anchorR.x = (r.width / 2) * wpp + 0.75; anchorR.y = (r.height / 2) * wpp
    return true
  }
  let diveIdx = 0
  function pulse(good) {
    if (good) {
      badges[diveIdx++ % badges.length].dive = performance.now() + 700
      for (const o of badges) o.body.applyImpulse({ x: (rnd(o.i, S.frame) - 0.5) * 2, y: 2, z: 0 }, true)
    } else {
      const b = tiles[Math.floor(rnd(S.frame, 3) * tiles.length)]
      b.body.applyImpulse({ x: 0, y: 6 * b.body.mass(), z: 0 }, true)
    }
  }

  /* ---------- shields: text is a physical object the tiles bump into but can't cover ---------- */
  const shields = [...document.querySelectorAll('[data-shield]')].map(el => ({
    el, w: 0, h: 0,
    col: world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 0.1, SLAB + 1).setTranslation(0, -300, 0).setFriction(0.4)),
  }))
  let textFloor = Infinity   // world y of the lowest edge of on-screen text, for laying tiles out underneath it
  function updateShields() {
    const wpp = (2 * halfH) / innerHeight, live = S.scene !== 'off'
    let floorY = Infinity
    for (const sh of shields) {
      const r = sh.el.getBoundingClientRect()
      if (!live || !r.width || r.bottom < 0 || r.top > innerHeight) { sh.col.setTranslation({ x: 0, y: -300, z: 0 }); continue }
      const hw = (r.width / 2) * wpp + 0.12, hh = (r.height / 2) * wpp + 0.12
      if (Math.abs(hw - sh.w) > 0.02 || Math.abs(hh - sh.h) > 0.02) { sh.col.setHalfExtents({ x: hw, y: hh, z: SLAB + 1 }); sh.w = hw; sh.h = hh }
      const y = -(r.top + r.height / 2 - innerHeight / 2) * wpp, x = (r.left + r.width / 2 - innerWidth / 2) * wpp
      sh.col.setTranslation({ x, y, z: 0 })
      // a tile already inside the text's box when it arrives would never be pushed out: move it past the nearest edge
      for (const b of bodies) {
        if (b.piece?.slot || b === S.held) continue
        const p = b.body.translation(), dx = p.x - x, dy = p.y - y
        if (Math.abs(dx) > hw || Math.abs(dy) > hh) continue
        const ex = hw - Math.abs(dx), ey = hh - Math.abs(dy)
        if (ex < ey) b.body.setTranslation({ x: x + Math.sign(dx || 1) * (hw + 0.8), y: p.y, z: p.z }, true)
        else b.body.setTranslation({ x: p.x, y: y + Math.sign(dy || 1) * (hh + 0.8), z: p.z }, true)
      }
      floorY = Math.min(floorY, y - hh)
    }
    textFloor = floorY
  }

  /* ---------- reticle ---------- */
  const reticle = document.createElement('div')
  reticle.className = 'reticle'
  reticle.innerHTML = '<span></span>'
  document.body.append(reticle)
  const reticleLabel = reticle.firstChild

  /* ---------- loop ---------- */
  const timer = new THREE.Timer()
  const v3 = new THREE.Vector3(), auto = new THREE.Vector3(), qTmp = new THREE.Quaternion(), eTmp = new THREE.Euler()
  const ID = new THREE.Quaternion()
  const toScreen = p => { const v = p.clone().applyMatrix4(rig.matrixWorld).project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight } }
  resize()
  addEventListener('resize', resize)
  drawPages()
  document.fonts.ready.then(drawPages)

  renderer.setAnimationLoop(() => {
    timer.update()
    const dt = Math.min(timer.getDelta(), 1 / 30)
    S.frame++
    // once the canvas has faded out, stop drawing until a scene needs it again
    if (S.scene === 'off') { if (++S.hidden > 50) return } else S.hidden = 0

    const cfg = SCENES[S.scene], now = performance.now()
    world.gravity = { x: 0, y: S.calm && cfg.lure ? -9.8 : cfg.g, z: 0 }
    const moving = pointer.active && now - S.lastMove < 4000

    // who is pulling: your cursor, or, after a few idle seconds, the page itself
    let lure = null, strength = 0
    if (cfg.lure && !S.calm && now > S.pausedAttract) {
      if (moving) { lure = S.lure; strength = 1 }
      else { const t = now / 1000; auto.set(-halfW * 0.2 + Math.sin(t * 0.45) * halfW * 0.4, -halfH * 0.15 + Math.sin(t * 0.8) * halfH * 0.3, 0); lure = auto; strength = 0.55 }
    }
    const push = cfg.push && moving && !S.held && !S.calm
    cursorBody.setNextKinematicTranslation(push ? { x: S.lure.x, y: S.lure.y, z: 0 } : { x: 0, y: -300, z: 0 })

    const orbiting = cfg.form === 'orbit' && readAnchor()
    // under reduced motion, everything driven by the clock (the ring turning, badges bobbing) holds still
    if (!S.calm) S.t = now / 1000
    const tNow = S.t
    for (const b of bodies) {
      const p = b.body.translation(), m = b.body.mass()

      // placed pieces glide into their slot and square up
      if (b.piece?.slot && S.scene === 'build') {
        const s = b.piece.slot.p, k = Math.min(1, dt * 10)
        b.body.setNextKinematicTranslation({ x: p.x + (s.x - p.x) * k, y: p.y + (s.y - p.y) * k, z: p.z + (s.z - p.z) * k })
        const r = b.body.rotation()
        b.body.setNextKinematicRotation(qTmp.set(r.x, r.y, r.z, r.w).slerp(ID, Math.min(1, dt * 8)))
        continue
      }
      if (b === S.held) {
        if (toWorld(pointer.x, pointer.y, v3, 0.8)) {
          S.heldPrev.copy(v3)
          b.body.setNextKinematicTranslation({ x: v3.x, y: v3.y, z: 0.8 })
          b.body.setNextKinematicRotation(qTmp.setFromEuler(eTmp.set(pointer.ny * 0.6, pointer.nx * 0.8, 0)))
        }
        continue
      }

      // where this body wants to be in this scene, if anywhere
      let target = null
      if (cfg.form === 'cloud') {
        target = ringTarget(b, tNow, v3)
        // on a phone the screen spans the width: a tile whose place is past it, or out of view, goes straight there
        if (F.ring.portrait) {
          const crossing = target.y < -halfH ? p.y > -halfH - 1 : Math.sign(p.y - fit.y) !== Math.sign(target.y - fit.y)
          if (crossing) { b.body.setTranslation({ x: target.x, y: target.y, z: 0 }, true); b.body.setLinvel({ x: 0, y: 0, z: 0 }, true) }
        }
      }
      else if (cfg.form === 'build' && pieces.includes(b)) target = F.homes[pieces.indexOf(b)]
      else if (orbiting && b.kind === 'badge') {
        if (b.dive && now < b.dive) target = anchorPos
        else {
          if (b.dive) { b.dive = 0; b.body.setTranslation({ x: anchorPos.x - anchorR.x, y: anchorPos.y + anchorR.y, z: 0 }, true) }
          const k = badges.indexOf(b), side = k % 2 ? 1 : -1, row = Math.floor(k / 2), rows = Math.ceil(badges.length / 2)
          const span = Math.max(0.5, anchorR.y - 1.2)
          target = v3.set(anchorPos.x + side * anchorR.x, anchorPos.y + span * (1 - (2 * row + 1) / rows) + Math.sin(tNow * 1.4 + k) * 0.25, Math.sin(tNow + k) * 0.4)
        }
      }
      if (!target && cfg.park) target = v3.set(b.body.translation().x, -halfH - 4, 0)
      if (target) {
        // a damped spring toward the target, with gravity cancelled
        const v = b.body.linvel(), k = 22, c = 7
        b.body.applyImpulse({
          x: ((target.x - p.x) * k - v.x * c) * m * dt,
          y: ((target.y - p.y) * k - v.y * c - world.gravity.y) * m * dt,
          z: ((target.z - p.z) * k - v.z * c) * m * dt,
        }, true)
        if (cfg.form === 'cloud') b.body.applyTorqueImpulse({ x: 0.002 * m, y: 0.003 * m, z: 0 }, true)
      }

      if (lure) {
        v3.set(lure.x - p.x, lure.y - p.y, -p.z * 0.5)
        const d = v3.length(), R = 7.5
        if (d < R) {
          const f = (1 - d / R) ** 0.6 * 30 * strength * m * dt
          v3.normalize()
          // pull in, cancel gravity, and a little swirl so the cloud orbits instead of clumping
          b.body.applyImpulse({ x: v3.x * f - v3.y * f * 0.35, y: v3.y * f + v3.x * f * 0.35 + 6 * m * dt * (1 - d / R), z: v3.z * f }, true)
        }
        if (strength === 1) {
          if (!b.near && d < 1.9) {
            b.near = true; session.captures++
            if (session.captures % 5 === 1) log('capture', `tile#${String(b.i).padStart(2, '0')} · total ${session.captures}`)
          } else if (b.near && d > 3.4) b.near = false
        }
      }
    }
    const sv = getScrollVel()
    if (!S.calm && Math.abs(sv) > 3 && (cfg.lure || S.scene === 'gate'))
      for (const { body } of bodies) body.applyImpulse({ x: 0, y: -sv * 0.0016 * body.mass(), z: 0 }, true)

    if (S.frame % 2 === 0) updateShields()
    world.timestep = dt
    world.step()
    for (const { mesh, body } of bodies) {
      mesh.position.copy(body.translation())
      mesh.quaternion.copy(body.rotation())
      mesh.scale.setScalar(1)
      mesh.visible = true
    }

    // on a phone the screen sits in the space left under the text, shrinking on a short screen
    if (F.ring.portrait && S.scene === 'flash') {
      const top = Math.min(textFloor, halfH - 1.2) - 0.35, bottom = -halfH + 2.8
      const s = THREE.MathUtils.clamp((top - bottom - 0.4) / (SH + 0.34), 0.45, 1)
      const y = Math.min(region().cy, top - (SH * s) / 2 - 0.17)
      const k = Math.min(1, dt * 6)
      fit.s += (s - fit.s) * k; fit.y += (y - fit.y) * k
      screen.position.y = fit.y
      if (Math.abs(fit.s - fit.colS) > 0.02) { fit.colS = fit.s; screenCol.setHalfExtents({ x: (SW * fit.s) / 2 + 0.3, y: (SH * fit.s) / 2 + 0.3, z: SLAB + 1 }) }
      screenBody.setTranslation({ x: screen.position.x, y: fit.y, z: 0 }, true)
      F.ring.cy = fit.y
    }
    // the flash screen arrives with its scene and leans with everything else
    screenAlpha += ((S.scene === 'flash' ? 1 : 0) - screenAlpha) * Math.min(1, dt * 4)
    screen.visible = screenAlpha > 0.01
    bezelMat.opacity = displayMat.opacity = screenAlpha
    screen.scale.setScalar((0.9 + 0.1 * screenAlpha) * fit.s)
    screen.rotation.x = rig.rotation.x
    screen.rotation.y = screenBaseY + rig.rotation.y

    // lean toward the pointer
    const k = Math.min(1, dt * 3), lean = !S.calm && pointer.active && !S.held && !S.flashing
    rig.rotation.y += ((lean ? pointer.nx * 0.14 : 0) - rig.rotation.y) * k
    rig.rotation.x += ((lean ? pointer.ny * 0.09 : 0) - rig.rotation.x) * k

    // the build frame fades in with its scene and leans with everything else
    frameAlpha += ((S.scene === 'build' ? 1 : 0) - frameAlpha) * Math.min(1, dt * 4)
    frame.visible = frameAlpha > 0.01
    frameMats[0].opacity = 0.5 * frameAlpha; frameMats[1].opacity = 0.28 * frameAlpha; frameMats[2].opacity = 0.8 * frameAlpha
    frame.rotation.copy(rig.rotation)

    // reticle: where the pull is, and how many tiles it has hold of
    const showReticle = strength === 1
    reticle.classList.toggle('on', showReticle)
    if (showReticle) {
      reticle.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`
      if (S.frame % 4 === 0) {
        let held = 0
        for (const b of bodies) if (b.near) held++
        reticleLabel.textContent = `Pulling ${String(held).padStart(2, '0')}`
      }
    }
    // a grab cursor over pieces you can pick up
    if (S.scene === 'build' && !S.held && S.frame % 5 === 0)
      document.documentElement.classList.toggle('can-grab', !!pickPiece(pointer.x, pointer.y))
    else if (S.scene !== 'build') document.documentElement.classList.remove('can-grab')

    renderer.render(scene, camera)
  })

  // debug handle so interaction claims can be checked as numbers
  window.__stage = {
    state: () => ({
      scene: S.scene, frame: S.frame, calm: S.calm, captures: session.captures, placed: S.placed, screen: S.screen,
      halfW: +halfW.toFixed(2), halfH: +halfH.toFixed(2),
      ys: bodies.map(b => +b.body.translation().y.toFixed(2)),
      xs: bodies.map(b => +b.body.translation().x.toFixed(2)),
    }),
    // screen positions of pieces and slots, for automated drag tests
    pieceScreens: () => pieces.map(b => ({ i: b.i, kind: b.kind, placed: !!b.piece?.slot, ...toScreen(b.mesh.position) })),
    slotScreens: () => F.slots.map(s => ({ kind: s.kind, ...toScreen(s.p) })),
    show: name => show(name),
    shields: () => shields.map(sh => { const t = sh.col.translation(); return t.y < -100 ? null : `${sh.el.className || sh.el.tagName}@(${t.x.toFixed(2)},${t.y.toFixed(2)}) ${sh.w.toFixed(2)}x${sh.h.toFixed(2)}` }).filter(Boolean),
    ring: () => F.ring,
    // how many tiles overlap the screen's face right now (should be 0 once settled)
    onScreen: () => bodies.filter(b => { const p = b.body.translation(); return Math.abs(p.x - screen.position.x) < SW / 2 && Math.abs(p.y - screen.position.y) < SH / 2 }).length,
  }

  return {
    setScene,
    setCalm(on) { S.calm = on },
    setAnchor(el) { S.anchor = el },
    flash,
    showCompare,
    screenIdle() { show('idle') },
    pulse,
    placeAll() { for (const b of pieces) if (!b.piece?.slot) lockInto(b, freeSlot(b)) },
  }
}

/* a cool studio environment built in code (no HDR download): the light of a screen, not a lamp */
function coolEnvironment(renderer) {
  const W = 256, H = 128, data = new Float32Array(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, fy = y / H, fx = (x / W) * Math.PI * 2
    let r = 0.05, g = 0.055, b = 0.07
    const key = Math.max(0, -Math.sin(fx - 2.2) * (1 - fy * 1.5)) ** 2
    r += key * 5.0; g += key * 4.9; b += key * 4.8
    const rim = Math.max(0, Math.sin(fx + 0.9) * (1 - Math.abs(fy - 0.45) * 3)) ** 3
    r += rim * 1.2; g += rim * 1.3; b += rim * 1.6
    const top = Math.max(0, 1 - fy * 2.4)
    r += top * 0.8; g += top * 0.82; b += top * 0.9
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 1
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.needsUpdate = true
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(tex).texture
  tex.dispose(); pmrem.dispose()
  return env
}
