// ---------------------------------------------------------------------------
//  Model C — economical fixed-grip Hall stick (T.16000M FCS class)
//  Units: mm. Y up, +Z front, +X right. Pivot (ball centre) = (0, 50, 0).
//  Twist (Z-rudder) collar on top of the shaft, throttle lever on the left.
// ---------------------------------------------------------------------------
import {
  V3, DEG, TAU, clamp, merge, box, cylX, cylY, ringY, sphere, lathe, revolve, spring,
  bellows, thickLoft, superShape, circlePath, extrudeY, screw, wire, THREE
} from '../geo.js'
import { ModelBuilder, GripSurface, mount, hat, domeButton, leverZY, smoothOutline } from '../builder.js'

export const PIVOT_Y = 50
const THR = V3(-98, 34, 0) // throttle pivot

export function build (data) {
  const b = new ModelBuilder(data)
  const P = V3(0, PIVOT_Y, 0)
  b.pivot.copy(P)

  const rStick = b.addRotNode('stick', 'fixed', P)
  const rTwist = b.addRotNode('twistN', 'stick', V3(0, 100, 0))
  const rBoot = b.addRotNode('bootN', 'fixed', P)
  const rThr = b.addRotNode('thr', 'fixed', THR)
  const rCone = b.addRotNode('cone', 'fixed', V3(0, 0, 0))
  const rSp = b.addRotNode('springN', 'fixed', V3(0, 12, 0))
  b.secNode = { shaft: 'stick', twist: 'stick', grip: 'twistN', boot: 'bootN', throttle: 'thr' }

  // ================================================================= BASE
  const plate = superShape(92, 104, 3, 128)
  for (const [x, z] of [[-60, -70], [60, -70], [-60, 70], [60, 70], [0, -88], [0, 88]]) plate.holes.push(circlePath(x, z, 1.7))
  b.part('f_plate', extrudeY(plate, 4, 2, { bevel: 0.6, seg: 64 }), 'abs', { label: V3(-70, 4, 80) })
  b.part('f_weight', box(120, 8, 80, { y: 10, z: -30, r: 2 }), 'powder', { label: V3(50, 14, -50) })
  const pads = []
  for (const [x, z] of [[-70, -80], [70, -80], [-70, 80], [70, 80], [0, 0]]) pads.push(cylY(9, 0, 2, { x, z, seg: 28 }))
  b.part('f_pads', merge(pads), 'rubber', { label: V3(70, 1, 80) })
  const scr = []
  for (const [x, z] of [[-60, -70], [60, -70], [-60, 70], [60, 70], [0, -88], [0, 88]]) scr.push(screw({ d: 3, len: 12, head: 'pan', x, y: 2, z, dir: 1, P: 1.0 }))
  b.part('f_screws', merge(scr), 'steel', { label: V3(60, 0, 70) })

  // ================================================================= HOUSING
  const hs = [
    { y: 6, a: 92, b: 104, p: 3 },
    { y: 14, a: 92, b: 104, p: 3 },
    { y: 50, a: 70, b: 78, p: 3 },
    { y: 60, a: 52, b: 56, p: 3 },
    { y: 62, a: 50, b: 54, p: 3 }
  ]
  b.part('f_housing_r', thickLoft(hs, { t: 2.5, n: 128, a0: -Math.PI / 2, a1: Math.PI / 2 }), 'abs', { label: V3(80, 30, 0) })
  b.part('f_housing_l', thickLoft(hs, { t: 2.5, n: 128, a0: Math.PI / 2, a1: Math.PI * 1.5 }), 'abs', { label: V3(-80, 30, 0) })
  const top = superShape(50, 54, 3, 128)
  top.holes.push(circlePath(0, 0, 30))
  b.part('f_housing_top', extrudeY(top, 3, 62, { bevel: 0.6, seg: 64 }), 'absGrey', { label: V3(36, 66, -36) })
  // 12 base buttons: two groups of six on the slopes (left / right)
  const btns = []
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3)
    const x = sx * (66 + row * 12), z = -18 + col * 18
    const yy = 50 - (Math.abs(x) - 66) * 0.95 + 2
    btns.push(mount(domeButton({ r: 4.5, h: 2.5, bezel: 1 }), V3(x, yy, z), V3(sx * 0.62, 1, 0).normalize(), { sink: 0.8 }))
  }
  b.part('f_btns', merge(btns), 'absLight', { label: V3(78, 46, 0) })

  // ================================================================= THROTTLE (lever pivots about X on the left side)
  b.part('f_throttle', merge([
    leverZY([[-6, 34], [6, 34], [5, 92], [-5, 92]], 8, -104),
    leverZY(smoothOutline([[-8, 88], [12, 88], [16, 100], [10, 110], [-8, 106], [-12, 96]]), 12, -105),
    cylX(8, -110, -100, { y: 34, seg: 32 })
  ]), 'absGrey', { label: V3(-110, 104, 0) })
  b.part('f_throttle_pot', merge([cylX(8, -96, -86, { y: 34, seg: 32 }), box(2, 10, 6, { x: -85, y: 26, z: 0 })]), 'steel', { label: V3(-90, 44, 0) })
  b.part('f_throttle_pot', cylX(3, -100, -96, { y: 34, seg: 20 }), 'brass', { node: 'thr' })

  // ================================================================= MECH (fixed + cone/spring nodes)
  const sock = [[22, 38], [22, 60]]
  for (let y = 60; y >= 38; y -= 1) sock.push([Math.sqrt(16.3 ** 2 - (y - PIVOT_Y) ** 2), y])
  sock.push([22, 38])
  b.part('f_socket', merge([
    lathe(sock, 72),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(6, 38, 6, { x: sx * 20, y: 20, z: sz * 20 })))
  ]), 'pom', { label: V3(-22, 56, 0) })
  b.part('f_spring', spring({ rMean: 13.6, wire: 2.8, length: 16, turns: 5, y0: 12 }), 'spring', { node: 'springN', label: V3(15, 18, 0) })
  b.part('f_cone', lathe([[6, 28], [17, 28], [17, 31], [6, 31], [6, 28]], 64), 'pom', { node: 'cone', label: V3(-17, 30, 0) })
  b.part('f_spring', ringY(17, 6, 10, 12), 'steel')

  // ================================================================= ELECTRONICS
  b.part('f_pcb', box(90, 1.6, 60, { y: 18.8, z: 10 }), 'pcb', { label: V3(-35, 21, 30) })
  b.part('f_pcb', merge([
    box(12, 1.4, 12, { x: 26, y: 20.3, z: 24 }),
    box(9, 6, 5, { x: -30, y: 22.6, z: 30 }), // JST header for grip
    box(7, 6, 4, { x: -38, y: 22.6, z: 0 }), // JST for throttle
    cylY(4, 19.6, 26, { seg: 18 }) // sensor post
  ]), 'chip')
  b.part('f_hall', box(4, 1, 4, { y: 26.5 }), 'chip', { label: V3(0, 27, 0) })
  b.part('f_usb', merge([
    box(10, 8, 12, { y: 24, z: -98 }),
    wire([[0, 24, -104], [0, 22, -130], [10, 12, -160], [30, 3, -190]], 2.2, 32)
  ]), 'conn', { label: V3(0, 32, -110) })
  b.part('f_pcb', merge([
    wire([[-38, 25, 0], [-60, 28, 0], [-80, 28, 4], [-86, 26, 3]], 0.6, 24)
  ]), 'wire')

  // ================================================================= BOOT
  b.part('f_boot', bellows({ r0: 29, r1: 15, y0: 65, y1: 78, folds: 3, amp: 1.6, t: 1.1, nT: 64 }), 'rubber', { label: V3(28, 72, 0) })

  // ================================================================= SHAFT (stick node)
  b.part('f_ball', sphere(16, { y: PIVOT_Y, w: 56, h: 36 }), 'pom', { label: V3(16, 50, 0) })
  b.part('f_shaft', ringY(7, 4, 31, 112, { seg: 40 }), 'steel', { label: V3(7, 90, 0) })
  b.part('f_shaft', lathe([[4, 31], [16, 31], [16, 33], [7, 38], [4, 38], [4, 31]], 64), 'steel')
  b.part('f_magnet', cylY(4, 28, 31, { seg: 28 }), 'magnet', { label: V3(4, 29, 0) })

  // twist mech (on stick node): bearing seat, torsion spring, twist sensor
  b.part('f_twist_spring', merge([
    spring({ rMean: 11, wire: 1.2, length: 8, turns: 4, y0: 101, dead: 0, radial: 8 }),
    cylY(0.6, 101, 107, { x: 11, seg: 8 }).rotateZ(0)
  ]), 'spring', { label: V3(12, 104, 0) })
  b.part('f_twist_sensor', merge([box(14, 1.6, 10, { y: 99, z: -14 }), box(3, 1, 3, { y: 100.3, z: -11 })]), 'pcb', { label: V3(0, 100, -20) })
  b.part('f_twist_sensor', ringY(12, 7, 96, 99, { seg: 48 }), 'absGrey')

  // ================================================================= GRIP (twist node)
  b.part('f_twist_collar', merge([ringY(17, 7.2, 100, 116, { seg: 64 }), cylY(2, 116, 118, { x: 0, z: -12, seg: 12 }), cylY(2, 99, 101, { x: 0, z: -11, seg: 12 })]), 'pom', { label: V3(-17, 108, 0) })
  b.part('f_twist_collar', cylY(3, 99.4, 100.4, { z: -11, seg: 16 }), 'magnet')
  const gs = new GripSurface([
    { y: 114, a: 18, b: 18, p: 2.2 },
    { y: 132, a: 19, b: 21, p: 2.3, cz: 0.5 },
    { y: 155, a: 21, b: 25, p: 2.5, cz: 2 },
    { y: 180, a: 21.5, b: 26, p: 2.6, cz: 3.5 },
    { y: 205, a: 22, b: 28, p: 2.8, cz: 6 },
    { y: 225, a: 22, b: 29, p: 3, cz: 9 },
    { y: 236, a: 18, b: 25, p: 3, cz: 10 },
    { y: 241.5, a: 8, b: 11, p: 2.4, cz: 10, t: 1.5 },
    { y: 242, a: 1, b: 1, p: 2, cz: 10, t: 0.5 }
  ], 6)
  const sh = gs.shells({ t: 2.3, n: 120 })
  b.part('f_grip_r', sh.right, 'abs', { label: V3(22, 180, 3) })
  b.part('f_grip_l', sh.left, 'abs', { label: V3(-22, 180, 3) })
  const onTop = (x, z, g, spin = 0, sink = 0.8) => { const f = gs.top(x, 10 + z); return mount(g, f.p, f.n, { spin, sink }) }
  b.part('f_hat', onTop(0, 2, hat({ r: 5.5, ways: 8, h: 4.5 })), 'absLight', { label: V3(0, 246, 12) })
  b.part('f_btn_top', merge([
    onTop(-11, 12, domeButton({ r: 4, h: 2.4 }), 0, 0.6),
    onTop(11, 12, domeButton({ r: 4, h: 2.4 }), 0, 0.6),
    onTop(0, 18, domeButton({ r: 4, h: 2.4 }), 0, 0.6)
  ]), 'red', { label: V3(11, 244, 22) })
  b.part('f_trigger', leverZY(smoothOutline([[30, 220], [40, 218], [45, 208], [43, 196], [37, 191], [34, 197], [34, 208], [29, 214]]), 11), 'absGrey', { label: V3(0, 205, 48) })
  b.part('f_grip_pcb', box(1.6, 50, 20, { x: 2, y: 205, z: 6 }), 'pcbBlue', { label: V3(2, 222, 6) })
  const harness = []
  for (let i = 0; i < 4; i++) {
    const o = (i - 1.5) * 1.0
    harness.push(wire([[2, 180, 5 + o], [1, 150, 2 + o], [o * 0.5, 120, o * 0.5], [o * 0.5, 90, o * 0.5], [o * 0.5, 40, o * 0.5], [o, 30, 2 + o], [-18, 24, 20], [-30, 26, 30 + o]], 0.4, 96))
  }
  b.part('f_harness', merge(harness), 'wire', { node: 'stick', label: V3(0, 70, 0) })
  b.part('f_grip_screws', merge([
    screw({ d: 3, len: 10, head: 'socket', dir: 1, P: 0.5 }).rotateZ(Math.PI / 2).translate(19.5, 110, 0),
    screw({ d: 3, len: 10, head: 'socket', dir: 1, P: 0.5 }).rotateZ(-Math.PI / 2).translate(-19.5, 110, 0)
  ]), 'steel', { label: V3(21, 110, 0) })

  // ================================================================= EXPLODE
  b.explode({
    base: [0, -40, 0],
    housing_l: [-120, 0, 0], housing_r: [120, 0, 0], housing_top: [0, 70, 0],
    throttle: [-60, 0, 0],
    boot: [0, 90, 0],
    mech: [0, 0, 0],
    electronics: [0, -10, 0],
    shaft: [0, 30, 0],
    twist: [0, 60, 0],
    grip: [0, 120, 0],
    grip_l: [-60, 0, 0], grip_r: [60, 0, 0], grip_ctrl: [0, 20, 45], grip_int: [0, 0, 0]
  })

  // ================================================================= KINEMATICS
  b.onAxes((ax) => {
    const p = ax.pitch * DEG, r = ax.roll * DEG
    rStick.rotation.set(p, 0, -r)
    rTwist.rotation.set(0, ax.twist * DEG, 0)
    rBoot.rotation.set(p * 0.5, 0, -r * 0.5)
    rThr.rotation.set((ax.throttle || 0) * 30 * DEG, 0, 0)
    const tilt = Math.acos(clamp(Math.cos(p) * Math.cos(r), -1, 1))
    const drop = 12 * Math.sin(tilt)
    rCone.position.y = -drop
    rSp.scale.y = (16 - drop) / 16
  })

  // ================================================================= DIMENSIONS
  const D = (o) => b.dim(o)
  D({ id: 'f_d_w', kind: 'linear', anchor: 'base', a: [-110, 2, 104], b: [110, 2, 104], off: [0, 0, 22], text: '220 mm', name: 'عرض کل (با تراتل)', conf: 'official', src: 'S14' })
  D({ id: 'f_d_d', kind: 'linear', anchor: 'base', a: [96, 2, -107], b: [96, 2, 107], off: [22, 0, 0], text: '214 mm', name: 'عمق کل', conf: 'official', src: 'S14' })
  D({ id: 'f_d_h', kind: 'linear', anchor: 'base', a: [-96, 0, 104], b: [-96, 242, 104], off: [-18, 0, 0], text: '242 mm', name: 'ارتفاع کل', conf: 'official', src: 'S14' })
  D({ id: 'f_d_ball', kind: 'diameter', anchor: 'shaft', c: [0, PIVOT_Y, 0], r: 16, n: [0, 0, 1], d: [1, -0.25, 0], lead: 24, text: 'Ø32', name: 'گوی مفصل', conf: 'design' })
  D({ id: 'f_d_spring', kind: 'diameter', anchor: 'mech', c: [0, 20, 0], r: 15, n: [0, 1, 0], d: [-1, 0, -0.3], lead: 22, text: 'Ø30 · سیم Ø2.8', name: 'فنر مارپیچ', conf: 'official', src: 'S15' })
  D({ id: 'f_d_throw', kind: 'angle', anchor: 'mech', c: [0, PIVOT_Y, 0], n: [1, 0, 0], u: [0, 1, 0], r: 80, deg: 18, text: '±18°', name: 'انحراف پیچ/رول', conf: 'design' })
  D({ id: 'f_d_gap', kind: 'linear', anchor: 'electronics', a: [0, 27, 0], b: [0, 28, 0], off: [20, 0, 0], arrow: 0.5, text: '≈ 1–2 mm', name: 'فاصلهٔ هوایی', conf: 'design', lshift: [8, 0, 0] })
  D({ id: 'f_d_shaft', kind: 'diameter', anchor: 'shaft', c: [0, 86, 0], r: 7, n: [0, 1, 0], d: [-1, 0, 0], lead: 30, text: 'Ø14', name: 'محور توخالی', conf: 'design' })
  D({ id: 'f_d_bore', kind: 'diameter', anchor: 'shaft', c: [0, 112, 0], r: 4, n: [0, 1, 0], d: [1, 0, 1], lead: 30, text: 'Ø8 bore', name: 'سوراخ عبور سیم', conf: 'design' })
  D({ id: 'f_d_collar', kind: 'diameter', anchor: 'grip', c: [0, 108, 0], r: 17, n: [0, 1, 0], d: [-1, 0, 0.5], lead: 24, text: 'Ø34', name: 'طوقهٔ چرخش', conf: 'design' })
  D({ id: 'f_d_gscrew', kind: 'leader', anchor: 'grip_int', p: [21, 110, 0], q: [50, 96, 22], text: '2 × M3×10', name: 'پیچ‌های دسته', conf: 'design' })
  D({ id: 'f_d_twist', kind: 'angle', anchor: 'twist', c: [0, 108, 0], n: [0, 1, 0], u: [0, 0, 1], r: 34, deg: 25, text: '±25° Z', name: 'چرخش Z', conf: 'design' })
  D({ id: 'f_d_thr', kind: 'angle', anchor: 'housing', c: [-104, 34, 0], n: [1, 0, 0], u: [0, 1, 0], r: 74, deg: 30, text: '±30°', name: 'کورس تراتل', conf: 'design' })
  D({ id: 'f_d_thrlen', kind: 'linear', anchor: 'throttle', a: [-110, 34, 0], b: [-110, 104, 0], off: [-14, 0, 0], text: '70 mm', name: 'طول اهرم تراتل', conf: 'design' })

  b.overview = ['f_d_w', 'f_d_d', 'f_d_h']
  b.focus = { target: V3(0, 115, 0), dist: 500 }
  return b
}
