/* ============================================================
   VANAJA DIAGNOSTIC CENTRE — app.js
   Shared engine: promo truth-engine, smart search, theme, chrome
   ============================================================ */
'use strict';

/* ---------- CATALOGUE (prices mirror the live site's published rates) ---------- */
const TESTS = [
  { id:'cbp',      name:'Complete Blood Count (CBC)', cat:'Haematology',  price:300,  prep:'No fasting required', desc:'Screens RBCs, WBCs, haemoglobin & platelets.' },
  { id:'thyroid',  name:'Thyroid Profile (T3, T4, TSH)', cat:'Endocrine', price:600, prep:'Morning sample preferred', desc:'Complete thyroid function assessment.' },
  { id:'lpt',      name:'Lipid Profile', cat:'Cardiac', price:600, prep:'12-hour fasting required', desc:'Total, HDL, LDL cholesterol & triglycerides.' },
  { id:'lft',      name:'Liver Function Test (LFT)', cat:'Biochemistry', price:600, prep:'No fasting required', desc:'ALT, AST, bilirubin & albumin levels.' },
  { id:'ghba1c',   name:'HbA1c (Diabetes)', cat:'Diabetes', price:600, prep:'No fasting required', desc:'3-month average blood sugar control.' },
  { id:'kft',      name:'Kidney Function Test (KFT)', cat:'Renal', price:null, prep:'Stay hydrated; avoid heavy meal before', desc:'Creatinine, urea & electrolyte assessment.' },
  { id:'vitd',     name:'Vitamin D (25-OH)', cat:'Vitamins', price:null, prep:'No preparation needed', desc:'Bone health & immunity marker.' },
  { id:'vitb12',   name:'Vitamin B12', cat:'Vitamins', price:null, prep:'6-hour fast preferred', desc:'Nerve function & energy metabolism.' },
  { id:'fbs',      name:'Fasting Blood Sugar (FBS)', cat:'Diabetes', price:null, prep:'8–10 hour fasting required', desc:'Blood glucose after overnight fast.' },
  { id:'ppbs',     name:'Post-Prandial Blood Sugar (PPBS)', cat:'Diabetes', price:null, prep:'Sample 2 hours after meal', desc:'Glucose response after a meal.' },
];

const PACKAGES = [
  {
    id:'fullbody', name:'Comprehensive Health Checkup', tag:'Best Value',
    testsCount:62, originalPrice:8999, currentPrice:2999,
    homeCollection:true, prep:'10–12 hour fasting required',
    includes:['Complete blood count & metabolic panel','Thyroid, Vitamin B12 & D','Liver, kidney & lipid profiles','HbA1c + urine routine','Free doctor consultation on report'],
    desc:'62 tests — our most complete whole-body screening.'
  },
  {
    id:'diabetes', name:'Diabetes Care Package', tag:'Diabetes',
    testsCount:12, originalPrice:2499, currentPrice:1499,
    homeCollection:true, prep:'Fasting & post-meal samples required',
    includes:['Fasting & Post-Meal Sugar','HbA1c (3-month average)','Kidney Function Test','Lipid Profile','Urine microalbumin'],
    desc:'Complete diabetic monitoring panel.'
  },
  {
    id:'thyroidpkg', name:'Thyroid Complete', tag:'Most Popular',
    testsCount:5, originalPrice:1200, currentPrice:749,
    homeCollection:true, prep:'Morning sample preferred',
    includes:['T3, T4 & TSH panel','Anti-TPO antibody','Complete Blood Count','Same-day report'],
    desc:'Full thyroid panel with blood count.'
  },
  {
    id:'heart', name:'Heart Health Panel', tag:'Cardiac',
    testsCount:14, originalPrice:3200, currentPrice:1899,
    homeCollection:true, prep:'12 hour fasting required',
    includes:['Lipid Profile (detailed)','hs-CRP cardiac risk marker','Homocysteine','Liver & kidney screen','ECG at centre'],
    desc:'Cardiac risk screening for men and women 35+.'
  },
  {
    id:'women', name:"Women's Wellness Check", tag:"Women's Health",
    testsCount:40, originalPrice:5500, currentPrice:3299,
    homeCollection:true, prep:'10 hour fasting recommended',
    includes:['CBC, thyroid & vitamins D/B12','Iron studies & ferritin','Hormone screen (PCOS panel)','Diabetes & lipid screening','Free diet consultation'],
    desc:'Whole-body screening tuned to women\u2019s health needs.'
  },
  {
    id:'senior', name:'Senior Citizen Care Package', tag:'60+',
    testsCount:55, originalPrice:7200, currentPrice:4299,
    homeCollection:true, prep:'10–12 hour fasting required',
    includes:['Full metabolic & blood panels','Bone health (Calcium, Vit D, uric acid)','Kidney, liver & cardiac markers','Prostate / pap smear screening add-on','Priority home collection'],
    desc:'Age-appropriate screening for 60 and above.'
  },
];

/* ---------- OFFER CONFIG (admin-editable; persisted to localStorage) ----------
   The "Save up to N%" figure is ALWAYS derived from real offers.
   The claimed percent only displays when an active offer genuinely supports it. */
const DEFAULT_CAMPAIGN = {
  enabled: true,
  headline: 'Save up to {MAX}% with Vanaja Diagnostic Centre',
  supportingCopy: 'Get quality diagnostic tests and health packages at exceptional value. Compare available offers and choose the right package for your health needs.',
  startDate: '2026-01-01',
  endDate:   '2026-12-31'
};

function loadCampaign(){
  try { const s = JSON.parse(localStorage.getItem('vd_campaign')); if (s) return {...DEFAULT_CAMPAIGN, ...s}; } catch(e){}
  return {...DEFAULT_CAMPAIGN};
}
function saveCampaign(c){ localStorage.setItem('vd_campaign', JSON.stringify(c)); }

function loadOffers(){
  try { const o = JSON.parse(localStorage.getItem('vd_offers')); if (Array.isArray(o)) return o; } catch(e){}
  // defaults = genuine live-site offers
  return PACKAGES.map(p => ({ ref:p.id, type:'package', originalPrice:p.originalPrice, currentPrice:p.currentPrice, active:true }));
}
function saveOffers(o){ localStorage.setItem('vd_offers', JSON.stringify(o)); }

const savingsPct = (o) => (!o || !o.originalPrice || o.originalPrice <= 0 || o.currentPrice == null)
  ? 0 : Math.round(((o.originalPrice - o.currentPrice) / o.originalPrice) * 100);

function maxActiveSavings(offers){
  return Math.max(0, ...(offers||loadOffers()).filter(o => o.active).map(savingsPct));
}

function campaignHeadline(){
  const c = loadCampaign();
  const withinDates = new Date() >= new Date(c.startDate) && new Date() <= new Date(c.endDate + 'T23:59:59');
  if (!c.enabled || !withinDates) return null;
  const max = maxActiveSavings();
  if (max <= 0) return null;
  return {
    percent: max,
    line: `Save up to ${max}%`,
    sub: 'On Health Checkups & Diagnostic Tests',
    brandline: 'Trusted Diagnostics. Better Value.',
    copy: c.supportingCopy
  };
}

/* ---------- SMART SEARCH ---------- */
const SEARCH_INTENTS = [
  { match:/sugar|diabet|shugar|madhumeh|glucose|hba1c/i,   ids:['ghba1c','fbs','ppbs'], pkg:'diabetes',  say:'For sugar / diabetes monitoring' },
  { match:/thyroid|galagundam|tsh/i,                        ids:['thyroid'],             pkg:'thyroidpkg',say:'For thyroid assessment' },
  { match:/cbc|blood count|cbp|raktha|hemoglobin|haemoglobin/i, ids:['cbp'],             pkg:null,        say:'Complete blood screening' },
  { match:/cholesterol|lipid|heart|cardiac|chest|hridayam/i,ids:['lpt'],                 pkg:'fullbody',  say:'Heart & cholesterol panel' },
  { match:/liver|kaamla|lft|jaundice/i,                     ids:['lft'],                 pkg:'fullbody',  say:'Liver function panel' },
  { match:/kidney|renal|kft|creatinine/i,                   ids:['kft'],                 pkg:'fullbody',  say:'Kidney function panel' },
  { match:/vitamin\s*d/i,                                   ids:['vitd'],                pkg:null,        say:'Vitamin D deficiency test' },
  { match:/vitamin|b12|deficiency|lopan/i,                  ids:['vitd','vitb12'],       pkg:'fullbody',  say:'Vitamin deficiency checks' },
  { match:/full ?body|master ?health|complete ?check( ?up)?|whole ?body|annual ?check/i, ids:[], pkg:'fullbody', say:'Whole-body screening package' },
  { match:/hair\s*fall|hair\s*loss|balding|జుట్టు.*రాల/i,    ids:['vitd','vitb12','thyroid','cbp'], pkg:'thyroidpkg', say:'Hair fall is commonly linked to thyroid, Vitamin D/B12, or blood counts — these panels help your doctor investigate' },
  { match:/tired|fatigue|weak|energy|alasat|అలసట/i,          ids:['vitd','vitb12','cbp','thyroid'], pkg:'fullbody', say:'Low energy is often screened with vitamins, CBC and thyroid' },
  { match:/women|woman|pregnan|pcos|pcod|period|menses|female/i, ids:['cbp','thyroid','vitd','ghba1c'], pkg:'fullbody', say:"Popular women's health tests" },
  { match:/men('|')?s?\s*health|\bman\b|male|purush/i,      ids:['lpt','ghba1c','lft','kft'], pkg:'fullbody',  say:"Popular men's health tests" },
  { match:/fever|infection|dengue|malaria|typhoid/i,        ids:['cbp'],                 pkg:null,        say:'Fever usually starts with a blood count — your doctor may add specific fever panels' },
  { match:/bone|joint|pain|arthrit/i,                       ids:['vitd'],                pkg:'fullbody',  say:'Bone and joint symptoms are often screened with Vitamin D' },
  { match:/general|checkup|health|screening/i,              ids:['cbp','ghba1c','lpt'],  pkg:'fullbody',  say:'General health checkup' },
];

/* Quick-discovery categories shown as chips under search boxes */
const SEARCH_CHIPS = [
  ['CBC','CBC'],['Diabetes','sugar'],['Thyroid','thyroid'],['Vitamin D','vitamin d'],
  ['Full body checkup','full body checkup'],['Heart checkup','heart'],
  ['Kidney tests','kidney'],['Liver tests','liver'],
  ["Women's health","women's health"],["Men's health","men's health"],
];

function smartSearch(q, opts){
  q = (q||'').trim();
  if (!q) return { tests:TESTS.slice(0,6), packages:PACKAGES, note:'' };
  const direct = q.toLowerCase();
  const tHits = TESTS.filter(t => (t.name+' '+t.cat).toLowerCase().includes(direct));
  const pHits = PACKAGES.filter(p => p.name.toLowerCase().includes(direct));
  let note = '', intentIds = [], intentPkg = null;
  for (const intent of SEARCH_INTENTS){
    if (intent.match.test(q)){
      note = intent.say; intentIds = intent.ids; intentPkg = intent.pkg; break;
    }
  }
  /* Natural-language fallback: word-stem matching when nothing matched yet.
     e.g. "I want to check my sugar levels before next month" -> sugar */
  if (!note && !tHits.length && !pHits.length){
    const STOP = new Set(['i','want','to','check','my','me','for','a','an','the','test','tests','of','and','get','do','can','you','please','need','is','are','in','on','with','before','after','next','month','this','some','help','find','show']);
    const stems = q.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w))
      .map(w => w.replace(/(?:s|es|ing|ed)$/,''));
    outer:
    for (const intent of SEARCH_INTENTS){
      const src2 = intent.match.source;
      for (const st of stems){
        try { if (st.length>3 && new RegExp(st).test(src2)){ note=intent.say; intentIds=intent.ids; intentPkg=intent.pkg; break outer; } } catch(_){}
      }
    }
    /* last resort: fuzzy substring against names */
    if (!note && !intentIds.length){
      const fz = TESTS.filter(t => stems.some(s => s.length>3 && t.name.toLowerCase().replace(/[^a-z]/g,'').includes(s)));
      if (fz.length){ return { tests:fz, packages:pHits, note:'Closest matches for your search' }; }
    }
  }
  const mergedTests = [...tHits, ...TESTS.filter(t => intentIds.includes(t.id) && !tHits.includes(t))];
  const mergedPkgs  = [...pHits, ...PACKAGES.filter(p => p.id === intentPkg && !pHits.includes(p))];
  if (!mergedTests.length && !mergedPkgs.length)
    return { tests:TESTS.slice(0,6), packages:PACKAGES, note:'No close match — showing popular tests & packages' };
  /* Apply optional filters (category, maxPrice, offersOnly) */
  if (opts){
    let { category, maxPrice, offersOnly } = opts;
    let t = mergedTests, p = mergedPkgs;
    if (category && category !== 'all'){
      if (category === 'Package'){ p = mergedPkgs; t = []; }
      else { t = mergedTests.filter(x => x.cat === category); p = []; }
    }
    if (maxPrice != null){
      t = t.filter(x => (x.price != null && x.price <= maxPrice));
      p = p.filter(x => (x.currentPrice <= maxPrice));
    }
    if (offersOnly){
      const offs = loadOffers();
      t = t.filter(x => offs.some(o => o.ref === x.id && o.active));
      p = p.filter(x => offs.some(o => o.ref === x.id && o.active));
    }
    if (!t.length && !p.length)
      return { tests:TESTS.slice(0,6), packages:PACKAGES, note:'No results match these filters — showing popular tests & packages' };
    return { tests:t, packages:p, note };
  }
  return { tests:mergedTests, packages:mergedPkgs, note };
}

/* Render quick-search chips into any container */
function renderSearchChips(elId){
  const el = document.getElementById(elId); if (!el) return;
  el.innerHTML = SEARCH_CHIPS.map(([label,q]) =>
    `<button type="button" class="chip" style="cursor:pointer;border:1px solid var(--border);background:var(--surface-2);padding:.35rem .8rem;border-radius:999px;font-size:.78rem;font-weight:600" onclick="chipSearch('${q.replace(/'/g,"\\'")}')">${label}</button>`
  ).join('');
}
function chipSearch(q){
  const qi = document.getElementById('q');
  if (qi){ qi.value = q; }
  if (typeof render === 'function' && document.getElementById('testTable')){ render(q); }
  else { location.href = 'tests.html?q=' + encodeURIComponent(q); }
}

/* ---------- THEME & ACCESSIBILITY ---------- */
function applyPrefs(){
  const theme = localStorage.getItem('vd_theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  if (localStorage.getItem('vd_largetext') === '1') document.documentElement.dataset.text = 'large';
  else delete document.documentElement.dataset.text;
}
function toggleTheme(){
  const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('vd_theme', cur); applyPrefs(); syncChrome();
}
function toggleLargeText(){
  const on = localStorage.getItem('vd_largetext') === '1' ? '0' : '1';
  localStorage.setItem('vd_largetext', on); applyPrefs();
}

/* ---------- SHARED CHROME (topbar, bottomnav, FAB) ---------- */
const ICONS = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  reports:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/></svg>',
  ai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7z"/></svg>',
  profile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5S18.5 17 20 21"/></svg>',
};

function buildChrome(active){
  const promo = campaignHeadline();
  /* ===== NAVIGATION TREE (per spec) ===== */
  const NAV=[
   {label:'Home', href:'index.html', icon:'home', items:[
     ['AI Health Dashboard','index.html'],
     ['Health Score','health-score.html'],
     ['Latest Reports','reports.html'],
     ['Book Test','booking.html'],
     ['AI Recommendations','recommender.html']]},
   {label:'Reports', href:'reports.html', icon:'reports', items:[
     ['All Reports','reports.html'],
     ['AI Analysis','report-insights.html'],
     ['Compare Reports','reports.html'],
     ['Health Timeline','trends.html']]},
   {label:'Book', href:'booking.html', icon:'book', items:[
     ['Tests','tests.html'],
     ['Packages','packages.html'],
     ['Home Collection','home-collection.html'],
     ['Lab Visit','booking.html?package=fullbody']]},
   {label:'Vanaja AI', href:'ai-assistant.html', icon:'ai', items:[
     ['Ask AI','ai-assistant.html'],
     ['Explain Report','report-insights.html'],
     ['Test Preparation','ai-assistant.html'],
     ['Health Education','trends.html'],
     ['🎙️ Voice AI','voice.html']]},
   {label:'Family', href:'family.html', icon:'profile', items:[
     ['Add Member','family.html'],
     ['View Reports','reports.html'],
     ['Health Overview','family.html']]},
   {label:'Profile', href:'membership.html', icon:'gear', items:[
     ['Personal Details','family.html'],
     ['Addresses','family.html'],
     ['Membership','membership.html'],
     ['Payments','membership.html'],
     ['Privacy & Consent','reminders.html']]},
  ];
  const ICONS2={...ICONS, gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>'};

  /* mega menu markup */
  const mega = `<div class="mega-wrap">
    ${NAV.map((col,i)=>`
    <div class="mega-item">
      <a href="${col.href}" class="mega-top${NAV.some(c=>c.items.some(it=>it[1]===location.pathname.split('/').pop())&&false)?'':''}" data-nav="${col.label}">${col.label}</a>
      <div class="mega-panel" role="menu" aria-label="${col.label} section">
        ${col.items.map(([lbl,href])=>`<a role="menuitem" href="${href}" class="mega-link">${lbl}</a>`).join('')}
      </div>
    </div>`).join('')}
  </div>`;

  const header = `
  <header class="topbar"><div class="container topbar-inner">
    <a class="brand" href="index.html" aria-label="Vanaja Diagnostic Centre home">
      <img src="assets/img/logo.png" alt="Vanaja Diagnostic Centre logo">
    </a>
    <nav class="topnav mega-nav" aria-label="Primary">${mega}</nav>
    <a class="icon-btn" href="reminders.html" title="Smart reminders" aria-label="Smart reminders" style="position:relative;text-decoration:none">🔔<span id="bellDot" style="position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:var(--maroon-600);display:none"></span></a>
    <button class="icon-btn" onclick="toggleLargeText()" title="Toggle large text (elder-friendly)" aria-label="Toggle large text">A⁺</button>
    <button class="icon-btn" onclick="toggleTheme()" title="Toggle dark mode" aria-label="Toggle dark mode">◐</button>
    <span id="authSlot"></span>
    <a class="btn btn-maroon btn-sm" href="booking.html">Book Test</a>
  </div>
  ${promo ? `<div class="container" style="padding:.35rem 0 .55rem">
      <a href="packages.html" style="text-decoration:none;display:block">
        <span class="badge-save">SAVE UP TO ${promo.percent}%</span>
        <span style="font-weight:700;font-size:.85rem;margin-left:.5rem;color:var(--maroon-600)">with Vanaja Diagnostic Centre · Free home collection</span>
      </a></div>` : ''}
  </header>`;

  const bottomNav = `
  <nav class="bottomnav glass" aria-label="Mobile">
    ${[['index.html','Home','home'],['booking.html','Book','book'],['reports.html','Reports','reports'],['ai-assistant.html','AI','ai'],['family.html','Profile','profile']]
      .map(([href,label,icon])=>`<a href="${href}"${active===label?' aria-current=\"page\"':''}>${ICONS[icon]}<span>${label}</span></a>`).join('')}
  </nav>`;

  const fab = `<a class="fab-ai" href="ai-assistant.html" aria-label="Ask Vanaja AI">${ICONS.ai}</a>`;

  const footer = `
  <footer class="footer"><div class="container section" style="display:grid;gap:1.4rem;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))">
    <div>
      <img src="assets/img/logo.png" alt="Vanaja Diagnostic Centre" style="height:52px;background:#fff;border-radius:10px;padding:.3rem">
      <p style="margin-top:.7rem;font-size:.88rem">ISO 9001:2015 certified laboratory with 18+ years of trusted diagnostic expertise in Hyderabad.</p>
    </div>
    <div><h4 style="color:#fff">Quick Links</h4><ul style="list-style:none;padding:0;font-size:.9rem;line-height:2">
      <li><a href="index.html">Home</a></li><li><a href="packages.html">Packages</a></li><li><a href="reports.html">My Reports</a></li><li><a href="membership.html">Vanaja Health+</a></li><li><a href="admin/index.html">Staff Login</a></li></ul></div>
    <div><h4 style="color:#fff">Services</h4><ul style="list-style:none;padding:0;font-size:.9rem;line-height:2">
      <li><a href="home-collection.html">Home Collection</a></li><li><a href="packages.html#fullbody">Full Body Checkup</a></li><li><a href="booking.html">Book a Test</a></li></ul></div>
    <div><h4 style="color:#fff">Contact</h4><ul style="list-style:none;padding:0;font-size:.9rem;line-height:2">
      <li><a href="tel:+919000011580">+91 90000 11580</a></li>
      <li><a href="mailto:vanajadiagnostic@gmail.com">vanajadiagnostic@gmail.com</a></li>
      <li>Kavadiguda Main Rd, Secunderabad – 500003</li></ul></div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,.08)">
    <div class="container disclaimer" style="margin:.9rem auto;border:none;background:transparent;color:var(--navy-300);border-radius:0;padding-left:0;padding-right:0">
      Medical disclaimer: AI-generated information is for educational and informational purposes and does not replace advice, diagnosis, or treatment from a qualified healthcare professional.
    </div>
    <div class="container" style="padding-bottom:1.2rem;font-size:.8rem;color:var(--navy-400)">© 2026 Vanaja Diagnostic Centre. All rights reserved.</div>
  </div></footer>`;

  return { header, bottomNav, fab, footer };
}

function mountChrome(active){
  applyPrefs();
  const c = buildChrome(active);
  const h = document.getElementById('chrome-header');
  const b = document.getElementById('chrome-bottom');
  const f = document.getElementById('chrome-footer');
  const fabHolder = document.getElementById('chrome-fab');
  if (h) h.innerHTML = c.header;
  if (b) b.innerHTML = c.bottomNav;
  if (f) f.innerHTML = c.footer;
  if (fabHolder) fabHolder.innerHTML = c.fab;
  syncChrome();
}

function syncChrome(){ /* hook for per-page refresh after theme toggles */
  /* auth slot: Sign-in button OR avatar menu */
  const slot=document.getElementById('authSlot');
  if(slot){
    let u=null; try{u=JSON.parse(sessionStorage.getItem('vd_session')||'null');}catch(_){}
    slot.innerHTML = u
      ? `<a href="profile.html" title="My profile" style="display:inline-flex;text-decoration:none">
           <span class="icon-btn" style="background:var(--grad-accent);color:#fff;font-weight:800">${(u.name||'U')[0].toUpperCase()}</span></a>`
      : `<a class="btn btn-ghost btn-sm" href="login.html">Sign in</a>`;
  }
  /* unread-reminder bell dot: shows unless every reminder was read on reminders.html */
  const dot=document.getElementById('bellDot');
  if(dot){
    let unread=3; /* 3 of the 4 demo notifications start unread */
    try{
      const total=4, read=new Set(JSON.parse(localStorage.getItem('vd_notif_read')||'[]'));
      unread=total-[...read].filter(i=>i<total).length;
    }catch(_){}
    dot.style.display=unread>0?'block':'none';
  }
}

/* ---------- FORMATTERS ---------- */
const fmtINR = n => n == null ? 'Enquire' : '₹' + Number(n).toLocaleString('en-IN');

/* ---------- BOOKING CART (demo state) ---------- */
function addToCart(id, type){
  const cart = JSON.parse(sessionStorage.getItem('vd_cart') || '[]');
  cart.push({ id, type });
  sessionStorage.setItem('vd_cart', JSON.stringify(cart));
  toast(`${type === 'package' ? 'Package' : 'Test'} added to booking`);
}
function toast(msg){
  let el = document.getElementById('vd-toast');
  if (!el){
    el = document.createElement('div'); el.id = 'vd-toast';
    el.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:110px;z-index:99;
      background:var(--navy-800);color:#fff;padding:.7rem 1.2rem;border-radius:999px;font-weight:700;
      font-size:.88rem;box-shadow:var(--shadow-3);opacity:0;transition:opacity .3s`;
    document.body.appendChild(el);
  }
  el.textContent = msg; el.style.opacity = '1';
  clearTimeout(el._t); el._t = setTimeout(()=> el.style.opacity='0', 2200);
}
