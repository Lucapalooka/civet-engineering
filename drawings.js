/* Civet Engineering: product drawings, service icons, illustrations, logo mark. */
function svg(inner, vb){ return `<svg viewBox="${vb || '0 0 160 120'}" aria-hidden="true" focusable="false">${inner}</svg>`; }
const SHADOW = '<ellipse class="m-shadow" cx="80" cy="114" rx="50" ry="4"/>';
const RAIL = '<rect class="m-rail" x="0" y="53" width="160" height="14" rx="1"/><rect class="m-rail2" x="0" y="57" width="160" height="6"/>';
function rep(n, fn){ let s=''; for(let i=0;i<n;i++) s += fn(i); return s; }
/* screw terminal: square pad with a slotted head */
function scr(x, y, w, h){ return `<rect class="m-term" x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/><rect class="m-slot" x="${x+w*0.22}" y="${y+h/2-0.5}" width="${w*0.56}" height="1.1" rx="0.5"/>`; }
function termRow(x, y, n, gap, w, h){ return rep(n, i => scr(x + i*gap, y, w || gap-2.4, h || 7)); }
function vents(x, y, w, n, gap){ return rep(n, i => `<rect class="m-vent" x="${x}" y="${y + i*gap}" width="${w}" height="1.8" rx="0.9"/>`); }
function ledCol(x, y, n, gap){ return rep(n, i => `<rect class="${i%3===0?'m-led':'m-off'}" x="${x}" y="${y + i*(gap||6.5)}" width="5.5" height="3" rx="1"/>`); }
function lines(x, y, w, n, gap){ return rep(n, i => `<rect class="m-print" x="${x}" y="${y + i*gap}" width="${i%2 ? w*0.62 : w}" height="1.4" rx="0.7"/>`); }
function rj45(x, y){ return `<rect class="m-port" x="${x}" y="${y}" width="17" height="14" rx="1.5"/><rect class="m-slot" x="${x+5}" y="${y-2}" width="7" height="4" rx="1"/><rect class="m-led" x="${x+1.5}" y="${y+10.5}" width="3" height="2" rx="1"/>`; }

function drawing(kind){
  switch(kind){
    /* SIMATIC S7-1200 / S7-1500 CPU */
    case 'plc': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="22" y="9" width="116" height="99" rx="3"/>' +
      '<rect class="m-face" x="27" y="13" width="106" height="15" rx="1.5"/>' + termRow(30, 16, 11, 9.4, 7, 9) +
      '<rect class="m-face" x="27" y="32" width="106" height="52" rx="1.5"/>' +
      ledCol(32, 36, 7) + ledCol(40, 36, 7) +
      '<rect class="m-label" x="52" y="36" width="72" height="16" rx="1"/>' + lines(56, 41, 62, 3, 4) +
      '<rect class="m-door" x="52" y="56" width="42" height="24" rx="1.5"/><rect class="m-slot" x="55" y="66" width="2" height="8" rx="1"/>' +
      rj45(104, 58) +
      '<rect class="m-face" x="27" y="88" width="106" height="15" rx="1.5"/>' + termRow(30, 91, 11, 9.4, 7, 9), '0 0 160 120');
    /* ET 200SP base unit + I/O module */
    case 'io': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="58" y="5" width="44" height="103" rx="2"/>' +
      '<rect class="m-strip" x="58" y="5" width="44" height="8" rx="1.5"/>' +
      '<rect class="m-label" x="62" y="16" width="36" height="13" rx="1"/>' + lines(65, 20, 30, 2, 4) +
      ledCol(62, 34, 8, 8) + ledCol(92, 34, 8, 8) +
      '<rect class="m-face" x="58" y="66" width="44" height="42" rx="2"/>' +
      rep(6, i => scr(62 + (i%2)*20, 70 + Math.floor(i/2)*12, 16, 8)), '0 0 160 120');
    /* communication module with sub-D port */
    case 'comms': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="58" y="9" width="44" height="99" rx="2"/>' +
      '<rect class="m-face" x="62" y="14" width="36" height="88" rx="1.5"/>' +
      '<rect class="m-label" x="65" y="18" width="30" height="10" rx="1"/>' +
      ledCol(66, 32, 3) + ledCol(88, 32, 3) +
      '<polygon class="m-port" points="64,50 96,50 92,76 68,76"/>' +
      rep(9, i => `<circle class="m-pin" cx="${69 + i*2.7}" cy="57" r="1.1"/>`) +
      rep(8, i => `<circle class="m-pin" cx="${70.5 + i*2.7}" cy="68" r="1.1"/>`) +
      '<rect class="m-print" x="66" y="86" width="28" height="1.6" rx="0.8"/><rect class="m-print" x="66" y="91" width="18" height="1.6" rx="0.8"/>', '0 0 160 120');
    /* SIMATIC memory card */
    case 'card': return svg('<ellipse class="m-shadow" cx="80" cy="104" rx="34" ry="3.5"/>' +
      '<path class="m-body" d="M50 22 h50 a4 4 0 0 1 4 4 v70 a4 4 0 0 1 -4 4 h-46 a4 4 0 0 1 -4 -4 v-62 z"/>' +
      '<polygon class="m-orange" points="50,22 62,22 50,34"/>' +
      '<rect class="m-label" x="56" y="40" width="42" height="26" rx="1.5"/>' + lines(59, 45, 36, 3, 5) +
      rep(6, i => `<rect class="m-pin" x="${57 + i*7}" y="74" width="5" height="14" rx="1"/>`), '0 0 160 120');
    /* SINAMICS drive */
    case 'drive': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="42" y="3" width="76" height="114" rx="3"/>' +
      '<rect class="m-fin" x="42" y="3" width="6" height="114"/><rect class="m-fin" x="112" y="3" width="6" height="114"/>' +
      vents(52, 9, 56, 5, 4.6) +
      '<rect class="m-face" x="50" y="36" width="60" height="46" rx="2"/>' +
      '<rect class="m-screen" x="56" y="41" width="48" height="16" rx="1"/>' + lines(59, 45, 30, 2, 5) +
      '<rect class="m-led" x="96" y="45" width="5" height="3" rx="1"/>' +
      rep(3, i => `<circle class="m-btn" cx="${62 + i*14}" cy="68" r="5"/>`) +
      '<circle class="m-btn" cx="98" cy="68" r="5"/>' +
      '<circle class="m-fan" cx="80" cy="99" r="13"/>' +
      rep(4, i => `<path class="m-blade" d="M80 99 L${80 + 11*Math.cos((i*90+20)*Math.PI/180)} ${99 + 11*Math.sin((i*90+20)*Math.PI/180)} L${80 + 11*Math.cos((i*90+60)*Math.PI/180)} ${99 + 11*Math.sin((i*90+60)*Math.PI/180)} Z"/>`) +
      '<circle class="m-hub" cx="80" cy="99" r="3.5"/>', '0 0 160 120');
    /* SIRIUS contactor */
    case 'contactor': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="50" y="18" width="60" height="84" rx="4"/>' +
      '<rect class="m-aux" x="50" y="18" width="60" height="9" rx="2"/>' +
      termRow(54, 22, 3, 18, 14, 9) +
      '<rect class="m-face" x="56" y="38" width="48" height="44" rx="2"/>' +
      '<rect class="m-label" x="60" y="42" width="40" height="12" rx="1"/>' + lines(63, 46, 34, 2, 4) +
      '<rect class="m-coil" x="66" y="60" width="28" height="14" rx="1.5"/><rect class="m-print" x="69" y="66" width="8" height="1.6" rx="0.8"/><rect class="m-print" x="83" y="66" width="8" height="1.6" rx="0.8"/>' +
      termRow(54, 88, 3, 18, 14, 9), '0 0 160 120');
    /* motor starter protector with rotary setting dial */
    case 'msp': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="52" y="12" width="56" height="95" rx="4"/>' +
      termRow(56, 16, 3, 17, 13, 9) +
      '<rect class="m-face" x="57" y="32" width="46" height="58" rx="2"/>' +
      '<circle class="m-dial" cx="80" cy="53" r="13"/>' +
      rep(7, i => { const a = (-120 + i*40) * Math.PI/180; return `<rect class="m-tick" x="${80 + 15*Math.cos(a) - 0.7}" y="${53 + 15*Math.sin(a) - 0.7}" width="1.6" height="1.6" rx="0.8"/>`; }) +
      '<rect class="m-orange" x="78.8" y="43" width="2.4" height="11" rx="1.2"/>' +
      '<rect class="m-btn2" x="61" y="72" width="16" height="9" rx="1.5"/><rect class="m-orange" x="83" y="72" width="16" height="9" rx="1.5"/>' +
      termRow(56, 94, 3, 17, 13, 9), '0 0 160 120');
    /* SITOP power supply */
    case 'psu': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="46" y="7" width="68" height="101" rx="3"/>' +
      '<rect class="m-face" x="50" y="11" width="60" height="13" rx="1.5"/>' + termRow(53, 13, 6, 9.6, 7.5, 9) +
      vents(52, 29, 56, 3, 4.5) +
      '<rect class="m-label" x="52" y="42" width="56" height="20" rx="1"/>' + lines(56, 47, 46, 3, 4.6) +
      '<circle class="m-dial" cx="62" cy="76" r="7"/><rect class="m-orange" x="61" y="70" width="2" height="7" rx="1"/>' +
      '<rect class="m-led" x="80" y="71" width="8" height="4" rx="1"/><rect class="m-print" x="80" y="79" width="20" height="1.6" rx="0.8"/>' +
      '<rect class="m-face" x="50" y="91" width="60" height="13" rx="1.5"/>' + termRow(53, 93, 6, 9.6, 7.5, 9), '0 0 160 120');
    /* HMI panel with a small plant mimic on screen */
    case 'hmi': return svg('<ellipse class="m-shadow" cx="80" cy="112" rx="58" ry="4"/>' +
      '<rect class="m-body" x="10" y="10" width="140" height="94" rx="5"/>' +
      '<rect class="m-screen" x="18" y="16" width="105" height="72" rx="2"/>' +
      '<rect class="m-ui" x="23" y="21" width="34" height="6" rx="1"/>' +
      '<rect class="m-tank" x="26" y="34" width="26" height="34" rx="2"/><rect class="m-fill" x="26" y="50" width="26" height="18" rx="2"/>' +
      '<rect class="m-pipe" x="52" y="44" width="30" height="4" rx="2"/><circle class="m-pump" cx="90" cy="46" r="8"/><rect class="m-fill" x="98" y="44" width="18" height="4" rx="2"/>' +
      rep(4, i => `<rect class="m-bar" x="${24 + i*9}" y="${82 - (4 + i*3)}" width="6" height="${4 + i*3}" rx="1"/>`) +
      '<rect class="m-led" x="104" y="74" width="12" height="8" rx="1.5"/><rect class="m-orange" x="88" y="74" width="12" height="8" rx="1.5"/>' +
      rep(4, i => `<rect class="m-btn2" x="130" y="${20 + i*17}" width="14" height="12" rx="1.5"/>`), '0 0 160 120');
    /* LOGO! with LCD and cursor keys */
    case 'logo': return svg(RAIL + SHADOW +
      '<rect class="m-body" x="32" y="12" width="96" height="94" rx="3"/>' +
      '<rect class="m-face" x="36" y="16" width="88" height="12" rx="1.5"/>' + termRow(39, 18, 9, 9.4, 7, 8) +
      '<rect class="m-face" x="36" y="32" width="88" height="52" rx="1.5"/>' +
      '<rect class="m-lcd" x="41" y="37" width="52" height="28" rx="1.5"/>' + lines(45, 43, 44, 3, 6) +
      '<circle class="m-btn" cx="108" cy="44" r="4"/><circle class="m-btn" cx="108" cy="58" r="4"/><circle class="m-btn" cx="100" cy="51" r="4"/><circle class="m-btn" cx="116" cy="51" r="4"/>' +
      '<rect class="m-led" x="41" y="70" width="6" height="3" rx="1"/><rect class="m-print" x="52" y="70" width="40" height="1.6" rx="0.8"/>' +
      '<rect class="m-face" x="36" y="88" width="88" height="12" rx="1.5"/>' + termRow(39, 90, 9, 9.4, 7, 8), '0 0 160 120');
    /* legacy S5 module: beige front, mode switch, front connector */
    case 's5': return svg(RAIL + SHADOW +
      '<rect class="m-s5" x="20" y="6" width="120" height="104" rx="2"/>' +
      '<rect class="m-s5b" x="20" y="6" width="120" height="7" rx="1"/>' +
      '<rect class="m-conn" x="26" y="18" width="30" height="86" rx="1.5"/>' +
      rep(11, i => `<rect class="m-pin" x="30" y="${22 + i*7.4}" width="22" height="3.4" rx="1"/>`) +
      '<rect class="m-label" x="64" y="16" width="68" height="16" rx="1"/>' + lines(68, 21, 58, 2, 5) +
      '<rect class="m-face" x="64" y="38" width="30" height="24" rx="1.5"/><rect class="m-orange" x="77" y="41" width="4" height="10" rx="1"/><circle class="m-pin" cx="79" cy="56" r="2"/>' +
      ledCol(102, 40, 4, 7) + ledCol(114, 40, 4, 7) +
      '<rect class="m-conn" x="64" y="70" width="68" height="34" rx="1.5"/><rect class="m-slot" x="70" y="76" width="56" height="10" rx="1"/><rect class="m-print" x="70" y="92" width="30" height="1.8" rx="0.9"/>', '0 0 160 120');
    default: return svg(RAIL + SHADOW);
  }
}

/* ---- small line drawings for the services list ---- */
function vignette(name){
  const V = {
    panel: '<rect class="v-s" x="8" y="6" width="48" height="52" rx="3"/><rect class="v-f" x="14" y="14" width="36" height="6" rx="1"/><rect class="v-f" x="14" y="26" width="10" height="16" rx="1"/><rect class="v-f" x="27" y="26" width="10" height="16" rx="1"/><rect class="v-a" x="40" y="26" width="10" height="16" rx="1"/><rect class="v-f" x="14" y="48" width="36" height="4" rx="1"/>',
    plc: '<rect class="v-s" x="4" y="12" width="48" height="32" rx="2"/><rect class="v-f" x="10" y="18" width="36" height="20" rx="1"/><path class="v-a-s" d="M14 24 h10 M28 24 h4 M36 24 h6 M14 32 h6 M24 32 h8 M36 32 h6"/><rect class="v-s" x="0" y="46" width="60" height="6" rx="2"/><rect class="v-a" x="50" y="8" width="10" height="10" rx="5"/>',
    drive: '<circle class="v-s" cx="24" cy="32" r="16"/><circle class="v-a" cx="24" cy="32" r="5"/><rect class="v-s" x="40" y="18" width="18" height="28" rx="2"/><path class="v-a-s" d="M46 26 h6 M46 32 h6 M46 38 h6"/><path class="v-a-s" d="M8 12 h12 l-4 -6"/>',
    cad: '<rect class="v-s" x="6" y="8" width="48" height="44" rx="2"/><path class="v-a-s" d="M6 42 h48 M40 42 v10 M40 46 h14"/><path class="v-a-s" d="M14 16 h14 v14 h-14 z M28 23 h10 v14 h-10"/><circle class="v-a" cx="14" cy="16" r="2.5"/>',
    callout: '<path class="v-s-f" d="M6 38 h6 l6 -12 h20 l4 12 h10 a4 4 0 0 1 4 4 v6 h-50 z"/><circle class="v-a" cx="18" cy="50" r="5"/><circle class="v-a" cx="44" cy="50" r="5"/><path class="v-a-s" d="M22 14 l8 8 M30 14 l-8 8"/>',
    design: '<rect class="v-s" x="10" y="6" width="40" height="50" rx="3"/><rect class="v-f" x="22" y="2" width="16" height="8" rx="2"/><path class="v-a-s" d="M18 22 h24 M18 30 h24 M18 38 h14"/><path class="v-a-s2" d="M16 46 l4 4 l8 -9"/>'
  };
  return `<svg viewBox="0 0 60 60" class="vig" aria-hidden="true">${V[name] || ''}</svg>`;
}

/* ---- illustrated stand-ins where real photographs should go ---- */
function photoArt(name){
  const A = {
    workshop: '<rect class="p-bg" x="0" y="0" width="320" height="240"/><rect class="p-w" x="0" y="0" width="320" height="150"/>' +
      rep(9, i => `<circle class="p-peg" cx="${34 + (i%5)*28}" cy="${34 + Math.floor(i/5)*26}" r="2.5"/>`) +
      '<rect class="p-t" x="18" y="24" width="10" height="26" rx="2"/><rect class="p-t" x="46" y="24" width="6" height="30" rx="3"/><rect class="p-t" x="70" y="24" width="14" height="18" rx="2"/>' +
      '<rect class="p-bench" x="0" y="150" width="320" height="16"/><rect class="p-leg" x="30" y="166" width="12" height="74"/><rect class="p-leg" x="278" y="166" width="12" height="74"/>' +
      '<rect class="p-cab" x="150" y="62" width="140" height="88" rx="4"/><rect class="p-plate" x="162" y="72" width="116" height="68" rx="2"/>' +
      rep(3, i => `<rect class="p-rail" x="168" y="${80 + i*22}" width="104" height="6" rx="1"/>`) +
      rep(5, i => `<rect class="p-mod" x="${170 + i*20}" y="${74 + 0}" width="16" height="12" rx="1"/>`) +
      '<rect class="p-acc" x="60" y="122" width="56" height="28" rx="3"/><circle class="p-acc2" cx="88" cy="136" r="7"/>',
    wiring: '<rect class="p-bg" x="0" y="0" width="320" height="240"/><rect class="p-plate" x="18" y="18" width="284" height="204" rx="3"/>' +
      rep(2, i => `<rect class="p-rail" x="34" y="${70 + i*84}" width="252" height="10" rx="1"/>`) +
      rep(16, i => `<rect class="p-term" x="${36 + i*15}" y="44" width="11" height="34" rx="1"/>`) +
      rep(16, i => `<rect class="p-fer" x="${38 + i*15}" y="34" width="7" height="10" rx="1"/>`) +
      rep(16, i => `<path class="p-wire" d="M${41 + i*15} 34 C${41 + i*15} 20 ${170} ${18 + i} ${170} 8"/>`) +
      rep(5, i => `<rect class="p-mod" x="${40 + i*50}" y="118" width="40" height="36" rx="2"/>`) +
      rep(5, i => `<path class="p-wire2" d="M${60 + i*50} 154 C${60 + i*50} 190 ${160} 190 ${160} 214"/>`),
    site: '<rect class="p-bg" x="0" y="0" width="320" height="240"/>' +
      rep(4, i => `<rect class="p-w" x="${10 + i*80}" y="20" width="60" height="60" rx="2"/>`) +
      '<rect class="p-belt" x="0" y="150" width="320" height="18" rx="4"/>' +
      rep(9, i => `<circle class="p-roll" cx="${20 + i*36}" cy="159" r="7"/>`) +
      rep(4, i => `<rect class="p-box" x="${30 + i*76}" y="124" width="44" height="26" rx="2"/>`) +
      '<rect class="p-cab" x="212" y="86" width="78" height="118" rx="4"/><rect class="p-screen" x="224" y="98" width="54" height="36" rx="2"/><circle class="p-lamp" cx="238" cy="152" r="7"/><circle class="p-acc2" cx="262" cy="152" r="7"/>' +
      '<rect class="p-leg" x="0" y="204" width="320" height="36"/>'
  };
  return `<svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${A[name] || ''}</svg>`;
}

/* ---- brand mark: a C cut by a DIN rail ---- */
function markSVG(cls){
  return `<svg class="mark ${cls || ''}" viewBox="0 0 30 30" aria-hidden="true"><path class="k-c" d="M21.5 7.5 A9.5 9.5 0 1 0 21.5 22.5" fill="none" stroke-width="5"/><rect class="k-r" x="13" y="12.4" width="17" height="5.2" rx="1"/></svg>`;
}

