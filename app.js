/* Civet Engineering website: sheet-driven catalogue, enquiry list, admin. */
(function(){
'use strict';

const CFG = window.CIVET_CONFIG || {};
const TZ = 'Africa/Johannesburg';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s || '').toUpperCase().replace(/[\s\-]/g, '');
const slug = s => String(s || '').toLowerCase().replace(/!/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const R = n => 'R ' + Number(n).toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
const R0 = n => 'R ' + Math.round(Number(n)).toLocaleString('en-ZA');
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(_) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} }
};
const sast = d => d.toLocaleString('en-ZA', {timeZone:TZ, day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:false}) + ' SAST';

/* ================================================================ sheet */
const CAT_ORDER = ['SIMATIC S7-1200','SIMATIC S7-1500','ET 200SP I/O','SIMATIC HMI','SINAMICS drives','SIRIUS controls','SITOP power','LOGO!','Legacy S5'];
const CAT_KIND = {'simatic-s7-1200':'plc','simatic-s7-1500':'plc','et-200sp-i-o':'io','simatic-hmi':'hmi','sinamics-drives':'drive','sirius-controls':'contactor','sitop-power':'psu','logo':'logo','legacy-s5':'s5'};
const CAT_BLURB = {
  'simatic-s7-1200':'Compact PLCs and modules', 'simatic-s7-1500':'Advanced controllers',
  'et-200sp-i-o':'Distributed I/O on PROFINET', 'simatic-hmi':'Operator panels',
  'sinamics-drives':'Variable speed drives', 'sirius-controls':'Contactors and motor protection',
  'sitop-power':'24 V DC power supplies', 'logo':'Logic modules', 'legacy-s5':'Used, bench-tested S5'
};

function parseCSV(text){
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (q){
      if (c === '"'){ if (text[i+1] === '"'){ f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ','){ row.push(f); f = ''; }
    else if (c === '\n' || c === '\r'){
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f !== '' || row.length){ row.push(f); rows.push(row); }
  return rows;
}
function headerKey(h){
  const k = h.toLowerCase().replace(/[^a-z]/g, '');
  if (k.includes('part') || k === 'mlfb' || k.includes('ordernumber')) return 'part';
  if (k.includes('show')) return 'show';
  if (k.includes('price')) return 'price';
  if (k.includes('name') || k === 'product') return 'name';
  if (k.includes('categ')) return 'cat';
  if (k.includes('desc')) return 'desc';
  if (k.includes('stock') || k.includes('qty') || k.includes('quantity')) return 'stock';
  if (k.includes('condition')) return 'cond';
  if (k.includes('lead')) return 'lead';
  if (k.includes('feature')) return 'featured';
  if (k.includes('image') || k.includes('photo')) return 'img';
  return null;
}
const yes = v => /^(y|yes|true|1|x|✓)$/i.test(String(v || '').trim());
const numOrNull = v => { const t = String(v || '').replace(/[R\s ]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'); if (t === '') return null; const n = Number(t); return isFinite(n) ? n : NaN; };

function kindFor(name, catSlug){
  const n = name.toLowerCase();
  if (n.includes('memory card')) return 'card';
  if (/^cm\s/.test(n) || n.includes('communication')) return 'comms';
  if (n.includes('starter protector') || n.includes('3rv')) return 'msp';
  if (n.includes('logo')) return 'logo';
  return CAT_KIND[catSlug] || 'plc';
}

function buildCatalogue(csv){
  const all = parseCSV(csv);
  const hi = all.findIndex(r => r.some(c => String(c).trim() !== ''));
  const rows = hi < 0 ? [] : all.slice(hi);
  const warnings = [];
  if (!rows.length) return {products:[], warnings:[{row:1, msg:'The sheet is empty.'}], header:[], rows:[], badCells:{}, headerRow:0};
  const header = rows[0].map(h => h.trim());
  const keys = header.map(headerKey);
  const need = ['part','name','cat'];
  need.forEach(k => { if (!keys.includes(k)) warnings.push({row:1, msg:`Missing a “${k === 'part' ? 'Part number' : k === 'name' ? 'Product name' : 'Category'}” column.`}); });
  const seen = new Set(); const products = []; const badCells = {};
  rows.slice(1).forEach((r, i) => {
    if (!r.some(c => String(c).trim() !== '')) return;
    const rowNo = hi + i + 2; const o = {};
    keys.forEach((k, ci) => { if (k) o[k] = String(r[ci] == null ? '' : r[ci]).trim(); });
    const mark = (col, msg) => { warnings.push({row:rowNo, msg}); badCells[rowNo + ':' + keys.indexOf(col)] = true; };
    if (!o.part){ mark('part', `Row ${rowNo}: no part number, so this row is skipped.`); return; }
    const pk = norm(o.part);
    if (seen.has(pk)){ mark('part', `Row ${rowNo}: part number ${o.part} appears twice. Only the first row is used.`); return; }
    seen.add(pk);
    if (!o.name) mark('name', `Row ${rowNo}: ${o.part} has no product name.`);
    const price = numOrNull(o.price);
    if (Number.isNaN(price)) mark('price', `Row ${rowNo}: price “${o.price}” isn't a number.`);
    const stockN = numOrNull(o.stock);
    if (Number.isNaN(stockN)) mark('stock', `Row ${rowNo}: stock “${o.stock}” isn't a number. Treated as 0.`);
    if (yes(o.show) && (price == null || Number.isNaN(price))) mark('show', `Row ${rowNo}: “Show price” is Yes but there is no price, so it shows “Price on enquiry”.`);
    const cat = o.cat || 'Other';
    const catSlug = slug(cat);
    products.push({
      row:rowNo, part:o.part, key:pk, name:o.name || o.part, cat, catSlug,
      desc:o.desc || '', price:(price == null || Number.isNaN(price)) ? null : price,
      show:yes(o.show), stock:(stockN == null || Number.isNaN(stockN)) ? 0 : Math.max(0, Math.round(stockN)),
      used:/used/i.test(o.cond || ''), cond:o.cond || 'New', lead:o.lead || '',
      featured:yes(o.featured), img:/^https?:\/\//i.test(o.img || '') ? o.img : '',
      kind:kindFor(o.name || '', catSlug)
    });
  });
  return {products, warnings, header, rows, badCells, headerRow:hi};
}

const SHEET = {status:'loading', source:'builtin', syncedAt:null, error:'', products:[], warnings:[], header:[], rows:[], badCells:{}};
async function loadSheet(){
  let csv = window.BUILTIN_SHEET_CSV || '', source = 'builtin', error = '';
  if (CFG.sheetCsvUrl){
    try {
      const url = CFG.sheetCsvUrl + (CFG.sheetCsvUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const res = await fetch(url, {cache:'no-store'});
      if (!res.ok) throw new Error('The sheet answered ' + res.status);
      const text = await res.text();
      if (/^\s*</.test(text)) throw new Error('The link returned a web page, not CSV. Use File › Share › Publish to web › CSV.');
      csv = text; source = 'live';
    } catch (e) { error = e.message || 'Could not reach the sheet'; }
  }
  const cat = buildCatalogue(csv);
  Object.assign(SHEET, cat, {status:'ready', source, error, syncedAt:new Date()});
}
const P = () => SHEET.products;
const byKey = k => P().find(p => p.key === norm(k));
function categories(){
  const map = new Map();
  P().forEach(p => { if (!map.has(p.catSlug)) map.set(p.catSlug, {slug:p.catSlug, name:p.cat, n:0, kind:CAT_KIND[p.catSlug] || p.kind}); map.get(p.catSlug).n++; });
  return Array.from(map.values()).sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a.name), ib = CAT_ORDER.indexOf(b.name);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.name.localeCompare(b.name);
  });
}
function stockChip(p){
  if (p.used) return `<span class="chip used">Used · ${p.stock} in stock</span>`;
  if (p.stock > 0) return `<span class="chip in">In stock (${p.stock})</span>`;
  return `<span class="chip order">Order in${p.lead ? ' · ' + esc(p.lead) : ''}</span>`;
}
const hasPrice = p => p.show && p.price != null;
function priceHtml(p, big){
  if (hasPrice(p)) return big ? `<div class="price num">${R0(p.price)} <small class="muted" style="font-size:.9rem;font-weight:400">ex VAT</small></div>` : `<div class="price num">${R0(p.price)} <small>ex VAT</small></div>`;
  return big ? `<div class="price ask">Price on enquiry. We reply with a written quote.</div>` : `<div class="price ask">Price on enquiry</div>`;
}
function pic(p){
  const d = drawing(p.kind);
  if (!p.img) return d;
  return `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment(this.dataset.fb))" data-fb="${esc(d)}">`;
}

/* ================================================================ enquiry list (cart) */
let CART = store.get('civet-cart', []);
const saveCart = () => { store.set('civet-cart', CART); updateCartUI(); };
function addToCart(part, name, qty){
  const k = norm(part);
  const ex = CART.find(l => l.key === k);
  if (ex) ex.qty += qty; else CART.push({key:k, part, name, qty, alt:true});
  saveCart();
}
const cartUnits = () => CART.reduce((a, l) => a + l.qty, 0);

/* ================================================================ admin data (sample enquiries) */
const L = (part, qty, price, lead) => ({part, qty, price:price == null ? null : price, lead:lead || 'Ex stock'});
const SAMPLE_ENQ = [
  {ref:'ENQ-2026-0148', recv:'14 Sep, 08:12', ageH:2, name:'Thandi Mokoena', company:'Atlantis Extrusions', email:'t.mokoena@example.co.za', phone:'021 000 0148', needBy:'19 Sep', delivery:'Deliver to Atlantis', status:'new',
    note:'Two drives failed on the puller line. Same rating, alternatives fine if in stock.', lines:[L('6SL3210-5BE17-5UV0',2), L('3RV2011-1HA10',2)]},
  {ref:'ENQ-2026-0147', recv:'13 Sep, 16:40', ageH:18, name:'Pieter Botha', company:'Epping Cold Stores', email:'pbotha@example.co.za', phone:'021 000 0147', needBy:'30 Sep', delivery:'Collect in Bellville', status:'new',
    note:'Adding a third compressor panel.', lines:[L('6ES7214-1AG40-0XB0',1), L('6ES7155-6AU01-0BN0',1), L('6ES7131-6BH01-0BA0',3), Object.assign(L('6ES7132-6BH01-0BA0',2,null,'To confirm'), {name:'DQ 16×24VDC/0.5A ST'})]},
  {ref:'ENQ-2026-0146', recv:'11 Sep, 10:05', ageH:70, name:'Ayesha Davids', company:'Paarl Canning Co.', email:'adavids@example.co.za', phone:'021 000 0146', needBy:'ASAP', delivery:'Deliver to Paarl', status:'quoting',
    note:'Retort line still on S5. Need a spare CPU while we plan the upgrade.', lines:[L('6ES5944-7UB11',1,8500), L('6ES5951-7LD21',1)]},
  {ref:'ENQ-2026-0145', recv:'10 Sep, 14:22', ageH:90, name:'Craig Jacobs', company:'Montague Gardens Packaging', email:'cjacobs@example.co.za', phone:'021 000 0145', needBy:'2 Oct', delivery:'Deliver to Montague Gardens', status:'sent', quote:'Q-2026-0091',
    note:'New wrapper line, panel to follow.', lines:[L('6ES7511-1AK02-0AB0',1,24500), L('6AV2123-2GB03-0AX0',1,16800), L('6EP1333-2BA20',2,3100)]},
  {ref:'ENQ-2026-0144', recv:'9 Sep, 09:03', ageH:120, name:'Lerato Khumalo', company:'Stellenbosch Bottling', email:'lkhumalo@example.co.za', phone:'021 000 0144', needBy:'15 Sep', delivery:'Deliver to Stellenbosch', status:'won', quote:'Q-2026-0089',
    note:'', lines:[L('6SL3210-1KE11-8UF2',3,9900,'1–2 weeks'), L('3RT2016-1AP01',12,560)]},
  {ref:'ENQ-2026-0143', recv:'8 Sep, 11:47', ageH:140, name:'Riaan Smit', company:'Blackheath Plastics', email:'rsmit@example.co.za', phone:'021 000 0143', needBy:'12 Sep', delivery:'Collect in Bellville', status:'lost', quote:'Q-2026-0087',
    note:'Needed same day.', lines:[L('6ES7515-2AM02-0AB0',1,52000,'3–4 weeks')]},
  {ref:'ENQ-2026-0142', recv:'5 Sep, 15:30', ageH:210, name:'Nomsa Dlamini', company:'Saldanha Fish Processors', email:'ndlamini@example.co.za', phone:'022 000 0142', needBy:'10 Sep', delivery:'Courier to Saldanha', status:'won', quote:'Q-2026-0085',
    note:'', lines:[L('6ES7212-1BE40-0XB0',2,6900), L('6ES7954-8LC03-0AA0',2,1350), L('6ED1052-1MD08-0BA1',4,3400)]}
];
let ENQ = store.get('civet-enq-v4', null) || SAMPLE_ENQ;
const saveEnq = () => store.set('civet-enq-v4', ENQ);
let nextRef = Math.max(148, ...ENQ.map(e => +e.ref.slice(-4))) + 1;
let nextQuote = 92;
const STATUS = {new:'New', quoting:'Quoting', sent:'Quote sent', won:'Won', lost:'Lost'};
const LEADS = ['Ex stock','1–2 weeks','3–4 weeks','6+ weeks','To confirm'];
const lineName = l => { const p = byKey(l.part); return p ? p.name : (l.name || 'Not in the catalogue'); };
const subtotal = e => e.lines.reduce((a, l) => a + (Number(l.price) || 0) * l.qty, 0);
const isLate = e => (e.status === 'new' || e.status === 'quoting') && e.ageH > 24;

/* ================================================================ UI helpers */
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }
function openModal(html){ $('#modalCard').innerHTML = `<button class="modal-x" data-act="close-modal" aria-label="Close">×</button>${html}`; $('#modal').hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(){ $('#modal').hidden = true; document.body.style.overflow = ''; }
function openDrawer(){ $('#drawer').hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => $('#dq') && $('#dq').focus(), 50); }
function closeDrawer(){ $('#drawer').hidden = true; document.body.style.overflow = ''; }

function updateCartUI(){
  $$('[data-cart-count]').forEach(el => { el.textContent = CART.length; el.hidden = CART.length === 0; });
  const r = route();
  const show = CART.length > 0 && !['enquiry','admin'].includes(r.view);
  $('#mbar').hidden = !show;
  document.body.classList.toggle('has-mbar', show);
  if (show) $('#mbarText').innerHTML = `${CART.length} part${CART.length > 1 ? 's' : ''} on your list<small>${cartUnits()} unit${cartUnits() === 1 ? '' : 's'} · ask for a price</small>`;
  const n = ENQ.filter(e => e.status === 'new').length;
  $$('[data-new-count]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
}

function card(p){
  const line = CART.find(l => l.key === p.key);
  return `<article class="pcard">
    <a class="pic" href="#/p/${encodeURIComponent(p.part)}" aria-label="${esc(p.name)}">${pic(p)}<span class="badge">${stockChip(p)}</span></a>
    <div class="body">
      <div class="cat-l">${esc(p.cat)}</div>
      <h3><a href="#/p/${encodeURIComponent(p.part)}">${esc(p.name)}</a></h3>
      <div class="pn">${esc(p.part)}</div>
      ${priceHtml(p)}
      <div class="act">${line
        ? `<div class="stepper" role="group" aria-label="Quantity"><button data-act="dec" data-key="${p.key}" aria-label="One less">−</button><span class="num">${line.qty} on list</span><button data-act="inc" data-key="${p.key}" aria-label="One more">+</button></div>`
        : `<button class="btn btn-red" data-act="add" data-part="${esc(p.part)}">Add to enquiry</button>`}</div>
    </div>
  </article>`;
}

/* ================================================================ router */
function route(){
  const raw = (location.hash || '#/').slice(1);
  const [path, qs] = raw.split('?');
  const q = new URLSearchParams(qs || '');
  const parts = path.split('/').filter(Boolean);
  let view = 'home';
  if (parts[0] === 'products') view = 'products';
  else if (parts[0] === 'p') view = 'product';
  else if (parts[0] === 'enquiry') view = 'enquiry';
  else if (parts[0] === 'progress') view = 'progress';
  else if (parts[0] === 'admin') view = 'admin';
  return {view, parts, q};
}
let lastPath = null;
function render(){
  const r = route();
  const isAdmin = r.view === 'admin';
  $('#site').hidden = isAdmin;
  $('#admin').hidden = !isAdmin;
  closeDrawer();
  $$('.nav a, .drawer nav a').forEach(a => a.removeAttribute('aria-current'));
  const navKey = {home:'home', products:'products', product:'products', enquiry:'enquiry'}[r.view];
  $$(`[data-nav="${navKey}"]`).forEach(a => a.setAttribute('aria-current', 'page'));
  if (SHEET.status !== 'ready'){ $('#main').innerHTML = `<div class="wrap" style="padding:60px 16px"><p class="muted">Loading products…</p></div>`; return; }
  if (r.view === 'home') renderHome();
  if (r.view === 'products') renderProducts(r);
  if (r.view === 'product') renderProduct(decodeURIComponent(r.parts[1] || ''));
  if (r.view === 'enquiry') renderEnquiry();
  if (r.view === 'progress') renderProgress();
  if (isAdmin) renderAdmin(r);
  updateCartUI();
  const pathOnly = (location.hash || '#/').split('?')[0];
  if (pathOnly !== lastPath){ window.scrollTo(0, 0); lastPath = pathOnly; }
  const t = {home:'Siemens automation parts, Cape Town', products:'Products', product:'Product', enquiry:'Your enquiry list', progress:'Progress', admin:'Admin'}[r.view];
  document.title = 'Civet Engineering · ' + t;
}

/* ================================================================ pages: home */
function renderHome(){
  const cats = categories();
  const feat = P().filter(p => p.featured).slice(0, 8);
  const list = feat.length ? feat : P().slice(0, 8);
  $('#main').innerHTML = `
  <section class="hero">
    <div class="wrap">
      <div>
        <div class="eyebrow">Siemens automation · Bellville, Cape Town</div>
        <h1>Send us the order numbers. We'll send back <em>the price.</em></h1>
        <p class="lede">SIMATIC, SINAMICS and SIRIUS parts, new and used. Build an enquiry list and ask for a quote. An engineer checks stock, compatibility and lead time before pricing it.</p>
        <div class="hero-cta">
          <a class="btn btn-red" href="#/products">Browse products</a>
          <a class="btn" href="#/products?c=legacy-s5">Used S5 parts</a>
        </div>
        <div class="trust"><span>Established 1994</span><span>No account needed</span><span>Written quote, usually same day</span></div>
      </div>
      <div class="bom">
        <div class="bom-head"><h2>Paste a parts list</h2><span>One part per line</span></div>
        <label for="bomText" class="sr">Parts list</label>
        <textarea id="bomText" spellcheck="false" placeholder="2 x 6ES7214-1AG40-0XB0&#10;6ES7 131-6BH01-0BA0  qty 8&#10;3RT2016-1AP01, 10"></textarea>
        <ul class="bom-res" id="bomRes" aria-live="polite"></ul>
        <div class="bom-foot"><small>Parts we don't list still go on the enquiry. We'll source them.</small><button class="btn btn-ink" data-act="paste">Add to enquiry list</button></div>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head"><div><div class="eyebrow">Shop by range</div><h2>Product ranges</h2></div><a class="link" href="#/products">All ${P().length} products</a></div>
      <div class="cats">${cats.map(c => `<a class="cat" href="#/products?c=${c.slug}"><div class="pic">${drawing(c.kind)}</div><div class="t"><b>${esc(c.name)}</b><span class="n">${c.n}</span></div></a>`).join('')}</div>
    </div>
  </section>

  <section class="sec alt">
    <div class="wrap">
      <div class="sec-head"><div><div class="eyebrow">Ready to go</div><h2>In stock in Bellville</h2></div><a class="link" href="#/products?stock=1">See all stock</a></div>
      <div class="grid">${list.map(card).join('')}</div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head"><div><div class="eyebrow">How it works</div><h2>From parts list to quote</h2></div></div>
      <div class="svcs">
        ${[['1','Add parts','Browse, or paste order numbers from your BOM.'],['2','Send the enquiry','Name and email is all we need. No account.'],['3','We check it','Stock, compatibility, alternatives and lead time.'],['4','Get a written quote','Accept it and we order or dispatch.']]
          .map(s => `<div class="svc"><div style="width:44px;height:44px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;font-family:var(--display);font-weight:850;font-size:1.2rem">${s[0]}</div><div><h3>${s[1]}</h3><p>${s[2]}</p></div></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="band" id="s5">
    <div class="wrap">
      <div>
        <div class="eyebrow" style="color:#fff;opacity:.85">Legacy SIMATIC S5</div>
        <h2>Still running S5? Keep it going, then move to S7 when you're ready.</h2>
        <p>We keep used, bench-tested S5 modules for breakdowns, and plan and program S5-to-S7 migrations so the line isn't down for long.</p>
        <div class="hero-cta"><a class="btn btn-white" href="#/products?c=legacy-s5">See S5 stock</a><a class="btn" href="#contact" data-scroll="contact">Ask about a migration</a></div>
      </div>
      <div class="facts">
        <div><b>S5-115U</b><span>CPUs and power supplies</span></div>
        <div><b>S5 → S7-1500</b><span>Migration and reprogramming</span></div>
        <div><b>Bench-tested</b><span>Every used module</span></div>
        <div><b>Callouts</b><span>Breakdown fault finding</span></div>
      </div>
    </div>
  </section>

  <section class="sec" id="services">
    <div class="wrap">
      <div class="sec-head"><div><div class="eyebrow">Services</div><h2>We build it, program it and fix it too</h2></div></div>
      <div class="svcs">${[
        ['panel','Control panel building','Designed, wired and tested before it leaves the workshop.'],
        ['plc','PLC programming','SIMATIC S7 in TIA Portal and STEP 7, plus S5-to-S7 conversions.'],
        ['drive','Drive commissioning','SINAMICS set-up, parameterisation and fault finding on site.'],
        ['cad','Electrical drawings','Drawings for new panels, and as-built updates for old ones.'],
        ['callout','Callouts and repairs','On-site fault finding and repair on Siemens equipment.'],
        ['design','Project design','From the I/O list to a commissioned system.']
      ].map(s => `<div class="svc">${vignette(s[0])}<div><h3>${s[1]}</h3><p>${s[2]}</p></div></div>`).join('')}</div>
    </div>
  </section>

  <section class="sec alt" id="about">
    <div class="wrap about">
      <div class="img">${photoArt('workshop')}</div>
      <div>
        <div class="eyebrow">About us</div>
        <h2>Siemens automation specialists since 1994</h2>
        <p>Civet Engineering supplies and supports Siemens automation equipment from our workshop in Bellville. We stock current SIMATIC, SINAMICS and SIRIUS ranges, keep used S5 parts for older plants, and build, program and commission control systems.</p>
        <p>When you send an enquiry, an engineer reads it, not a script. We check the part suits your application and tell you if there's a better or faster alternative.</p>
        <div class="stats"><div><b>1994</b><span>Established</span></div><div><b>S5–S7</b><span>Old and new</span></div><div><b>Bellville</b><span>Cape Town</span></div></div>
      </div>
    </div>
  </section>

  <section class="sec" id="contact">
    <div class="wrap">
      <div class="sec-head"><div><div class="eyebrow">Contact</div><h2>Talk to an engineer</h2></div></div>
      <div class="contact">
        <div class="c"><b>Phone</b><span>${esc(CFG.phone)}</span></div>
        <div class="c"><b>Email</b><span>${esc(CFG.email)}</span></div>
        <div class="c"><b>Workshop</b><span>${esc(CFG.address)}</span></div>
        <div class="c"><b>Hours</b><span>${esc(CFG.hours)}</span></div>
      </div>
    </div>
  </section>`;
}

/* ================================================================ pages: products */
function renderProducts(r){
  const c = r.q.get('c') || 'all';
  const qs = r.q.get('q') || '';
  const stockOnly = r.q.get('stock') === '1';
  const sort = r.q.get('sort') || 'range';
  const cats = categories();
  const catName = c === 'all' ? 'All products' : (cats.find(x => x.slug === c) || {name:'Products'}).name;
  $('#main').innerHTML = `
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/products">Products</a>${c !== 'all' ? `<span>/</span><span>${esc(catName)}</span>` : ''}</nav>
    <h1 class="page-title">${esc(catName)}</h1>
    ${c !== 'all' && CAT_BLURB[c] ? `<p class="muted">${esc(CAT_BLURB[c])}</p>` : ''}
    <div class="shop">
      <aside class="filters" aria-label="Ranges">
        <h4>Ranges</h4>
        <button data-act="cat" data-c="all" aria-pressed="${c === 'all'}">All products <span class="c">${P().length}</span></button>
        ${cats.map(x => `<button data-act="cat" data-c="${x.slug}" aria-pressed="${c === x.slug}">${esc(x.name)} <span class="c">${x.n}</span></button>`).join('')}
      </aside>
      <div style="min-width:0;display:grid;gap:14px;align-content:start">
        <div class="fchips" role="group" aria-label="Ranges">
          <button class="fchip" data-act="cat" data-c="all" aria-pressed="${c === 'all'}">All</button>
          ${cats.map(x => `<button class="fchip" data-act="cat" data-c="${x.slug}" aria-pressed="${c === x.slug}">${esc(x.name)}</button>`).join('')}
        </div>
        <div class="hsearch" style="display:block;max-width:none;margin:0">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input id="pq" type="search" inputmode="search" placeholder="Search by name or order number, e.g. 6ES7214" value="${esc(qs)}" aria-label="Search products">
        </div>
        <div class="toolbar">
          <span class="count-l" id="countL"></span>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <label class="toggle"><input type="checkbox" id="stockOnly" ${stockOnly ? 'checked' : ''}> In stock only</label>
            <label class="sr" for="sortSel">Sort</label>
            <select id="sortSel"><option value="range" ${sort==='range'?'selected':''}>Sort: range</option><option value="name" ${sort==='name'?'selected':''}>Name A–Z</option><option value="stock" ${sort==='stock'?'selected':''}>Most in stock</option></select>
          </div>
        </div>
        <div class="grid" id="pgrid"></div>
      </div>
    </div>
  </div>`;
  drawGrid();
}
function currentFilters(){
  const r = route();
  return {c:r.q.get('c') || 'all', q:($('#pq') ? $('#pq').value : r.q.get('q')) || '', stock:$('#stockOnly') ? $('#stockOnly').checked : false, sort:$('#sortSel') ? $('#sortSel').value : 'range'};
}
function setQuery(f, replace){
  const q = new URLSearchParams();
  if (f.c && f.c !== 'all') q.set('c', f.c);
  if (f.q) q.set('q', f.q);
  if (f.stock) q.set('stock', '1');
  if (f.sort && f.sort !== 'range') q.set('sort', f.sort);
  const h = '#/products' + (q.toString() ? '?' + q : '');
  if (replace) history.replaceState(null, '', h); else location.hash = h;
}
function drawGrid(){
  const f = currentFilters();
  const nq = norm(f.q);
  let items = P().filter(p => (f.c === 'all' || p.catSlug === f.c) && (!f.stock || p.stock > 0) && (!nq || norm(p.name + p.part + p.desc + p.cat).includes(nq)));
  if (f.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  if (f.sort === 'stock') items.sort((a, b) => b.stock - a.stock);
  $('#countL').textContent = `${items.length} product${items.length === 1 ? '' : 's'}`;
  $('#pgrid').innerHTML = items.length ? items.map(card).join('') :
    `<div class="empty" style="grid-column:1/-1"><b>No listed parts match “${esc(f.q)}”.</b><br>We can still source it. <button class="link" data-act="add-unlisted" data-part="${esc(f.q)}">Add “${esc(f.q)}” to your enquiry</button></div>`;
}

/* ================================================================ pages: product */
function renderProduct(part){
  const p = byKey(part);
  if (!p){
    $('#main').innerHTML = `<div class="wrap" style="padding:40px 16px 60px"><h1 class="page-title">We don't list ${esc(part)} online</h1><p class="muted" style="margin:8px 0 18px">We can usually still source it. Add it to your enquiry and we'll come back with a price and lead time.</p><button class="btn btn-red" data-act="add-unlisted" data-part="${esc(part)}">Add ${esc(part)} to enquiry</button> <a class="btn" href="#/products">Browse products</a></div>`;
    return;
  }
  const line = CART.find(l => l.key === p.key);
  const related = P().filter(x => x.catSlug === p.catSlug && x.key !== p.key).slice(0, 4);
  $('#main').innerHTML = `
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/products?c=${p.catSlug}">${esc(p.cat)}</a><span>/</span><span>${esc(p.part)}</span></nav>
    <div class="pdp">
      <div class="gallery">${pic(p)}</div>
      <div>
        <div class="eyebrow">${esc(p.cat)}</div>
        <h1>${esc(p.name)}</h1>
        <div class="pn-row"><span class="pn">${esc(p.part)}</span><button class="btn btn-ghost btn-sm" data-act="copy" data-code="${esc(p.part)}">Copy</button>${stockChip(p)}</div>
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
        <div class="buybox">
          ${priceHtml(p, true)}
          <div class="qty">
            <div class="stepper" role="group" aria-label="Quantity"><button data-act="pdq" data-d="-1" aria-label="One less">−</button><span class="num" id="pdqv">${line ? line.qty : 1}</span><button data-act="pdq" data-d="1" aria-label="One more">+</button></div>
            <button class="btn btn-red" data-act="pdadd" data-part="${esc(p.part)}">${line ? 'Update enquiry' : 'Add to enquiry'}</button>
          </div>
          <p class="note">${line ? `${line.qty} already on your list. ` : ''}No payment here. You'll get a written quote by email.</p>
        </div>
        <dl class="specs">
          <div><dt>Order number</dt><dd class="mono">${esc(p.part)}</dd></div>
          <div><dt>Range</dt><dd>${esc(p.cat)}</dd></div>
          <div><dt>Condition</dt><dd>${p.used ? 'Used, bench-tested' : 'New'}</dd></div>
          <div><dt>Stock</dt><dd>${p.stock > 0 ? p.stock + ' in Bellville' : 'Ordered in for you'}</dd></div>
          <div><dt>Lead time</dt><dd>${esc(p.lead || (p.stock > 0 ? 'Ex stock' : 'Confirmed on the quote'))}</dd></div>
        </dl>
      </div>
    </div>
    ${related.length ? `<section style="padding-bottom:56px"><div class="sec-head"><h2 style="font-size:1.4rem">More in ${esc(p.cat)}</h2></div><div class="grid">${related.map(card).join('')}</div></section>` : ''}
  </div>`;
}

/* ================================================================ pages: enquiry */
let submitted = null;
function renderEnquiry(){
  if (submitted){
    const e = submitted;
    $('#main').innerHTML = `<div class="wrap"><div class="done">
      <div class="eyebrow" style="margin-top:28px">Enquiry sent</div>
      <h1 class="page-title">Thank you, ${esc(e.name.split(' ')[0])}</h1>
      <div class="ref">${e.ref}</div>
      <p>Your enquiry is with our sales desk. We'll check stock and lead times and email a written quote to <b>${esc(e.email)}</b>. Keep this reference if you call us.</p>
      <ul>${e.lines.map(l => `<li><span><span class="pn">${esc(l.part)}</span><br>${esc(lineName(l))}</span><span class="num">× ${l.qty}</span></li>`).join('')}</ul>
      <a class="btn btn-red" href="#/products">Back to products</a>
    </div></div>`;
    return;
  }
  if (!CART.length){
    $('#main').innerHTML = `<div class="wrap" style="padding:40px 16px 64px"><h1 class="page-title">Your enquiry list is empty</h1><p class="muted" style="margin:8px 0 20px">Add parts from the catalogue, or paste order numbers on the home page.</p><a class="btn btn-red" href="#/products">Browse products</a></div>`;
    return;
  }
  const draft = store.get('civet-form', {});
  $('#main').innerHTML = `
  <div class="wrap">
    <nav class="crumbs"><a href="#/">Home</a><span>/</span><span>Enquiry list</span></nav>
    <h1 class="page-title">Your enquiry list</h1>
    <p class="muted">${CART.length} part${CART.length > 1 ? 's' : ''}, ${cartUnits()} units. Prices come back on a written quote.</p>
    <div class="enq" style="margin-top:16px">
      <div>
        <div class="lines">${CART.map(l => { const p = byKey(l.part); return `<div class="line">
          <div class="th">${p ? drawing(p.kind) : '?'}</div>
          <div style="min-width:0">
            <h3>${p ? `<a href="#/p/${encodeURIComponent(p.part)}" style="text-decoration:none">${esc(p.name)}</a>` : 'Not listed online'}</h3>
            <div class="meta"><span class="pn">${esc(l.part)}</span>${p ? stockChip(p) : '<span class="chip used">We\'ll source it</span>'}</div>
            <label class="opt"><input type="checkbox" data-act="alt" data-key="${l.key}" ${l.alt ? 'checked' : ''}> An alternative part is OK</label>
          </div>
          <div class="ctrl">
            <div class="stepper" role="group" aria-label="Quantity"><button data-act="dec" data-key="${l.key}" aria-label="One less">−</button><span class="num">${l.qty}</span><button data-act="inc" data-key="${l.key}" aria-label="One more">+</button></div>
            <button class="btn btn-ghost btn-sm" data-act="remove" data-key="${l.key}">Remove</button>
          </div>
        </div>`; }).join('')}
          <div class="lines-foot">Missing something? <a href="#/products">Keep browsing</a> or paste order numbers on the <a href="#/">home page</a>.</div>
        </div>
      </div>
      <aside class="form-card">
        <h2>Where should we send the quote?</h2>
        <p class="note">No account needed. We only use this to quote you.</p>
        <form class="form" id="enqForm" novalidate>
          <div class="field"><label for="f-name">Your name</label><input id="f-name" autocomplete="name" value="${esc(draft.name || '')}"></div>
          <div class="field"><label for="f-co">Company <i>(optional)</i></label><input id="f-co" autocomplete="organization" value="${esc(draft.co || '')}"></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" type="email" inputmode="email" autocomplete="email" value="${esc(draft.email || '')}"></div>
          <div class="field"><label for="f-phone">Phone <i>(optional)</i></label><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(draft.phone || '')}"></div>
          <div class="row2">
            <div class="field"><label for="f-del">Delivery</label><select id="f-del"><option>Collect in Bellville</option><option>Deliver / courier</option></select></div>
            <div class="field"><label for="f-need">Needed by <i>(optional)</i></label><input id="f-need" type="date"></div>
          </div>
          <div class="field"><label for="f-note">Notes for the engineer <i>(optional)</i></label><textarea id="f-note" placeholder="What's it for? Any part you'd accept instead?">${esc(draft.note || '')}</textarea></div>
          <div class="err" id="f-err" hidden role="alert" style="color:var(--red);font-weight:700"></div>
          <button class="btn btn-red btn-block" type="submit" style="min-height:52px;font-size:1.05rem">Request quote</button>
          <p class="note">Quotes are in rand, ex VAT, valid for 14 days.</p>
        </form>
      </aside>
    </div>
  </div>`;
}

/* ================================================================ pages: progress */
const CHANGELOG = [
  {v:'Version 5', d:'28 Sep 2026', h:'A link that opens on any phone', items:[
    'The site now has its own web address. It opens straight from WhatsApp, with no login or app.',
    'Sharing the link shows a Civet preview card in WhatsApp.',
    'Hidden from Google until the real site launches.']},
  {v:'Version 4', d:'28 Sep 2026', h:'A real website, run from a Google Sheet', items:[
    'Every product now comes from one Google Sheet: part number, name, range, description, price, stock, lead time.',
    'Edit the sheet and the website updates. No code, no login to the site needed.',
    'White and red, rebuilt for phones first and checked on desktop.',
    'Proper product pages, search, range filters and an "in stock only" switch.',
    'Admin shows the sheet, when it last synced, and flags mistakes like a missing price.']},
  {v:'Version 3', d:'27 Sep 2026', h:'Red and white', items:['First red and white repaint.','This progress page.']},
  {v:'Version 2', d:'27 Sep 2026', h:'Pictures everywhere', items:['Drawn product images.','Logo mark: a C cut through by a DIN rail.','Quote preview in admin.']},
  {v:'Version 1', d:'14 Sep 2026', h:'First working mockup', items:['Shop with no public prices.','Paste a BOM of Siemens order numbers.','Admin that prices lines and sends quotes.']}
];
const WAITING = [
  'Create the Google Sheet from the template and publish it (5 minutes, steps included).',
  'Phone number, email, street address and workshop hours.',
  'Photos: the workshop, a wired panel, a job on site.',
  'Payment terms and banking details for the quote footer.',
  'Confirm the Siemens partner wording we may use.'
];
const NEXT = ['Connect the live sheet and host the site at its own address.','Email the customer a receipt and the quote itself.','Admin behind a proper login.','A web address: civet.co.za or similar.'];
function renderProgress(){
  $('#main').innerHTML = `<div class="wrap">
    <nav class="crumbs"><a href="#/">Home</a><span>/</span><span>Progress</span></nav>
    <h1 class="page-title">What has been built so far</h1>
    <p class="muted">Last updated 28 September 2026. This link always shows the newest version.</p>
    <div class="live"><div><b>You're on the live link</b><p class="muted">Bookmark it. Every time work is done, refresh and the newest version is here.</p></div>
      <div class="hero-cta" style="margin:0"><button class="btn btn-red" data-act="copylink">Copy the link</button><a class="btn" href="#/">Open the site</a></div></div>
    <div class="prog">
      <div>${CHANGELOG.map(c => `<div class="tl-item"><div class="when"><b>${c.v}</b>${c.d}</div><div><h3>${esc(c.h)}</h3><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div></div>`).join('')}</div>
      <div>
        <div class="card"><h3>Waiting on you</h3><ul class="todo">${WAITING.map(w => `<li><span class="b"></span><span>${esc(w)}</span></li>`).join('')}</ul></div>
        <div class="card"><h3>Next up</h3><ul class="todo">${NEXT.map(w => `<li><span class="b"></span><span>${esc(w)}</span></li>`).join('')}</ul></div>
      </div>
    </div>
  </div>`;
}

/* ================================================================ admin */
function renderAdmin(r){
  const sub = r.parts[1] || 'enquiries';
  $$('#admin .side nav a').forEach(a => a.setAttribute('aria-current', a.dataset.anav === (sub === 'e' ? 'enquiries' : sub) ? 'page' : 'false'));
  const newN = ENQ.filter(e => e.status === 'new').length, late = ENQ.filter(isLate).length, sent = ENQ.filter(e => e.status === 'sent').length;
  $('#attn').innerHTML = `<b>Needs attention</b><a href="#/admin?f=new"><span>Unquoted</span><span class="num">${newN}</span></a><a href="#/admin?f=late"><span>Waiting over 24 h</span><span class="num">${late}</span></a><a href="#/admin?f=sent"><span>Awaiting reply</span><span class="num">${sent}</span></a>`;
  if (sub === 'e') return adminDetail(decodeURIComponent(r.parts[2] || ''));
  if (sub === 'products') return adminProducts();
  adminEnquiries(r.q.get('f') || 'all');
}
function adminEnquiries(f){
  $('#admTitle').textContent = 'Enquiries';
  const cnt = s => ENQ.filter(e => e.status === s).length;
  const late = ENQ.filter(isLate).length;
  const sentVal = ENQ.filter(e => e.status === 'sent').reduce((a, e) => a + subtotal(e), 0);
  const wonVal = ENQ.filter(e => e.status === 'won').reduce((a, e) => a + subtotal(e), 0);
  const list = ENQ.filter(e => f === 'all' || (f === 'late' ? isLate(e) : e.status === f));
  $('#admBody').innerHTML = `
    ${syncLine()}
    <div class="tiles">
      <div class="tile hot"><div class="l">New</div><div class="v">${cnt('new')}</div><div class="d">Not quoted yet</div></div>
      <div class="tile ${late ? 'warn' : ''}"><div class="l">Over 24 h</div><div class="v">${late}</div><div class="d">Still waiting</div></div>
      <div class="tile"><div class="l">Quotes out</div><div class="v">${cnt('sent')}</div><div class="d num">${R0(sentVal)} ex VAT</div></div>
      <div class="tile"><div class="l">Won, September</div><div class="v num">${R0(wonVal)}</div><div class="d">${cnt('won')} won · ${cnt('lost')} lost</div></div>
    </div>
    <div class="tabs" role="group" aria-label="Filter">${['all','new','late','quoting','sent','won','lost'].map(t => `<button data-act="afilter" data-f="${t}" aria-pressed="${f === t}">${t === 'all' ? 'All' : t === 'late' ? 'Over 24 h' : STATUS[t]}<span class="c">${t === 'all' ? ENQ.length : t === 'late' ? late : cnt(t)}</span></button>`).join('')}</div>
    <div class="panel">
      <div class="ehead"><span>Reference</span><span>Received</span><span>Customer</span><span>Parts</span><span>Needed by</span><span style="text-align:right">Value</span><span>Status</span></div>
      <div class="elist">${list.map(e => { const v = subtotal(e); return `<a class="erow" href="#/admin/e/${e.ref}">
        <span class="mono d-only" style="font-size:.85rem">${e.ref}</span>
        <span class="d-only num">${esc(e.recv)}${isLate(e) ? `<div class="late">${Math.floor(e.ageH / 24)} days waiting</div>` : ''}</span>
        <span><span class="co">${esc(e.company || e.name)}</span><br><span class="sub">${e.company ? esc(e.name) : 'No company given'}<span class="m-only"> · ${e.ref} · ${esc(e.recv)}</span></span>${isLate(e) ? `<span class="late m-only"><br>${Math.floor(e.ageH / 24)} days waiting</span>` : ''}</span>
        <span class="d-only num">${e.lines.length}</span>
        <span class="d-only">${esc(e.needBy)}</span>
        <span class="r num d-only">${v ? R0(v) : '<span class="sub">not priced</span>'}</span>
        <span class="r"><span class="pill ${e.status}">${STATUS[e.status]}</span><span class="m-only sub num"><br>${v ? R0(v) : e.lines.length + ' parts'}</span></span>
      </a>`; }).join('') || '<p style="padding:24px 16px" class="muted">Nothing here.</p>'}</div>
    </div>`;
}
function margins(e){
  let cost = 0, sell = 0;
  e.lines.forEach(l => { const p = byKey(l.part); if (p && p.price != null && l.price){ cost += p.price * 0.78 * l.qty; sell += l.price * l.qty; } });
  return sell ? Math.round((sell - cost) / sell * 100) : null;
}
function totalsHtml(e){
  const s = subtotal(e), m = margins(e);
  return `<span>Subtotal</span><span>${R(s)}</span><span>VAT 15%</span><span>${R(s * 0.15)}</span><span class="t">Total</span><span class="t">${R(s * 1.15)}</span>${m != null ? `<span class="m">Margin on catalogue lines</span><span class="m">${m}%</span>` : ''}`;
}
function adminDetail(ref){
  const e = ENQ.find(x => x.ref === ref);
  if (!e){ adminEnquiries('all'); return; }
  $('#admTitle').textContent = e.ref;
  const edit = e.status === 'new' || e.status === 'quoting';
  const acts = edit
    ? `<button class="btn" data-act="list-prices" data-ref="${e.ref}">Fill sheet prices</button><button class="btn" data-act="draft" data-ref="${e.ref}">Save draft</button><button class="btn btn-red" data-act="send" data-ref="${e.ref}">Send quote</button>`
    : e.status === 'sent'
      ? `<button class="btn" data-act="status" data-s="quoting" data-ref="${e.ref}">Revise</button><button class="btn" data-act="status" data-s="lost" data-ref="${e.ref}">Mark lost</button><button class="btn btn-ink" data-act="status" data-s="won" data-ref="${e.ref}">Mark won</button>`
      : `<button class="btn" data-act="status" data-s="quoting" data-ref="${e.ref}">Reopen</button>`;
  $('#admBody').innerHTML = `
    <a href="#/admin" class="link" style="text-decoration:none">← All enquiries</a>
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between">
      <div><h2 style="font-family:var(--display);font-weight:850;font-size:1.5rem">${esc(e.company || e.name)}</h2><p class="muted">Received ${esc(e.recv)} · needed by ${esc(e.needBy)}${e.quote ? ' · ' + e.quote : ''}</p></div>
      <span class="pill ${e.status}" style="font-size:.9rem;padding:5px 12px">${STATUS[e.status]}</span>
    </div>
    <div class="det">
      <div class="panel">
        <div class="panel-h"><h2>Quote</h2><button class="btn btn-sm" data-act="preview" data-ref="${e.ref}">Preview quote</button></div>
        <div class="qlines">${e.lines.map((l, i) => { const p = byKey(l.part); return `<div class="qline">
          <div class="th">${p ? drawing(p.kind) : '?'}</div>
          <div style="min-width:0"><b>${esc(lineName(l))}</b><div class="pn">${esc(l.part)} · qty ${l.qty}</div>
            <div class="muted" style="font-size:.82rem">${p ? `Sheet price ${p.price != null ? R0(p.price) : 'not set'} · ${p.stock} in stock` : 'Not in the sheet: check the supplier price'}</div></div>
          <div class="inputs">
            <label>Unit price ex VAT${edit ? `<input inputmode="decimal" data-act="price" data-ref="${e.ref}" data-i="${i}" value="${l.price ?? ''}" placeholder="0.00">` : `<span class="num" style="font-weight:700;color:var(--ink)">${R(l.price || 0)}</span>`}</label>
            <label>Lead time${edit ? `<select data-act="lead" data-ref="${e.ref}" data-i="${i}">${LEADS.map(o => `<option ${o === l.lead ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<span style="color:var(--ink)">${esc(l.lead)}</span>`}</label>
            <span class="lt" data-lt="${i}">${l.price ? R(l.price * l.qty) : '—'}</span>
          </div>
        </div>`; }).join('')}</div>
        <div class="totals" id="totals">${totalsHtml(e)}</div>
        <div class="acts">${acts}</div>
      </div>
      <div>
        <div class="card"><h3>Customer</h3><dl class="dl"><dt>Name</dt><dd>${esc(e.name)}</dd><dt>Company</dt><dd>${esc(e.company || '—')}</dd><dt>Email</dt><dd><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd><dt>Phone</dt><dd>${e.phone ? `<a href="tel:${esc(e.phone.replace(/\s/g, ''))}">${esc(e.phone)}</a>` : '—'}</dd><dt>Delivery</dt><dd>${esc(e.delivery)}</dd></dl></div>
        ${e.note ? `<div class="card"><h3>Customer note</h3><p class="muted">${esc(e.note)}</p></div>` : ''}
      </div>
    </div>`;
}
function syncLine(){
  const live = SHEET.source === 'live';
  const dot = SHEET.error ? 'r' : live ? '' : 'w';
  return `<div class="sync"><span><i class="dot ${dot}"></i>${live ? 'Live from the Google Sheet' : SHEET.error ? 'Sheet unreachable, showing the saved copy' : 'Showing the built-in copy of the sheet'}</span><span>Synced ${sast(SHEET.syncedAt)}</span><span>${P().length} products</span>${SHEET.warnings.length ? `<a class="link" href="#/admin/products">${SHEET.warnings.length} sheet issue${SHEET.warnings.length > 1 ? 's' : ''}</a>` : ''}</div>`;
}
function adminProducts(){
  $('#admTitle').textContent = 'Products (Google Sheet)';
  const live = SHEET.source === 'live';
  $('#admBody').innerHTML = `
    ${syncLine()}
    <div class="panel">
      <div class="panel-h" style="align-items:flex-start">
        <div style="max-width:62ch"><h2>Products come from the Google Sheet</h2>
          <p class="muted" style="margin-top:4px">To change a price, stock level, description or part number, edit the sheet. The website picks it up on the next page load (Google can take a few minutes to republish).</p>
          ${!live ? `<p class="sample-note">${SHEET.error ? esc(SHEET.error) + '. ' : ''}${CFG.sheetCsvUrl ? '' : 'No sheet is connected yet, so this is the built-in copy. '}The live link goes in data.js once the sheet is published.</p>` : ''}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${CFG.sheetEditUrl ? `<a class="btn btn-red" href="${esc(CFG.sheetEditUrl)}" target="_blank" rel="noopener">Open the Google Sheet</a>` : `<button class="btn btn-red" data-act="nosheet">Open the Google Sheet</button>`}
          <button class="btn" data-act="sync">Sync now</button>
        </div>
      </div>
      ${SHEET.warnings.length ? `<ul class="warnlist">${SHEET.warnings.map(w => `<li><span class="chip red">Row ${w.row}</span><span>${esc(w.msg.replace(/^Row \d+: /, ''))}</span></li>`).join('')}</ul>` : `<p style="padding:12px 16px" class="muted"><i class="dot"></i>No problems found in the sheet.</p>`}
    </div>
    <div class="panel">
      <div class="panel-h"><h2>What the sheet says right now</h2><span class="muted" style="font-size:.88rem">Read-only view. Edit in Google Sheets.</span></div>
      <div class="sheet-rows"><table>
        <thead><tr><th class="rn"></th>${SHEET.header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${SHEET.rows.slice(1).map((r, i) => `<tr><td class="rn">${SHEET.headerRow + i + 2}</td>${SHEET.header.map((_, ci) => `<td class="${SHEET.badCells[(SHEET.headerRow + i + 2) + ':' + ci] ? 'bad' : ''}">${esc(r[ci] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}
function quoteSheet(ref){
  const e = ENQ.find(x => x.ref === ref);
  const s = subtotal(e);
  const today = new Date().toLocaleDateString('en-ZA', {timeZone:TZ, day:'numeric', month:'long', year:'numeric'});
  openModal(`<div class="sheet">
    <div class="sheet-top">
      <div><div class="logo">${markSVG()}<span class="w1">CIVET</span></div><p class="muted" style="font-size:.86rem;margin-top:8px">${esc(CFG.company)}<br>${esc(CFG.address)}<br>${esc(CFG.phone)} · ${esc(CFG.email)}</p></div>
      <div style="text-align:right"><h2>QUOTATION</h2><div class="meta">${e.quote || 'Q-2026-DRAFT'}<br>${today}<br>Valid 14 days</div></div>
    </div>
    <div class="sheet-to">
      <div><b>${esc(e.company || e.name)}</b><br>${esc(e.name)}<br>${esc(e.email)}<br>${esc(e.phone || '')}</div>
      <div>${esc(e.delivery)}<br>Needed by ${esc(e.needBy)}<br>Your reference ${e.ref}</div>
    </div>
    <div style="overflow-x:auto"><table>
      <thead><tr><th class="r">Qty</th><th>Description</th><th>Order no.</th><th>Lead time</th><th class="r">Unit</th><th class="r">Amount</th></tr></thead>
      <tbody>${e.lines.map(l => `<tr><td class="r">${l.qty}</td><td>${esc(lineName(l))}</td><td class="mono" style="font-size:.82rem">${esc(l.part)}</td><td>${esc(l.lead)}</td><td class="r">${l.price ? R(l.price) : '—'}</td><td class="r">${l.price ? R(l.price * l.qty) : '—'}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="tot"><span>Subtotal ex VAT</span><span class="r">${R(s)}</span><span>VAT 15%</span><span class="r">${R(s * 0.15)}</span><span class="big">Total</span><span class="big r">${R(s * 1.15)}</span></div>
    <div class="sheet-terms"><div><b>Terms</b>Prices in rand. Lead times confirmed on order. [Payment terms.]</div><div><b>Banking</b>[Bank] · [Account name]<br>[Account no.] · [Branch code]<br>Reference: ${e.ref}</div></div>
  </div>`);
}

/* ================================================================ paste a list */
function parseList(text){
  return text.split(/\r?\n|;/).map(s => s.trim()).filter(Boolean).map(line => {
    const tidy = line.replace(/\b(6E[SDP]\d|6SL\d|6AV\d|6GK\d)\s+(?=\d)/gi, '$1');
    const m = tidy.match(/\b(?:6E[SDP]\d|6SL\d|6AV\d|6GK\d|3R[A-Z]\d)[0-9A-Z\-]{5,}/i);
    if (!m) return {raw:line, bad:true};
    const code = m[0].toUpperCase();
    const rest = tidy.replace(m[0], ' ');
    const q = rest.match(/(?:^|\s)(\d{1,4})\s*(?:x|×|pcs|off)\b/i) || rest.match(/(?:x|×|qty:?|pcs:?)\s*(\d{1,4})\b/i) || rest.match(/,\s*(\d{1,4})\s*$/) || rest.match(/^\s*(\d{1,4})\s*$/);
    return {code, qty:q ? Math.max(1, parseInt(q[1], 10)) : 1, product:byKey(code)};
  });
}

/* ================================================================ events */
document.addEventListener('click', ev => {
  const sc = ev.target.closest('[data-scroll]');
  if (sc){
    const id = sc.dataset.scroll;
    ev.preventDefault();
    const go = () => { const el = document.getElementById(id); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); };
    if (route().view !== 'home'){ location.hash = '#/'; setTimeout(go, 60); } else go();
    closeDrawer();
    return;
  }
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const a = t.dataset.act;
  const rer = () => render();
  if (a === 'menu') openDrawer();
  if (a === 'close-drawer') closeDrawer();
  if (a === 'close-modal') closeModal();
  if (a === 'add'){ const p = byKey(t.dataset.part); addToCart(p.part, p.name, 1); toast(`Added ${p.part} to your enquiry`); rer(); }
  if (a === 'add-unlisted'){ const code = t.dataset.part.trim().toUpperCase(); if (!code) return; addToCart(code, 'Not listed online', 1); toast(`Added ${code}. We'll source it.`); rer(); }
  if (a === 'inc' || a === 'dec'){
    const l = CART.find(x => x.key === t.dataset.key);
    if (l){ l.qty += a === 'inc' ? 1 : -1; if (l.qty < 1) CART = CART.filter(x => x !== l); }
    saveCart(); rer();
  }
  if (a === 'remove'){ CART = CART.filter(x => x.key !== t.dataset.key); saveCart(); rer(); toast('Removed from your enquiry'); }
  if (a === 'alt'){ const l = CART.find(x => x.key === t.dataset.key); if (l){ l.alt = t.checked; saveCart(); } }
  if (a === 'copy'){ try { navigator.clipboard.writeText(t.dataset.code); } catch(_) {} toast(`Copied ${t.dataset.code}`); }
  if (a === 'copylink'){ try { navigator.clipboard.writeText(location.href.split('#')[0]); } catch(_) {} toast('Link copied'); }
  if (a === 'pdq'){ const v = $('#pdqv'); v.textContent = Math.max(1, (+v.textContent) + (+t.dataset.d)); }
  if (a === 'pdadd'){
    const p = byKey(t.dataset.part), qty = +$('#pdqv').textContent;
    const ex = CART.find(l => l.key === p.key);
    if (ex) ex.qty = qty; else CART.push({key:p.key, part:p.part, name:p.name, qty, alt:true});
    saveCart(); toast(`${qty} × ${p.part} on your enquiry`); rer();
  }
  if (a === 'cat'){ const f = currentFilters(); f.c = t.dataset.c; setQuery(f); }
  if (a === 'paste'){
    const rows = parseList($('#bomText').value);
    rows.forEach(r => { if (!r.bad) addToCart(r.product ? r.product.part : r.code, r.product ? r.product.name : 'Not listed online', r.qty); });
    $('#bomRes').innerHTML = rows.map(r => r.bad
      ? `<li><span class="x">×</span><span class="muted">No order number in “${esc(r.raw)}”</span><span></span></li>`
      : `<li><span class="${r.product ? 'ok' : 'q'}">${r.product ? '✓' : '?'}</span><span><span class="mono">${esc(r.code)}</span> <span class="muted">${r.product ? esc(r.product.name) : 'not listed, we\'ll source it'}</span></span><span class="num">× ${r.qty}</span></li>`).join('');
    const ok = rows.filter(r => !r.bad).length;
    toast(ok ? `${ok} part${ok > 1 ? 's' : ''} added to your enquiry` : 'No order numbers found. Put one per line, e.g. 6ES7214-1AG40-0XB0');
    updateCartUI();
  }
  /* admin */
  if (a === 'afilter'){ location.hash = t.dataset.f === 'all' ? '#/admin' : '#/admin?f=' + t.dataset.f; }
  if (a === 'preview') quoteSheet(t.dataset.ref);
  if (a === 'list-prices'){ const e = ENQ.find(x => x.ref === t.dataset.ref); e.lines.forEach(l => { const p = byKey(l.part); if (p && p.price != null && !l.price) l.price = p.price; }); saveEnq(); rer(); toast('Filled prices from the sheet'); }
  if (a === 'draft'){ const e = ENQ.find(x => x.ref === t.dataset.ref); e.status = 'quoting'; saveEnq(); rer(); toast(`Draft saved on ${e.ref}`); }
  if (a === 'send'){
    const e = ENQ.find(x => x.ref === t.dataset.ref);
    const miss = e.lines.filter(l => !l.price).length;
    if (miss){ toast(`Add a price to ${miss} more line${miss > 1 ? 's' : ''} first`); return; }
    e.status = 'sent'; e.quote = 'Q-2026-' + String(nextQuote++).padStart(4, '0'); e.ageH = 0; saveEnq(); rer();
    toast(`Quote ${e.quote} emailed to ${e.name}`);
  }
  if (a === 'status'){ const e = ENQ.find(x => x.ref === t.dataset.ref); e.status = t.dataset.s; saveEnq(); rer(); toast(`${e.ref}: ${STATUS[e.status]}`); }
  if (a === 'sync'){ t.disabled = true; t.textContent = 'Syncing…'; loadSheet().then(() => { rer(); toast(SHEET.source === 'live' ? `Synced ${P().length} products from the sheet` : 'Reloaded the built-in copy'); }); }
  if (a === 'nosheet'){ toast('No sheet connected yet. Its link goes in data.js once it is published.'); }
  if (a === 'reset-demo'){ try { localStorage.removeItem('civet-enq-v4'); localStorage.removeItem('civet-cart'); } catch(_) {} location.reload(); }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'pq'){ setQuery(currentFilters(), true); drawGrid(); }
  if (t.id === 'dq' || t.id === 'hq'){ /* handled on submit */ }
  if (t.dataset.act === 'price'){
    const e = ENQ.find(x => x.ref === t.dataset.ref);
    const v = parseFloat(t.value.replace(/\s/g, '').replace(',', '.'));
    const l = e.lines[+t.dataset.i]; l.price = isNaN(v) ? null : v; saveEnq();
    const lt = $(`[data-lt="${t.dataset.i}"]`); if (lt) lt.textContent = l.price ? R(l.price * l.qty) : '—';
    $('#totals').innerHTML = totalsHtml(e);
  }
  if (t.closest && t.closest('#enqForm')){
    store.set('civet-form', {name:$('#f-name').value, co:$('#f-co').value, email:$('#f-email').value, phone:$('#f-phone').value, note:$('#f-note').value});
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'stockOnly' || t.id === 'sortSel'){ setQuery(currentFilters(), true); drawGrid(); }
  if (t.dataset.act === 'lead'){ const e = ENQ.find(x => x.ref === t.dataset.ref); e.lines[+t.dataset.i].lead = t.value; saveEnq(); }
});
document.addEventListener('submit', ev => {
  const f = ev.target;
  if (f.id === 'hsearchForm' || f.id === 'dsearchForm'){
    ev.preventDefault();
    const v = f.querySelector('input').value.trim();
    closeDrawer();
    location.hash = '#/products' + (v ? '?q=' + encodeURIComponent(v) : '');
    return;
  }
  if (f.id !== 'enqForm') return;
  ev.preventDefault();
  const name = $('#f-name').value.trim(), email = $('#f-email').value.trim(), err = $('#f-err');
  if (!name || !/^\S+@\S+\.\S+$/.test(email)){
    err.hidden = false;
    err.textContent = !name ? 'Add your name so we know who to address the quote to.' : 'Add a valid email address so we can send the quote.';
    (!name ? $('#f-name') : $('#f-email')).focus();
    return;
  }
  const now = new Date();
  const need = $('#f-need').value ? new Date($('#f-need').value + 'T12:00:00').toLocaleDateString('en-ZA', {day:'numeric', month:'short'}) : 'Not given';
  const e = {
    ref:'ENQ-2026-' + String(nextRef++).padStart(4, '0'),
    recv:now.toLocaleDateString('en-ZA', {timeZone:TZ, day:'numeric', month:'short'}) + ', ' + now.toLocaleTimeString('en-ZA', {timeZone:TZ, hour:'2-digit', minute:'2-digit', hour12:false}),
    ageH:0, name, company:$('#f-co').value.trim(), email, phone:$('#f-phone').value.trim(), needBy:need, delivery:$('#f-del').value, status:'new',
    note:$('#f-note').value.trim(),
    lines:CART.map(l => { const p = byKey(l.part); return {part:l.part, name:p ? p.name : 'Not listed online', qty:l.qty, price:null, lead:p && p.stock > 0 ? 'Ex stock' : 'To confirm'}; })
  };
  ENQ.unshift(e); saveEnq();
  submitted = e; CART = []; saveCart(); store.set('civet-form', {});
  render();
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape'){ if (!$('#modal').hidden) closeModal(); if (!$('#drawer').hidden) closeDrawer(); }
});
window.addEventListener('hashchange', () => { if (route().view !== 'enquiry') submitted = null; render(); });

/* ================================================================ boot */
$$('[data-mark]').forEach(el => { el.outerHTML = markSVG(); });
render();
loadSheet().then(render);
})();
