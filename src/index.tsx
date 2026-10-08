import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { MODELS, SOURCES } from './data/models'

const app = new Hono()

app.use('/api/*', cors())

// ---------------------------------------------------------------- API
app.get('/api/health', (c) => c.json({ ok: true, models: MODELS.length }))

app.get('/api/models', (c) =>
  c.json(
    MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      en: m.en,
      refClass: m.refClass,
      parts: m.parts.length,
      connections: m.connections.length
    }))
  )
)

app.get('/api/models/:id', (c) => {
  const m = MODELS.find((x) => x.id === c.req.param('id'))
  if (!m) return c.json({ error: 'model not found' }, 404)
  const sources = SOURCES.filter((s) => m.sources.includes(s.id))
  return c.json({ ...m, sourceList: sources })
})

app.get('/api/sources', (c) => c.json(SOURCES))

// ---------------------------------------------------------------- Page
const PAGE = /* html */ `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>استیک پروازی سه‌بعدی — اتصالات و ابعاد دقیق | Flight Stick 3D Explorer</title>
  <meta name="description" content="نمایش سه‌بعدی تعاملی دستهٔ استیک پروازی شبیه‌ساز با تمام اتصالات، ابعاد، نمای انفجاری، برش مقطع و ابزار اندازه‌گیری" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%230b1220'/><path d='M28 10h8l2 30h-12z' fill='%23f59e0b'/><rect x='14' y='44' width='36' height='10' rx='4' fill='%2338bdf8'/></svg>" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/css/app.css" rel="stylesheet" />
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <header id="top-bar">
    <div class="brand">
      <i class="fa-solid fa-plane-up"></i>
      <div>
        <h1>استیک پروازی سه‌بعدی</h1>
        <small dir="ltr">Flight-Stick 3D Explorer · connections &amp; exact dimensions</small>
      </div>
    </div>
    <nav id="model-tabs" aria-label="انتخاب مدل"></nav>
    <div class="top-actions">
      <button id="btn-left-panel" class="icon-btn" title="پنل بخش‌ها"><i class="fa-solid fa-layer-group"></i></button>
      <button id="btn-right-panel" class="icon-btn" title="پنل اطلاعات"><i class="fa-solid fa-circle-info"></i></button>
      <button id="btn-help" class="icon-btn" title="راهنما"><i class="fa-solid fa-question"></i></button>
    </div>
  </header>

  <main id="layout">
    <aside id="left-panel" class="panel">
      <section class="panel-block">
        <h2><i class="fa-solid fa-up-right-and-down-left-from-center"></i> نمای انفجاری (باز و بسته کردن)</h2>
        <div class="row">
          <input type="range" id="explode-range" min="0" max="100" value="0" />
          <output id="explode-out" dir="ltr">0%</output>
        </div>
        <div class="btn-row">
          <button id="btn-open-all" class="btn"><i class="fa-solid fa-box-open"></i> باز کردن همه</button>
          <button id="btn-close-all" class="btn"><i class="fa-solid fa-box"></i> بستن همه</button>
        </div>
      </section>
      <section class="panel-block grow">
        <h2><i class="fa-solid fa-sitemap"></i> بخش‌ها</h2>
        <p class="hint">چشم = نمایش/پنهان · <i class="fa-solid fa-arrows-left-right-to-line"></i> = باز/بسته کردن همان بخش</p>
        <ul id="section-tree"></ul>
      </section>
      <section class="panel-block">
        <h2><i class="fa-solid fa-gamepad"></i> شبیه‌سازی حرکت محورها</h2>
        <div id="axis-controls"></div>
        <div class="btn-row">
          <button id="btn-animate" class="btn"><i class="fa-solid fa-play"></i> پخش حرکت</button>
          <button id="btn-center" class="btn"><i class="fa-solid fa-crosshairs"></i> مرکز</button>
        </div>
        <div id="axis-output" dir="ltr"></div>
      </section>
    </aside>

    <section id="viewport" aria-label="نمای سه‌بعدی">
      <div id="canvas-host"></div>
      <div id="loading"><div class="spinner"></div><span>در حال ساخت مدل سه‌بعدی…</span></div>

      <div id="toolbar" class="floating">
        <div class="tb-group" title="نماهای استاندارد">
          <button data-view="iso" class="tb-btn active" title="ایزومتریک"><i class="fa-solid fa-cube"></i></button>
          <button data-view="front" class="tb-btn" title="جلو">جلو</button>
          <button data-view="back" class="tb-btn" title="پشت">پشت</button>
          <button data-view="right" class="tb-btn" title="راست">راست</button>
          <button data-view="left" class="tb-btn" title="چپ">چپ</button>
          <button data-view="top" class="tb-btn" title="بالا">بالا</button>
          <button data-view="bottom" class="tb-btn" title="زیر">زیر</button>
        </div>
        <div class="tb-group">
          <button id="tb-dims" class="tb-btn active" title="نمایش ابعاد"><i class="fa-solid fa-ruler-combined"></i></button>
          <button id="tb-alldims" class="tb-btn" title="همهٔ ابعاد هم‌زمان"><i class="fa-solid fa-ruler"></i><sup>+</sup></button>
          <button id="tb-labels" class="tb-btn" title="برچسب قطعات"><i class="fa-solid fa-tags"></i></button>
          <button id="tb-xray" class="tb-btn" title="حالت شفاف (X-Ray)"><i class="fa-solid fa-x-ray"></i></button>
          <button id="tb-clip" class="tb-btn" title="برش مقطع"><i class="fa-solid fa-scissors"></i></button>
          <button id="tb-measure" class="tb-btn" title="اندازه‌گیری دو نقطه"><i class="fa-solid fa-ruler-horizontal"></i></button>
          <button id="tb-colors" class="tb-btn" title="رنگ‌بندی بر اساس بخش"><i class="fa-solid fa-palette"></i></button>
          <button id="tb-grid" class="tb-btn active" title="شبکهٔ میلی‌متری"><i class="fa-solid fa-border-all"></i></button>
          <button id="tb-rotate" class="tb-btn" title="چرخش خودکار"><i class="fa-solid fa-rotate"></i></button>
          <button id="tb-shot" class="tb-btn" title="ذخیرهٔ تصویر"><i class="fa-solid fa-camera"></i></button>
          <button id="tb-reset" class="tb-btn" title="بازنشانی همه"><i class="fa-solid fa-arrow-rotate-left"></i></button>
        </div>
      </div>

      <div id="clip-panel" class="floating hidden">
        <strong><i class="fa-solid fa-scissors"></i> صفحهٔ برش</strong>
        <div class="seg" id="clip-axis">
          <button data-axis="x" class="active">X (چپ/راست)</button>
          <button data-axis="z">Z (جلو/عقب)</button>
          <button data-axis="y">Y (بالا/پایین)</button>
        </div>
        <div class="row">
          <input type="range" id="clip-range" min="-150" max="150" value="0" step="0.5" />
          <output id="clip-out" dir="ltr">0 mm</output>
        </div>
        <label class="chk"><input type="checkbox" id="clip-flip" /> وارونه کردن سمت برش</label>
        <p class="hint">سطح بریده‌شده با رنگ هاشور قرمز نمایش داده می‌شود.</p>
      </div>

      <div id="measure-panel" class="floating hidden">
        <strong><i class="fa-solid fa-ruler-horizontal"></i> ابزار اندازه‌گیری</strong>
        <p class="hint">روی دو نقطه از سطح مدل کلیک کنید. فاصله به میلی‌متر نمایش داده می‌شود.</p>
        <div id="measure-result" dir="ltr">—</div>
        <button id="btn-measure-clear" class="btn small"><i class="fa-solid fa-trash"></i> پاک کردن اندازه‌ها</button>
      </div>

      <div id="legend" class="floating">
        <span><i class="dot official"></i>رسمی</span>
        <span><i class="dot community"></i>جامعه</span>
        <span><i class="dot standard"></i>استاندارد</span>
        <span><i class="dot design"></i>طراحی مرجع</span>
        <span class="sep">|</span>
        <span>شبکه: <b dir="ltr">10 mm</b></span>
      </div>

      <div id="hover-tip" class="hidden"></div>
    </section>

    <aside id="right-panel" class="panel">
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="conn"><i class="fa-solid fa-link"></i> اتصالات</button>
        <button class="tab" data-tab="part"><i class="fa-solid fa-gear"></i> قطعه</button>
        <button class="tab" data-tab="dims"><i class="fa-solid fa-ruler-combined"></i> ابعاد</button>
        <button class="tab" data-tab="info"><i class="fa-solid fa-book"></i> مشخصات</button>
      </div>
      <div class="tab-body" id="tab-conn"></div>
      <div class="tab-body hidden" id="tab-part"><p class="empty">روی یک قطعه در مدل کلیک کنید.</p></div>
      <div class="tab-body hidden" id="tab-dims"></div>
      <div class="tab-body hidden" id="tab-info"></div>
    </aside>
  </main>

  <dialog id="help-dialog">
    <h3><i class="fa-solid fa-circle-question"></i> راهنمای استفاده</h3>
    <ul>
      <li><b>چرخش:</b> کلیک چپ + کشیدن · <b>جابه‌جایی:</b> کلیک راست + کشیدن · <b>زوم:</b> اسکرول (در موبایل: دو انگشت)</li>
      <li><b>انتخاب قطعه:</b> کلیک روی قطعه ← مشخصات در تب «قطعه» · دوبار کلیک = تمرکز دوربین</li>
      <li><b>اتصالات:</b> در تب «اتصالات» روی هر اتصال بزنید تا بخش‌های لازم باز شود، قطعات هایلایت و ابعاد آن رسم شود.</li>
      <li><b>باز و بسته کردن:</b> اسلایدر انفجاری برای کل مدل یا دکمهٔ <i class="fa-solid fa-arrows-left-right-to-line"></i> هر بخش.</li>
      <li><b>برش مقطع:</b> با ابزار قیچی، مدل را در محور X/Y/Z برش بزنید تا داخل قطعات دیده شود.</li>
      <li><b>اندازه‌گیری:</b> با ابزار خط‌کش، فاصلهٔ هر دو نقطه را بسنجید.</li>
      <li><b>رنگ ابعاد:</b> سبز = رسمی سازنده · زرد = اندازه‌گیری جامعه · آبی = استاندارد صنعتی · بنفش = مقدار طراحی مدل مرجع</li>
      <li>کلیدهای میان‌بر: <kbd>E</kbd> انفجاری · <kbd>X</kbd> شفاف · <kbd>C</kbd> برش · <kbd>M</kbd> اندازه‌گیری · <kbd>D</kbd> ابعاد · <kbd>Esc</kbd> لغو انتخاب</li>
    </ul>
    <p class="hint">همهٔ واحدها میلی‌متر است. مدل‌ها «مرجع مهندسی» از کلاس محصولات واقعی هستند؛ مقادیری که سازنده منتشر کرده با منبع مشخص شده‌اند.</p>
    <form method="dialog"><button class="btn">متوجه شدم</button></form>
  </dialog>

  <script type="module" src="/static/js/app.js"></script>
</body>
</html>`

app.get('/', (c) => c.html(PAGE))

export default app
