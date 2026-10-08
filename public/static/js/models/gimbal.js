// ---------------------------------------------------------------------------
//  Model B — dual-axis cardan gimbal desktop stick (Gladiator NXT EVO class)
//  Units: mm. Y up, +Z front, +X right. Gimbal centre = (0, 44, 0).
//  Pitch axis = X (outer yoke on towers), roll axis = Z (inner block in yoke)
// ---------------------------------------------------------------------------
import {
  V3, DEG, TAU, clamp, merge, box, cylX, cylY, cylZ, ringY, sphere, revolve, spring, extSpring,
  bellows, thickLoft, superShape, roundedRectShape, circlePath, extrudeY, extrudeX, extrudeZ, camShape, screw, wire, THREE
} from '../geo.js'
import { ModelBuilder, GripSurface, mount, hat, domeButton, knob, leverZY, smoothOutline } from '../builder.js'

export const CY = 44

/** ring along X axis (bearing-like) */
function ringX (R, r, x0, x1, { y = 0, z = 0, seg = 48 } = {}) {
  const g = revolve({ rOut: R, rIn: r, y0: x0, y1: x1, nT: seg, nY: 1 })
  g.rotateZ(-Math.PI / 2)
  g.translate(0, y, z)
  return g
}
function ringZ (R, r, z0, z1, { x = 0, y = 0, seg = 48 } = {}) {
  const g = revolve({ rOut: R, rIn: r, y0: z0, y1: z1, nT: seg, nY: 1 })
  g.rotateX(Math.PI / 2)
  g.translate(x, y, 0)
  return g
}
/** 608 bearing along X or Z */
function bearing608 (axis, c0, at) {
  const [a, b2] = [c0 - 3.5, c0 + 3.5]
  const f = axis === 'x' ? ringX : ringZ
  const o = axis === 'x' ? { y: at[1], z: at[2] } : { x: at[0], y: at[1] }
  return merge([f(11, 9.2, a, b2, o), f(6.2, 4, a, b2, o), f(9.2, 6.2, a + 0.8, b2 - 0.8, o)])
}

export function build (data) {
  const b = new ModelBuilder(data)
  const C = V3(0, CY, 0)
  b.pivot.copy(C)

  // ---------------------------------------------------------------- kinematic nodes
  const rPitch = b.addRotNode('pitch', 'fixed', C)
  const rRoll = b.addRotNode('roll', 'pitch', C)
  const rTwist = b.addRotNode('twist', 'roll', C)
  const rBoot = b.addRotNode('bootN', 'fixed', C)
  const rFolP = b.addRotNode('folP', 'fixed', V3(-46, 12, -24))
  const rSprP = b.addRotNode('sprP', 'fixed', V3(-46, 40, -54))
  const rFolR = b.addRotNode('folR', 'pitch', V3(-17, 28, -31))
  b.secNode = { shaft: 'roll', grip: 'twist', boot: 'bootN' }

  // ================================================================= BASE PLATE
  const plate = roundedRectShape(145, 185, 10)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    plate.holes.push(circlePath(sx * 60, sz * 80, 3.5)) // Ø7 mounting
    plate.holes.push(circlePath(sx * 40, sz * 50, 3)) // Ø6 base screws
  }
  for (const sz of [-1, 1]) plate.holes.push(circlePath(0, sz * 80, 4.5)) // Ø9 extruded
  b.part('g_baseplate', extrudeY(plate, 3, 2, { bevel: 0.4, seg: 20 }), 'powder', { label: V3(-60, 5, 70) })
  const pads = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pads.push(cylY(8, 0, 2, { x: sx * 56, z: sz * 64, seg: 28 }))
  b.part('g_pads', merge(pads), 'rubber', { label: V3(56, 1, 64) })
  const scr = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scr.push(screw({ d: 5, len: 10, head: 'socket', x: sx * 40, y: 2, z: sz * 50, dir: 1, P: 0.8 }))
  b.part('g_screws', merge(scr), 'steel', { label: V3(40, 0, 50) })

  // ================================================================= HOUSING
  const hs = [
    { y: 5, a: 62, b: 72, p: 4 },
    { y: 10, a: 62, b: 72, p: 4 },
    { y: 60, a: 48, b: 55, p: 4 },
    { y: 66, a: 46, b: 52, p: 4 }
  ]
  b.part('g_housing_r', thickLoft(hs, { t: 2.5, n: 128, a0: -Math.PI / 2, a1: Math.PI / 2 }), 'abs', { label: V3(58, 35, 0) })
  b.part('g_housing_l', thickLoft(hs, { t: 2.5, n: 128, a0: Math.PI / 2, a1: Math.PI * 1.5 }), 'abs', { label: V3(-58, 35, 0) })
  const top = superShape(46, 52, 4, 128)
  top.holes.push(circlePath(0, 0, 28))
  b.part('g_housing_top', extrudeY(top, 3, 66, { bevel: 0.6, seg: 64 }), 'absGrey', { label: V3(30, 70, -40) })
  // base controls
  b.part('g_encoders', merge([
    knob({ r: 7, h: 9, ribs: 24 }).translate(-33, 69, 36),
    knob({ r: 7, h: 9, ribs: 24 }).translate(33, 69, 36)
  ]), 'aluDark', { label: V3(-33, 80, 36) })
  const wh = cylX(12, -3, 3, { seg: 48 }); wh.translate(40, 64, -12)
  const whRib = []
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; whRib.push(box(6, 1.2, 1.2, { x: 40, y: 64 + 12.2 * Math.sin(a), z: -12 + 12.2 * Math.cos(a), rx: -a / DEG })) }
  b.part('g_wheel', merge([wh, ...whRib]), 'absLight', { label: V3(44, 78, -12) })
  b.part('g_buttons', merge([
    domeButton({ r: 4.5, h: 2.5 }).translate(-34, 69, -30),
    domeButton({ r: 4.5, h: 2.5 }).translate(-20, 69, -42),
    domeButton({ r: 4.5, h: 2.5 }).translate(20, 69, -42)
  ]), 'red', { label: V3(-34, 74, -30) })

  // ================================================================= GIMBAL
  // fixed: base frame + two towers carrying the pitch bearings
  const towers = [box(96, 4, 44, { y: 7, r: 1 })]
  for (const sx of [-1, 1]) {
    const t = roundedRectShape(32, 50, 4, 0, 0)
    t.holes.push(circlePath(0, 50 / 2 - 14, 11))
    const g = extrudeX(t, 8, 0)
    // shape (u,v) -> (x, v, -u): v in [-25,25] -> shift so bottom at y 9, bearing at y 44
    g.translate(sx > 0 ? 33 : -41, 9 + 25, 0)
    towers.push(g)
  }
  b.part('g_frame', merge(towers), 'pa', { label: V3(37, 20, 16) })
  b.part('g_bearings', merge([bearing608('x', 37, [0, CY, 0]), bearing608('x', -37, [0, CY, 0])]), 'steel', { label: V3(37, 56, 0) })

  // pitch node: outer yoke + stub axles + roll bearings
  const yoke = roundedRectShape(54, 54, 5)
  yoke.holes.push(roundedRectShape(40, 40, 3))
  const yk = extrudeY(yoke, 24, CY - 12, { seg: 16 })
  b.part('g_yoke', yk, 'pa', { node: 'pitch', label: V3(-24, 56, 24) })
  b.part('g_axle_x', merge([cylX(4, 18, 44, { y: CY }), cylX(4, -50, -18, { y: CY })]), 'steel', { node: 'pitch', label: V3(-48, 50, 0) })
  b.part('g_bearings', merge([bearing608('z', 23.5, [0, CY, 0]), bearing608('z', -23.5, [0, CY, 0])]), 'steel', { node: 'pitch' })

  // roll node: inner block + roll axle
  b.part('g_block', box(26, 26, 26, { y: CY, r: 2 }), 'pa', { node: 'roll', label: V3(13, 58, 13) })
  b.part('g_axle_z', cylZ(4, -34, 34, { y: CY }), 'steel', { node: 'roll', label: V3(0, 50, 34) })

  // ================================================================= CENTERING (cams, followers, springs, clutch)
  // pitch cam on the left stub, detent facing back (-Z)
  const camP = extrudeX(camShape(18, 3, 0.45, 0), 5, -48.5); camP.translate(0, CY, 0)
  b.part('g_cam_x', merge([camP, ringX(6, 4, -48.5, -43.5, { y: CY })]), 'pom', { node: 'pitch', label: V3(-46, 64, 0) })
  // roll cam on the roll axle behind the yoke, detent facing -X
  const camR = extrudeZ(camShape(15, 2.5, 0.5, Math.PI), 4, -34); camR.translate(0, CY, 0)
  b.part('g_cam_z', camR, 'pom', { node: 'roll', label: V3(0, 60, -32) })

  // pitch follower (fixed frame, pivots about X at y 12, z -24)
  b.part('g_follower', merge([
    leverZY([[-26, 12], [-22, 12], [-19, 44], [-23, 44]], 5, -46),
    cylX(5, -48.5, -43.5, { y: 44, z: -21.2, seg: 32 }),
    cylX(1.5, -50, -42, { y: 44, z: -21.2, seg: 12 }),
    cylX(2.5, -50, -42, { y: 12, z: -24, seg: 16 })
  ]), 'steel', { node: 'folP', label: V3(-46, 30, -28) })
  b.part('g_follower', merge([box(6, 38, 6, { x: -46, y: 26, z: -54 })]), 'pa', { label: V3(-46, 20, -56) })
  // extension spring between follower lever (z -24) and anchor post (z -54), along Z
  const sp = extSpring({ rMean: 3.2, wire: 0.9, length: 30, y0: 0 })
  sp.rotateX(-Math.PI / 2); sp.translate(-46, 40, -54)
  b.part('g_springs', sp, 'spring', { node: 'sprP', label: V3(-52, 46, -40) })

  // roll follower on the yoke (pitch node), lever in X-Y plane, pivot (-17, 28)
  const lvR = new THREE.Shape([[-1.6, 0], [1.6, 0], [1.6, 16], [-1.6, 16]].map(([u, v]) => new THREE.Vector2(u, v)))
  const lvRg = extrudeZ(lvR, 3, -33); lvRg.translate(-17, 28, 0)
  b.part('g_follower', merge([
    lvRg,
    cylZ(4, -34, -30, { x: -16.3, y: CY, seg: 28 }),
    cylZ(1.8, -35, -29, { x: -17, y: 28, seg: 12 })
  ]), 'steel', { node: 'folR' })
  b.part('g_follower', merge([box(5, 8, 3, { x: -24, y: 30, z: -31.5 }), box(16, 3, 4, { x: -20, y: 26, z: -31.5 })]), 'pa', { node: 'pitch' })
  const spR = spring({ rMean: 1.6, wire: 0.5, length: 7, turns: 8, y0: 0 })
  spR.rotateZ(Math.PI / 2); spR.translate(-15, 36, -31.5)
  b.part('g_springs', spR, 'spring', { node: 'pitch' })

  // clutch: friction disc stack on the roll axle in front of the yoke + adjust screw
  b.part('g_clutch', merge([
    ringZ(13, 4.2, 28, 30, { y: CY }),
    ringZ(12, 4.2, 30, 31, { y: CY }),
    ringZ(13, 4.2, 31, 33, { y: CY }),
    cylZ(3, 33, 38, { y: CY, seg: 6 })
  ]), 'steel', { node: 'pitch', label: V3(0, 60, 32) })
  b.part('g_clutch', ringZ(12.2, 4.2, 30.1, 30.9, { y: CY }), 'grease', { node: 'pitch' })

  // ================================================================= ELECTRONICS
  // pitch sensor: magnet on right stub end, MaRS board fixed beyond it
  b.part('g_magnets', cylX(3, 44, 46.5, { y: CY, seg: 24 }), 'magnet', { node: 'pitch', label: V3(45, 50, 0) })
  b.part('g_mars', box(1.6, 18, 18, { x: 48.8, y: CY }), 'pcb', { label: V3(49, 54, 9) })
  b.part('g_mars', merge([box(1, 3, 3, { x: 48.5 - 0.8, y: CY }), box(10, 3, 10, { x: 44, y: 34, z: 0 })]), 'chip')
  // roll sensor: magnet on roll axle front end, board on the yoke bracket
  b.part('g_magnets', cylZ(3, 38, 40.5, { y: CY, seg: 24 }), 'magnet', { node: 'roll' })
  b.part('g_mars', merge([box(18, 18, 1.6, { y: CY, z: 42.8 }), box(18, 2, 14, { y: CY - 10, z: 35 })]), 'pcb', { node: 'pitch' })
  b.part('g_mars', box(3, 3, 1, { y: CY, z: 41.5 }), 'chip', { node: 'pitch' })
  // main board at the back + usb
  b.part('g_mainboard', box(64, 1.6, 34, { y: 13, z: -46 }), 'pcb', { label: V3(20, 15, -46) })
  b.part('g_mainboard', merge([
    box(10, 1.4, 10, { x: 10, y: 14.5, z: -44 }),
    box(5, 1, 3, { x: -12, y: 14.3, z: -40 }),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cylY(2.2, 5, 12.2, { x: sx * 28, z: -46 + sz * 14, seg: 14 })))
  ]), 'chip')
  b.part('g_usb', merge([box(10, 8, 14, { y: 18.6, z: -62 })]), 'steel', { label: V3(0, 26, -70) })
  b.part('g_usb', wire([[0, 18.6, -69], [0, 18, -82], [6, 12, -100], [22, 4, -118]], 2.2, 32), 'conn')
  // sensor cables (fixed)
  b.part('g_mainboard', merge([
    wire([[48, CY - 9, 0], [50, 25, -10], [30, 15, -30]], 0.6, 32),
    wire([[0, CY - 11, 35], [0, 20, 40], [-10, 15, 20], [-8, 15, -29]], 0.6, 32)
  ]), 'wire')

  // ================================================================= BOOT
  b.part('g_boot', bellows({ r0: 27, r1: 14, y0: 69, y1: 80, folds: 3, amp: 1.5, t: 1, nT: 64 }), 'rubber', { label: V3(26, 75, 0) })

  // ================================================================= SHAFT / TWIST / ADAPTER
  b.part('g_shaft', merge([ringY(10, 7, 57, 112, { seg: 48 }), cylY(12, 55, 58, { seg: 40 })]), 'alu', { label: V3(10, 92, 0) })
  b.part('g_twist', merge([ringY(13, 10, 112, 124, { seg: 48 })]), 'pom', { label: V3(13, 118, 0) })
  b.part('g_twist', merge([screw({ d: 3, len: 6, head: 'socket', x: 0, y: 0, z: 0, dir: 1, P: 0.5 })]).rotateX(-Math.PI / 2).translate(0, 118, 13), 'steel')
  b.part('g_adapter', merge([
    ringY(11, 6, 124, 146, { seg: 48 }),
    ringY(13, 6, 122, 124, { seg: 48 }),
    cylY(6, 112, 124, { seg: 32 })
  ]), 'alu', { node: 'twist', label: V3(-11, 136, 0) })
  b.part('g_adapter', box(8, 3, 4, { y: 145.6 }), 'conn', { node: 'twist' })

  // ================================================================= GRIP (twist node)
  const gs = new GripSurface([
    { y: 122, a: 15, b: 15, p: 2.2 },
    { y: 140, a: 16, b: 18, p: 2.3, cz: 0.5 },
    { y: 160, a: 19, b: 23, p: 2.5, cz: 2 },
    { y: 182, a: 20, b: 25, p: 2.6, cz: 3.5 },
    { y: 204, a: 21, b: 27, p: 2.8, cz: 6 },
    { y: 222, a: 22, b: 28, p: 3, cz: 8 },
    { y: 231, a: 17, b: 23, p: 3, cz: 9 },
    { y: 234.5, a: 8, b: 11, p: 2.4, cz: 9, t: 1.5 },
    { y: 235, a: 1, b: 1, p: 2, cz: 9, t: 0.5 }
  ], 6)
  const sh = gs.shells({ t: 2.3, n: 120 })
  b.part('g_grip_r', sh.right, 'abs', { label: V3(21, 180, 3) })
  b.part('g_grip_l', sh.left, 'abs', { label: V3(-21, 180, 3) })
  const onTop = (x, z, g, spin = 0, sink = 0.8) => { const f = gs.top(x, 9 + z); return mount(g, f.p, f.n, { spin, sink }) }
  const thumb = gs.frame(212, Math.PI * 0.95)
  const front = gs.frame(170, Math.PI / 2)
  b.part('g_grip_ctrl', merge([
    onTop(-6, 4, hat({ r: 5, ways: 4, h: 4 })),
    onTop(7, 2, hat({ r: 4.5, ways: 8, h: 4 })),
    onTop(0, 18, domeButton({ r: 4.5, h: 2.5 }), 0, 0.6),
    mount(hat({ r: 4.5, ways: 4, h: 4 }), thumb.p, thumb.n),
    mount(domeButton({ r: 3.5, h: 2.2 }), front.p, front.n, { sink: 0.6 }),
    leverZY(smoothOutline([[30, 214], [40, 211], [44, 201], [42, 191], [36, 186], [33, 192], [33, 202], [29, 208]]), 11)
  ]), 'absGrey', { label: V3(0, 240, 18) })
  b.part('g_grip_pcb', box(1.6, 60, 22, { x: 2, y: 190, z: 5 }), 'pcbBlue', { label: V3(2, 205, 5) })
  b.part('g_grip_pcb', merge([
    wire([[2, 160, 4], [1, 152, 2], [0, 148, 0], [0, 147.2, 0]], 1.2, 24)
  ]), 'wire')
  b.part('g_grip_conn', merge([box(9, 4, 5, { y: 148.6 })]), 'conn', { label: V3(0, 150, -12) })
  b.part('g_grip_conn', merge(new Array(8).fill(0).map((_, i) => cylY(0.32, 146, 147, { x: -3.5 + i * 1, z: 0, seg: 8 }))), 'gold')
  b.part('g_grip_screws', merge([
    screw({ d: 3, len: 8, head: 'socket', x: 0, y: 0, z: 0, dir: 1, P: 0.5 }).rotateZ(Math.PI / 2).translate(16.5, 136, 0),
    screw({ d: 3, len: 8, head: 'socket', x: 0, y: 0, z: 0, dir: 1, P: 0.5 }).rotateZ(-Math.PI / 2).translate(-16.5, 136, 0)
  ]), 'steel', { label: V3(19, 136, 0) })

  // ================================================================= EXPLODE
  b.explode({
    base: [0, -40, 0],
    housing_l: [-110, 0, 0], housing_r: [110, 0, 0], housing_top: [0, 70, 0],
    boot: [0, 95, 0],
    gimbal: [0, 0, 0],
    centering: [0, 0, -60],
    electronics: [0, -6, -80],
    shaft: [0, 40, 0],
    grip: [0, 120, 0],
    grip_l: [-60, 0, 0], grip_r: [60, 0, 0], grip_ctrl: [0, 20, 45], grip_int: [0, 0, 0]
  })

  // ================================================================= KINEMATICS
  b.onAxes((ax) => {
    const p = ax.pitch * DEG, r = ax.roll * DEG
    rPitch.rotation.set(p, 0, 0)
    rRoll.rotation.set(0, 0, -r)
    rTwist.rotation.set(0, ax.twist * DEG, 0)
    rBoot.rotation.set(p * 0.5, 0, -r * 0.5)
    // follower lift = detent depth * min(1, |angle| / half-width)
    const liftP = 3 * Math.min(1, Math.abs(p) / 0.45)
    rFolP.rotation.x = -Math.atan2(liftP, 32)
    rSprP.scale.z = (30 - liftP) / 30
    const liftR = 2.5 * Math.min(1, Math.abs(r) / 0.5)
    rFolR.rotation.z = Math.atan2(liftR, 16)
  })

  // ================================================================= DIMENSIONS
  const D = (o) => b.dim(o)
  D({ id: 'g_d_w', kind: 'linear', anchor: 'base', a: [-72.5, 5, 92.5], b: [72.5, 5, 92.5], off: [0, 0, 20], text: '145 mm', name: 'عرض صفحه', conf: 'official', src: 'S8' })
  D({ id: 'g_d_d', kind: 'linear', anchor: 'base', a: [72.5, 5, -92.5], b: [72.5, 5, 92.5], off: [20, 0, 0], text: '185 mm', name: 'عمق صفحه', conf: 'official', src: 'S8' })
  D({ id: 'g_d_holes', kind: 'diameter', anchor: 'base', c: [60, 5.1, 80], r: 3.5, n: [0, 1, 0], d: [1, 0, 1], lead: 14, text: 'Ø7 · Ø6 · Ø9', name: 'سوراخ‌های نصب', conf: 'community', src: 'S9' })
  D({ id: 'g_d_total', kind: 'linear', anchor: 'base', a: [-72.5, 0, 92.5], b: [-72.5, 235, 92.5], off: [-18, 0, 0], text: '≈ 235 mm', name: 'ارتفاع کل', conf: 'official', src: 'S8' })
  D({ id: 'g_d_axle', kind: 'diameter', anchor: 'gimbal', node: 'pitch', c: [-30, CY, 0], r: 4, n: [1, 0, 0], d: [0, 1, 0.3], lead: 30, text: 'Ø8 · 2 × 26', name: 'شفت محور پیچ', conf: 'design' })
  D({ id: 'g_d_bearing', kind: 'diameter', anchor: 'gimbal', c: [40.6, CY, 0], r: 11, n: [1, 0, 0], d: [0, 0.6, -1], lead: 22, text: '608 · 8×22×7', name: 'بلبرینگ', conf: 'standard' })
  D({ id: 'g_d_towers', kind: 'linear', anchor: 'gimbal', a: [-33, 20, 16], b: [33, 20, 16], off: [0, 0, 12], text: '66 mm', name: 'فاصلهٔ داخلی برج‌ها', conf: 'design' })
  D({ id: 'g_d_center', kind: 'linear', anchor: 'gimbal', a: [0, 0, 0], b: [0, CY, 0], off: [-80, 0, 0], text: '44 mm', name: 'ارتفاع مرکز گیمبال', conf: 'design' })
  D({ id: 'g_d_throw', kind: 'angle', anchor: 'gimbal', c: [0, CY, 0], n: [1, 0, 0], u: [0, 1, 0], r: 82, deg: 15, text: '±15°', name: 'انحراف پیچ/رول', conf: 'design' })
  D({ id: 'g_d_cam', kind: 'diameter', anchor: 'centering', node: 'pitch', c: [-48.5, CY, 0], r: 18, n: [1, 0, 0], d: [0, 1, 0.5], lead: 22, text: 'Ø36 · V 3 mm', name: 'بادامک پیچ', conf: 'design' })
  D({ id: 'g_d_spring', kind: 'linear', anchor: 'centering', a: [-52, 40, -54], b: [-52, 40, -24], off: [0, 14, 0], text: '30 mm · Ø8', name: 'فنر کششی قابل تعویض', conf: 'design' })
  D({ id: 'g_d_clutch', kind: 'diameter', anchor: 'centering', node: 'pitch', c: [0, CY, 33], r: 13, n: [0, 0, 1], d: [1, 0.8, 0], lead: 22, text: 'Ø26', name: 'دیسک کلاچ', conf: 'design' })
  D({ id: 'g_d_gap', kind: 'linear', anchor: 'electronics', a: [46.5, CY + 6, 0], b: [48, CY + 6, 0], off: [0, 16, 0], arrow: 0.6, text: '1.5 mm', name: 'فاصلهٔ هوایی MaRS', conf: 'design', lshift: [0, 4, 0] })
  D({ id: 'g_d_usb', kind: 'leader', anchor: 'electronics', p: [0, 18.6, -69], q: [-30, 40, -100], text: 'USB · 180 cm', name: 'کابل', conf: 'official', src: 'S10' })
  D({ id: 'g_d_adapter', kind: 'diameter', anchor: 'shaft', node: 'twist', c: [0, 140, 0], r: 11, n: [0, 1, 0], d: [-1, 0, 0], lead: 30, text: 'Ø22', name: 'آداپتور', conf: 'design' })
  D({ id: 'g_d_engage', kind: 'linear', anchor: 'shaft', node: 'twist', a: [11, 124, 0], b: [11, 146, 0], off: [26, 0, 0], text: '22 mm', name: 'طول درگیری', conf: 'design' })
  D({ id: 'g_d_screws', kind: 'leader', anchor: 'grip_int', p: [19, 136, 0], q: [48, 120, 20], text: '2 × M3×8', name: 'پیچ‌های قفل دسته', conf: 'design' })
  D({ id: 'g_d_conn', kind: 'leader', anchor: 'grip_int', p: [0, 148.6, -2.5], q: [-36, 160, -34], text: '8P · 2.0 mm', name: 'کانکتور دسته', conf: 'design' })
  D({ id: 'g_d_twist', kind: 'angle', anchor: 'shaft', c: [0, 118, 0], n: [0, 1, 0], u: [0, 0, 1], r: 32, deg: 15, text: '±15° Z', name: 'چرخش Z', conf: 'design' })
  D({ id: 'g_d_griph', kind: 'linear', anchor: 'grip', a: [0, 122, -15], b: [0, 235, -15], off: [0, 0, -28], text: '≈ 113 mm', name: 'ارتفاع دسته', conf: 'design' })

  b.overview = ['g_d_w', 'g_d_d', 'g_d_total']
  b.focus = { target: V3(0, 110, 0), dist: 470 }
  return b
}
