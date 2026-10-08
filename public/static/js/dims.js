// ---------------------------------------------------------------------------
//  dims.js — engineering dimension annotations in 3D
//  kinds: linear | diameter | radius | angle | leader | measure
//  Every dimension is attached to an anchor Object3D (a section group), so
//  it follows exploded views and the stick's kinematic motion.
// ---------------------------------------------------------------------------
import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'

export const CONF_COLORS = {
  official: 0x22c55e,
  community: 0xfacc15,
  standard: 0x38bdf8,
  design: 0xc084fc,
  measure: 0xf59e0b,
  hl: 0xffffff
}
export const CONF_FA = { official: 'رسمی سازنده', community: 'اندازه‌گیری جامعه', standard: 'استاندارد صنعتی', design: 'طراحی مدل مرجع', measure: 'اندازه‌گیری شما' }

const v3 = (a) => (a && a.isVector3 ? a.clone() : new THREE.Vector3(a?.[0] || 0, a?.[1] || 0, a?.[2] || 0))
const ORDER = 990

export class DimSystem {
  constructor ({ onLabelClick = null } = {}) {
    this.items = new Map()
    this.onLabelClick = onLabelClick
    this.main = {}; this.thin = {}; this.solid = {}
    for (const [k, c] of Object.entries(CONF_COLORS)) {
      this.main[k] = new LineMaterial({ color: c, linewidth: k === 'hl' ? 2.6 : 1.7, depthTest: false, transparent: true, opacity: 0.98 })
      this.thin[k] = new LineMaterial({ color: c, linewidth: 1.0, depthTest: false, transparent: true, opacity: 0.55 })
      this.solid[k] = new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, opacity: 0.98 })
    }
    this.coneGeo = new THREE.ConeGeometry(0.42, 1, 12).translate(0, -0.5, 0) // tip at origin, body along -Y
    this.dotGeo = new THREE.SphereGeometry(1, 12, 8)
    this.highlighted = null
    this.measureCount = 0
  }

  setResolution (w, h) {
    for (const m of [...Object.values(this.main), ...Object.values(this.thin)]) m.resolution.set(w, h)
  }

  // ------------------------------------------------------------ geometry of one dim
  _shape (def) {
    const segs = [], ext = [], arrows = [], dots = []
    let lp = new THREE.Vector3()
    const kind = def.kind
    if (kind === 'linear' || kind === 'measure') {
      const a = v3(def.a), b = v3(def.b), o = v3(def.off)
      const a2 = a.clone().add(o), b2 = b.clone().add(o)
      if (o.length() > 0.01) {
        const on = o.clone().normalize()
        ext.push(a.clone().addScaledVector(on, 0.8), a2.clone().addScaledVector(on, 2.2))
        ext.push(b.clone().addScaledVector(on, 0.8), b2.clone().addScaledVector(on, 2.2))
      }
      segs.push(a2, b2)
      const len = a2.distanceTo(b2)
      const d = b2.clone().sub(a2).normalize()
      const as = def.arrow ?? THREE.MathUtils.clamp(len * 0.2, 0.8, 3.4)
      if (kind === 'measure') { dots.push([a, 1.0], [b, 1.0]) } else {
        arrows.push([a2, d.clone().negate(), as], [b2, d.clone(), as])
      }
      lp = a2.clone().lerp(b2, 0.5)
      if (def.lshift) lp.add(v3(def.lshift))
    } else if (kind === 'diameter' || kind === 'radius') {
      const c = v3(def.c), n = v3(def.n || [0, 1, 0]).normalize()
      const d = v3(def.d || [1, 0, 0]); d.addScaledVector(n, -d.dot(n)).normalize()
      const e = new THREE.Vector3().crossVectors(n, d)
      const r = def.r, lead = def.lead ?? Math.max(7, r * 0.5)
      const N = 72
      const arcFrom = kind === 'radius' ? -0.45 : 0, arcTo = kind === 'radius' ? 0.45 : Math.PI * 2
      if (def.circle !== false) {
        for (let i = 0; i < N; i++) {
          const t0 = arcFrom + (arcTo - arcFrom) * i / N, t1 = arcFrom + (arcTo - arcFrom) * (i + 1) / N
          ext.push(c.clone().addScaledVector(d, r * Math.cos(t0)).addScaledVector(e, r * Math.sin(t0)))
          ext.push(c.clone().addScaledVector(d, r * Math.cos(t1)).addScaledVector(e, r * Math.sin(t1)))
        }
      }
      const pEnd = c.clone().addScaledVector(d, r)
      const pFar = c.clone().addScaledVector(d, r + lead)
      const as = def.arrow ?? THREE.MathUtils.clamp(r * 0.35, 0.7, 3.2)
      if (kind === 'diameter') {
        const pStart = c.clone().addScaledVector(d, -r)
        segs.push(pStart, pFar)
        arrows.push([pStart, d.clone().negate(), as], [pEnd, d.clone(), as])
      } else {
        segs.push(c.clone(), pFar)
        arrows.push([pEnd, d.clone(), as])
        dots.push([c, 0.5])
      }
      lp = c.clone().addScaledVector(d, r + lead + 1.5)
      if (def.lshift) lp.add(v3(def.lshift))
    } else if (kind === 'angle') {
      const c = v3(def.c), n = v3(def.n || [1, 0, 0]).normalize(), u = v3(def.u || [0, 1, 0]).normalize()
      const r = def.r || 60
      const A = THREE.MathUtils.degToRad(def.deg || 20)
      const a0 = def.oneSided ? 0 : -A
      const q = new THREE.Quaternion()
      const pt = (ang) => u.clone().applyQuaternion(q.setFromAxisAngle(n, ang)).multiplyScalar(r).add(c)
      const N = 40
      for (let i = 0; i < N; i++) segs.push(pt(a0 + (A - a0) * i / N), pt(a0 + (A - a0) * (i + 1) / N))
      ext.push(c.clone(), pt(a0).sub(c).multiplyScalar(1.08).add(c))
      ext.push(c.clone(), pt(A).sub(c).multiplyScalar(1.08).add(c))
      ext.push(c.clone(), u.clone().multiplyScalar(r * 1.15).add(c))
      const tang = (ang, s) => new THREE.Vector3().crossVectors(n, pt(ang).sub(c)).normalize().multiplyScalar(s)
      const as = def.arrow ?? 3
      arrows.push([pt(A), tang(A, 1), as], [pt(a0), tang(a0, -1), as])
      lp = pt((A + a0) / 2 + (def.oneSided ? 0 : A * 0.0)).sub(c).multiplyScalar(1.12).add(c)
      if (!def.oneSided) lp = pt(A * 0.55).sub(c).multiplyScalar(1.12).add(c)
      if (def.lshift) lp.add(v3(def.lshift))
    } else if (kind === 'leader') {
      const p = v3(def.p), q2 = v3(def.q)
      segs.push(p, q2)
      dots.push([p, def.dot ?? 0.8])
      lp = q2.clone()
    }
    return { segs, ext, arrows, dots, lp }
  }

  _lines (pts, mat) {
    const g = new LineSegmentsGeometry()
    const arr = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z })
    g.setPositions(arr)
    const l = new LineSegments2(g, mat)
    l.computeLineDistances()
    l.renderOrder = ORDER
    l.frustumCulled = false
    return l
  }

  _label (def, conf) {
    const el = document.createElement('div')
    el.className = `dim-label ${conf}`
    el.dataset.dim = def.id
    const val = document.createElement('span')
    val.className = 'dl-val'
    val.textContent = def.text
    el.appendChild(val)
    if (def.name) {
      const nm = document.createElement('span')
      nm.className = 'dl-name'
      nm.textContent = def.name
      el.appendChild(nm)
    }
    el.title = `${def.name || ''}\n${def.text}\nاعتبار: ${CONF_FA[conf] || conf}${def.src ? ' · منبع ' + def.src : ''}`
    el.addEventListener('pointerdown', (ev) => ev.stopPropagation())
    el.addEventListener('click', (ev) => { ev.stopPropagation(); this.onLabelClick && this.onLabelClick(def.id) })
    const o = new CSS2DObject(el)
    return o
  }

  /** create a dimension and attach it to anchor (Object3D) */
  add (def, anchor) {
    if (this.items.has(def.id)) this.remove(def.id)
    const conf = def.kind === 'measure' ? 'measure' : (def.conf || 'design')
    const grp = new THREE.Group()
    grp.name = 'dim:' + def.id
    grp.userData.isDim = true
    const s = this._shape(def)
    const mainL = this._lines(s.segs, this.main[conf])
    grp.add(mainL)
    let thinL = null
    if (s.ext.length) { thinL = this._lines(s.ext, this.thin[conf]); grp.add(thinL) }
    const meshes = []
    for (const [tip, dir, size] of s.arrows) {
      const m = new THREE.Mesh(this.coneGeo, this.solid[conf])
      m.scale.set(size, size * 2.4, size)
      m.position.copy(tip)
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      m.renderOrder = ORDER + 1
      grp.add(m); meshes.push(m)
    }
    for (const [p, r] of s.dots) {
      const m = new THREE.Mesh(this.dotGeo, this.solid[conf])
      m.scale.setScalar(r); m.position.copy(p); m.renderOrder = ORDER + 1
      grp.add(m); meshes.push(m)
    }
    const label = this._label(def, conf)
    label.position.copy(s.lp)
    grp.add(label)
    grp.visible = false
    anchor.add(grp)
    const item = { def, conf, grp, mainL, thinL, meshes, label, anchor }
    this.items.set(def.id, item)
    return item
  }

  remove (id) {
    const it = this.items.get(id)
    if (!it) return
    it.grp.traverse((o) => { if (o.geometry && o.geometry !== this.coneGeo && o.geometry !== this.dotGeo) o.geometry.dispose() })
    it.label.element.remove()
    it.grp.removeFromParent()
    this.items.delete(id)
  }

  clear (filter = null) {
    for (const id of [...this.items.keys()]) {
      if (!filter || filter(this.items.get(id))) this.remove(id)
    }
  }

  setVisible (id, v) {
    const it = this.items.get(id)
    if (it) it.grp.visible = v
  }

  /** show exactly the given ids (Set or array); everything else hidden (measure dims untouched) */
  showOnly (ids) {
    const s = ids instanceof Set ? ids : new Set(ids)
    for (const [id, it] of this.items) {
      if (it.def.kind === 'measure') continue
      it.grp.visible = s.has(id)
    }
  }

  highlight (id) {
    if (this.highlighted) {
      const p = this.items.get(this.highlighted)
      if (p) this._paint(p, p.conf)
    }
    this.highlighted = id
    const it = id && this.items.get(id)
    if (it) this._paint(it, 'hl')
  }

  _paint (it, key) {
    it.mainL.material = this.main[key]
    for (const m of it.meshes) m.material = this.solid[key]
    it.label.element.classList.toggle('hl', key === 'hl')
  }

  /** world-space bounding box of a dim (for camera focus) */
  boxOf (id) {
    const it = this.items.get(id)
    if (!it) return null
    const b = new THREE.Box3()
    const pts = []
    const s = this._shape(it.def)
    pts.push(...s.segs, ...s.ext, s.lp)
    it.anchor.updateWorldMatrix(true, false)
    for (const p of pts) b.expandByPoint(p.clone().applyMatrix4(it.anchor.matrixWorld))
    return b
  }

  // ------------------------------------------------------------ measure tool
  addMeasure (pa, pb, anchor) {
    const id = `measure-${++this.measureCount}`
    const dist = pa.distanceTo(pb)
    const def = { id, kind: 'measure', a: pa.clone(), b: pb.clone(), text: `${dist.toFixed(2)} mm`, name: `اندازه‌گیری ${this.measureCount}` }
    const it = this.add(def, anchor)
    it.grp.visible = true
    return { id, dist }
  }

  clearMeasures () { this.clear((it) => it.def.kind === 'measure'); this.measureCount = 0 }
}
