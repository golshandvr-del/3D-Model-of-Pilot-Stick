// ---------------------------------------------------------------------------
//  builder.js — model-building core shared by all stick models
//   * material palette (with section-cut cap shader)
//   * kinematic node graph (pitch / roll / twist / throttle / half-tilt boot)
//   * sections (explode groups, can live on several kinematic nodes)
//   * parts (meshes tagged with partId), dimensions (attached to sections)
//   * grip loft + surface sampling, hats, buttons, levers
// ---------------------------------------------------------------------------
import * as THREE from 'three'
import { V3, TAU, DEG, lerp, clamp, thickLoft, sePoint, extrudeX, extrudeY, cylY, sphere, merge } from './geo.js'

// ------------------------------------------------------------ materials
export const CAP = { uniform: { value: 0 } }

export const PALETTE = {
  powder: { c: 0x1f2329, m: 0.35, r: 0.55 }, // powder-coated steel (black)
  zinc: { c: 0x3b4149, m: 0.85, r: 0.42 }, // die-cast housing
  alu: { c: 0xb9c0ca, m: 1.0, r: 0.3 },
  aluDark: { c: 0x2c3036, m: 0.9, r: 0.36 }, // black anodised
  steel: { c: 0x9ba4ae, m: 1.0, r: 0.24 },
  chrome: { c: 0xdfe5ec, m: 1.0, r: 0.12 },
  brass: { c: 0xc9a54a, m: 1.0, r: 0.3 },
  spring: { c: 0x70798a, m: 1.0, r: 0.3 },
  rubber: { c: 0x141619, m: 0.0, r: 0.92 },
  abs: { c: 0x25282e, m: 0.05, r: 0.55 },
  absGrey: { c: 0x454b55, m: 0.05, r: 0.5 },
  absLight: { c: 0x7c8592, m: 0.05, r: 0.48 },
  pa: { c: 0x34352f, m: 0.0, r: 0.72 }, // glass-filled nylon
  pom: { c: 0xe6e2d8, m: 0.0, r: 0.42 },
  pcb: { c: 0x0f6a3c, m: 0.1, r: 0.48 },
  pcbBlue: { c: 0x123e7a, m: 0.1, r: 0.48 },
  chip: { c: 0x101113, m: 0.2, r: 0.4 },
  copper: { c: 0xb8733a, m: 1.0, r: 0.35 },
  gold: { c: 0xd8b04a, m: 1.0, r: 0.28 },
  magnet: { c: 0x8f99a5, m: 1.0, r: 0.18 },
  wire: { c: 0xd4782a, m: 0.1, r: 0.5 },
  conn: { c: 0x101215, m: 0.1, r: 0.55 },
  red: { c: 0xb4231f, m: 0.1, r: 0.4 },
  yellow: { c: 0xd9a514, m: 0.1, r: 0.4 },
  grease: { c: 0x5a4a2a, m: 0.3, r: 0.3 }
}

const CAP_GLSL = `
  if (uCap > 0.5 && !gl_FrontFacing) {
    float hh = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 9.0));
    gl_FragColor = vec4(mix(vec3(0.60, 0.06, 0.06), vec3(0.94, 0.28, 0.18), hh), 1.0);
  }`

export function makeMat (key) {
  const p = PALETTE[key] || PALETTE.abs
  const m = new THREE.MeshStandardMaterial({ color: p.c, metalness: p.m, roughness: p.r, side: THREE.DoubleSide })
  m.userData.base = { color: p.c, key }
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCap = CAP.uniform
    sh.fragmentShader = 'uniform float uCap;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + CAP_GLSL)
  }
  m.customProgramCacheKey = () => 'cap-v1'
  return m
}

// distinct colours for "colour by section" mode
export function sectionColor (i, n) {
  const c = new THREE.Color()
  c.setHSL(((i * 0.618034) % 1), 0.62, 0.55)
  return c.getHex()
}

// ------------------------------------------------------------ builder
export class ModelBuilder {
  constructor (data) {
    this.data = data
    this.root = new THREE.Group()
    this.root.name = 'model:' + data.id
    this.nodes = { fixed: this.root }
    this.rot = {}
    this.kinFns = []
    this.secDefs = new Map(data.sections.map((s) => [s.id, s]))
    this.partDefs = new Map(data.parts.map((p) => [p.id, p]))
    this.sections = new Map()
    this.secNode = {}
    this.parts = new Map()
    this.dims = []
    this.labelAt = {}
    this.pivot = V3()
    this.axes = { pitch: 0, roll: 0, twist: 0, throttle: 0 }
    data.sections.forEach((s, i) => {
      this.sections.set(s.id, {
        def: s, groups: new Map(), explode: V3(), factor: 0, target: 0, visible: true,
        color: sectionColor(i, data.sections.length)
      })
    })
  }

  /** rotating node: holder at origin -> rot -> inner(-origin). inner coords == rest world coords */
  addRotNode (name, parent, origin) {
    const holder = new THREE.Group(); holder.name = name + ':holder'
    holder.position.copy(origin)
    const rot = new THREE.Group(); rot.name = name + ':rot'
    const inner = new THREE.Group(); inner.name = name
    inner.position.copy(origin).negate()
    holder.add(rot); rot.add(inner)
    this.nodes[parent].add(holder)
    this.nodes[name] = inner
    this.rot[name] = rot
    return rot
  }

  onAxes (fn) { this.kinFns.push(fn) }
  applyAxes (ax) {
    Object.assign(this.axes, ax)
    for (const f of this.kinFns) f(this.axes)
  }

  /** group of a section on a kinematic node (created lazily, nested under parent section) */
  group (secId, node = null) {
    const sec = this.sections.get(secId)
    if (!sec) throw new Error('unknown section ' + secId)
    const nd = node || this.secNode[secId] || (sec.def.parent ? (this.secNode[sec.def.parent] || 'fixed') : 'fixed')
    if (sec.groups.has(nd)) return sec.groups.get(nd)
    const g = new THREE.Group()
    g.name = 'sec:' + secId + '@' + nd
    g.userData.section = secId
    const parent = sec.def.parent ? this.group(sec.def.parent, nd) : this.nodes[nd]
    parent.add(g)
    sec.groups.set(nd, g)
    return g
  }

  /** add a mesh for part partId */
  part (partId, geo, matKey, { node = null, label = null } = {}) {
    const def = this.partDefs.get(partId)
    if (!def) { console.warn('unknown part', partId); return null }
    if (!geo.attributes.normal) geo.computeVertexNormals()
    const mesh = new THREE.Mesh(geo, makeMat(matKey))
    mesh.name = partId
    mesh.userData.partId = partId
    mesh.userData.section = def.section
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group(def.section, node).add(mesh)
    if (!this.parts.has(partId)) this.parts.set(partId, [])
    this.parts.get(partId).push(mesh)
    if (label) this.labelAt[partId] = label
    return mesh
  }

  /** register dimension (coordinates in rest/world space of its section node) */
  dim (def) {
    this.dims.push(def)
    return def
  }

  explode (map) {
    for (const [id, v] of Object.entries(map)) {
      const s = this.sections.get(id)
      if (s) s.explode.set(v[0], v[1], v[2])
    }
  }

  /** advance explode animation; returns true when something moved */
  tick (dt) {
    let moving = false
    const k = 1 - Math.exp(-dt * 7)
    for (const s of this.sections.values()) {
      if (Math.abs(s.factor - s.target) > 1e-4) {
        s.factor = lerp(s.factor, s.target, k)
        if (Math.abs(s.factor - s.target) < 1e-3) s.factor = s.target
        moving = true
      }
      const e = s.factor * s.factor * (3 - 2 * s.factor)
      for (const g of s.groups.values()) g.position.copy(s.explode).multiplyScalar(e)
    }
    return moving
  }

  setSectionVisible (id, v) {
    const s = this.sections.get(id)
    if (!s) return
    s.visible = v
    for (const g of s.groups.values()) g.visible = v
  }

  /** anchor group of a dimension */
  dimAnchor (def) { return this.group(def.anchor, def.node || null) }

  meshes () {
    const out = []
    for (const list of this.parts.values()) out.push(...list)
    return out
  }
}

// ------------------------------------------------------------ grip loft
/** resample sections smoothly (Catmull-Rom on every numeric field). */
export function resampleSecs (secs, per = 6) {
  const keys = ['y', 'a', 'b', 'p', 'cx', 'cz', 't']
  const get = (i, k) => {
    const s = secs[clamp(i, 0, secs.length - 1)]
    if (k === 'p') return s.p ?? 3
    if (k === 'cx' || k === 'cz') return s[k] || 0
    if (k === 't') return s.t ?? -1
    return s[k]
  }
  const out = []
  for (let i = 0; i < secs.length - 1; i++) {
    for (let j = 0; j < per; j++) {
      const u = j / per
      const o = {}
      for (const k of keys) {
        const p0 = get(i - 1, k), p1 = get(i, k), p2 = get(i + 1, k), p3 = get(i + 2, k)
        const u2 = u * u, u3 = u2 * u
        o[k] = 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
      }
      if (o.t < 0) delete o.t
      out.push(o)
    }
  }
  const last = { ...secs[secs.length - 1] }
  out.push(last)
  // keep y monotonic & sizes positive
  for (let i = 1; i < out.length; i++) if (out[i].y <= out[i - 1].y) out[i].y = out[i - 1].y + 0.05
  for (const o of out) { o.a = Math.max(o.a, 0.3); o.b = Math.max(o.b, 0.3) }
  return out
}

/** apply forward lean: cz += (y - y0) * k */
export function lean (secs, k, y0 = secs[0].y) {
  return secs.map((s) => ({ ...s, cz: (s.cz || 0) + (s.y - y0) * k }))
}

export class GripSurface {
  constructor (secs, per = 6) {
    this.secs = secs
    this.dense = resampleSecs(secs, per)
  }
  at (y) {
    const d = this.dense
    if (y <= d[0].y) return d[0]
    if (y >= d[d.length - 1].y) return d[d.length - 1]
    let lo = 0, hi = d.length - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d[m].y > y) hi = m; else lo = m }
    const A = d[lo], B = d[hi], u = (y - A.y) / (B.y - A.y)
    return { y, a: lerp(A.a, B.a, u), b: lerp(A.b, B.b, u), p: lerp(A.p ?? 3, B.p ?? 3, u), cx: lerp(A.cx || 0, B.cx || 0, u), cz: lerp(A.cz || 0, B.cz || 0, u) }
  }
  point (y, t) {
    const s = this.at(y)
    const [x, z] = sePoint(s.a, s.b, s.p, t)
    return V3(x + s.cx, y, z + s.cz)
  }
  /** surface point + outward normal. t: 0 = +X(right), PI/2 = +Z(front), PI = -X, -PI/2 = back */
  frame (y, t) {
    const p = this.point(y, t)
    const e = 0.02, ey = 0.25
    const du = this.point(y, t + e).sub(this.point(y, t - e))
    const dv = this.point(y + ey, t).sub(this.point(y - ey, t))
    const n = new THREE.Vector3().crossVectors(dv, du).normalize()
    const s = this.at(y)
    const radial = V3(p.x - s.cx, 0, p.z - s.cz)
    if (n.dot(radial) < 0) n.negate()
    return { p, n }
  }
  /** point on the top cap: walk down from the top along a ray (dirX, dirZ) */
  top (x, z) {
    const d = this.dense
    for (let i = d.length - 1; i >= 0; i--) {
      const s = d[i]
      const dx = (x - (s.cx || 0)) / s.a, dz = (z - (s.cz || 0)) / s.b
      const r = Math.abs(dx) ** s.p + Math.abs(dz) ** s.p
      if (r <= 1) {
        // normal by finite differences of the implicit height
        const h = (xx, zz) => this._height(xx, zz, i)
        const e = 0.4
        const n = V3(-(h(x + e, z) - h(x - e, z)) / (2 * e), 1, -(h(x, z + e) - h(x, z - e)) / (2 * e)).normalize()
        return { p: V3(x, h(x, z), z), n }
      }
    }
    return { p: V3(x, d[0].y, z), n: V3(0, 1, 0) }
  }
  _height (x, z, iHint) {
    const d = this.dense
    for (let i = Math.min(d.length - 1, iHint + 3); i > 0; i--) {
      const s = d[i]
      const r = Math.abs((x - (s.cx || 0)) / s.a) ** s.p + Math.abs((z - (s.cz || 0)) / s.b) ** s.p
      if (r <= 1) {
        const s2 = d[Math.min(i + 1, d.length - 1)]
        const r2 = Math.abs((x - (s2.cx || 0)) / s2.a) ** s2.p + Math.abs((z - (s2.cz || 0)) / s2.b) ** s2.p
        if (r2 <= r || i === d.length - 1) return s.y
        const u = clamp((1 - r) / Math.max(r2 - r, 1e-6), 0, 1)
        return lerp(s.y, s2.y, u)
      }
    }
    return d[0].y
  }
  /** split shells: left (x<0) and right (x>0) */
  shells ({ t = 2.5, n = 120 } = {}) {
    return {
      right: thickLoft(this.dense, { t, n, a0: -Math.PI / 2, a1: Math.PI / 2 }),
      left: thickLoft(this.dense, { t, n, a0: Math.PI / 2, a1: Math.PI * 1.5 })
    }
  }
}

// ------------------------------------------------------------ controls
/** orient a +Y-built geometry onto surface point p with normal n (spin around n in degrees) */
export function mount (g, p, n, { spin = 0, sink = 0.6 } = {}) {
  if (spin) g.rotateY(spin * DEG)
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), n.clone().normalize())
  g.applyQuaternion(q)
  const o = p.clone().addScaledVector(n, -sink)
  g.translate(o.x, o.y, o.z)
  return g
}

function starShape (r, ways, depth = 0.22) {
  const s = new THREE.Shape()
  const N = ways * 16
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU
    const rr = r * (1 - depth * (0.5 + 0.5 * Math.cos(a * ways)) * 0.6)
    const x = rr * Math.cos(a), y = rr * Math.sin(a)
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
  }
  return s
}

/** hat switch built along +Y, base on y=0 */
export function hat ({ r = 5.5, ways = 8, h = 4.5 } = {}) {
  const bezel = cylY(r + 1.8, -1, 1.4, { seg: 40 })
  const cap = extrudeY(starShape(r, ways), h - 1.4, 1.4, { seg: 64 })
  const nub = cylY(1.4, h, h + 2.2, { seg: 20, r2: 1.0 })
  const tip = sphere(1.1, { y: h + 2.2, w: 16, h: 10 })
  return merge([bezel, cap, nub, tip])
}
/** push button along +Y */
export function button ({ r = 4, h = 2.6, bezel = 1.2 } = {}) {
  const parts = [cylY(r, -1, h - r * 0.25, { seg: 36 }), sphere(r, { y: h - r * 0.25, w: 36, h: 12 }).scale(1, 0.25, 1)]
  const top = parts[1]; top.translate(0, (h - r * 0.25) * 0.75, 0)
  if (bezel) parts.push(cylY(r + bezel, -1, 0.8, { seg: 36 }))
  return merge(parts)
}
/** fix button top translate bug-free variant */
export function domeButton ({ r = 4, h = 2.6, bezel = 1.2 } = {}) {
  const body = cylY(r, -1, h, { seg: 36 })
  const dome = new THREE.SphereGeometry(r, 36, 10, 0, TAU, 0, Math.PI / 2)
  dome.deleteAttribute('uv'); dome.scale(1, 0.3, 1); dome.translate(0, h, 0)
  const list = [body, dome]
  if (bezel) list.push(cylY(r + bezel, -1, 0.8, { seg: 36 }))
  return merge(list)
}
/** rotary encoder knob along +Y */
export function knob ({ r = 7, h = 9, ribs = 24 } = {}) {
  const sh = new THREE.Shape()
  const N = ribs * 6
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU
    const rr = r - 0.5 * (0.5 + 0.5 * Math.cos(a * ribs))
    if (i === 0) sh.moveTo(rr * Math.cos(a), rr * Math.sin(a)); else sh.lineTo(rr * Math.cos(a), rr * Math.sin(a))
  }
  return merge([extrudeY(sh, h, 0, { seg: 64 }), cylY(r * 0.55, h, h + 0.6), cylY(r + 1.5, -1, 0.6)])
}

/** lever in the Z-Y plane, extruded along X (width w, centred on x0). pts: [[z, y], ...] */
export function leverZY (pts, w, x0 = 0) {
  const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(-z, y)))
  return extrudeX(sh, w, x0 - w / 2)
}
/** smooth closed outline through control points (Catmull-Rom), returned as [[z,y]...] */
export function smoothOutline (pts, n = 96) {
  const c = new THREE.CatmullRomCurve3(pts.map(([z, y]) => V3(z, y, 0)), true, 'centripetal')
  return c.getPoints(n).slice(0, -1).map((p) => [p.x, p.y])
}

/** board with a few chips; lies in XZ plane on top of y0 */
export function board (w, d, t, { y0 = 0, x = 0, z = 0, chips = [] } = {}) {
  const g = new THREE.BoxGeometry(w, t, d); g.deleteAttribute('uv')
  g.translate(x, y0 + t / 2, z)
  return g
}

export { THREE, V3, DEG, TAU }
