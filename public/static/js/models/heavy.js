// ---------------------------------------------------------------------------
//  Model A — heavy metal HOTAS stick with Warthog-standard grip interface
//  Units: mm. Y up, +Z = front (away from pilot), +X = pilot's right.
//  Table top = y 0. Pivot (ball centre) = y 62.
// ---------------------------------------------------------------------------
import {
  V3, DEG, clamp, merge, box, cylY, ringY, sphere, lathe, revolve, extThread, intThread, knurl,
  spring, bellows, thickLoft, superShape, roundedRectShape, circlePath, extrudeY, screw, wire
} from '../geo.js'
import { ModelBuilder, GripSurface, mount, hat, domeButton, leverZY, smoothOutline } from '../builder.js'

export const PIVOT_Y = 62

export function build (data) {
  const b = new ModelBuilder(data)
  const P = V3(0, PIVOT_Y, 0)
  b.pivot.copy(P)

  // ---------------------------------------------------------------- kinematic nodes
  const rStick = b.addRotNode('stick', 'fixed', P)
  const rBoot = b.addRotNode('bootN', 'fixed', P)
  const rPl = b.addRotNode('plunger', 'fixed', V3(0, 0, 0))
  const rSp = b.addRotNode('springN', 'fixed', V3(0, 13, 0))
  b.secNode = { shaft: 'stick', interface: 'stick', grip: 'stick', boot: 'bootN' }

  // ================================================================= BASE
  const plateShape = roundedRectShape(232, 270, 14)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    plateShape.holes.push(circlePath(sx * 102, sz * 121, 2.25))
    plateShape.holes.push(circlePath(sx * 30.05, sz * 30.05, 2.25))
  }
  b.part('h_baseplate', extrudeY(plateShape, 5, 3, { bevel: 0.6, seg: 20 }), 'powder', { label: V3(-80, 8, 100) })
  const feet = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) feet.push(cylY(10, 0, 3, { x: sx * 92, z: sz * 105, seg: 32 }))
  b.part('h_feet', merge(feet), 'rubber', { label: V3(92, 1.5, 105) })
  const scr = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scr.push(screw({ d: 4, len: 10, head: 'pan', x: sx * 30.05, y: 3, z: sz * 30.05, dir: 1, P: 0.7 }))
  b.part('h_screws_m4', merge(scr), 'steel', { label: V3(30, 0, 30) })

  // ================================================================= HOUSING
  const hs = [
    { y: 8, a: 75, b: 75, p: 6 },
    { y: 14, a: 75, b: 75, p: 6 },
    { y: 80, a: 57.5, b: 57.5, p: 6 },
    { y: 84, a: 55.5, b: 55.5, p: 6 }
  ]
  b.part('h_housing_r', thickLoft(hs, { t: 3, n: 128, a0: -Math.PI / 2, a1: Math.PI / 2 }), 'zinc', { label: V3(70, 50, 0) })
  b.part('h_housing_l', thickLoft(hs, { t: 3, n: 128, a0: Math.PI / 2, a1: Math.PI * 1.5 }), 'zinc', { label: V3(-70, 50, 0) })
  const top = superShape(56, 56, 6, 128)
  top.holes.push(circlePath(0, 0, 35))
  b.part('h_housing_top', extrudeY(top, 4, 84, { bevel: 0.8, seg: 64 }), 'alu', { label: V3(40, 88, 40) })

  // floor with 4 M4 threaded bosses (60.1 square)
  const floor = superShape(72, 72, 6, 96)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) floor.holes.push(circlePath(sx * 30.05, sz * 30.05, 2))
  const fl = [extrudeY(floor, 3, 8, { seg: 32 })]
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl.push(ringY(4.5, 2.0, 11, 16, { x: sx * 30.05, z: sz * 30.05, seg: 32 }))
  b.part('h_inner_plate', merge(fl), 'steel', { label: V3(-50, 11, 40) })

  // ================================================================= CENTERING MECHANISM (fixed frame)
  // chassis: top plate + 4 legs
  const frTop = roundedRectShape(96, 96, 6)
  frTop.holes.push(circlePath(0, 0, 27.5))
  b.part('h_frame', merge([
    extrudeY(frTop, 3, 74, { seg: 32 }),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(8, 63, 8, { x: sx * 44, y: 42.5, z: sz * 44 })))
  ]), 'steel', { label: V3(44, 60, 44) })
  // ball socket (POM) — spherical cavity Ø40.6
  const sock = [[27, 46], [27, 74]]
  for (let y = 74; y >= 46; y -= 1) sock.push([Math.sqrt(20.3 ** 2 - (y - 62) ** 2), y])
  sock.push([27, 46])
  b.part('h_socket', lathe(sock, 72), 'pom', { label: V3(-27, 70, 0) })
  b.part('h_spring_seat', ringY(22, 9, 11, 13), 'steel', { label: V3(-22, 12, 0) })
  b.part('h_spring', spring({ rMean: 15.75, wire: 2.5, length: 18, turns: 6, y0: 13 }), 'spring', { node: 'springN', label: V3(17, 22, 0) })
  b.part('h_plunger', lathe([[14.5, 31], [19, 31], [19, 34.5], [18, 36], [14.5, 36], [14.5, 31]], 72), 'pom', { node: 'plunger', label: V3(-19, 33, 0) })

  // ================================================================= ELECTRONICS
  b.part('h_sensor_pcb', merge([box(24, 1.6, 24, { y: 28.2 })]), 'pcb', { label: V3(12, 28, 12) })
  b.part('h_sensor_pcb', cylY(6, 11, 27.4, { seg: 24 }), 'abs')
  b.part('h_hall', box(4, 1, 4, { y: 29.5 }), 'chip', { label: V3(0, 30, 0) })
  const mb = [box(80, 1.6, 50, { y: 18.8, z: -46 })]
  b.part('h_mainboard', mb[0], 'pcb', { label: V3(-30, 20, -50) })
  b.part('h_mainboard', merge([
    box(14, 1.6, 14, { x: -14, y: 20.4, z: -44 }),
    box(6, 1.2, 4, { x: 6, y: 20.2, z: -36 }),
    box(5, 2.5, 5, { x: -30, y: 20.8, z: -60 }),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cylY(2.5, 11, 18, { x: sx * 34, z: -46 + sz * 20, seg: 16 })))
  ]), 'chip')
  b.part('h_usb', merge([box(12, 10.9, 16, { x: 30, y: 25.05, z: -68 })]), 'steel', { label: V3(30, 31, -76) })
  b.part('h_usb', box(8, 7.5, 0.6, { x: 30, y: 25.05, z: -75.8 }), 'conn')

  // ================================================================= BOOT (half-tilt node)
  b.part('h_boot', bellows({ r0: 34, r1: 20, y0: 88, y1: 100, folds: 3, amp: 1.8, t: 1.2, nT: 72 }), 'rubber', { label: V3(30, 94, 0) })

  // ================================================================= SHAFT (stick node)
  b.part('h_ball', sphere(20, { y: PIVOT_Y, w: 64, h: 40 }), 'chrome', { label: V3(20, 62, 0) })
  b.part('h_shaft', cylY(8, 36, 112, { seg: 40 }), 'steel', { label: V3(8, 92, 0) })
  b.part('h_cam', lathe([[0, 36], [18, 36], [18, 38.5], [8.5, 42], [0, 42], [0, 36]], 72), 'steel', { label: V3(18, 38, 0) })
  b.part('h_magnet', cylY(5, 32, 36, { seg: 32 }), 'magnet', { label: V3(5, 34, 0) })

  // ================================================================= INTERFACE (base side, stick node)
  b.part('h_flange', merge([cylY(22, 100, 104, { seg: 72 })]), 'alu', { label: V3(22, 102, 0) })
  b.part('h_stub', merge([
    revolve({ rOut: extThread(36, 2), rIn: 14, y0: 104, y1: 116, nT: 96, nY: 54 }),
    cylY(7, 104, 108, { seg: 32 }),
    box(3, 3, 3, { y: 117.5, z: 15 }) // orientation key
  ]), 'alu', { label: V3(-18, 110, 0) })
  const dinF = [ringY(4.75, 4.2, 108, 116, { seg: 40 })]
  b.part('h_din_f', merge(dinF), 'steel', { label: V3(5, 116, 0) })
  const pinPos = [[-3.4, -1.2], [3.4, -1.2], [-2.2, 2.2], [2.2, 2.2], [0, -2.9]]
  b.part('h_din_f', merge([
    cylY(4.2, 108, 115.2, { seg: 40 }),
    ...pinPos.map(([x, z]) => ringY(0.75, 0.5, 115.2, 115.4, { x, z, seg: 12 }))
  ]), 'conn')

  // ================================================================= GRIP (stick node)
  // collar nut + lower tube + male DIN
  b.part('h_nut', merge([
    revolve({ rOut: knurl(22, 0.5, 48, 3), rIn: intThread(36, 2), y0: 103, y1: 116, nT: 96, nY: 60 }),
    ringY(21.5, 16.2, 116, 119, { seg: 72 })
  ]), 'aluDark', { label: V3(-22, 111, 0) })
  b.part('h_grip_tube', merge([
    ringY(16, 13, 117, 140, { seg: 64 }),
    ringY(17.5, 13, 116, 117, { seg: 64 }),
    cylY(13, 117, 119, { seg: 48 })
  ]), 'alu', { label: V3(16, 132, 0) })
  b.part('h_din_m', ringY(4.75, 4.3, 111, 117, { seg: 40 }), 'steel', { label: V3(-5, 113, 0) })
  b.part('h_din_m', merge([
    cylY(4.3, 116, 117, { seg: 32 }),
    ...pinPos.map(([x, z]) => cylY(0.5, 111.5, 116, { x, z, seg: 10 }))
  ]), 'gold')

  // anatomical A-10 style grip
  const gs = new GripSurface([
    { y: 128, a: 19, b: 19, p: 2.2, cz: 0 },
    { y: 145, a: 20, b: 22, p: 2.3, cz: 0.5 },
    { y: 165, a: 21.5, b: 26, p: 2.5, cz: 2 },
    { y: 190, a: 22, b: 28, p: 2.6, cz: 4 },
    { y: 215, a: 21.5, b: 27.5, p: 2.6, cz: 6 },
    { y: 238, a: 21, b: 27, p: 2.7, cz: 8 },
    { y: 256, a: 22.5, b: 30, p: 2.9, cz: 11 },
    { y: 272, a: 23, b: 31, p: 3.1, cz: 14 },
    { y: 283, a: 19, b: 27, p: 3, cz: 15 },
    { y: 289, a: 9, b: 13, p: 2.4, cz: 15, t: 1.5 },
    { y: 290, a: 1.2, b: 1.2, p: 2, cz: 15, t: 0.5 }
  ], 6)
  const sh = gs.shells({ t: 2.5, n: 128 })
  b.part('h_grip_r', sh.right, 'powder', { label: V3(23, 200, 4) })
  b.part('h_grip_l', sh.left, 'powder', { label: V3(-23, 200, 4) })

  // controls
  const onTop = (x, z, g, spin = 0, sink = 0.8) => { const f = gs.top(x, 15 + z); return mount(g, f.p, f.n, { spin, sink }) }
  b.part('h_hat_pov', onTop(-7, 8, hat({ r: 5.5, ways: 8, h: 4.5 })), 'aluDark', { label: V3(-7, 292, 23) })
  b.part('h_hat_dms', onTop(8, 6, hat({ r: 5, ways: 8, h: 4 })), 'absGrey', { label: V3(8, 292, 21) })
  b.part('h_hat_tms', onTop(5, 24, hat({ r: 5, ways: 8, h: 4 }), 0, 0.6), 'absGrey', { label: V3(5, 290, 39) })
  b.part('h_btn_weapon', onTop(-9, 24, domeButton({ r: 5, h: 3, bezel: 1.2 }), 0, 0.6), 'red', { label: V3(-9, 290, 39) })
  const cms = gs.frame(260, Math.PI * 0.97)
  b.part('h_hat_cms', mount(hat({ r: 4.5, ways: 4, h: 4 }), cms.p, cms.n, { sink: 0.8 }), 'absLight', { label: cms.p.clone().add(V3(-6, 0, 0)) })
  const nws = gs.frame(206, Math.PI / 2)
  b.part('h_btn_nws', mount(domeButton({ r: 4, h: 2.4, bezel: 1 }), nws.p, nws.n, { sink: 0.6 }), 'absGrey', { label: nws.p.clone().add(V3(0, 0, 6)) })
  b.part('h_trigger', leverZY(smoothOutline([[30, 254], [42, 252], [48, 242], [47, 230], [41, 223], [37, 229], [36, 240], [32, 248]]), 12), 'aluDark', { label: V3(0, 236, 50) })
  b.part('h_pinkie', leverZY(smoothOutline([[24, 176], [36, 173], [41, 163], [38, 151], [33, 154], [32, 164], [27, 170]]), 13), 'aluDark', { label: V3(0, 160, 42) })

  // grip internals
  b.part('h_grip_pcb', box(1.6, 70, 24, { x: 2, y: 215, z: 6 }), 'pcbBlue', { label: V3(2, 235, 6) })
  b.part('h_grip_pcb', merge([
    box(2.2, 10, 6, { x: 3.6, y: 225, z: 4 }),
    box(2.2, 10, 6, { x: 3.6, y: 205, z: 4 }),
    box(2.2, 6, 4, { x: 3.6, y: 190, z: 12 })
  ]), 'chip')
  const loom = []
  for (let i = 0; i < 5; i++) {
    const o = (i - 2) * 1.1
    loom.push(wire([[1.5, 181, 4 + o], [2, 165, 3 + o], [0.8, 145, 1.5 + o * 0.6], [0.4, 125, o * 0.5], [pinPos[i][0], 117.5, pinPos[i][1]]], 0.45, 48))
  }
  b.part('h_grip_wires', merge(loom), 'wire', { label: V3(2, 160, 3) })

  // ================================================================= EXPLODE VECTORS
  b.explode({
    base: [0, -45, 0],
    housing_l: [-120, 0, 0], housing_r: [120, 0, 0], housing_top: [0, 75, 0],
    boot: [0, 105, 0],
    mech: [0, 0, 0],
    electronics: [0, -10, -125],
    shaft: [0, 35, 0],
    interface: [0, 70, 0],
    grip: [0, 150, 0],
    grip_l: [-70, 0, 0], grip_r: [70, 0, 0], grip_ctrl: [0, 25, 55], grip_int: [0, 0, 0],
    nut: [0, -60, 0]
  })

  // ================================================================= KINEMATICS
  b.onAxes((ax) => {
    const p = ax.pitch * DEG, r = ax.roll * DEG
    rStick.rotation.set(p, 0, -r)
    rBoot.rotation.set(p * 0.5, 0, -r * 0.5)
    const tilt = Math.acos(clamp(Math.cos(p) * Math.cos(r), -1, 1))
    const drop = 17 * Math.sin(tilt)
    rPl.position.y = -drop
    rSp.scale.y = (18 - drop) / 18
  })

  // ================================================================= DIMENSIONS
  const D = (o) => b.dim(o)
  // --- base plate
  D({ id: 'h_d_w', kind: 'linear', anchor: 'base', a: [-116, 8, 135], b: [116, 8, 135], off: [0, 0, 24], text: '232 mm', name: 'عرض پایه', conf: 'official', src: 'S1' })
  D({ id: 'h_d_d', kind: 'linear', anchor: 'base', a: [116, 8, -135], b: [116, 8, 135], off: [24, 0, 0], text: '270 mm', name: 'عمق پایه', conf: 'official', src: 'S1' })
  D({ id: 'h_d_corner', kind: 'diameter', anchor: 'base', c: [102, 8.1, 121], r: 2.25, n: [0, 1, 0], d: [1, 0, 1], lead: 16, text: 'Ø4.5 · R14', name: 'سوراخ و شعاع گوشه', conf: 'community', src: 'S6' })
  D({ id: 'h_d_holepx', kind: 'linear', anchor: 'base', a: [-102, 8, -121], b: [102, 8, -121], off: [0, 0, -26], text: '204 mm', name: 'فاصلهٔ مراکز سوراخ (X)', conf: 'design' })
  D({ id: 'h_d_holepz', kind: 'linear', anchor: 'base', a: [-102, 8, -121], b: [-102, 8, 121], off: [-26, 0, 0], text: '242 mm', name: 'فاصلهٔ مراکز سوراخ (Z)', conf: 'design' })
  D({ id: 'h_d_m4x', kind: 'linear', anchor: 'base', a: [-30.05, 2.9, 30.05], b: [30.05, 2.9, 30.05], off: [0, 0, 16], text: '60.1 mm', name: 'الگوی M4 (X)', conf: 'community', src: 'S4' })
  D({ id: 'h_d_m4z', kind: 'linear', anchor: 'base', a: [30.05, 2.9, -30.05], b: [30.05, 2.9, 30.05], off: [16, 0, 0], text: '60.1 mm', name: 'الگوی M4 (Z)', conf: 'community', src: 'S4' })
  D({ id: 'h_d_m4note', kind: 'leader', anchor: 'base', p: [-30.05, 2.9, 30.05], q: [-62, -14, 62], text: '4 × M4×0.7 ↧8', name: 'رزوهٔ نصب', conf: 'community', src: 'S4' })
  D({ id: 'h_d_baseh', kind: 'linear', anchor: 'base', a: [116, 0, -135], b: [116, 100, -135], off: [18, 0, 0], text: '100 mm', name: 'ارتفاع پایه', conf: 'official', src: 'S1' })
  D({ id: 'h_d_total', kind: 'linear', anchor: 'base', a: [-116, 0, 135], b: [-116, 290, 135], off: [-18, 0, 0], text: '≈ 290 mm', name: 'ارتفاع کل', conf: 'community', src: 'S2' })
  // --- pivot & centering
  D({ id: 'h_d_ball', kind: 'diameter', anchor: 'shaft', c: [0, 62, 0], r: 20, n: [0, 0, 1], d: [1, -0.25, 0], lead: 26, text: 'Ø40', name: 'گوی مفصل', conf: 'design' })
  D({ id: 'h_d_shaft', kind: 'diameter', anchor: 'shaft', c: [0, 94, 0], r: 8, n: [0, 1, 0], d: [-1, 0, 0], lead: 30, text: 'Ø16', name: 'قطر محور', conf: 'design' })
  D({ id: 'h_d_throw', kind: 'angle', anchor: 'mech', c: [0, 62, 0], n: [1, 0, 0], u: [0, 1, 0], r: 75, deg: 20, text: '±20°', name: 'انحراف پیچ/رول', conf: 'design' })
  D({ id: 'h_d_pivoth', kind: 'linear', anchor: 'mech', a: [0, 0, 0], b: [0, 62, 0], off: [-98, 0, 0], text: '62 mm', name: 'ارتفاع مرکز دوران', conf: 'design' })
  D({ id: 'h_d_spring', kind: 'diameter', anchor: 'mech', c: [0, 22, 0], r: 17, n: [0, 1, 0], d: [-1, 0, -0.3], lead: 24, text: 'Ø34 · سیم Ø2.5', name: 'فنر اصلی', conf: 'design' })
  D({ id: 'h_d_springlen', kind: 'linear', anchor: 'mech', a: [17, 13, 0], b: [17, 31, 0], off: [16, 0, 0], text: '18 mm', name: 'طول نصب فنر', conf: 'design' })
  D({ id: 'h_d_cam', kind: 'diameter', anchor: 'shaft', c: [0, 37, 0], r: 18, n: [0, 1, 0], d: [0, 0, 1], lead: 24, text: 'Ø36 · 120°', name: 'بادامک مخروطی', conf: 'design' })
  // --- sensor
  D({ id: 'h_d_gap', kind: 'linear', anchor: 'electronics', a: [0, 30, 0], b: [0, 32, 0], off: [22, 0, 0], arrow: 0.7, text: '2.0 mm', name: 'فاصلهٔ هوایی', conf: 'design', lshift: [8, 0, 0] })
  D({ id: 'h_d_magnet', kind: 'diameter', anchor: 'shaft', c: [0, 34, 0], r: 5, n: [0, 1, 0], d: [-1, 0, 0.4], lead: 22, text: 'Ø10 × 4', name: 'آهنربا', conf: 'design' })
  D({ id: 'h_d_usb', kind: 'leader', anchor: 'electronics', p: [30, 25, -76], q: [62, 46, -104], text: '12.0 × 10.9 USB-B', name: 'کانکتور USB', conf: 'standard' })
  // --- interface
  D({ id: 'h_d_thread', kind: 'diameter', anchor: 'interface', c: [0, 110, 0], r: 18, n: [0, 1, 0], d: [1, 0, 0], lead: 28, text: 'M36 × 2', name: 'رزوهٔ گلویی', conf: 'community', src: 'S3' })
  D({ id: 'h_d_threadlen', kind: 'linear', anchor: 'interface', a: [-18, 104, 0], b: [-18, 116, 0], off: [-16, 0, 0], text: '12 mm', name: 'طول رزوه', conf: 'design' })
  D({ id: 'h_d_flange', kind: 'diameter', anchor: 'interface', c: [0, 102, 0], r: 22, n: [0, 1, 0], d: [0, 0, 1], lead: 22, text: 'Ø44 × 4', name: 'فلنج', conf: 'design' })
  D({ id: 'h_d_din', kind: 'diameter', anchor: 'interface', c: [0, 116.2, 0], r: 4.75, n: [0, 1, 0], d: [1, 0, -1], lead: 30, text: 'Ø9.5 Mini-DIN 5', name: 'کانکتور مادگی', conf: 'standard', src: 'S7' })
  D({ id: 'h_d_nut', kind: 'diameter', anchor: 'nut', c: [0, 111, 0], r: 22, n: [0, 1, 0], d: [-1, 0, 0], lead: 26, text: 'Ø44 · M36×2', name: 'مهرهٔ قفلی', conf: 'design' })
  D({ id: 'h_d_dinpins', kind: 'leader', anchor: 'nut', p: [-3.4, 111.5, -1.2], q: [-34, 96, -30], text: '5 × Ø1.0 pins', name: 'پین‌های نری', conf: 'design' })
  // --- grip
  D({ id: 'h_d_griph', kind: 'linear', anchor: 'grip', a: [0, 128, -19], b: [0, 290, -19], off: [0, 0, -30], text: '≈ 162 mm', name: 'ارتفاع دسته', conf: 'design' })
  D({ id: 'h_d_gripw', kind: 'linear', anchor: 'grip', a: [-23, 272, 14], b: [23, 272, 14], off: [0, 22, 0], text: '≈ 46 mm', name: 'بیشینهٔ عرض دسته', conf: 'design' })

  b.overview = ['h_d_w', 'h_d_d', 'h_d_baseh', 'h_d_total']
  b.focus = { target: V3(0, 130, 0), dist: 560 }
  return b
}
