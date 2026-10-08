// ---------------------------------------------------------------------------
//  app.js — Flight-Stick 3D Explorer (scene, UI, explode, section cut,
//  x-ray, selection, connections, dimensions, measuring, axis motion)
// ---------------------------------------------------------------------------
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CAP } from './builder.js'
import { DimSystem, CONF_FA } from './dims.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const TYPE_FA = { mechanical: 'مکانیکی', electrical: 'الکتریکی', fastener: 'پیچ و نصب', kinematic: 'سینماتیک', sensor: 'سنسور' }
const TYPE_ICON = { mechanical: 'fa-gears', electrical: 'fa-plug', fastener: 'fa-screwdriver-wrench', kinematic: 'fa-arrows-spin', sensor: 'fa-magnet' }
const EMI_SEL = 0x0c5a96
const EMI_HL = 0x7a4a00

// ================================================================ renderer / scene
const host = $('#canvas-host')
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.localClippingEnabled = true
host.appendChild(renderer.domElement)

const labelRenderer = new CSS2DRenderer()
labelRenderer.domElement.className = 'label-layer'
host.appendChild(labelRenderer.domElement)

const scene = new THREE.Scene()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

const camera = new THREE.PerspectiveCamera(35, 1, 1, 6000)
camera.position.set(380, 300, 420)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.09
controls.screenSpacePanning = true
controls.minDistance = 30
controls.maxDistance = 2200
controls.target.set(0, 120, 0)
controls.autoRotateSpeed = 1.6

scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x1a1d24, 0.55))
const sun = new THREE.DirectionalLight(0xffffff, 2.0)
sun.position.set(260, 520, 300)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -320, right: 320, top: 320, bottom: -320, near: 50, far: 1500 })
sun.shadow.bias = -0.0004
sun.shadow.normalBias = 0.6
scene.add(sun)
const rim = new THREE.DirectionalLight(0x88aaff, 0.7)
rim.position.set(-300, 200, -260)
scene.add(rim)

const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.32, depthWrite: false }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.3
ground.receiveShadow = true
scene.add(ground)

const grid = new THREE.Group()
const g10 = new THREE.GridHelper(600, 60, 0x24324f, 0x152038); g10.material.transparent = true; g10.material.opacity = 0.55
const g100 = new THREE.GridHelper(600, 6, 0x3b5585, 0x3b5585); g100.position.y = 0.05; g100.material.transparent = true; g100.material.opacity = 0.7
grid.add(g10, g100); grid.position.y = -0.2
scene.add(grid)

const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

const dims = new DimSystem({ onLabelClick: (id) => selectDim(id, true) })

// ================================================================ state
const S = {
  list: [], data: null, b: null, model: null,
  explode: 0,
  dimsOn: true, dimMode: 'overview', dimSingle: null,
  labelsOn: false, xray: false, colors: false, clip: false, clipAxis: 'x', clipFlip: false,
  measure: false, measureA: null, autoRotate: false, animate: false, animT: 0,
  selPart: null, hlParts: new Set(), activeConn: null, iso: null, connFilter: 'all',
  partLabels: new Map(), tween: null, axes: { pitch: 0, roll: 0, twist: 0, throttle: 0 }
}
const measureMarker = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 10), new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false }))
measureMarker.renderOrder = 999; measureMarker.visible = false
scene.add(measureMarker)

// ================================================================ helpers
function partDef (id) { return S.data.parts.find((p) => p.id === id) }
function secDef (id) { return S.data.sections.find((s) => s.id === id) }
function srcById (id) { return (S.data.sourceList || []).find((s) => s.id === id) }
function effVisible (o) { while (o) { if (!o.visible) return false; o = o.parent } return true }
function descendants (secId) {
  const out = new Set([secId])
  let grew = true
  while (grew) {
    grew = false
    for (const s of S.data.sections) if (s.parent && out.has(s.parent) && !out.has(s.id)) { out.add(s.id); grew = true }
  }
  return out
}
function ancestors (secId) {
  const out = []
  let s = secDef(secId)
  while (s && s.parent) { out.push(s.parent); s = secDef(s.parent) }
  return out
}
function specsTable (specs) {
  if (!specs || !specs.length) return ''
  return `<table class="specs">${specs.map((s) => {
    const src = s.src ? srcById(s.src) : null
    const link = src ? `<a class="src-ref" href="${esc(src.url)}" target="_blank" rel="noopener" title="${esc(src.title)}">[${esc(s.src)}]</a>` : (s.src ? `<span class="src-ref">[${esc(s.src)}]</span>` : '')
    const conf = s.c ? `<i class="conf ${s.c}" title="${esc(CONF_FA[s.c] || s.c)}"></i>` : ''
    return `<tr><th>${esc(s.k)}</th><td>${conf}<span class="val">${esc(s.v)}</span>${link}</td></tr>`
  }).join('')}</table>`
}

// ================================================================ boot
async function init () {
  onResize()
  try {
    S.list = await (await fetch('/api/models')).json()
  } catch (e) { fatal('خطا در دریافت فهرست مدل‌ها', e); return }
  const tabs = $('#model-tabs')
  tabs.innerHTML = S.list.map((m) => `<button data-model="${m.id}" title="${esc(m.en)}">${esc(m.name.split('—')[0].trim())} — ${esc(m.refClass.split('/')[0].trim())}</button>`).join('')
  tabs.addEventListener('click', (e) => { const bt = e.target.closest('button[data-model]'); if (bt) loadModel(bt.dataset.model) })
  if (window.innerWidth <= 820) document.body.classList.add('hide-left', 'hide-right')
  bindUI()
  const want = new URLSearchParams(location.search).get('model')
  await loadModel(S.list.some((m) => m.id === want) ? want : S.list[0].id)
  requestAnimationFrame(loop)
}

function fatal (msg, e) {
  console.error(msg, e)
  const l = $('#loading'); l.classList.remove('done')
  l.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size:32px;color:#ef4444"></i><span>${esc(msg)}</span><small dir="ltr" style="color:#8193b2">${esc(e && (e.stack || e.message || e))}</small>`
}

// ================================================================ model loading
async function loadModel (id) {
  if (S.model === id) return
  $('#loading').classList.remove('done')
  await new Promise((r) => setTimeout(r, 30))
  let data, mod
  try {
    [data, mod] = await Promise.all([
      fetch('/api/models/' + id).then((r) => r.json()),
      import(`./models/${id}.js`)
    ])
  } catch (e) { fatal('خطا در بارگذاری مدل', e); return }
  disposeModel()
  S.data = data; S.model = id
  let b
  try { b = mod.build(data) } catch (e) { fatal('خطا در ساخت هندسهٔ مدل', e); return }
  S.b = b
  scene.add(b.root)
  // dimensions
  for (const def of b.dims) {
    try { dims.add(def, b.dimAnchor(def)) } catch (e) { console.warn('dim failed', def.id, e) }
  }
  // part labels
  for (const [pid, pos] of Object.entries(b.labelAt)) {
    const meshes = b.parts.get(pid); if (!meshes) continue
    const el = document.createElement('div')
    el.className = 'part-label'
    el.textContent = partDef(pid)?.name || pid
    const o = new CSS2DObject(el)
    o.position.copy(pos)
    o.visible = false
    meshes[0].parent.add(o)
    S.partLabels.set(pid, o)
  }
  // reset state
  Object.assign(S, { explode: 0, dimMode: 'overview', dimSingle: null, selPart: null, activeConn: null, iso: null, measureA: null })
  S.hlParts = new Set()
  S.axes = { pitch: 0, roll: 0, twist: 0, throttle: 0 }
  b.applyAxes(S.axes)
  $('#explode-range').value = 0; $('#explode-out').textContent = '0%'
  $$('#model-tabs button').forEach((x) => x.classList.toggle('active', x.dataset.model === id))
  history.replaceState(null, '', '?model=' + id)
  buildSectionTree(); buildAxisControls(); renderConnTab(); renderDimsTab(); renderInfoTab(); renderPartTab()
  applyMaterials(); refreshDims(); refreshLabels(); updateClip()
  setView('iso', false)
  $('#loading').classList.add('done')
}

function disposeModel () {
  if (!S.b) return
  dims.clear()
  measureMarker.visible = false
  for (const o of S.partLabels.values()) { o.element.remove(); o.removeFromParent() }
  S.partLabels.clear()
  S.b.root.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose() } })
  scene.remove(S.b.root)
  S.b = null
}

// ================================================================ materials / highlight / visibility
function applyMaterials () {
  const b = S.b; if (!b) return
  for (const mesh of b.meshes()) {
    const m = mesh.material
    const pid = mesh.userData.partId
    const hl = S.hlParts.has(pid), sel = S.selPart === pid
    m.color.setHex(S.colors ? b.sections.get(mesh.userData.section).color : m.userData.base.color)
    m.emissive.setHex(sel ? EMI_SEL : hl ? EMI_HL : 0x000000)
    m.emissiveIntensity = sel || hl ? 0.9 : 0
    const ghost = S.xray && !(hl || sel)
    if (m.transparent !== ghost) { m.transparent = ghost; m.needsUpdate = true }
    m.opacity = ghost ? 0.14 : 1
    m.depthWrite = !ghost
    mesh.castShadow = !ghost
    const cp = S.clip ? [clipPlane] : []
    if ((m.clippingPlanes || []).length !== cp.length) { m.clippingPlanes = cp; m.needsUpdate = true }
  }
  CAP.uniform.value = S.clip ? 1 : 0
  for (const [pid, o] of S.partLabels) o.element.classList.toggle('hl', S.hlParts.has(pid) || S.selPart === pid)
}

function updateMeshVisibility () {
  const b = S.b; if (!b) return
  let keep = null
  if (S.iso?.type === 'section') keep = (m) => descendants(S.iso.id).has(m.userData.section)
  if (S.iso?.type === 'part') keep = (m) => m.userData.partId === S.iso.id
  for (const m of b.meshes()) m.visible = keep ? keep(m) : true
  $$('.sec-row').forEach((r) => r.classList.toggle('isolated', S.iso?.type === 'section' && S.iso.id === r.dataset.sec))
}

function refreshDims () {
  let ids = []
  if (S.dimsOn) {
    if (S.dimMode === 'all') ids = S.b.dims.map((d) => d.id)
    else if (S.dimMode === 'conn' && S.activeConn) ids = S.data.connections.find((c) => c.id === S.activeConn)?.dims || []
    else if (S.dimMode === 'single' && S.dimSingle) ids = [S.dimSingle]
    else ids = S.b.overview || []
  }
  dims.showOnly(ids)
  dims.highlight(S.dimMode === 'single' ? S.dimSingle : null)
  $('#tb-dims').classList.toggle('active', S.dimsOn)
  $('#tb-alldims').classList.toggle('active', S.dimsOn && S.dimMode === 'all')
  $$('.dim-item').forEach((el) => el.classList.toggle('active', ids.includes(el.dataset.dim)))
}

function refreshLabels () {
  for (const [pid, o] of S.partLabels) o.visible = S.labelsOn || S.hlParts.has(pid) || S.selPart === pid
  $('#tb-labels').classList.toggle('active', S.labelsOn)
}

// ================================================================ explode
function setExplodeAll (v, immediate = false) {
  S.explode = v
  for (const s of S.b.sections.values()) { s.target = v; if (immediate) s.factor = v }
  $('#explode-range').value = Math.round(v * 100)
  $('#explode-out').textContent = Math.round(v * 100) + '%'
  syncTreeButtons()
}
function openOnly (secIds) {
  const want = new Set(secIds)
  for (const id of secIds) for (const a of ancestors(id)) want.add(a)
  for (const [id, s] of S.b.sections) s.target = want.has(id) && secIds.includes(id) ? 1 : 0
  // ancestor sections listed explicitly are opened; implicit ancestors stay closed (children explode relative to them)
  syncTreeButtons()
}

// ================================================================ section tree
function buildSectionTree () {
  const ul = $('#section-tree')
  const kids = (pid) => S.data.sections.filter((s) => (s.parent || null) === pid)
  const row = (s) => {
    const sec = S.b.sections.get(s.id)
    const col = '#' + sec.color.toString(16).padStart(6, '0')
    const ch = kids(s.id)
    return `<li><div class="sec-row" data-sec="${s.id}" title="${esc(s.en)}">
      <span class="sec-swatch" style="background:${col}"></span>
      <span class="sec-name">${esc(s.name)}</span>
      <button class="sec-btn" data-act="explode" title="باز/بسته کردن این بخش"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>
      <button class="sec-btn" data-act="iso" title="ایزوله (فقط همین بخش)"><i class="fa-solid fa-crosshairs"></i></button>
      <button class="sec-btn" data-act="eye" title="نمایش/پنهان"><i class="fa-solid fa-eye"></i></button>
    </div>${ch.length ? `<ul>${ch.map(row).join('')}</ul>` : ''}</li>`
  }
  ul.innerHTML = kids(null).map(row).join('')
  syncTreeButtons()
}
function syncTreeButtons () {
  if (!S.b) return
  $$('.sec-row').forEach((r) => {
    const s = S.b.sections.get(r.dataset.sec); if (!s) return
    r.classList.toggle('off', !s.visible)
    r.querySelector('[data-act=eye] i').className = 'fa-solid ' + (s.visible ? 'fa-eye' : 'fa-eye-slash')
    r.querySelector('[data-act=explode]').classList.toggle('on', s.target > 0.5)
  })
}
function onTreeClick (e) {
  const r = e.target.closest('.sec-row'); if (!r) return
  const id = r.dataset.sec, s = S.b.sections.get(id)
  const act = e.target.closest('[data-act]')?.dataset.act
  if (act === 'eye') { S.b.setSectionVisible(id, !s.visible) } else if (act === 'explode') { s.target = s.target > 0.5 ? 0 : 1 } else if (act === 'iso') {
    S.iso = S.iso?.type === 'section' && S.iso.id === id ? null : { type: 'section', id }
    updateMeshVisibility()
    if (S.iso) setTimeout(() => focusMeshes(S.b.meshes().filter((m) => m.visible)), 50)
  } else {
    // select section: highlight its parts
    const set = descendants(id)
    S.hlParts = new Set(S.data.parts.filter((p) => set.has(p.section)).map((p) => p.id))
    S.activeConn = null; S.selPart = null
    applyMaterials(); refreshLabels(); renderConnTab()
    focusMeshes(S.b.meshes().filter((m) => set.has(m.userData.section)))
  }
  syncTreeButtons()
}

// ================================================================ axes
function buildAxisControls () {
  const ax = S.data.axes
  const rows = [['roll', 'رول (X)', ax.roll], ['pitch', 'پیچ (Y)', ax.pitch]]
  if (ax.twist) rows.push(['twist', 'چرخش Z', ax.twist])
  if (S.b.rot.thr) rows.push(['throttle', 'تراتل', 1])
  $('#axis-controls').innerHTML = rows.map(([k, n, m]) => `<div class="axis-row"><label>${n}</label>
    <input type="range" data-axis="${k}" min="${-m}" max="${m}" step="${k === 'throttle' ? 0.01 : 0.5}" value="0" />
    <output dir="ltr" data-out="${k}">0</output></div>`).join('')
  S.animate = false; $('#btn-animate').innerHTML = '<i class="fa-solid fa-play"></i> پخش حرکت'
  updateAxisOutput()
}
function setAxes (patch, fromSlider = false) {
  Object.assign(S.axes, patch)
  S.b.applyAxes(S.axes)
  if (!fromSlider) for (const [k, v] of Object.entries(patch)) { const el = $(`input[data-axis=${k}]`); if (el) el.value = v }
  updateAxisOutput()
}
function updateAxisOutput () {
  const ax = S.data.axes
  const raw = (v, m) => Math.round(32767.5 + (m ? v / m : 0) * 32767.5)
  const fmt = (v, u = '°') => (v >= 0 ? '+' : '') + v.toFixed(1) + u
  for (const k of ['roll', 'pitch', 'twist', 'throttle']) {
    const o = $(`output[data-out=${k}]`)
    if (o) o.textContent = k === 'throttle' ? Math.round(S.axes.throttle * 100) + '%' : fmt(S.axes[k])
  }
  const lines = [
    `X roll  ${fmt(S.axes.roll).padStart(7)}  raw16 ${String(raw(S.axes.roll, ax.roll)).padStart(5)}`,
    `Y pitch ${fmt(S.axes.pitch).padStart(7)}  raw16 ${String(raw(-S.axes.pitch, ax.pitch)).padStart(5)}`
  ]
  if (ax.twist) lines.push(`Rz twist${fmt(S.axes.twist).padStart(7)}  raw16 ${String(raw(S.axes.twist, ax.twist)).padStart(5)}`)
  if (S.b.rot.thr) lines.push(`Throttle ${(S.axes.throttle * 100).toFixed(0).padStart(5)}%  raw16 ${String(raw(S.axes.throttle, 1)).padStart(5)}`)
  $('#axis-output').textContent = lines.join('\n')
}

// ================================================================ right panel
function renderConnTab () {
  const types = ['all', ...new Set(S.data.connections.map((c) => c.type))]
  const list = S.data.connections.filter((c) => S.connFilter === 'all' || c.type === S.connFilter)
  $('#tab-conn').innerHTML = `
    <p class="hint">${S.data.connections.length} اتصال · روی هر کارت بزنید تا بخش‌های لازم باز، قطعات هایلایت و ابعاد اتصال رسم شود.</p>
    <div class="conn-filter">${types.map((t) => `<button data-filter="${t}" class="${S.connFilter === t ? 'active' : ''}">${t === 'all' ? 'همه' : TYPE_FA[t]}</button>`).join('')}</div>
    ${list.map((c) => `<article class="conn-card ${S.activeConn === c.id ? 'active' : ''}" data-conn="${c.id}">
      <div class="conn-head"><i class="fa-solid ${TYPE_ICON[c.type]}"></i><h3>${esc(c.name)}<br><span class="conn-en" dir="ltr">${esc(c.en)}</span></h3>
      <span class="type-badge type-${c.type}">${TYPE_FA[c.type]}</span></div>
      <div class="conn-body"><p>${esc(c.desc)}</p>${specsTable(c.specs)}
        <div class="part-actions">${c.parts.map((p) => `<span class="chip" data-part="${p}">${esc(partDef(p)?.name || p)}</span>`).join('')}</div>
      </div></article>`).join('')}`
}
function renderPartTab () {
  const el = $('#tab-part')
  const p = S.selPart && partDef(S.selPart)
  if (!p) { el.innerHTML = '<p class="empty"><i class="fa-solid fa-hand-pointer"></i><br>روی یک قطعه در مدل کلیک کنید.</p>'; return }
  const conns = S.data.connections.filter((c) => c.parts.includes(p.id))
  el.innerHTML = `<h3 class="part-title">${esc(p.name)}</h3><div class="part-sub" dir="ltr">${esc(p.en)} · <code>${esc(p.id)}</code></div>
    <span class="chip"><i class="fa-solid fa-layer-group"></i> ${esc(secDef(p.section)?.name)}</span>
    <span class="chip"><i class="fa-solid fa-cube"></i> ${esc(p.material)}</span>
    <p class="info-summary">${esc(p.desc)}</p>
    ${specsTable(p.specs)}
    <div class="part-actions">
      <button class="btn small" data-pact="focus"><i class="fa-solid fa-magnifying-glass-plus"></i> تمرکز</button>
      <button class="btn small ${S.iso?.type === 'part' ? 'active' : ''}" data-pact="iso"><i class="fa-solid fa-crosshairs"></i> ایزوله</button>
      <button class="btn small" data-pact="hide"><i class="fa-solid fa-eye-slash"></i> پنهان کردن بخش</button>
    </div>
    ${conns.length ? `<div class="part-conns"><h4 style="margin:6px 0;color:var(--accent);font-size:12.5px">اتصالات این قطعه</h4>${conns.map((c) => `<a data-goconn="${c.id}"><i class="fa-solid ${TYPE_ICON[c.type]}"></i> ${esc(c.name)}</a>`).join('')}</div>` : ''}`
}
function renderDimsTab () {
  const groups = new Map()
  for (const d of S.b.dims) {
    if (!groups.has(d.anchor)) groups.set(d.anchor, [])
    groups.get(d.anchor).push(d)
  }
  $('#tab-dims').innerHTML = `<p class="hint">${S.b.dims.length} اندازه · روی هر مورد بزنید تا در مدل رسم و دوربین روی آن متمرکز شود. رنگ نقطه = سطح اعتبار.</p>
    <div class="btn-row" style="margin-bottom:6px"><button class="btn small" data-dmode="all"><i class="fa-solid fa-ruler"></i> همه</button>
    <button class="btn small" data-dmode="overview"><i class="fa-solid fa-expand"></i> ابعاد کلی</button></div>
    ${[...groups].map(([sec, list]) => `<div class="dim-group"><h4>${esc(secDef(sec)?.name || sec)}</h4>
      ${list.map((d) => `<div class="dim-item" data-dim="${d.id}"><span><i class="conf ${d.conf || 'design'}"></i>${esc(d.name || d.id)}</span><b>${esc(d.text)}</b></div>`).join('')}</div>`).join('')}`
}
function renderInfoTab () {
  const d = S.data
  $('#tab-info').innerHTML = `<h3 class="part-title">${esc(d.name)}</h3><div class="part-sub" dir="ltr">${esc(d.en)}</div>
    <span class="chip">کلاس مرجع: <b dir="ltr">${esc(d.refClass)}</b></span>
    <p class="info-summary">${esc(d.summary)}</p>
    <h4 style="color:var(--accent);margin:10px 0 0">مشخصات کلی</h4>${specsTable(d.overall)}
    <p class="hint" style="margin-top:10px">${d.parts.length} قطعه · ${d.sections.length} بخش · ${d.connections.length} اتصال · ${S.b.dims.length} اندازهٔ رسم‌شده</p>
    <h4 style="color:var(--accent);margin:10px 0 0">منابع</h4>
    <ul class="src-list">${(d.sourceList || []).map((s) => `<li id="src-${s.id}"><b>[${s.id}]</b> <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><span class="note">${esc(s.note)}</span></li>`).join('')}</ul>
    <p class="hint">نکته: مقادیر «طراحی مرجع» (بنفش) مقدار مهندسی این مدل هستند، چون سازندگان نقشهٔ داخلی منتشر نکرده‌اند. مقادیر رسمی و جامعه با شمارهٔ منبع مشخص شده‌اند.</p>`
}
function showTab (name) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name))
  $$('.tab-body').forEach((b) => b.classList.toggle('hidden', b.id !== 'tab-' + name))
  if (window.innerWidth <= 820) document.body.classList.remove('hide-right')
}

// ================================================================ actions
function activateConn (id) {
  if (S.activeConn === id) { clearSelection(); return }
  const c = S.data.connections.find((x) => x.id === id); if (!c) return
  S.activeConn = id; S.selPart = null; S.iso = null
  S.hlParts = new Set(c.parts)
  for (const s of S.b.sections.values()) if (!s.visible) S.b.setSectionVisible(s.def.id, true)
  openOnly(c.open)
  S.dimMode = 'conn'; S.dimsOn = true
  updateMeshVisibility(); applyMaterials(); refreshDims(); refreshLabels(); renderConnTab(); renderPartTab()
  setTimeout(() => {
    const box = new THREE.Box3()
    for (const pid of c.parts) for (const m of S.b.parts.get(pid) || []) box.expandByObject(m)
    for (const did of c.dims) { const bb = dims.boxOf(did); if (bb) box.union(bb) }
    if (!box.isEmpty()) focusBox(box, 1.15)
  }, 650)
}
function selectPart (pid, { focus = false, tab = true } = {}) {
  S.selPart = pid
  if (pid && S.iso?.type === 'part' && S.iso.id !== pid) { S.iso = null; updateMeshVisibility() }
  applyMaterials(); refreshLabels(); renderPartTab()
  if (pid && tab) showTab('part')
  if (pid && focus) focusMeshes(S.b.parts.get(pid))
}
function selectDim (id, fromLabel = false) {
  const conn = S.data.connections.find((c) => c.dims.includes(id))
  if (conn && !fromLabel) openOnly(conn.open)
  S.dimMode = 'single'; S.dimSingle = id; S.dimsOn = true
  refreshDims()
  if (!fromLabel) setTimeout(() => { const bb = dims.boxOf(id); if (bb) focusBox(bb, 1.8) }, conn ? 650 : 0)
  else showTab('dims')
}
function clearSelection () {
  S.activeConn = null; S.selPart = null; S.hlParts = new Set(); S.iso = null
  if (S.dimMode === 'conn' || S.dimMode === 'single') S.dimMode = 'overview'
  setExplodeAll(S.explode)
  updateMeshVisibility(); applyMaterials(); refreshDims(); refreshLabels(); renderConnTab(); renderPartTab()
}
function resetAll () {
  S.xray = false; S.colors = false; S.clip = false; S.labelsOn = false; S.dimsOn = true; S.autoRotate = false
  S.measure = false; S.measureA = null; measureMarker.visible = false; dims.clearMeasures()
  for (const s of S.b.sections.values()) S.b.setSectionVisible(s.def.id, true)
  setExplodeAll(0)
  setAxes({ pitch: 0, roll: 0, twist: 0, throttle: 0 })
  S.animate = false; $('#btn-animate').innerHTML = '<i class="fa-solid fa-play"></i> پخش حرکت'
  clearSelection(); updateClip(); syncToolbar(); setView('iso')
}

// ================================================================ camera
function focusBox (box, pad = 1.25) {
  const c = box.getCenter(new THREE.Vector3())
  const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 12)
  const dist = (r * pad) / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.aspect < 1 ? 1 / camera.aspect : 1)
  const dir = camera.position.clone().sub(controls.target).normalize()
  flyTo(c, c.clone().addScaledVector(dir, Math.max(dist, 60)))
}
function focusMeshes (list) {
  if (!list || !list.length) return
  const box = new THREE.Box3()
  for (const m of list) box.expandByObject(m)
  focusBox(box)
}
function flyTo (target, pos, dur = 0.7) {
  S.tween = { t: 0, dur, t0: controls.target.clone(), t1: target.clone(), p0: camera.position.clone(), p1: pos.clone() }
}
const VIEWS = { iso: [0.85, 0.62, 1.0], front: [0, 0.08, 1], back: [0, 0.08, -1], right: [1, 0.08, 0], left: [-1, 0.08, 0], top: [0, 1, 0.002], bottom: [0, -1, 0.002] }
function setView (name, anim = true) {
  const f = S.b?.focus || { target: new THREE.Vector3(0, 120, 0), dist: 520 }
  const d = new THREE.Vector3(...VIEWS[name]).normalize()
  const k = camera.aspect < 1 ? 1 / camera.aspect : 1
  const pos = f.target.clone().addScaledVector(d, f.dist * Math.min(k, 1.9))
  if (anim) flyTo(f.target, pos); else { controls.target.copy(f.target); camera.position.copy(pos) }
  $$('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === name))
}

// ================================================================ clipping
const CLIP_RANGE = { x: [-150, 150], y: [-10, 320], z: [-150, 150] }
function updateClip () {
  const a = S.clipAxis
  const v = parseFloat($('#clip-range').value)
  const n = { x: [-1, 0, 0], y: [0, -1, 0], z: [0, 0, -1] }[a]
  clipPlane.normal.set(...n)
  clipPlane.constant = v
  if (S.clipFlip) clipPlane.negate()
  $('#clip-out').textContent = v.toFixed(1) + ' mm'
  $('#clip-panel').classList.toggle('hidden', !S.clip)
  applyMaterials()
}
function setClipAxis (a) {
  S.clipAxis = a
  const [mn, mx] = CLIP_RANGE[a]
  const r = $('#clip-range'); r.min = mn; r.max = mx
  r.value = a === 'y' ? (S.b?.pivot.y ?? 60) : 0
  $$('#clip-axis button').forEach((b) => b.classList.toggle('active', b.dataset.axis === a))
  updateClip()
}

// ================================================================ picking
function pick (ev) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(S.b ? S.b.meshes() : [], false)
  for (const h of hits) {
    if (!effVisible(h.object)) continue
    if (S.clip && clipPlane.distanceToPoint(h.point) < 0) continue
    if (S.xray && h.object.material.transparent) continue
    return h
  }
  if (S.xray) { // in x-ray allow picking ghosted parts too
    for (const h of hits) if (effVisible(h.object) && !(S.clip && clipPlane.distanceToPoint(h.point) < 0)) return h
  }
  return null
}

let downAt = null
let hoverPending = false, lastMove = null
function onPointerDown (e) { downAt = [e.clientX, e.clientY]; S.autoRotate = false; syncToolbar() }
function onPointerUp (e) {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) { downAt = null; return }
  downAt = null
  if (!S.b) return
  const h = pick(e)
  if (S.measure) {
    if (!h) return
    if (!S.measureA) { S.measureA = h.point.clone(); measureMarker.position.copy(h.point); measureMarker.visible = true; $('#measure-result').textContent = 'نقطهٔ دوم را انتخاب کنید…' } else {
      const r = dims.addMeasure(S.measureA, h.point, scene)
      $('#measure-result').textContent = r.dist.toFixed(2) + ' mm'
      S.measureA = null; measureMarker.visible = false
    }
    return
  }
  if (h) selectPart(h.object.userData.partId)
  else if (S.selPart) selectPart(null, { tab: false })
}
function onDblClick (e) {
  if (!S.b || S.measure) return
  const h = pick(e)
  if (h) selectPart(h.object.userData.partId, { focus: true })
}
function onPointerMove (e) {
  lastMove = e
  if (hoverPending) return
  hoverPending = true
  requestAnimationFrame(() => {
    hoverPending = false
    const tip = $('#hover-tip')
    if (!S.b || !lastMove || downAt || lastMove.pointerType === 'touch') { tip.classList.add('hidden'); return }
    const h = pick(lastMove)
    if (!h) { tip.classList.add('hidden'); renderer.domElement.style.cursor = S.measure ? 'crosshair' : ''; return }
    const p = partDef(h.object.userData.partId)
    const rect = host.getBoundingClientRect()
    tip.innerHTML = `${esc(p?.name)}<small dir="ltr">${esc(p?.en)}${S.measure ? ` · (${h.point.x.toFixed(1)}, ${h.point.y.toFixed(1)}, ${h.point.z.toFixed(1)})` : ''}</small>`
    tip.style.left = (lastMove.clientX - rect.left) + 'px'
    tip.style.top = (lastMove.clientY - rect.top) + 'px'
    tip.classList.remove('hidden')
    renderer.domElement.style.cursor = S.measure ? 'crosshair' : 'pointer'
  })
}

// ================================================================ toolbar / UI bindings
function syncToolbar () {
  $('#tb-xray').classList.toggle('active', S.xray)
  $('#tb-colors').classList.toggle('active', S.colors)
  $('#tb-clip').classList.toggle('active', S.clip)
  $('#tb-measure').classList.toggle('active', S.measure)
  $('#tb-grid').classList.toggle('active', grid.visible)
  $('#tb-rotate').classList.toggle('active', S.autoRotate)
  $('#measure-panel').classList.toggle('hidden', !S.measure)
}
const toggles = {
  dims: () => { S.dimsOn = !S.dimsOn; refreshDims() },
  alldims: () => { if (S.dimMode === 'all' && S.dimsOn) S.dimMode = S.activeConn ? 'conn' : 'overview'; else { S.dimMode = 'all'; S.dimsOn = true } refreshDims() },
  labels: () => { S.labelsOn = !S.labelsOn; refreshLabels() },
  xray: () => { S.xray = !S.xray; applyMaterials(); syncToolbar() },
  clip: () => { S.clip = !S.clip; updateClip(); syncToolbar() },
  measure: () => { S.measure = !S.measure; S.measureA = null; measureMarker.visible = false; $('#measure-result').textContent = '—'; syncToolbar() },
  colors: () => { S.colors = !S.colors; applyMaterials(); syncToolbar() },
  grid: () => { grid.visible = !grid.visible; syncToolbar() },
  rotate: () => { S.autoRotate = !S.autoRotate; syncToolbar() },
  explode: () => setExplodeAll(S.explode > 0.5 ? 0 : 1)
}
function screenshot () {
  renderer.render(scene, camera)
  const a = document.createElement('a')
  a.href = renderer.domElement.toDataURL('image/png')
  a.download = `flight-stick-${S.model}.png`
  a.click()
}

function bindUI () {
  $('#explode-range').addEventListener('input', (e) => setExplodeAll(e.target.value / 100))
  $('#btn-open-all').addEventListener('click', () => setExplodeAll(1))
  $('#btn-close-all').addEventListener('click', () => setExplodeAll(0))
  $('#section-tree').addEventListener('click', onTreeClick)
  $('#axis-controls').addEventListener('input', (e) => {
    const k = e.target.dataset.axis; if (!k) return
    S.animate = false; $('#btn-animate').innerHTML = '<i class="fa-solid fa-play"></i> پخش حرکت'
    setAxes({ [k]: parseFloat(e.target.value) }, true)
  })
  $('#btn-animate').addEventListener('click', () => {
    S.animate = !S.animate; S.animT = 0
    $('#btn-animate').innerHTML = S.animate ? '<i class="fa-solid fa-pause"></i> توقف' : '<i class="fa-solid fa-play"></i> پخش حرکت'
  })
  $('#btn-center').addEventListener('click', () => { S.animate = false; $('#btn-animate').innerHTML = '<i class="fa-solid fa-play"></i> پخش حرکت'; setAxes({ pitch: 0, roll: 0, twist: 0, throttle: 0 }) })

  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)))
  for (const k of Object.keys(toggles)) { const el = $('#tb-' + k); if (el) el.addEventListener('click', toggles[k]) }
  $('#tb-shot').addEventListener('click', screenshot)
  $('#tb-reset').addEventListener('click', resetAll)

  $('#clip-axis').addEventListener('click', (e) => { const b = e.target.closest('button[data-axis]'); if (b) setClipAxis(b.dataset.axis) })
  $('#clip-range').addEventListener('input', updateClip)
  $('#clip-flip').addEventListener('change', (e) => { S.clipFlip = e.target.checked; updateClip() })
  $('#btn-measure-clear').addEventListener('click', () => { dims.clearMeasures(); S.measureA = null; measureMarker.visible = false; $('#measure-result').textContent = '—' })

  $$('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)))
  $('#tab-conn').addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]')
    if (f) { S.connFilter = f.dataset.filter; renderConnTab(); return }
    const chip = e.target.closest('[data-part]')
    if (chip) { e.stopPropagation(); selectPart(chip.dataset.part, { focus: true }); return }
    if (e.target.closest('a')) return
    const card = e.target.closest('[data-conn]')
    if (card) activateConn(card.dataset.conn)
  })
  $('#tab-part').addEventListener('click', (e) => {
    const a = e.target.closest('[data-pact]')
    if (a && S.selPart) {
      if (a.dataset.pact === 'focus') focusMeshes(S.b.parts.get(S.selPart))
      if (a.dataset.pact === 'iso') { S.iso = S.iso?.type === 'part' ? null : { type: 'part', id: S.selPart }; updateMeshVisibility(); renderPartTab(); if (S.iso) focusMeshes(S.b.parts.get(S.selPart)) }
      if (a.dataset.pact === 'hide') { S.b.setSectionVisible(partDef(S.selPart).section, false); selectPart(null, { tab: false }); syncTreeButtons() }
    }
    const g = e.target.closest('[data-goconn]')
    if (g) { showTab('conn'); activateConn(g.dataset.goconn) }
  })
  $('#tab-dims').addEventListener('click', (e) => {
    const m = e.target.closest('[data-dmode]')
    if (m) { S.dimMode = m.dataset.dmode; S.dimsOn = true; refreshDims(); return }
    const d = e.target.closest('[data-dim]')
    if (d) selectDim(d.dataset.dim)
  })

  $('#btn-left-panel').addEventListener('click', () => { document.body.classList.toggle('hide-left'); setTimeout(onResize, 20) })
  $('#btn-right-panel').addEventListener('click', () => { document.body.classList.toggle('hide-right'); setTimeout(onResize, 20) })
  $('#btn-help').addEventListener('click', () => $('#help-dialog').showModal())

  const cv = renderer.domElement
  cv.addEventListener('pointerdown', onPointerDown)
  cv.addEventListener('pointerup', onPointerUp)
  cv.addEventListener('pointermove', onPointerMove)
  cv.addEventListener('pointerleave', () => $('#hover-tip').classList.add('hidden'))
  cv.addEventListener('dblclick', onDblClick)
  controls.addEventListener('start', () => { S.tween = null })

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') && e.target.type !== 'range') return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const k = e.key.toLowerCase()
    const map = { e: 'explode', x: 'xray', c: 'clip', m: 'measure', d: 'dims', l: 'labels', r: 'rotate', g: 'grid' }
    if (map[k]) { toggles[map[k]](); e.preventDefault() } else if (k === 'escape') {
      if (S.measure) toggles.measure(); else clearSelection()
    } else if ('1234567'.includes(k) && k.length === 1) setView(Object.keys(VIEWS)[+k - 1])
  })
  new ResizeObserver(onResize).observe(host)
  window.addEventListener('resize', onResize)
}

function onResize () {
  const w = host.clientWidth || 1, h = host.clientHeight || 1
  renderer.setSize(w, h, false)
  labelRenderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  dims.setResolution(w, h)
}

// ================================================================ loop
const clock = new THREE.Clock()
function loop () {
  requestAnimationFrame(loop)
  const dt = Math.min(clock.getDelta(), 0.05)
  if (S.b) {
    S.b.tick(dt)
    if (S.animate) {
      S.animT += dt
      const ax = S.data.axes, t = S.animT
      const patch = { roll: ax.roll * Math.sin(t * 1.3), pitch: ax.pitch * Math.sin(t * 0.9 + 0.6) }
      if (ax.twist) patch.twist = ax.twist * Math.sin(t * 0.7 + 1.1)
      if (S.b.rot.thr) patch.throttle = Math.sin(t * 0.5)
      setAxes(patch)
    }
  }
  if (S.tween) {
    const tw = S.tween
    tw.t += dt
    const u = Math.min(tw.t / tw.dur, 1), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
    controls.target.lerpVectors(tw.t0, tw.t1, e)
    camera.position.lerpVectors(tw.p0, tw.p1, e)
    if (u >= 1) S.tween = null
  }
  controls.autoRotate = S.autoRotate
  controls.update()
  // CSS2D labels: respect visibility of ancestors (section hidden / dim hidden)
  for (const it of dims.items.values()) it.label.element.style.visibility = effVisible(it.grp) ? '' : 'hidden'
  for (const o of S.partLabels.values()) o.element.style.visibility = effVisible(o) && effVisible(o.parent) ? '' : 'hidden'
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

init()
