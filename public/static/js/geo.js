// ---------------------------------------------------------------------------
//  geo.js — procedural geometry helpers (units: millimetres, Y up)
//  Every closed solid is generated with consistent winding and then flipped
//  (if needed) so that the signed volume is positive => outward normals.
//  This matters because section-cut caps are drawn from back faces.
// ---------------------------------------------------------------------------
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export const TAU = Math.PI * 2
export const DEG = Math.PI / 180
export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const smooth = (t) => t * t * (3 - 2 * t)
/** triangle wave 0..1..0 with period 1 */
export const tri = (x) => { const f = x - Math.floor(x); return 1 - Math.abs(2 * f - 1) }

// ------------------------------------------------------------ orientation
export function signedVolume (g) {
  const p = g.attributes.position.array
  const idx = g.index ? g.index.array : null
  const n = idx ? idx.length : p.length / 3
  let v = 0
  for (let i = 0; i < n; i += 3) {
    const a = (idx ? idx[i] : i) * 3, b = (idx ? idx[i + 1] : i + 1) * 3, c = (idx ? idx[i + 2] : i + 2) * 3
    v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) -
         p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) +
         p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])
  }
  return v / 6
}

function flipNonIndexed (g) {
  for (const key of Object.keys(g.attributes)) {
    const at = g.attributes[key], s = at.itemSize, arr = at.array
    for (let i = 0; i < at.count; i += 3) {
      for (let k = 0; k < s; k++) {
        const i1 = (i + 1) * s + k, i2 = (i + 2) * s + k
        const t = arr[i1]; arr[i1] = arr[i2]; arr[i2] = t
      }
    }
    at.needsUpdate = true
  }
  const nrm = g.attributes.normal
  if (nrm) { for (let i = 0; i < nrm.array.length; i++) nrm.array[i] = -nrm.array[i] }
}

/** Make a closed solid outward facing. Works for indexed & non-indexed. */
export function orient (g) {
  if (signedVolume(g) >= 0) return g
  if (g.index) {
    const ix = g.index.array
    for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t }
    g.index.needsUpdate = true
    g.computeVertexNormals()
  } else {
    flipNonIndexed(g)
  }
  return g
}

/** Normalise for merging: non-indexed, only position + normal. */
export function clean (g) {
  if (!g.attributes.normal) g.computeVertexNormals()
  const o = g.index ? g.toNonIndexed() : g
  for (const k of Object.keys(o.attributes)) if (k !== 'position' && k !== 'normal') o.deleteAttribute(k)
  o.morphAttributes = {}
  return o
}

/** Merge any list of geometries (they are cleaned first). */
export function merge (list) {
  const parts = list.filter(Boolean).map(clean)
  if (parts.length === 1) return parts[0]
  return mergeGeometries(parts, false)
}

/** Translate / rotate helper (rotation in degrees, XYZ order). */
export function place (g, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null } = {}) {
  if (s) g.scale(s[0], s[1], s[2])
  if (rx) g.rotateX(rx * DEG)
  if (ry) g.rotateY(ry * DEG)
  if (rz) g.rotateZ(rz * DEG)
  if (x || y || z) g.translate(x, y, z)
  return g
}

// ------------------------------------------------------------ Mesher
/** Builds closed solids from quad grids. Rows are arrays of Vector3. */
export class Mesher {
  constructor () { this.strips = [] }
  grid (rows, closeU = false) {
    const nu = rows[0].length, nv = rows.length
    const pos = new Float32Array(nu * nv * 3)
    let o = 0
    for (const r of rows) for (const p of r) { pos[o++] = p.x; pos[o++] = p.y; pos[o++] = p.z }
    const ind = []
    const cu = closeU ? nu : nu - 1
    for (let v = 0; v < nv - 1; v++) {
      for (let u = 0; u < cu; u++) {
        const u2 = (u + 1) % nu
        const a = v * nu + u, b = v * nu + u2, c = (v + 1) * nu + u, d = (v + 1) * nu + u2
        ind.push(a, c, b, b, c, d)
      }
    }
    this.strips.push({ pos, ind })
    return this
  }
  build () {
    const geos = this.strips.map(({ pos, ind }) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      g.setIndex(ind)
      return g
    })
    let vol = 0
    for (const g of geos) vol += signedVolume(g)
    const out = geos.map((g) => {
      if (vol < 0) {
        const ix = g.index.array
        for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t }
      }
      g.computeVertexNormals()
      return g.toNonIndexed()
    })
    return out.length === 1 ? out[0] : mergeGeometries(out, false)
  }
}

// ------------------------------------------------------------ rings
/** superellipse point: |x/a|^p + |z/b|^p = 1 at parameter t */
export function sePoint (a, b, p, t) {
  const c = Math.cos(t), s = Math.sin(t)
  return [a * Math.sign(c) * Math.abs(c) ** (2 / p), b * Math.sign(s) * Math.abs(s) ** (2 / p)]
}

/**
 * Thick-walled loft through horizontal superellipse sections.
 * secs: [{ y, a, b, p=4, cx=0, cz=0, t? }]  (a = half-width X, b = half-depth Z)
 * a0..a1: angular range (partial => split shell, side faces are closed).
 * Section tips can shrink to ~0 to close the shape (e.g. grip head).
 */
export function thickLoft (secs, { t = 2, n = 96, a0 = 0, a1 = TAU } = {}) {
  const full = Math.abs(a1 - a0 - TAU) < 1e-6
  const N = full ? n : Math.max(8, Math.round(n * (a1 - a0) / TAU)) + 1
  const ring = (s, inner) => {
    const th = s.t ?? t
    const A = inner ? Math.max(s.a - th, 0.12) : s.a
    const B = inner ? Math.max(s.b - th, 0.12) : s.b
    const pts = []
    for (let i = 0; i < N; i++) {
      const tt = a0 + (a1 - a0) * i / (full ? N : N - 1)
      const [x, z] = sePoint(A, B, s.p ?? 4, tt)
      pts.push(V3(x + (s.cx || 0), s.y, z + (s.cz || 0)))
    }
    return pts
  }
  const O = secs.map((s) => ring(s, false))
  const I = secs.map((s) => ring(s, true))
  const m = new Mesher()
  m.grid(O, full)
  m.grid(I.slice().reverse(), full)
  m.grid([I[0], O[0]], full)
  m.grid([O[O.length - 1], I[I.length - 1]], full)
  if (!full) {
    m.grid(O.map((r, k) => [I[k][0], r[0]]))
    m.grid(O.map((r, k) => [r[N - 1], I[k][N - 1]]))
  }
  return m.build()
}

/** Solid loft (no cavity) through superellipse sections, closed with caps. */
export function solidLoft (secs, { n = 64, a0 = 0, a1 = TAU } = {}) {
  const full = Math.abs(a1 - a0 - TAU) < 1e-6
  const N = full ? n : Math.max(8, Math.round(n * (a1 - a0) / TAU)) + 1
  const ring = (s) => {
    const pts = []
    for (let i = 0; i < N; i++) {
      const tt = a0 + (a1 - a0) * i / (full ? N : N - 1)
      const [x, z] = sePoint(s.a, s.b, s.p ?? 4, tt)
      pts.push(V3(x + (s.cx || 0), s.y, z + (s.cz || 0)))
    }
    return pts
  }
  const O = secs.map(ring)
  const C = secs.map((s) => new Array(N).fill(0).map(() => V3(s.cx || 0, s.y, s.cz || 0)))
  const m = new Mesher()
  m.grid(O, full)
  m.grid([C[0], O[0]], full)
  m.grid([O[O.length - 1], C[C.length - 1]], full)
  if (!full) {
    m.grid(O.map((r, k) => [C[k][0], r[0]]))
    m.grid(O.map((r, k) => [r[N - 1], C[k][N - 1]]))
  }
  return m.build()
}

// ------------------------------------------------------------ revolve
/**
 * Revolved solid around the Y axis with radius functions r(theta, y).
 * rOut: number | (th, y) => r ; rIn: null (solid) | number | fn
 */
export function revolve ({ rOut, rIn = null, y0, y1, nT = 72, nY = 2, phi0 = 0, phi1 = TAU }) {
  const fo = typeof rOut === 'function' ? rOut : () => rOut
  const fi = rIn == null ? () => 0 : (typeof rIn === 'function' ? rIn : () => rIn)
  const full = Math.abs(phi1 - phi0 - TAU) < 1e-6
  const N = full ? nT : Math.max(6, Math.round(nT * (phi1 - phi0) / TAU)) + 1
  const rowsO = [], rowsI = []
  for (let j = 0; j <= nY; j++) {
    const y = lerp(y0, y1, j / nY)
    const ro = [], ri = []
    for (let i = 0; i < N; i++) {
      const th = phi0 + (phi1 - phi0) * i / (full ? N : N - 1)
      const c = Math.cos(th), s = Math.sin(th)
      const R = fo(th, y), r = fi(th, y)
      ro.push(V3(R * c, y, R * s)); ri.push(V3(r * c, y, r * s))
    }
    rowsO.push(ro); rowsI.push(ri)
  }
  const m = new Mesher()
  m.grid(rowsO, full)
  m.grid(rowsI.slice().reverse(), full)
  m.grid([rowsI[0], rowsO[0]], full)
  m.grid([rowsO[nY], rowsI[nY]], full)
  if (!full) {
    m.grid(rowsO.map((r, k) => [rowsI[k][0], r[0]]))
    m.grid(rowsO.map((r, k) => [r[N - 1], rowsI[k][N - 1]]))
  }
  return m.build()
}

/** Lathe from a closed 2D profile [[r, y], ...] (outward oriented). */
export function lathe (profile, segs = 64, phiStart = 0, phiLen = TAU) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y))
  const g = new THREE.LatheGeometry(pts, segs, phiStart, phiLen)
  g.deleteAttribute('uv')
  g.computeVertexNormals()
  return orient(g)
}

// ------------------------------------------------------------ threads & knurl
/** External ISO-ish thread radius function (major diameter D, pitch P). */
export function extThread (D, P) {
  const h = 0.5413 * P, R = D / 2
  return (th, y) => R - h + h * clamp(tri(y / P - th / TAU) * 1.25, 0, 1)
}
/** Internal thread (nut) radius function — crests point inward. */
export function intThread (D, P) {
  const h = 0.5413 * P, R = D / 2
  return (th, y) => R - h * clamp(tri(y / P - th / TAU) * 1.25, 0, 1)
}
/** Diamond knurl radius function. */
export function knurl (R, depth = 0.5, count = 48, pitch = 3) {
  return (th, y) => {
    const s1 = tri(count * th / TAU + y / pitch), s2 = tri(count * th / TAU - y / pitch)
    return R - depth * (1 - Math.min(s1, s2))
  }
}
/** Straight serrations / grip ribs. */
export function ribs (R, depth = 0.4, count = 40) {
  return (th) => R - depth * (1 - tri(count * th / TAU))
}

// ------------------------------------------------------------ springs
export class HelixCurve extends THREE.Curve {
  /** compression spring centre-line: rMean, length, turns, wire, dead coils */
  constructor (rMean, length, turns, wire, dead = 0.75) {
    super()
    Object.assign(this, { rMean, length, turns, wire, dead })
  }
  getPoint (t, target = new THREE.Vector3()) {
    const { rMean, length, turns, wire, dead } = this
    const ang = t * turns * TAU
    const tt = t * turns
    const active = Math.max(turns - 2 * dead, 0.5)
    let h
    if (tt < dead) h = 0
    else if (tt > turns - dead) h = 1
    else h = (tt - dead) / active
    h = h * 0.92 + 0.08 * smooth(clamp(h, 0, 1))
    const y = wire / 2 + h * (length - wire)
    return target.set(rMean * Math.cos(ang), y, rMean * Math.sin(ang))
  }
}
/** Compression spring along +Y starting at y0. */
export function spring ({ rMean, wire, length, turns, y0 = 0, dead = 0.75, radial = 10 }) {
  const curve = new HelixCurve(rMean, length, turns, wire, dead)
  const g = new THREE.TubeGeometry(curve, Math.ceil(turns * 40), wire / 2, radial, false)
  g.deleteAttribute('uv')
  g.translate(0, y0, 0)
  return g
}
/** Extension spring with hook loops, along +Y from y0. */
export function extSpring ({ rMean, wire, length, y0 = 0 }) {
  const coilLen = length - 4 * rMean
  const turns = Math.max(3, Math.floor(coilLen / wire) - 1)
  const body = spring({ rMean, wire, length: coilLen, turns, y0: y0 + 2 * rMean, dead: 0, radial: 8 })
  const hook = (yc, up) => {
    const c = new THREE.EllipseCurve(0, 0, rMean, rMean, 0, TAU * 0.85, false, 0)
    const pts = c.getPoints(24).map((p) => V3(0, yc + (up ? p.y : -p.y), p.x))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, wire / 2, 8, false)
  }
  return merge([body, hook(y0 + rMean, false), hook(y0 + length - rMean, true)])
}

// ------------------------------------------------------------ bellows
export function bellows ({ r0, r1, y0, y1, folds = 4, amp = 2, t = 1.2, nT = 64 }) {
  const fo = (th, y) => {
    const s = (y - y0) / (y1 - y0)
    return lerp(r0, r1, s) + amp * Math.abs(Math.sin(Math.PI * folds * s))
  }
  return revolve({ rOut: fo, rIn: (th, y) => fo(th, y) - t, y0, y1, nT, nY: folds * 10 })
}

// ------------------------------------------------------------ primitives
export function box (w, h, d, { x = 0, y = 0, z = 0, r = 0, rx = 0, ry = 0, rz = 0 } = {}) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) - 1e-3) : new THREE.BoxGeometry(w, h, d)
  g.deleteAttribute('uv')
  return place(g, { x, y, z, rx, ry, rz })
}
/** cylinder along Y from y0 to y1 */
export function cylY (r, y0, y1, { x = 0, z = 0, seg = 48, r2 = null } = {}) {
  const g = new THREE.CylinderGeometry(r2 ?? r, r, Math.abs(y1 - y0), seg)
  g.deleteAttribute('uv')
  g.translate(x, (y0 + y1) / 2, z)
  return g
}
/** cylinder along X from x0 to x1 */
export function cylX (r, x0, x1, { y = 0, z = 0, seg = 40 } = {}) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg)
  g.deleteAttribute('uv')
  g.rotateZ(Math.PI / 2)
  g.translate((x0 + x1) / 2, y, z)
  return g
}
/** cylinder along Z from z0 to z1 */
export function cylZ (r, z0, z1, { x = 0, y = 0, seg = 40 } = {}) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg)
  g.deleteAttribute('uv')
  g.rotateX(Math.PI / 2)
  g.translate(x, y, (z0 + z1) / 2)
  return g
}
/** tube (ring) along Y: outer R, inner r */
export function ringY (R, r, y0, y1, { x = 0, z = 0, seg = 64 } = {}) {
  const g = revolve({ rOut: R, rIn: r, y0, y1, nT: seg, nY: 1 })
  g.translate(x, 0, z)
  return g
}
export function sphere (r, { x = 0, y = 0, z = 0, w = 48, h = 32 } = {}) {
  const g = new THREE.SphereGeometry(r, w, h)
  g.deleteAttribute('uv')
  g.translate(x, y, z)
  return g
}
/** wire / cable through points */
export function wire (points, r = 0.6, seg = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : V3(...p))))
  const g = new THREE.TubeGeometry(curve, seg, r, 8, false)
  g.deleteAttribute('uv')
  return g
}
/** hex head screw along +Y: head at y0 (top of head = y0 + k), shank downward or upward */
export function screw ({ d = 4, len = 10, head = 'socket', x = 0, y = 0, z = 0, dir = 1, P = 0.7 }) {
  // shank goes from y to y + dir*len, head on the opposite side
  const k = head === 'pan' ? d * 0.7 : d
  const hd = head === 'pan' ? d * 2 : d * 1.6
  const parts = []
  const s0 = y, s1 = y + dir * len
  parts.push(revolve({ rOut: extThread(d, P), y0: Math.min(s0, s1), y1: Math.max(s0, s1), nT: 24, nY: Math.ceil(len / P) * 3 }))
  const h0 = y - dir * k
  if (head === 'socket') {
    parts.push(revolve({ rOut: hd / 2, rIn: d * 0.45, y0: Math.min(y, h0), y1: Math.max(y, h0), nT: 6 * 5, nY: 1 }))
    parts.push(cylY(d * 0.46, dir > 0 ? h0 : y - k * 0.4, dir > 0 ? y - k * 0.6 : h0, { seg: 6 }))
  } else if (head === 'pan') {
    parts.push(lathe([[0, 0], [hd / 2, 0], [hd / 2, k * 0.6], [hd / 2 * 0.8, k], [0, k]], 32).translate(0, 0, 0))
    const g = parts[parts.length - 1]
    if (dir > 0) { g.rotateX(Math.PI); g.translate(0, y, 0) } else g.translate(0, y, 0)
  } else { // hex
    parts.push(cylY(hd / 2 * 1.08, Math.min(y, h0), Math.max(y, h0), { seg: 6 }))
  }
  const g = merge(parts)
  g.translate(x, 0, z)
  return g
}

// ------------------------------------------------------------ 2D shapes
export function roundedRectShape (w, d, r, cx = 0, cy = 0) {
  const s = new THREE.Shape()
  const x = cx - w / 2, y = cy - d / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}
export function superShape (a, b, p = 4, n = 96) {
  const s = new THREE.Shape()
  for (let i = 0; i <= n; i++) {
    const [x, y] = sePoint(a, b, p, (i / n) * TAU)
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
  }
  return s
}
export function circlePath (cx, cy, r, hole = true) {
  const p = hole ? new THREE.Path() : new THREE.Shape()
  p.absarc(cx, cy, r, 0, TAU, hole)
  return p
}
/** Extrude shape (in X/-Z plane: shape (u,v) -> world (u, y, -v)) upward from y0. */
export function extrudeY (shape, thick, y0 = 0, { bevel = 0, seg = 24 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thick - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments: seg
  })
  g.deleteAttribute('uv')
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0 + bevel, 0)
  return orient(g)
}
/** Extrude shape along +X from x0: shape (u,v) -> world (x, v, -u). */
export function extrudeX (shape, thick, x0 = 0, { seg = 32 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: seg })
  g.deleteAttribute('uv')
  g.rotateY(Math.PI / 2)
  g.translate(x0, 0, 0)
  return orient(g)
}
/** Extrude shape along +Z from z0: shape (u,v) -> world (u, v, z). */
export function extrudeZ (shape, thick, z0 = 0, { seg = 32 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: seg })
  g.deleteAttribute('uv')
  g.translate(0, 0, z0)
  return orient(g)
}
/** Centering cam profile: circle radius R with a V detent of depth dep at angle (rad). */
export function camShape (R, dep = 3, width = 0.5, at = -Math.PI / 2, n = 96) {
  const s = new THREE.Shape()
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU
    let d = Math.atan2(Math.sin(a - at), Math.cos(a - at))
    const k = Math.max(0, 1 - Math.abs(d) / width)
    const r = R - dep * k
    const x = r * Math.cos(a), y = r * Math.sin(a)
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
  }
  return s
}

export { THREE, mergeGeometries }
