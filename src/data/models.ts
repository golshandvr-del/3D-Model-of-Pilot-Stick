// ---------------------------------------------------------------------------
//  Flight-stick 3D explorer — single source of truth for model metadata
//  All lengths in millimetres (mm), angles in degrees.
//  Confidence levels:
//    official  = published by manufacturer / official reseller
//    community = measured & reported by the sim-pit community (forums)
//    design    = engineering value of this reference model (not published)
// ---------------------------------------------------------------------------

export type Confidence = 'official' | 'community' | 'design' | 'standard'

export interface Spec {
  k: string // label
  v: string // value
  c?: Confidence
  src?: string // source id
}

export interface Section {
  id: string
  name: string
  en: string
  parent?: string
}

export interface Part {
  id: string
  name: string
  en: string
  section: string
  material: string
  desc: string
  specs: Spec[]
}

export type ConnType = 'mechanical' | 'electrical' | 'fastener' | 'kinematic' | 'sensor'

export interface Connection {
  id: string
  name: string
  en: string
  type: ConnType
  parts: string[] // highlighted parts
  dims: string[] // dimension ids drawn by builder.js
  open: string[] // sections to explode to reveal the joint
  desc: string
  specs: Spec[]
}

export interface StickModel {
  id: string
  name: string
  en: string
  refClass: string
  summary: string
  overall: Spec[]
  axes: { pitch: number; roll: number; twist: number }
  sections: Section[]
  parts: Part[]
  connections: Connection[]
  sources: string[]
}

export interface Source {
  id: string
  title: string
  url: string
  note: string
}

// ---------------------------------------------------------------------------
//  Sources
// ---------------------------------------------------------------------------
export const SOURCES: Source[] = [
  { id: 'S1', title: 'Thrustmaster — HOTAS Magnetic Base (product page)', url: 'https://www.thrustmaster.com/products/hotas-magnetic-base/', note: 'Width 232 mm, Depth 270 mm, Height 100 mm, > 2 kg, detachable metal plate' },
  { id: 'S2', title: 'Thrustmaster — HOTAS Warthog Flight Stick (product page)', url: 'https://www.thrustmaster.com/products/hotas-warthog-flight-stick/', note: 'All-metal detachable handle, H.E.A.R.T 16-bit, no gimbal, 19 buttons + POV, > 3 kg, USB' },
  { id: 'S3', title: 'SimHQ — Warthog connector thread', url: 'https://simhq.net/forum/ubbthreads.php/topics/4351252/re-warthog-connector-thread', note: 'Grip collar thread M36×2 (tested), connector 5-pin mini-DIN male on grip, serial shift-register protocol' },
  { id: 'S4', title: 'Reddit r/hotas — Thrustmaster HOTAS mounting', url: 'https://www.reddit.com/r/hotas/comments/bqyw79/thrustmaster_hotas_mounting/', note: 'Warthog hole pattern 60.1 × 60.1 mm, M4 × 0.7 threaded ≈ 8 mm deep' },
  { id: 'S5', title: 'Sublight Dynamics — Joystick base mounting hole patterns (PDF)', url: 'https://sublightdynamics.com/PDFs/Sublight%20Early%20Access%20Base%20Mounting%20Hole%20Patterns.pdf', note: 'M4 threaded 60.1 × 60.1 mm pattern compatible with Warthog mounts' },
  { id: 'S6', title: 'ED Forums — Thrustmaster Warthog screw measurements', url: 'https://forum.dcs.world/topic/83046-thrustmaster-warthog-screw-measurements/', note: 'Base-plate holes ≈ 4.5 mm diameter' },
  { id: 'S7', title: 'Wikipedia — Mini-DIN connector', url: 'https://en.wikipedia.org/wiki/Mini-DIN_connector', note: 'Mini-DIN connectors are 9.5 mm in diameter, 3…9 pins' },
  { id: 'S8', title: 'VKB-Sim Australia — Gladiator EVO Space Combat Edition', url: 'https://vkb-sim.com.au/products/gladiator-evo-space-combat-edition-standard', note: 'Table-top to top of grip ≈ 235 mm, base plate 185 mm deep × 145 mm wide' },
  { id: 'S9', title: 'Reddit r/hotas — VKB NXT Gladiator EVO mount dimensions', url: 'https://www.reddit.com/r/hotas/comments/15e4xia/vkb_nxt_gladiator_evo_mount_dimensions_pdf/', note: 'Mounting holes 6 mm (NXT plate), 7 mm (base plate), 9 mm (extruded holes)' },
  { id: 'S10', title: 'FlightSimControls — Gladiator NXT EVO Space Combat Edition', url: 'https://flightsimcontrols.com/product/gladiator-evo-space-combat-edition/', note: 'ABS base & grip, glass-fibre reinforced PA gimbal, steel table-top plate, 32-bit ARM, USB cable 180 cm, lockable twist' },
  { id: 'S11', title: 'Stormbirds — Full review of the VKB Gladiator NXT', url: 'https://stormbirds.blog/2022/03/31/full-review-of-the-vkb-gladiator-nxt/', note: '2 contactless MaRS sensors on X/Y, 2 rotary encoders, 1 throttle wheel, screws + screwdriver to fix grip' },
  { id: 'S12', title: 'IL-2 forum — Actual size of the VKB NXT EVO', url: 'https://forum.il2sturmovik.com/topic/81881-does-anyone-know-the-actual-size-of-the-vkb-nxt-evo/', note: 'Interchangeable springs (10/20/30), adjustable clutches (dampers), same hole pattern as NXT' },
  { id: 'S13', title: 'Subliminal — VKB Gladiator NXT EVO review', url: 'https://subliminal.gg/blog/vkb-gladiator-nxt-evo-review', note: 'Twist (Z) lockable with an included screw at the base of the stick' },
  { id: 'S14', title: 'Thrustmaster — T.16000M FCS (product page)', url: 'https://www.thrustmaster.com/en-us/products/t-16000m-fcs/', note: 'L/W/H 21.4 × 22.0 × 24.2 cm, 1320 g, H.E.A.R.T Hall-effect 16-bit' },
  { id: 'S15', title: 'Thrustmaster eShop — T.16000M FCS', url: 'https://eshop.thrustmaster.com/en_us/products-joysticks/t-16000m-fcs.html', note: 'Helical spring (2.8 mm in diameter) for firm, linear tension' },
  { id: 'S16', title: 'FFBeast docs — wiring Thrustmaster grips', url: 'https://ffbeast.github.io/docs/en/connection_odrive.html', note: 'TM grips work from 3.3 V and 5 V, read over SPI extension (shift registers)' },
  { id: 'S17', title: 'Thrustmaster — HOTAS Warthog user manual (PDF)', url: 'https://ts.thrustmaster.com/download/accessories/pc/hotas/manual/HOTAS_Warthog/HOTAS_Warthog_Manual.pdf', note: '4 screws under the metal base plate; 4 corner holes in the plate for cockpit mounting' }
]

// ---------------------------------------------------------------------------
//  MODEL A — heavy metal HOTAS stick, Warthog-standard interface
// ---------------------------------------------------------------------------
const heavy: StickModel = {
  id: 'heavy',
  name: 'مدل A — استیک فلزی سنگین (استاندارد Warthog)',
  en: 'Model A — Heavy metal HOTAS stick (Warthog-standard)',
  refClass: 'Thrustmaster HOTAS Warthog / HOTAS Magnetic Base',
  summary:
    'استیک رومیزی فلزی با پایهٔ مغناطیسی بدون گیمبال (سنسور Hall سه‌بعدی) و دستهٔ جداشونده که با مهرهٔ رزوه‌دار M36×2 و کانکتور Mini-DIN پنج‌پین روی پایه بسته می‌شود. این رابط، استاندارد عملی بازار است و دسته‌های Virpil و VKB هم با آداپتور روی آن سوار می‌شوند.',
  overall: [
    { k: 'عرض پایه (W)', v: '232 mm', c: 'official', src: 'S1' },
    { k: 'عمق پایه (D)', v: '270 mm', c: 'official', src: 'S1' },
    { k: 'ارتفاع پایه', v: '100 mm', c: 'official', src: 'S1' },
    { k: 'ارتفاع کل تا بالای دسته', v: '≈ 290 mm', c: 'community', src: 'S2' },
    { k: 'وزن کل', v: '> 3 kg', c: 'official', src: 'S2' },
    { k: 'وزن پایه', v: '> 2 kg', c: 'official', src: 'S1' },
    { k: 'سنسور', v: 'H.E.A.R.T — Hall 3D، 16-bit (65536×65536)', c: 'official', src: 'S2' },
    { k: 'دکمه‌ها', v: '19 دکمه + 1 کلاه POV هشت‌جهته', c: 'official', src: 'S2' }
  ],
  axes: { pitch: 20, roll: 20, twist: 0 },
  sections: [
    { id: 'base', name: 'صفحهٔ پایه و پایه‌ها', en: 'Base plate & feet' },
    { id: 'housing', name: 'پوستهٔ بدنهٔ پایه', en: 'Base housing' },
    { id: 'housing_l', name: 'نیمهٔ چپ پوسته', en: 'Housing — left shell', parent: 'housing' },
    { id: 'housing_r', name: 'نیمهٔ راست پوسته', en: 'Housing — right shell', parent: 'housing' },
    { id: 'housing_top', name: 'درپوش بالایی', en: 'Top cover', parent: 'housing' },
    { id: 'boot', name: 'گردگیر لاستیکی', en: 'Rubber boot' },
    { id: 'mech', name: 'مکانیزم مرکزگرا', en: 'Centering mechanism' },
    { id: 'electronics', name: 'الکترونیک پایه', en: 'Base electronics' },
    { id: 'shaft', name: 'محور و مفصل کروی', en: 'Shaft & ball pivot' },
    { id: 'interface', name: 'رابط اتصال (سمت پایه)', en: 'Grip interface (base side)' },
    { id: 'grip', name: 'دستهٔ کامل', en: 'Grip assembly' },
    { id: 'grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip — left shell', parent: 'grip' },
    { id: 'grip_r', name: 'پوستهٔ راست دسته', en: 'Grip — right shell', parent: 'grip' },
    { id: 'grip_ctrl', name: 'کلیدها و ماشه‌ها', en: 'Grip controls', parent: 'grip' },
    { id: 'grip_int', name: 'الکترونیک داخل دسته', en: 'Grip internals', parent: 'grip' },
    { id: 'nut', name: 'مهرهٔ قفلی و کانکتور نری', en: 'Collar nut & male connector', parent: 'grip' }
  ],
  parts: [
    { id: 'h_baseplate', name: 'صفحهٔ فلزی پایه', en: 'Steel base plate', section: 'base', material: 'فولاد، رنگ پودری مشکی', desc: 'صفحهٔ وزن‌دار قابل جداشدن؛ برای نصب در کابین جدا شده و بدنه مستقیماً با الگوی 60.1×60.1 پیچ می‌شود.', specs: [ { k: 'ابعاد', v: '232 × 270 mm', c: 'official', src: 'S1' }, { k: 'ضخامت', v: '5 mm', c: 'design' }, { k: 'سوراخ گوشه‌ها', v: '4 × Ø4.5 mm', c: 'community', src: 'S6' }, { k: 'شعاع گوشه', v: 'R14 mm', c: 'design' } ] },
    { id: 'h_feet', name: 'پایه‌های لاستیکی', en: 'Rubber feet', section: 'base', material: 'لاستیک EPDM', desc: 'چهار پایهٔ ضدلغزش زیر صفحه.', specs: [ { k: 'قطر × ارتفاع', v: 'Ø20 × 3 mm', c: 'design' } ] },
    { id: 'h_screws_m4', name: 'پیچ‌های اتصال بدنه به صفحه', en: 'M4 housing screws', section: 'base', material: 'فولاد گالوانیزه', desc: 'چهار پیچ زیر صفحه که بدنه را به صفحه می‌بندند (دفترچهٔ سازنده: 4 پیچ زیر صفحهٔ فلزی).', specs: [ { k: 'رزوه', v: 'M4 × 0.7', c: 'community', src: 'S4' }, { k: 'طول', v: '10 mm', c: 'design' }, { k: 'تعداد', v: '4', c: 'official', src: 'S17' } ] },
    { id: 'h_housing_l', name: 'پوستهٔ چپ بدنه', en: 'Housing left shell', section: 'housing_l', material: 'آلیاژ روی/آلومینیوم ریخته‌گری', desc: 'پوستهٔ هرمی ناقص با گوشه‌های گرد.', specs: [ { k: 'ابعاد پایین', v: '150 × 150 mm', c: 'design' }, { k: 'ابعاد بالا', v: '112 × 112 mm', c: 'design' }, { k: 'ضخامت دیواره', v: '3 mm', c: 'design' } ] },
    { id: 'h_housing_r', name: 'پوستهٔ راست بدنه', en: 'Housing right shell', section: 'housing_r', material: 'آلیاژ روی/آلومینیوم ریخته‌گری', desc: 'قرینهٔ پوستهٔ چپ؛ محل خروج کانکتور USB در پشت.', specs: [ { k: 'ارتفاع', v: '76 mm', c: 'design' } ] },
    { id: 'h_housing_top', name: 'درپوش بالایی', en: 'Top cover', section: 'housing_top', material: 'آلومینیوم', desc: 'درپوش تخت با دهانهٔ عبور محور و گردگیر.', specs: [ { k: 'قطر دهانه', v: 'Ø70 mm', c: 'design' }, { k: 'ضخامت', v: '4 mm', c: 'design' } ] },
    { id: 'h_inner_plate', name: 'صفحهٔ کف بدنه با مهره‌های M4', en: 'Housing floor with M4 inserts', section: 'housing', material: 'فولاد', desc: 'کف بدنه با چهار سوراخ رزوه‌دار M4 در الگوی مربعی 60.1 mm؛ همین الگو برای نصب روی پایه‌های میز/کابین استفاده می‌شود.', specs: [ { k: 'الگوی سوراخ', v: '60.1 × 60.1 mm', c: 'community', src: 'S4' }, { k: 'رزوه', v: '4 × M4×0.7، عمق ≈ 8 mm', c: 'community', src: 'S4' } ] },
    { id: 'h_boot', name: 'گردگیر آکاردئونی', en: 'Bellows boot', section: 'boot', material: 'لاستیک سیلیکونی', desc: 'جلوی ورود گردوغبار به مفصل را می‌گیرد و با حرکت محور تغییر شکل می‌دهد.', specs: [ { k: 'قطر پایین', v: 'Ø68 mm', c: 'design' }, { k: 'قطر بالا', v: 'Ø40 mm', c: 'design' }, { k: 'ارتفاع', v: '12 mm', c: 'design' } ] },
    { id: 'h_frame', name: 'شاسی داخلی', en: 'Inner chassis', section: 'mech', material: 'فولاد خم‌کاری‌شده', desc: 'نگهدارندهٔ کاسهٔ مفصل و نشیمنگاه فنر.', specs: [ { k: 'ابعاد', v: '96 × 96 × 70 mm', c: 'design' } ] },
    { id: 'h_socket', name: 'کاسهٔ مفصل کروی', en: 'Ball socket', section: 'mech', material: 'POM (دلرین) خودروان', desc: 'کاسهٔ نیم‌کره که گوی محور در آن می‌چرخد.', specs: [ { k: 'قطر داخلی', v: 'Ø40 mm', c: 'design' } ] },
    { id: 'h_plunger', name: 'پیستون مرکزگرا', en: 'Centering plunger', section: 'mech', material: 'POM', desc: 'زیر بادامک مخروطی قرار می‌گیرد و با فشار فنر، دسته را به مرکز برمی‌گرداند.', specs: [ { k: 'قطر', v: 'Ø38 mm', c: 'design' } ] },
    { id: 'h_spring', name: 'فنر فشاری اصلی', en: 'Main compression spring', section: 'mech', material: 'فولاد فنر', desc: 'نیروی مرکزگرا را از طریق پیستون به بادامک وارد می‌کند.', specs: [ { k: 'قطر خارجی', v: 'Ø34 mm', c: 'design' }, { k: 'قطر سیم', v: 'Ø2.5 mm', c: 'design' }, { k: 'طول نصب', v: '24 mm', c: 'design' }, { k: 'تعداد حلقه', v: '6', c: 'design' } ] },
    { id: 'h_spring_seat', name: 'نشیمنگاه فنر', en: 'Spring seat', section: 'mech', material: 'فولاد', desc: 'حلقهٔ تکیه‌گاه پایینی فنر با سوراخ عبور آهنربا.', specs: [ { k: 'قطر', v: 'Ø44 mm', c: 'design' } ] },
    { id: 'h_sensor_pcb', name: 'برد سنسور', en: 'Sensor PCB', section: 'electronics', material: 'FR-4', desc: 'برد سنسور Hall سه‌بعدی، دقیقاً زیر آهنربای انتهای محور.', specs: [ { k: 'ابعاد', v: '40 × 40 × 1.6 mm', c: 'design' } ] },
    { id: 'h_hall', name: 'سنسور Hall سه‌بعدی', en: '3D Hall sensor IC', section: 'electronics', material: 'آی‌سی SMD', desc: 'جهت میدان آهنربا را در سه محور اندازه می‌گیرد (H.E.A.R.T، 16-bit).', specs: [ { k: 'وضوح', v: '16-bit', c: 'official', src: 'S2' }, { k: 'فاصلهٔ هوایی تا آهنربا', v: '2.0 mm', c: 'design' } ] },
    { id: 'h_mainboard', name: 'برد کنترلر اصلی', en: 'Main controller board', section: 'electronics', material: 'FR-4', desc: 'میکروکنترلر USB با Firmware قابل‌به‌روزرسانی؛ دسته را از طریق Mini-DIN به‌صورت سریال می‌خواند.', specs: [ { k: 'ابعاد', v: '80 × 50 × 1.6 mm', c: 'design' } ] },
    { id: 'h_usb', name: 'کانکتور USB', en: 'USB Type-B receptacle', section: 'electronics', material: 'فلز/پلاستیک', desc: 'اتصال به رایانه.', specs: [ { k: 'نوع', v: 'USB Type-B', c: 'design' }, { k: 'دهانه', v: '12.0 × 10.9 mm', c: 'standard' } ] },
    { id: 'h_ball', name: 'گوی مفصل', en: 'Pivot ball', section: 'shaft', material: 'فولاد سخت‌کاری‌شده', desc: 'مرکز چرخش دوبعدی دسته؛ مرکز آن مبنای زاویهٔ انحراف است.', specs: [ { k: 'قطر', v: 'Ø40 mm', c: 'design' } ] },
    { id: 'h_shaft', name: 'محور اصلی', en: 'Main shaft', section: 'shaft', material: 'فولاد', desc: 'از گوی می‌گذرد؛ بالای آن رابط دسته و پایین آن آهنربا.', specs: [ { k: 'قطر', v: 'Ø16 mm', c: 'design' }, { k: 'طول', v: '76 mm', c: 'design' } ] },
    { id: 'h_cam', name: 'بادامک مخروطی', en: 'Cone cam', section: 'shaft', material: 'فولاد', desc: 'با انحراف دسته روی پیستون می‌لغزد و آن را پایین می‌دهد ← نیروی برگشت.', specs: [ { k: 'قطر', v: 'Ø36 mm', c: 'design' }, { k: 'زاویهٔ مخروط', v: '120°', c: 'design' } ] },
    { id: 'h_magnet', name: 'آهنربای نئودیمیوم', en: 'NdFeB magnet', section: 'shaft', material: 'NdFeB N42', desc: 'آهنربای دیسکی قطبیده‌شده در قطر، انتهای محور.', specs: [ { k: 'ابعاد', v: 'Ø10 × 4 mm', c: 'design' } ] },
    { id: 'h_flange', name: 'فلنج رابط', en: 'Interface flange', section: 'interface', material: 'آلومینیوم', desc: 'نشیمنگاه مهرهٔ قفلی دسته.', specs: [ { k: 'قطر', v: 'Ø44 mm', c: 'design' }, { k: 'ضخامت', v: '4 mm', c: 'design' } ] },
    { id: 'h_stub', name: 'گلویی رزوه‌دار (نری)', en: 'Threaded stub (male)', section: 'interface', material: 'آلومینیوم', desc: 'رزوهٔ بیرونی که مهرهٔ دسته روی آن بسته می‌شود.', specs: [ { k: 'رزوه', v: 'M36 × 2', c: 'community', src: 'S3' }, { k: 'طول رزوه', v: '12 mm', c: 'design' } ] },
    { id: 'h_din_f', name: 'کانکتور Mini-DIN مادگی', en: 'Mini-DIN 5 female (base)', section: 'interface', material: 'فلز/ترموپلاستیک', desc: 'کانکتور پنل‌نصب مادگی در مرکز گلویی.', specs: [ { k: 'قطر پوسته', v: 'Ø9.5 mm', c: 'standard', src: 'S7' }, { k: 'تعداد پین', v: '5', c: 'community', src: 'S3' } ] },
    { id: 'h_grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip left shell', section: 'grip_l', material: 'فلز ریخته‌گری (تمام فلزی)', desc: 'نیمهٔ چپ دستهٔ آناتومیک (کپی A-10C).', specs: [ { k: 'ارتفاع دسته', v: '≈ 178 mm', c: 'design' }, { k: 'ضخامت دیواره', v: '2.5 mm', c: 'design' } ] },
    { id: 'h_grip_r', name: 'پوستهٔ راست دسته', en: 'Grip right shell', section: 'grip_r', material: 'فلز ریخته‌گری', desc: 'نیمهٔ راست دسته.', specs: [ { k: 'بیشینهٔ عرض', v: '≈ 46 mm', c: 'design' } ] },
    { id: 'h_trigger', name: 'ماشهٔ دومرحله‌ای', en: 'Dual-stage trigger', section: 'grip_ctrl', material: 'فلز', desc: 'ماشهٔ فلزی دو مرحله‌ای (2 دکمه).', specs: [ { k: 'نوع', v: 'Dual-stage metal', c: 'official', src: 'S2' } ] },
    { id: 'h_pinkie', name: 'اهرم انگشت کوچک', en: 'Pinkie lever', section: 'grip_ctrl', material: 'فلز', desc: 'اهرم پایین جلوی دسته.', specs: [ { k: 'تعداد', v: '2 دکمهٔ pinkie', c: 'official', src: 'S2' } ] },
    { id: 'h_hat_tms', name: 'کلاه هشت‌جهته (TMS)', en: '8-way hat (TMS)', section: 'grip_ctrl', material: 'فلز/پلاستیک', desc: 'کلاه هشت‌جهته.', specs: [ { k: 'نوع', v: '8-way', c: 'official', src: 'S2' } ] },
    { id: 'h_hat_dms', name: 'کلاه هشت‌جهته (DMS)', en: '8-way hat (DMS)', section: 'grip_ctrl', material: 'فلز/پلاستیک', desc: 'کلاه هشت‌جهتهٔ دوم.', specs: [ { k: 'نوع', v: '8-way', c: 'official', src: 'S2' } ] },
    { id: 'h_hat_cms', name: 'کلاه چهارجهته + فشاری (CMS)', en: '4-way hat + push (CMS)', section: 'grip_ctrl', material: 'پلاستیک', desc: 'کلاه چهارجهته با دکمهٔ فشاری.', specs: [ { k: 'نوع', v: '4-way + push', c: 'official', src: 'S2' } ] },
    { id: 'h_hat_pov', name: 'کلاه دید (POV)', en: 'POV hat', section: 'grip_ctrl', material: 'فلز', desc: 'کلاه هشت‌جهتهٔ دید (Trim).', specs: [ { k: 'نوع', v: '8-way POV', c: 'official', src: 'S2' } ] },
    { id: 'h_btn_weapon', name: 'دکمهٔ رهاسازی سلاح', en: 'Weapon release button', section: 'grip_ctrl', material: 'پلاستیک', desc: 'دکمهٔ فشاری بالای دسته.', specs: [ { k: 'قطر', v: 'Ø10 mm', c: 'design' } ] },
    { id: 'h_btn_nws', name: 'دکمهٔ NWS', en: 'NWS / push button', section: 'grip_ctrl', material: 'پلاستیک', desc: 'دکمهٔ فشاری جلوی دسته.', specs: [ { k: 'قطر', v: 'Ø8 mm', c: 'design' } ] },
    { id: 'h_grip_pcb', name: 'برد شیفت‌رجیستر دسته', en: 'Grip shift-register PCB', section: 'grip_int', material: 'FR-4', desc: 'دکمه‌ها را به‌صورت موازی می‌خواند و از طریق 5 سیم (VCC، GND، CLK، DATA، LATCH) سریال می‌فرستد.', specs: [ { k: 'منطق', v: 'Shift-register / SPI', c: 'community', src: 'S3' }, { k: 'تغذیه', v: '3.3 V یا 5 V', c: 'community', src: 'S16' }, { k: 'ابعاد', v: '24 × 70 mm', c: 'design' } ] },
    { id: 'h_grip_wires', name: 'دستهٔ سیم داخلی', en: 'Internal wiring loom', section: 'grip_int', material: 'سیم مسی 28AWG', desc: 'اتصال برد دسته به کانکتور نری.', specs: [ { k: 'تعداد رشته', v: '5', c: 'community', src: 'S3' } ] },
    { id: 'h_nut', name: 'مهرهٔ قفلی آج‌دار', en: 'Knurled collar nut', section: 'nut', material: 'آلومینیوم آنودایز', desc: 'مهرهٔ اسیر روی لولهٔ دسته؛ با چرخاندن روی رزوهٔ M36×2 دسته را محکم می‌کند.', specs: [ { k: 'رزوهٔ داخلی', v: 'M36 × 2', c: 'community', src: 'S3' }, { k: 'قطر بیرونی', v: 'Ø44 mm', c: 'design' }, { k: 'ارتفاع', v: '16 mm', c: 'design' } ] },
    { id: 'h_din_m', name: 'کانکتور Mini-DIN نری', en: 'Mini-DIN 5 male (grip)', section: 'nut', material: 'فلز/ترموپلاستیک', desc: 'کانکتور پنل‌نصب نری در انتهای دسته.', specs: [ { k: 'قطر پوسته', v: 'Ø9.5 mm', c: 'standard', src: 'S7' }, { k: 'پین‌ها', v: '5 × Ø≈1.0 mm', c: 'design' } ] },
    { id: 'h_grip_tube', name: 'لولهٔ پایینی دسته', en: 'Grip lower tube', section: 'nut', material: 'آلومینیوم', desc: 'لوله‌ای که مهره روی آن اسیر است و کانکتور نری را در خود دارد.', specs: [ { k: 'قطر', v: 'Ø32 mm', c: 'design' } ] }
  ],
  connections: [
    { id: 'hc_thread', name: 'اتصال مکانیکی دسته به پایه (مهره و رزوه)', en: 'Grip ↔ base mechanical (collar nut)', type: 'mechanical', parts: ['h_nut', 'h_stub', 'h_flange', 'h_grip_tube'], dims: ['h_d_thread', 'h_d_nut', 'h_d_threadlen', 'h_d_flange'], open: ['grip', 'nut'], desc: 'دسته روی گلویی فرو می‌رود؛ یک خار/شیار جهت‌دهی موقعیت زاویه‌ای را ثابت می‌کند و مهرهٔ اسیر روی رزوهٔ بیرونی M36×2 بسته می‌شود. همین رابط در پایه‌های Virpil و دسته‌های سازگار با Warthog به کار می‌رود.', specs: [ { k: 'رزوه', v: 'M36 × 2 (متریک ریزدنده)', c: 'community', src: 'S3' }, { k: 'قطر اسمی', v: '36 mm', c: 'community', src: 'S3' }, { k: 'گام', v: '2 mm', c: 'community', src: 'S3' }, { k: 'طول درگیری', v: '≈ 12 mm (6 دور)', c: 'design' }, { k: 'قطر بیرونی مهره', v: 'Ø44 mm', c: 'design' } ] },
    { id: 'hc_din', name: 'اتصال الکتریکی دسته (Mini-DIN 5)', en: 'Grip ↔ base electrical (5-pin mini-DIN)', type: 'electrical', parts: ['h_din_m', 'h_din_f', 'h_grip_pcb', 'h_grip_wires'], dims: ['h_d_din', 'h_d_dinpins'], open: ['grip', 'nut', 'grip_l'], desc: 'نری روی دسته، مادگی روی پایه. دکمه‌ها با زنجیرهٔ شیفت‌رجیستر خوانده می‌شوند، بنابراین فقط 5 سیم لازم است.', specs: [ { k: 'نوع', v: 'Mini-DIN 5 پین، پنل‌نصب', c: 'community', src: 'S3' }, { k: 'قطر پوسته', v: 'Ø9.5 mm', c: 'standard', src: 'S7' }, { k: 'سیگنال‌ها', v: 'VCC · GND · CLK · DATA(MISO) · LATCH(CS)', c: 'community', src: 'S16' }, { k: 'سطح ولتاژ', v: '3.3 V / 5 V', c: 'community', src: 'S16' }, { k: 'پروتکل', v: 'سریال شیفت‌رجیستر (سازگار با SPI)', c: 'community', src: 'S3' } ] },
    { id: 'hc_mount', name: 'نصب بدنه روی صفحه / کابین (الگوی M4)', en: 'Housing mounting pattern (4×M4)', type: 'fastener', parts: ['h_inner_plate', 'h_screws_m4', 'h_baseplate'], dims: ['h_d_m4x', 'h_d_m4z', 'h_d_m4note'], open: ['base'], desc: 'کف بدنه چهار سوراخ رزوه‌دار M4 در مربع 60.1 mm دارد. با برداشتن صفحهٔ فلزی، بدنه را مستقیم روی پایهٔ میز یا کابین می‌بندند.', specs: [ { k: 'الگو', v: '60.1 × 60.1 mm (مربع)', c: 'community', src: 'S4' }, { k: 'رزوه', v: 'M4 × 0.7', c: 'community', src: 'S4' }, { k: 'عمق رزوه', v: '≈ 8 mm', c: 'community', src: 'S4' }, { k: 'تعداد پیچ', v: '4', c: 'official', src: 'S17' } ] },
    { id: 'hc_plate', name: 'سوراخ‌های گوشهٔ صفحه برای نصب', en: 'Base-plate corner holes', type: 'fastener', parts: ['h_baseplate'], dims: ['h_d_w', 'h_d_d', 'h_d_corner', 'h_d_holepx', 'h_d_holepz'], open: [], desc: 'صفحهٔ فلزی در چهار گوشه سوراخ دارد تا کل استیک (با صفحه) روی میز یا کابین پیچ شود.', specs: [ { k: 'قطر سوراخ', v: 'Ø4.5 mm', c: 'community', src: 'S6' }, { k: 'فاصلهٔ مراکز (X)', v: '204 mm', c: 'design' }, { k: 'فاصلهٔ مراکز (Z)', v: '242 mm', c: 'design' } ] },
    { id: 'hc_pivot', name: 'مفصل کروی و محدودهٔ حرکت', en: 'Ball pivot & throw', type: 'kinematic', parts: ['h_ball', 'h_socket', 'h_shaft'], dims: ['h_d_ball', 'h_d_shaft', 'h_d_throw', 'h_d_pivoth'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'به‌جای گیمبال کاردانی، محور با یک گوی در کاسه می‌چرخد (بدون گیمبال). مرکز گوی، مرکز دوران پیچ و رول است.', specs: [ { k: 'قطر گوی', v: 'Ø40 mm', c: 'design' }, { k: 'قطر محور', v: 'Ø16 mm', c: 'design' }, { k: 'انحراف بیشینه', v: '±20° (پیچ و رول)', c: 'design' }, { k: 'ارتفاع مرکز دوران از میز', v: '62 mm', c: 'design' } ] },
    { id: 'hc_spring', name: 'مرکزگرا: بادامک مخروطی + فنر', en: 'Centering: cone cam + spring', type: 'kinematic', parts: ['h_cam', 'h_plunger', 'h_spring', 'h_spring_seat'], dims: ['h_d_spring', 'h_d_springlen', 'h_d_cam'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'با انحراف دسته، لبهٔ بادامک مخروطی پیستون را پایین می‌راند و فنر فشرده می‌شود؛ نیروی برگشت در همهٔ جهات یکنواخت است.', specs: [ { k: 'قطر فنر', v: 'Ø34 mm، سیم Ø2.5', c: 'design' }, { k: 'زاویهٔ مخروط بادامک', v: '120°', c: 'design' } ] },
    { id: 'hc_sensor', name: 'آهنربا ↔ سنسور Hall', en: 'Magnet ↔ 3D Hall sensor', type: 'sensor', parts: ['h_magnet', 'h_hall', 'h_sensor_pcb'], dims: ['h_d_gap', 'h_d_magnet'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'آهنربای انتهای محور بالای سنسور Hall سه‌بعدی؛ زاویهٔ میدان = زاویهٔ دسته. هیچ تماس مکانیکی ← بدون فرسایش.', specs: [ { k: 'فاصلهٔ هوایی', v: '2.0 mm', c: 'design' }, { k: 'آهنربا', v: 'Ø10 × 4 mm NdFeB', c: 'design' }, { k: 'وضوح', v: '16-bit', c: 'official', src: 'S2' } ] },
    { id: 'hc_usb', name: 'اتصال USB به رایانه', en: 'USB to PC', type: 'electrical', parts: ['h_usb', 'h_mainboard'], dims: ['h_d_usb'], open: ['housing_r'], desc: 'کانکتور USB در پشت بدنه.', specs: [ { k: 'نوع', v: 'USB Type-B', c: 'design' }, { k: 'استاندارد', v: 'USB 2.0 Full-Speed HID', c: 'design' } ] }
  ],
  sources: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S16', 'S17']
}

// ---------------------------------------------------------------------------
//  MODEL B — 2-axis gimbal desktop stick (Gladiator NXT EVO class)
// ---------------------------------------------------------------------------
const gimbal: StickModel = {
  id: 'gimbal',
  name: 'مدل B — استیک گیمبال دومحوره (کلاس VKB Gladiator NXT EVO)',
  en: 'Model B — Dual-axis gimbal stick (Gladiator NXT EVO class)',
  refClass: 'VKB Gladiator NXT EVO',
  summary:
    'استیک رومیزی با گیمبال کاردانی از PA تقویت‌شده با الیاف شیشه، مکانیزم بادامک و فنر قابل تعویض در هر محور، کلاچ (دمپر) قابل تنظیم و سنسورهای مغناطیسی بدون تماس MaRS. دسته روی محور سوار و با پیچ محکم می‌شود.',
  overall: [
    { k: 'ارتفاع از میز تا بالای دسته', v: '≈ 235 mm', c: 'official', src: 'S8' },
    { k: 'عمق صفحهٔ پایه', v: '≈ 185 mm', c: 'official', src: 'S8' },
    { k: 'عرض صفحهٔ پایه', v: '≈ 145 mm', c: 'official', src: 'S8' },
    { k: 'جنس بدنه و دسته', v: 'ABS صنعتی', c: 'official', src: 'S10' },
    { k: 'جنس گیمبال', v: 'PA تقویت‌شده با الیاف شیشه', c: 'official', src: 'S10' },
    { k: 'سنسور', v: '2 × MaRS بدون تماس (X/Y)', c: 'official', src: 'S11' },
    { k: 'پردازنده', v: 'ARM 32-bit', c: 'official', src: 'S10' },
    { k: 'کابل USB', v: '180 cm', c: 'official', src: 'S10' }
  ],
  axes: { pitch: 15, roll: 15, twist: 15 },
  sections: [
    { id: 'base', name: 'صفحهٔ فولادی پایه', en: 'Steel base plate' },
    { id: 'housing', name: 'پوستهٔ پایه', en: 'Base housing' },
    { id: 'housing_l', name: 'نیمهٔ چپ پوسته', en: 'Housing — left', parent: 'housing' },
    { id: 'housing_r', name: 'نیمهٔ راست پوسته', en: 'Housing — right', parent: 'housing' },
    { id: 'housing_top', name: 'درپوش و کنترل‌های پایه', en: 'Top cover & base controls', parent: 'housing' },
    { id: 'boot', name: 'گردگیر', en: 'Dust boot' },
    { id: 'gimbal', name: 'گیمبال کاردانی', en: 'Cardan gimbal' },
    { id: 'centering', name: 'بادامک، فنر و کلاچ', en: 'Cams, springs & clutches' },
    { id: 'electronics', name: 'الکترونیک و سنسورها', en: 'Electronics & sensors' },
    { id: 'shaft', name: 'محور، چرخش Z و آداپتور', en: 'Shaft, twist & adapter' },
    { id: 'grip', name: 'دستهٔ کامل', en: 'Grip assembly' },
    { id: 'grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip — left shell', parent: 'grip' },
    { id: 'grip_r', name: 'پوستهٔ راست دسته', en: 'Grip — right shell', parent: 'grip' },
    { id: 'grip_ctrl', name: 'کلیدهای دسته', en: 'Grip controls', parent: 'grip' },
    { id: 'grip_int', name: 'الکترونیک و کانکتور دسته', en: 'Grip internals & connector', parent: 'grip' }
  ],
  parts: [
    { id: 'g_baseplate', name: 'صفحهٔ فولادی رومیزی', en: 'Steel table-top plate', section: 'base', material: 'فولاد', desc: 'صفحهٔ سنگین برای پایداری روی میز؛ برای نصب روی پایهٔ میز (UCM) جدا می‌شود.', specs: [ { k: 'ابعاد', v: '185 × 145 mm', c: 'official', src: 'S8' }, { k: 'ضخامت', v: '3 mm', c: 'design' }, { k: 'سوراخ‌ها', v: 'Ø6 / Ø7 / Ø9 mm', c: 'community', src: 'S9' } ] },
    { id: 'g_pads', name: 'پدهای ضدلغزش', en: 'Anti-slip pads', section: 'base', material: 'لاستیک', desc: 'چهار پد زیر صفحه.', specs: [ { k: 'ابعاد', v: 'Ø16 × 2 mm', c: 'design' } ] },
    { id: 'g_screws', name: 'پیچ‌های اتصال پایه به صفحه', en: 'Base-to-plate screws', section: 'base', material: 'فولاد', desc: 'چهار پیچ از زیر صفحه به بدنه.', specs: [ { k: 'رزوه', v: 'M5', c: 'design' }, { k: 'سوراخ صفحه', v: 'Ø6 mm', c: 'community', src: 'S9' } ] },
    { id: 'g_housing_l', name: 'پوستهٔ چپ', en: 'Housing left', section: 'housing_l', material: 'ABS صنعتی', desc: 'نیمهٔ چپ بدنه.', specs: [ { k: 'ابعاد پایین', v: '150 × 128 mm', c: 'design' } ] },
    { id: 'g_housing_r', name: 'پوستهٔ راست', en: 'Housing right', section: 'housing_r', material: 'ABS صنعتی', desc: 'نیمهٔ راست بدنه.', specs: [ { k: 'ارتفاع', v: '66 mm', c: 'design' } ] },
    { id: 'g_housing_top', name: 'درپوش بالایی', en: 'Top cover', section: 'housing_top', material: 'ABS', desc: 'درپوش با دهانهٔ گردگیر و محل کنترل‌های پایه.', specs: [ { k: 'قطر دهانه', v: 'Ø56 mm', c: 'design' } ] },
    { id: 'g_encoders', name: 'انکودرهای دوار', en: 'Rotary encoders', section: 'housing_top', material: 'فلز/پلاستیک', desc: 'دو انکودر روی پایه.', specs: [ { k: 'تعداد', v: '2', c: 'official', src: 'S11' }, { k: 'قطر دستگیره', v: 'Ø14 mm', c: 'design' } ] },
    { id: 'g_wheel', name: 'چرخ تراتل', en: 'Throttle wheel', section: 'housing_top', material: 'پلاستیک', desc: 'چرخ آنالوگ روی پایه.', specs: [ { k: 'تعداد', v: '1', c: 'official', src: 'S11' }, { k: 'قطر', v: 'Ø24 mm', c: 'design' } ] },
    { id: 'g_buttons', name: 'دکمه‌های پایه', en: 'Base buttons', section: 'housing_top', material: 'پلاستیک', desc: 'دکمه‌های فشاری پایه.', specs: [ { k: 'قطر', v: 'Ø9 mm', c: 'design' } ] },
    { id: 'g_boot', name: 'گردگیر لاستیکی', en: 'Rubber boot', section: 'boot', material: 'لاستیک', desc: 'محافظ دهانهٔ گیمبال.', specs: [ { k: 'قطر', v: 'Ø54 → Ø30 mm', c: 'design' } ] },
    { id: 'g_frame', name: 'برج‌های نگهدارنده گیمبال', en: 'Gimbal towers', section: 'gimbal', material: 'PA + GF', desc: 'دو برج ثابت که بلبرینگ‌های محور پیچ (X) را نگه می‌دارند.', specs: [ { k: 'فاصلهٔ داخلی برج‌ها', v: '84 mm', c: 'design' } ] },
    { id: 'g_yoke', name: 'یوک بیرونی (محور پیچ)', en: 'Outer yoke (pitch)', section: 'gimbal', material: 'PA + GF', desc: 'قاب مستطیلی که حول محور X می‌چرخد و محور رول را حمل می‌کند.', specs: [ { k: 'ابعاد', v: '64 × 64 × 14 mm', c: 'design' } ] },
    { id: 'g_block', name: 'بلوک داخلی (محور رول)', en: 'Inner block (roll)', section: 'gimbal', material: 'PA + GF', desc: 'بلوک مرکزی که حول محور Z می‌چرخد و محور اصلی را نگه می‌دارد.', specs: [ { k: 'ابعاد', v: '30 × 30 × 30 mm', c: 'design' } ] },
    { id: 'g_axle_x', name: 'شفت محور پیچ', en: 'Pitch axle', section: 'gimbal', material: 'فولاد', desc: 'شفت محور X.', specs: [ { k: 'قطر', v: 'Ø8 mm', c: 'design' }, { k: 'طول', v: '120 mm', c: 'design' } ] },
    { id: 'g_axle_z', name: 'شفت محور رول', en: 'Roll axle', section: 'gimbal', material: 'فولاد', desc: 'شفت محور Z.', specs: [ { k: 'قطر', v: 'Ø8 mm', c: 'design' }, { k: 'طول', v: '76 mm', c: 'design' } ] },
    { id: 'g_bearings', name: 'بلبرینگ‌ها', en: 'Ball bearings', section: 'gimbal', material: 'فولاد بلبرینگ', desc: 'چهار بلبرینگ 608 در دو محور.', specs: [ { k: 'سایز', v: '608 — 8 × 22 × 7 mm', c: 'standard' } ] },
    { id: 'g_cam_x', name: 'بادامک محور پیچ', en: 'Pitch cam', section: 'centering', material: 'POM', desc: 'بادامک با فرورفتگی مرکزی (V) روی شفت X.', specs: [ { k: 'قطر', v: 'Ø36 mm', c: 'design' } ] },
    { id: 'g_cam_z', name: 'بادامک محور رول', en: 'Roll cam', section: 'centering', material: 'POM', desc: 'بادامک روی شفت Z.', specs: [ { k: 'قطر', v: 'Ø30 mm', c: 'design' } ] },
    { id: 'g_follower', name: 'اهرم و غلتک پیرو', en: 'Follower levers & rollers', section: 'centering', material: 'فولاد + بلبرینگ', desc: 'غلتک روی بادامک فشرده می‌شود.', specs: [ { k: 'قطر غلتک', v: 'Ø10 mm', c: 'design' } ] },
    { id: 'g_springs', name: 'فنرهای قابل تعویض', en: 'Interchangeable springs', section: 'centering', material: 'فولاد فنر', desc: 'فنر کششی برای هر محور؛ چند سختی (10/20/30/40) قابل تعویض است.', specs: [ { k: 'سختی‌ها', v: '10 / 20 / 30 / 40', c: 'community', src: 'S12' }, { k: 'قطر خارجی', v: 'Ø8 mm', c: 'design' } ] },
    { id: 'g_clutch', name: 'کلاچ / دمپر اصطکاکی', en: 'Friction clutch / damper', section: 'centering', material: 'فولاد + گریس دمپینگ', desc: 'با پیچ تنظیم می‌شود تا لرزش برگشت را میرا کند.', specs: [ { k: 'قطر دیسک', v: 'Ø26 mm', c: 'design' }, { k: 'تنظیم', v: 'پیچ (ربع دور)', c: 'community', src: 'S12' } ] },
    { id: 'g_mars', name: 'بردهای سنسور MaRS', en: 'MaRS sensor boards', section: 'electronics', material: 'FR-4', desc: 'دو سنسور مغناطیسی بدون تماس روبه‌روی آهنربای انتهای هر شفت.', specs: [ { k: 'تعداد', v: '2 (X و Y)', c: 'official', src: 'S11' }, { k: 'فاصلهٔ هوایی', v: '1.5 mm', c: 'design' } ] },
    { id: 'g_magnets', name: 'آهنرباهای انتهای شفت', en: 'Axle-end magnets', section: 'electronics', material: 'NdFeB', desc: 'آهنربای دیسکی قطبیده در قطر.', specs: [ { k: 'ابعاد', v: 'Ø6 × 2.5 mm', c: 'design' } ] },
    { id: 'g_mainboard', name: 'برد کنترلر ARM', en: 'ARM controller board', section: 'electronics', material: 'FR-4', desc: 'پردازندهٔ 32 بیتی ARM.', specs: [ { k: 'پردازنده', v: '32-bit ARM', c: 'official', src: 'S10' } ] },
    { id: 'g_usb', name: 'کانکتور USB', en: 'USB connector', section: 'electronics', material: 'فلز', desc: 'اتصال کابل 180 سانتی‌متری.', specs: [ { k: 'طول کابل', v: '180 cm', c: 'official', src: 'S10' } ] },
    { id: 'g_shaft', name: 'محور اصلی', en: 'Main shaft', section: 'shaft', material: 'آلومینیوم', desc: 'از بلوک داخلی بالا می‌آید و دسته روی آن سوار می‌شود.', specs: [ { k: 'قطر', v: 'Ø20 mm', c: 'design' } ] },
    { id: 'g_twist', name: 'یاتاقان چرخش Z و پیچ قفل', en: 'Twist bearing & lock screw', section: 'shaft', material: 'فولاد/POM', desc: 'چرخش Z دسته؛ با پیچ همراه قابل قفل است.', specs: [ { k: 'قفل', v: 'پیچ در سوراخ پایهٔ دسته', c: 'community', src: 'S13' }, { k: 'رزوهٔ پیچ', v: 'M3', c: 'design' } ] },
    { id: 'g_adapter', name: 'آداپتور دسته', en: 'Grip adapter', section: 'shaft', material: 'آلومینیوم', desc: 'گلویی با کانکتور مادگی و سوراخ‌های پیچ.', specs: [ { k: 'قطر', v: 'Ø22 mm', c: 'design' } ] },
    { id: 'g_grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip left shell', section: 'grip_l', material: 'ABS', desc: 'نیمهٔ چپ دسته (Space Combat).', specs: [ { k: 'ارتفاع دسته', v: '≈ 150 mm', c: 'design' } ] },
    { id: 'g_grip_r', name: 'پوستهٔ راست دسته', en: 'Grip right shell', section: 'grip_r', material: 'ABS', desc: 'نیمهٔ راست دسته.', specs: [ { k: 'عرض', v: '≈ 44 mm', c: 'design' } ] },
    { id: 'g_grip_ctrl', name: 'کلیدها، کلاه و ماشه', en: 'Hats, buttons & trigger', section: 'grip_ctrl', material: 'ABS', desc: 'ماشه، کلاه‌های چهارجهته و دکمه‌ها.', specs: [ { k: 'ماشه', v: 'دومرحله‌ای', c: 'design' } ] },
    { id: 'g_grip_pcb', name: 'برد دسته', en: 'Grip PCB', section: 'grip_int', material: 'FR-4', desc: 'برد کلیدهای دسته.', specs: [ { k: 'ابعاد', v: '22 × 60 mm', c: 'design' } ] },
    { id: 'g_grip_conn', name: 'کانکتور دسته', en: 'Grip connector', section: 'grip_int', material: 'پلاستیک/فسفربرنز', desc: 'کانکتور اختصاصی دسته به آداپتور.', specs: [ { k: 'نوع', v: '8 پین، گام 2.0 mm', c: 'design' } ] },
    { id: 'g_grip_screws', name: 'پیچ‌های قفل دسته', en: 'Grip retaining screws', section: 'grip_int', material: 'فولاد', desc: 'دو پیچ جانبی که دسته را روی آداپتور ثابت می‌کنند (پیچ و پیچ‌گوشتی همراه محصول).', specs: [ { k: 'رزوه', v: '2 × M3 × 8', c: 'design' }, { k: 'وجود پیچ', v: 'در جعبه', c: 'official', src: 'S11' } ] }
  ],
  connections: [
    { id: 'gc_grip', name: 'اتصال مکانیکی دسته به آداپتور', en: 'Grip ↔ adapter mechanical', type: 'mechanical', parts: ['g_adapter', 'g_grip_screws', 'g_grip_l', 'g_grip_r'], dims: ['g_d_adapter', 'g_d_screws', 'g_d_engage'], open: ['grip'], desc: 'دسته روی آداپتور Ø22 فرو می‌رود و با دو پیچ جانبی M3 محکم می‌شود.', specs: [ { k: 'قطر آداپتور', v: 'Ø22 mm', c: 'design' }, { k: 'طول درگیری', v: '22 mm', c: 'design' }, { k: 'پیچ‌ها', v: '2 × M3 × 8', c: 'design' } ] },
    { id: 'gc_elec', name: 'اتصال الکتریکی دسته', en: 'Grip electrical connector', type: 'electrical', parts: ['g_grip_conn', 'g_grip_pcb', 'g_adapter'], dims: ['g_d_conn'], open: ['grip', 'grip_l'], desc: 'کانکتور اختصاصی هم‌زمان با جاافتادن دسته درگیر می‌شود.', specs: [ { k: 'نوع', v: 'اختصاصی، 8 پین، گام 2.0 mm', c: 'design' } ] },
    { id: 'gc_twist', name: 'چرخش Z و قفل آن', en: 'Twist axis & lock', type: 'kinematic', parts: ['g_twist'], dims: ['g_d_twist'], open: ['grip'], desc: 'یاتاقان چرخشی بین محور و آداپتور؛ با پیچ همراه قفل می‌شود.', specs: [ { k: 'قفل', v: 'پیچ', c: 'community', src: 'S13' }, { k: 'دامنه', v: '±15°', c: 'design' } ] },
    { id: 'gc_gimbal', name: 'گیمبال کاردانی دومحوره', en: 'Cardan gimbal joint', type: 'kinematic', parts: ['g_frame', 'g_yoke', 'g_block', 'g_axle_x', 'g_axle_z', 'g_bearings'], dims: ['g_d_axle', 'g_d_bearing', 'g_d_towers', 'g_d_center', 'g_d_throw'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'محور X (پیچ) روی برج‌ها و محور Z (رول) درون یوک؛ هر دو محور در مرکز گیمبال هم‌دیگر را قطع می‌کنند.', specs: [ { k: 'شفت‌ها', v: 'Ø8 mm فولادی', c: 'design' }, { k: 'بلبرینگ', v: '608 (8×22×7)', c: 'standard' }, { k: 'ارتفاع مرکز گیمبال', v: '44 mm', c: 'design' }, { k: 'انحراف', v: '±15°', c: 'design' } ] },
    { id: 'gc_cam', name: 'بادامک و فنر قابل تعویض', en: 'Cam & interchangeable spring', type: 'kinematic', parts: ['g_cam_x', 'g_cam_z', 'g_follower', 'g_springs'], dims: ['g_d_cam', 'g_d_spring'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'غلتک پیرو در فرورفتگی بادامک می‌نشیند (مرکز). با انحراف، اهرم بالا می‌رود و فنر کششی کشیده می‌شود.', specs: [ { k: 'فنرها', v: '10 / 20 / 30 / 40', c: 'community', src: 'S12' } ] },
    { id: 'gc_clutch', name: 'کلاچ / دمپر', en: 'Clutch / damper', type: 'kinematic', parts: ['g_clutch'], dims: ['g_d_clutch'], open: ['housing_l', 'housing_r', 'housing_top'], desc: 'دیسک اصطکاکی با پیچ تنظیم؛ باید با سختی فنر هماهنگ شود.', specs: [ { k: 'تنظیم', v: 'پیچ، گام‌های ربع دور', c: 'community', src: 'S12' } ] },
    { id: 'gc_sensor', name: 'سنسورهای MaRS', en: 'MaRS magnetic sensors', type: 'sensor', parts: ['g_mars', 'g_magnets'], dims: ['g_d_gap'], open: ['housing_l', 'housing_r', 'housing_top'], desc: 'آهنربا روی انتهای هر شفت و سنسور روبه‌روی آن.', specs: [ { k: 'تعداد', v: '2', c: 'official', src: 'S11' }, { k: 'فاصلهٔ هوایی', v: '1.5 mm', c: 'design' } ] },
    { id: 'gc_plate', name: 'صفحهٔ فولادی و سوراخ‌های نصب', en: 'Steel plate & mounting holes', type: 'fastener', parts: ['g_baseplate', 'g_screws'], dims: ['g_d_w', 'g_d_d', 'g_d_holes'], open: ['base'], desc: 'صفحهٔ فولادی با سوراخ‌های نصب؛ سازگار با پایه‌های UCM.', specs: [ { k: 'ابعاد صفحه', v: '185 × 145 mm', c: 'official', src: 'S8' }, { k: 'قطر سوراخ‌ها', v: 'Ø6 / Ø7 / Ø9 mm', c: 'community', src: 'S9' } ] },
    { id: 'gc_usb', name: 'USB', en: 'USB', type: 'electrical', parts: ['g_usb', 'g_mainboard'], dims: ['g_d_usb'], open: ['housing_r'], desc: 'کابل 180 سانتی‌متری.', specs: [ { k: 'طول کابل', v: '180 cm', c: 'official', src: 'S10' } ] }
  ],
  sources: ['S8', 'S9', 'S10', 'S11', 'S12', 'S13']
}

// ---------------------------------------------------------------------------
//  MODEL C — economical fixed-grip Hall stick (T.16000M FCS class)
// ---------------------------------------------------------------------------
const fixed: StickModel = {
  id: 'fixed',
  name: 'مدل C — استیک اقتصادی Hall با دستهٔ ثابت (کلاس T.16000M FCS)',
  en: 'Model C — Fixed-grip Hall-effect stick (T.16000M FCS class)',
  refClass: 'Thrustmaster T.16000M FCS',
  summary:
    'استیک دوطرفه (چپ‌دست/راست‌دست) با سنسور مغناطیسی H.E.A.R.T 16-bit، چرخش Z (سکان) و اهرم تراتل روی پایه. دسته ثابت است و سیم‌کشی آن از داخل محور به برد پایه می‌رود.',
  overall: [
    { k: 'طول (عمق)', v: '214 mm', c: 'official', src: 'S14' },
    { k: 'عرض', v: '220 mm', c: 'official', src: 'S14' },
    { k: 'ارتفاع', v: '242 mm', c: 'official', src: 'S14' },
    { k: 'وزن', v: '1320 g', c: 'official', src: 'S14' },
    { k: 'سنسور', v: 'H.E.A.R.T Hall، 16-bit', c: 'official', src: 'S14' },
    { k: 'فنر مرکزگرا', v: 'فنر مارپیچ Ø2.8 mm', c: 'official', src: 'S15' },
    { k: 'محورها', v: '4 (X، Y، Z-twist، تراتل)', c: 'official', src: 'S14' },
    { k: 'دکمه‌ها', v: '16 + کلاه هشت‌جهته', c: 'official', src: 'S14' }
  ],
  axes: { pitch: 18, roll: 18, twist: 25 },
  sections: [
    { id: 'base', name: 'صفحهٔ پایه و وزنه', en: 'Base plate & weight' },
    { id: 'housing', name: 'پوستهٔ پایه', en: 'Base housing' },
    { id: 'housing_l', name: 'نیمهٔ چپ پوسته', en: 'Housing — left', parent: 'housing' },
    { id: 'housing_r', name: 'نیمهٔ راست پوسته', en: 'Housing — right', parent: 'housing' },
    { id: 'housing_top', name: 'درپوش و دکمه‌های پایه', en: 'Top cover & base buttons', parent: 'housing' },
    { id: 'throttle', name: 'اهرم تراتل', en: 'Throttle lever' },
    { id: 'boot', name: 'گردگیر', en: 'Boot' },
    { id: 'mech', name: 'مفصل و فنر مرکزگرا', en: 'Pivot & centering spring' },
    { id: 'electronics', name: 'الکترونیک پایه', en: 'Base electronics' },
    { id: 'shaft', name: 'محور و آهنربا', en: 'Shaft & magnet' },
    { id: 'twist', name: 'مکانیزم چرخش Z', en: 'Twist mechanism' },
    { id: 'grip', name: 'دستهٔ کامل', en: 'Grip assembly' },
    { id: 'grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip — left shell', parent: 'grip' },
    { id: 'grip_r', name: 'پوستهٔ راست دسته', en: 'Grip — right shell', parent: 'grip' },
    { id: 'grip_ctrl', name: 'کلیدهای دسته', en: 'Grip controls', parent: 'grip' },
    { id: 'grip_int', name: 'برد و سیم‌کشی دسته', en: 'Grip PCB & harness', parent: 'grip' }
  ],
  parts: [
    { id: 'f_plate', name: 'صفحهٔ کف', en: 'Bottom plate', section: 'base', material: 'ABS + وزنهٔ فولادی', desc: 'کف بیضی‌گون پایه.', specs: [ { k: 'ابعاد', v: '220 × 214 mm', c: 'official', src: 'S14' }, { k: 'ضخامت', v: '4 mm', c: 'design' } ] },
    { id: 'f_weight', name: 'وزنهٔ تعادل', en: 'Ballast weight', section: 'base', material: 'فولاد', desc: 'وزنهٔ داخلی برای پایداری.', specs: [ { k: 'ابعاد', v: '120 × 80 × 8 mm', c: 'design' }, { k: 'جرم', v: '≈ 600 g', c: 'design' } ] },
    { id: 'f_pads', name: 'پدهای لاستیکی', en: 'Rubber pads', section: 'base', material: 'لاستیک', desc: 'پنج پد ضدلغزش.', specs: [ { k: 'ابعاد', v: 'Ø18 × 2 mm', c: 'design' } ] },
    { id: 'f_screws', name: 'پیچ‌های کف', en: 'Bottom screws', section: 'base', material: 'فولاد', desc: 'پیچ‌های خودکار پلاستیک (Self-tapping).', specs: [ { k: 'سایز', v: 'ST3.0 × 12', c: 'design' }, { k: 'تعداد', v: '6', c: 'design' } ] },
    { id: 'f_housing_l', name: 'پوستهٔ چپ', en: 'Housing left', section: 'housing_l', material: 'ABS', desc: 'نیمهٔ چپ بدنه.', specs: [ { k: 'ارتفاع', v: '60 mm', c: 'design' } ] },
    { id: 'f_housing_r', name: 'پوستهٔ راست', en: 'Housing right', section: 'housing_r', material: 'ABS', desc: 'نیمهٔ راست بدنه.', specs: [ { k: 'ارتفاع', v: '60 mm', c: 'design' } ] },
    { id: 'f_housing_top', name: 'درپوش بالایی', en: 'Top cover', section: 'housing_top', material: 'ABS', desc: 'درپوش با دهانهٔ محور و پنل دکمه‌ها.', specs: [ { k: 'قطر دهانه', v: 'Ø60 mm', c: 'design' } ] },
    { id: 'f_btns', name: 'دکمه‌های پایه', en: 'Base buttons', section: 'housing_top', material: 'پلاستیک', desc: 'دو گروه شش‌تایی (12 دکمه) روی پایه.', specs: [ { k: 'تعداد', v: '12', c: 'official', src: 'S14' }, { k: 'قطر', v: 'Ø9 mm', c: 'design' } ] },
    { id: 'f_throttle', name: 'اهرم تراتل', en: 'Throttle lever', section: 'throttle', material: 'ABS', desc: 'اهرم آنالوگ کنار پایه.', specs: [ { k: 'کورس زاویه‌ای', v: '±30°', c: 'design' }, { k: 'طول اهرم', v: '70 mm', c: 'design' } ] },
    { id: 'f_throttle_pot', name: 'پتانسیومتر تراتل', en: 'Throttle potentiometer', section: 'throttle', material: 'کربن/فلز', desc: 'سنسور زاویهٔ تراتل.', specs: [ { k: 'نوع', v: 'پتانسیومتر 10 kΩ خطی', c: 'design' }, { k: 'شفت', v: 'Ø6 mm', c: 'design' } ] },
    { id: 'f_boot', name: 'گردگیر', en: 'Boot', section: 'boot', material: 'لاستیک', desc: 'محافظ دهانه.', specs: [ { k: 'قطر', v: 'Ø58 → Ø30 mm', c: 'design' } ] },
    { id: 'f_socket', name: 'کاسهٔ مفصل', en: 'Pivot socket', section: 'mech', material: 'POM', desc: 'کاسهٔ مفصل کروی.', specs: [ { k: 'قطر', v: 'Ø32 mm', c: 'design' } ] },
    { id: 'f_spring', name: 'فنر مارپیچ مرکزگرا', en: 'Helical centering spring', section: 'mech', material: 'فولاد فنر', desc: 'فنر مارپیچ با کشش محکم، خطی و نرم.', specs: [ { k: 'قطر سیم', v: 'Ø2.8 mm', c: 'official', src: 'S15' }, { k: 'قطر خارجی', v: 'Ø30 mm', c: 'design' } ] },
    { id: 'f_cone', name: 'مخروط مرکزگرا', en: 'Centering cone', section: 'mech', material: 'POM', desc: 'مخروط پلاستیکی که فنر روی آن فشار می‌آورد.', specs: [ { k: 'قطر', v: 'Ø34 mm', c: 'design' } ] },
    { id: 'f_hall', name: 'سنسور Hall', en: 'Hall sensor', section: 'electronics', material: 'آی‌سی', desc: 'سنسور مغناطیسی سه‌بعدی زیر آهنربا.', specs: [ { k: 'وضوح', v: '16-bit', c: 'official', src: 'S14' }, { k: 'فاصلهٔ هوایی', v: '2.0 mm', c: 'design' } ] },
    { id: 'f_pcb', name: 'برد اصلی', en: 'Main PCB', section: 'electronics', material: 'FR-4', desc: 'برد USB با کانکتورهای JST برای دسته و تراتل.', specs: [ { k: 'ابعاد', v: '90 × 60 mm', c: 'design' } ] },
    { id: 'f_usb', name: 'کابل USB ثابت', en: 'Captive USB cable', section: 'electronics', material: 'PVC', desc: 'کابل ثابت با گیرهٔ ضدکشش.', specs: [ { k: 'نوع', v: 'USB-A', c: 'design' }, { k: 'طول', v: '1.8 m', c: 'design' } ] },
    { id: 'f_ball', name: 'گوی مفصل', en: 'Pivot ball', section: 'shaft', material: 'POM', desc: 'گوی مفصل.', specs: [ { k: 'قطر', v: 'Ø32 mm', c: 'design' } ] },
    { id: 'f_shaft', name: 'محور توخالی', en: 'Hollow shaft', section: 'shaft', material: 'فولاد', desc: 'محور توخالی؛ سیم‌های دسته از داخل آن عبور می‌کنند.', specs: [ { k: 'قطر', v: 'Ø14 mm (داخلی Ø8)', c: 'design' } ] },
    { id: 'f_magnet', name: 'آهنربا', en: 'Magnet', section: 'shaft', material: 'NdFeB', desc: 'آهنربای انتهای محور.', specs: [ { k: 'ابعاد', v: 'Ø8 × 3 mm', c: 'design' } ] },
    { id: 'f_twist_collar', name: 'طوقهٔ چرخش Z', en: 'Twist collar', section: 'twist', material: 'POM', desc: 'یاتاقان چرخش دسته روی محور.', specs: [ { k: 'قطر', v: 'Ø34 mm', c: 'design' } ] },
    { id: 'f_twist_spring', name: 'فنر پیچشی Z', en: 'Twist torsion spring', section: 'twist', material: 'فولاد فنر', desc: 'دسته را در محور Z به مرکز برمی‌گرداند.', specs: [ { k: 'قطر سیم', v: 'Ø1.2 mm', c: 'design' } ] },
    { id: 'f_twist_sensor', name: 'سنسور چرخش Z', en: 'Twist sensor', section: 'twist', material: 'آی‌سی', desc: 'سنسور زاویهٔ چرخش.', specs: [ { k: 'دامنه', v: '±25°', c: 'design' } ] },
    { id: 'f_grip_l', name: 'پوستهٔ چپ دسته', en: 'Grip left shell', section: 'grip_l', material: 'ABS', desc: 'دستهٔ متقارن (دوطرفه).', specs: [ { k: 'ارتفاع', v: '≈ 160 mm', c: 'design' } ] },
    { id: 'f_grip_r', name: 'پوستهٔ راست دسته', en: 'Grip right shell', section: 'grip_r', material: 'ABS', desc: 'نیمهٔ راست.', specs: [ { k: 'عرض', v: '≈ 44 mm', c: 'design' } ] },
    { id: 'f_trigger', name: 'ماشه', en: 'Trigger', section: 'grip_ctrl', material: 'ABS', desc: 'ماشهٔ تک‌مرحله‌ای.', specs: [ { k: 'نوع', v: 'تک‌مرحله‌ای', c: 'design' } ] },
    { id: 'f_hat', name: 'کلاه هشت‌جهته', en: '8-way hat', section: 'grip_ctrl', material: 'ABS', desc: 'کلاه هشت‌جهته POV.', specs: [ { k: 'نوع', v: '8-way', c: 'official', src: 'S14' } ] },
    { id: 'f_btn_top', name: 'دکمه‌های بالای دسته', en: 'Head buttons', section: 'grip_ctrl', material: 'ABS', desc: 'سه دکمهٔ بالای دسته.', specs: [ { k: 'تعداد', v: '3', c: 'design' } ] },
    { id: 'f_grip_pcb', name: 'برد دسته', en: 'Grip PCB', section: 'grip_int', material: 'FR-4', desc: 'برد کلیدهای دسته.', specs: [ { k: 'ابعاد', v: '20 × 50 mm', c: 'design' } ] },
    { id: 'f_harness', name: 'دستهٔ سیم + کانکتور JST', en: 'Harness + JST connector', section: 'grip_int', material: 'سیم 28AWG', desc: 'سیم‌کشی دسته از داخل محور توخالی تا برد پایه.', specs: [ { k: 'کانکتور', v: 'JST-PH 8 پین، گام 2.0 mm', c: 'design' } ] },
    { id: 'f_grip_screws', name: 'پیچ‌های نگهدارنده دسته', en: 'Grip screws', section: 'grip_int', material: 'فولاد', desc: 'دسته به طوقهٔ چرخش پیچ می‌شود (کاربر نمی‌تواند جدا کند).', specs: [ { k: 'سایز', v: '2 × M3 × 10', c: 'design' } ] }
  ],
  connections: [
    { id: 'fc_grip', name: 'اتصال ثابت دسته به طوقهٔ Z', en: 'Fixed grip ↔ twist collar', type: 'mechanical', parts: ['f_grip_screws', 'f_twist_collar', 'f_grip_l', 'f_grip_r'], dims: ['f_d_collar', 'f_d_gscrew'], open: ['grip'], desc: 'دسته جداشونده نیست؛ دو پیچ M3 آن را به طوقهٔ چرخش متصل می‌کنند.', specs: [ { k: 'پیچ‌ها', v: '2 × M3 × 10', c: 'design' }, { k: 'قطر طوقه', v: 'Ø34 mm', c: 'design' } ] },
    { id: 'fc_harness', name: 'سیم‌کشی دسته از داخل محور', en: 'Harness through hollow shaft', type: 'electrical', parts: ['f_harness', 'f_shaft', 'f_grip_pcb', 'f_pcb'], dims: ['f_d_shaft', 'f_d_bore'], open: ['grip', 'grip_l', 'housing_l', 'housing_r', 'housing_top'], desc: 'سیم‌ها از برد دسته، داخل محور توخالی Ø8 به کانکتور JST روی برد اصلی می‌روند.', specs: [ { k: 'کانکتور', v: 'JST-PH 8 پین', c: 'design' }, { k: 'قطر داخلی محور', v: 'Ø8 mm', c: 'design' } ] },
    { id: 'fc_twist', name: 'چرخش Z (سکان)', en: 'Twist (rudder) axis', type: 'kinematic', parts: ['f_twist_collar', 'f_twist_spring', 'f_twist_sensor'], dims: ['f_d_twist'], open: ['grip'], desc: 'طوقه روی محور می‌چرخد و فنر پیچشی آن را به مرکز برمی‌گرداند.', specs: [ { k: 'دامنه', v: '±25°', c: 'design' } ] },
    { id: 'fc_pivot', name: 'مفصل کروی و فنر مارپیچ', en: 'Ball pivot & helical spring', type: 'kinematic', parts: ['f_ball', 'f_socket', 'f_spring', 'f_cone'], dims: ['f_d_ball', 'f_d_spring', 'f_d_throw'], open: ['housing_l', 'housing_r', 'housing_top', 'boot'], desc: 'گوی Ø32 در کاسه؛ فنر مارپیچ با فشار روی مخروط، دسته را به مرکز برمی‌گرداند.', specs: [ { k: 'قطر سیم فنر', v: 'Ø2.8 mm', c: 'official', src: 'S15' }, { k: 'انحراف', v: '±18°', c: 'design' } ] },
    { id: 'fc_sensor', name: 'آهنربا ↔ سنسور Hall', en: 'Magnet ↔ Hall sensor', type: 'sensor', parts: ['f_magnet', 'f_hall'], dims: ['f_d_gap'], open: ['housing_l', 'housing_r', 'housing_top'], desc: 'H.E.A.R.T: آهنربا زیر محور، سنسور روی برد.', specs: [ { k: 'وضوح', v: '16-bit', c: 'official', src: 'S14' }, { k: 'فاصلهٔ هوایی', v: '2.0 mm', c: 'design' } ] },
    { id: 'fc_throttle', name: 'محور تراتل', en: 'Throttle pivot', type: 'kinematic', parts: ['f_throttle', 'f_throttle_pot'], dims: ['f_d_thr', 'f_d_thrlen'], open: ['housing_l'], desc: 'اهرم روی شفت پتانسیومتر Ø6 سوار است.', specs: [ { k: 'شفت', v: 'Ø6 mm', c: 'design' }, { k: 'کورس', v: '±30°', c: 'design' } ] },
    { id: 'fc_base', name: 'کف و وزنه', en: 'Base & ballast', type: 'fastener', parts: ['f_plate', 'f_weight', 'f_screws'], dims: ['f_d_w', 'f_d_d', 'f_d_h'], open: ['base'], desc: 'کف با 6 پیچ خودکار به بدنه بسته می‌شود.', specs: [ { k: 'ابعاد کلی', v: '214 × 220 × 242 mm', c: 'official', src: 'S14' } ] }
  ],
  sources: ['S14', 'S15']
}

export const MODELS: StickModel[] = [heavy, gimbal, fixed]
