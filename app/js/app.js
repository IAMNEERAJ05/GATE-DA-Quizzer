/* GATE DA Formula Quizzer — app logic.
   Data comes from data/syllabus.js (SUBJECTS, BANK, addCards), data/papers.js and data/<subject>.js. */
(function(){
'use strict';

/* ---------- derived data ---------- */
const SUBJ = {}, TL = {}, UNIT = {}, HITS = {};
for (const s of SUBJECTS){
  SUBJ[s.id] = s;
  for (const t of s.topics){
    TL[s.id+'.'+t.id] = t.name;
    for (const [k,label] of Object.entries(t.units)) UNIT[s.id+'.'+k] = {label, topic:t.id, subj:s.id};
  }
}
for (const [p,q,s,us] of PAPER_QS) for (const u of us){
  (HITS[s+'.'+u] = HITS[s+'.'+u] || []).push(PAPERS[p]+' Q'+q);
}
const unitsOf = c => (Array.isArray(c.u) ? c.u : [c.u]).filter(Boolean).map(u => c.s+'.'+u);
const CARDS = BANK;                                   /* built-in cards only */
const official = s => BANK.filter(c => c.s === s);
/* the student's own notes become recall cards */
function myCards(){ return (S.mine || []).map(n => ({id:'my.'+n.id, s:n.s, t:n.t, k:'recall', lv:1, name:n.name, sheet:n.sheet || '', note:n.note || '', why:'', mine:true})); }
let IMP = null;   /* cache of imported question cards; reset whenever S.qs changes */
const allCards = () => BANK.concat(myCards(), impCards());
const bySubj = s => allCards().filter(c => c.s === s);
const BUILT = SUBJECTS.filter(s => official(s.id).length).map(s => s.id);
const ready = () => SUBJECTS.filter(s => bySubj(s.id).length).map(s => s.id);

/* ---------- constants ---------- */
const KIND = {fill:'Fill the gap', bug:'Spot the bug', cond:'When does it hold?', nat:'Quick plug · NAT', mcq:'Concept check', solve:'Quick solve', match:'Match it', msq:'Multiple select', recall:'Recall it'};
const KIND_DESC = {
  fill:'Pick the missing piece of a formula.', bug:'A formula with one mistake. Find it.',
  cond:'Pick the condition that makes a result valid.', nat:'Type a numeric answer, like a GATE NAT question.',
  mcq:'One idea, four plausible answers.', solve:'A short numeric problem with four options. The numbers change every time it appears.', msq:'One or more options are correct. Tick all of them; no partial credit, as in GATE.', match:'Pair four formula names with their formulas.',
  recall:'Your own notes and imported formulas: recall it from memory, reveal it, and mark whether you knew it.'
};
const DEFQ = {fill:'Fill the gap in this formula.', bug:'This formula has one mistake. Find it.'};
const TIERS = [{n:'Learner',m:1,min:0},{n:'Capable',m:2,min:.25},{n:'Advanced',m:3,min:.5},{n:'Ninja',m:4,min:.8}];
const INTERVALS = [0,1,2,4,7,15];
const DAY = 864e5, SPEED = 20, TLIM = 45, KEY = 'gateda-quizzer-v2';
const OKW = ['Correct.','Right.','Nice.','Exactly.'];
const kindOf = c => c.k === 'mcq' && c.gen ? 'solve' : c.k;
const isDA = p => !/^CS/.test(p);

const app = document.getElementById('app');
const $ = s => app.querySelector(s);
const D = x => '\\['+x+'\\]', I = x => '\\('+x+'\\)', ID = x => '\\(\\displaystyle '+x+'\\)';
const SH = (c, cls = 'fxi') => c.tx ? `<p class="rule">${c.sheet}</p>` : c.imp ? (c.sheet ? `<div class="${cls}">${D(esc(c.sheet))}</div>` : '') : `<div class="${cls}">${D(c.sheet)}</div>`;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const shuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const plural = (n,w) => n+' '+w+(n===1?'':'s');

let tq = Promise.resolve();
function typeset(el){
  if (!el || !window.MathJax || !MathJax.typesetPromise) return;
  tq = tq.then(() => MathJax.typesetPromise([el])).catch(e => console.warn(e));
}
window.__typesetApp = () => typeset(app);

/* ---------- state ---------- */
function fresh(){ return {v:2, c:{}, pts:0, streak:0, last:null, sets:0, pick:BUILT.slice(), known:BUILT.slice(), flags:{}, mine:[], qs:[]}; }
function tidy(s){
  s.flags = s.flags || {}; s.mine = Array.isArray(s.mine) ? s.mine.filter(n => n && SUBJ[n.s] && n.name) : [];
  s.qs = Array.isArray(s.qs) ? s.qs.filter(x => x && SUBJ[x.s] && x.id && (x.q || (x.k === 'formula' && x.name && x.formula))) : []; IMP = null;
  s.pick = (s.pick || []).filter(x => SUBJ[x]); if (!s.pick.length) s.pick = BUILT.slice();
  /* a subject that is new since the last visit joins the daily set once; after that the student's choice stands */
  const known = Array.isArray(s.known) ? s.known : ['ps','la','calc','dsa','db','ml','ai'];
  for (const x of BUILT) if (!known.includes(x) && !s.pick.includes(x)) s.pick.push(x);
  s.known = BUILT.slice();
  const cut = Date.now() - DAY; s.shown = Object.fromEntries(Object.entries(s.shown || {}).filter(([,t]) => t > cut));
  return s;
}
function load(){
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2 && typeof s.c === 'object') return tidy(s); } catch(e){}
  return fresh();
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
let S = load();
const blank = {b:0,due:0,seen:0,ok:0};
const get = id => S.c[id] || blank;
const cs = id => S.c[id] || (S.c[id] = {b:0,due:0,seen:0,ok:0});
const isM = id => get(id).b >= 3;
const mastCount = list => list.filter(c => isM(c.id)).length;
function tier(s){ const l = official(s); const r = l.length ? mastCount(l)/l.length : 0; let t = TIERS[0]; for (const x of TIERS) if (r >= x.min) t = x; return t; }
const ymd = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = () => ymd(new Date()), yesterday = () => ymd(new Date(Date.now()-DAY));
const streakNow = () => (S.last===today() || S.last===yesterday()) ? S.streak : 0;
/* A dot is earned only when the card was due (or new). Correct answers before the due date leave the dots alone. */
function review(c, ok){
  const s = cs(c.id), now = Date.now(), due = !s.seen || s.due <= now; s.seen++; s.at = now;
  if (!ok){ s.b = 0; s.due = 0; return 'reset'; }
  s.ok++;
  if (!due) return 'early';
  s.b = Math.min(5, s.b+1); s.due = now + INTERVALS[s.b]*DAY; return 'up';
}
function dotLine(c, r){
  const s = get(c.id), dots = '●'.repeat(s.b) + '○'.repeat(5 - s.b);
  const msg = r === 'up' ? `Dot ${s.b} of 5${s.b === 3 ? ' · mastered' : ''} · next review in ${plural(INTERVALS[s.b], 'day')}`
    : r === 'early' ? `Reviewed before it was due on ${new Date(s.due).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}, so no new dot`
    : 'Dots reset · this one comes back in your next set';
  return `<p class="dotline"><span class="dots" aria-hidden="true">${dots}</span>${msg}</p>`;
}

/* ---------- session builder ---------- */
/* priority: missed or due first, then unseen (level-appropriate first), then the rest at random */
const COOL = 30*60*1000;   /* a card shown in the last 30 minutes waits, unless nothing else is left */
const lastShown = c => Math.max((S.shown && S.shown[c.id]) || 0, get(c.id).at || 0);
function priority(c, now){
  const s = get(c.id), tl = TIERS.indexOf(tier(c.s)), age = now - lastShown(c); let p;
  if (!s.seen) p = 2 + (c.lv <= tl+1 ? .6 : 0);
  else if (s.due <= now) p = s.b <= 1 ? 3 : 1.5;
  else p = Math.min(1, age/(7*DAY));          /* not due: least recently seen first */
  if (age < COOL) p -= 4;
  return p + Math.random()*.9;
}
/* Pick n cards from a ranked list without repeating a formula (same name) or a concept unit in one set,
   and with at most a third of the set spent on cards you just got wrong. Constraints relax only if the pool is too small. */
const conceptKey = c => (c.name || '').trim().toLowerCase();
const unitKey = c => c.s + '.' + [].concat(c.u)[0];
function choose(ranked, n, st){
  const out = [], capMissed = Math.max(2, Math.ceil(n/3));
  for (let pass = 0; pass < 3 && out.length < n; pass++){
    for (const x of ranked){
      if (out.length >= n) break;
      const c = x.c;
      if (st.ids.has(c.id)) continue;
      if (pass < 2 && st.names.has(conceptKey(c))) continue;
      if (pass < 1 && !c.mine && !c.imp && st.units.has(unitKey(c))) continue;
      if (pass < 2 && x.p >= 3 && st.missed >= capMissed) continue;
      out.push(x); st.ids.add(c.id); st.names.add(conceptKey(c)); st.units.add(unitKey(c)); if (x.p >= 3) st.missed++;
    }
  }
  return out;
}
/* opt.per: take this many from each subject (balanced sets); opt.matches: number of matching rounds */
function build(pool, n, opt = {}){
  const now = Date.now();
  const ranked = pool.map(c => ({c, p: priority(c, now)})).sort((x,y) => y.p - x.p);
  const st = {ids:new Set(), names:new Set(), units:new Set(), missed:0};
  let picked;
  if (opt.per){
    picked = [];
    for (const s of new Set(pool.map(c => c.s))) picked.push(...choose(ranked.filter(x => x.c.s === s), opt.per, st));
    if (picked.length < n) picked.push(...choose(ranked, n - picked.length, st));
    picked = shuffle(picked);
  } else picked = shuffle(choose(ranked, Math.min(n, pool.length), st));
  const qs = picked.map(x => ({card:x.c}));
  const nm = opt.matches ?? 1, used = new Set();
  for (let i = 0; i < nm; i++){
    const m = pickMatch(pool, used, st.names); if (!m) break;
    used.add(m[0].s);
    qs.splice(Math.round((i+1) * qs.length / (nm+1)), 0, {match:m});
  }
  return qs;
}
/* daily set size grows with the number of subjects picked */
function dailyPlan(){
  const k = S.pick.filter(s => bySubj(s).length).length || 1;
  const km = S.pick.filter(s => bySubj(s).length && !SUBJ[s].noMatch).length;
  const n = Math.max(9, 6*k), matches = Math.ceil(km/3);
  return {k, n, matches, rounds: n + matches, minutes: Math.max(5, Math.round((n + matches) * 0.5))};
}
function pickMatch(pool, used = new Set(), avoid = new Set()){
  const subs = shuffle([...new Set(pool.map(c => c.s))]).sort((a,b) => (used.has(a)?1:0) - (used.has(b)?1:0));
  for (const s of subs){
    if (SUBJ[s].noMatch) continue;
    let cand = pool.filter(c => c.s === s && !c.mine && !c.tx && (!c.imp || (c.fx && c.k === 'recall')) && c.sheet.length <= 75);
    const fresh = cand.filter(c => !avoid.has(conceptKey(c)));   /* formulas not already in this set */
    if (new Set(fresh.map(conceptKey)).size >= 4) cand = fresh;
    if (cand.length < 4) continue;
    cand = shuffle(cand).sort((a,b) => (get(b.id).seen?1:0) - (get(a.id).seen?1:0));
    const out = [], names = new Set();
    for (const c of cand){ if (!names.has(c.name)){ out.push(c); names.add(c.name); } if (out.length === 4) break; }
    if (out.length === 4) return out;
  }
  return null;
}

/* ---------- shared bits ---------- */
let VIEW = 'home', G = null, raf = 0;
function stopTimer(){ cancelAnimationFrame(raf); }
function confirmBtn(btn, label, fn){
  btn.addEventListener('click', () => {
    if (btn.dataset.armed){ fn(); return; }
    const orig = btn.textContent; btn.dataset.armed = '1'; btn.textContent = label; btn.classList.add('danger');
    setTimeout(() => { if (btn.isConnected){ delete btn.dataset.armed; btn.textContent = orig; btn.classList.remove('danger'); } }, 3500);
  });
}
function go(view){ stopTimer(); VIEW = view; window.scrollTo(0,0); }
function ladder(list, t){
  const m = mastCount(list), N = list.length, pct = N ? m/N*100 : 0;
  const next = TIERS[TIERS.indexOf(t)+1], toNext = next ? Math.max(0, Math.ceil(next.min*N) - m) : 0;
  return `<div class="ladder">
    <div class="rail"><div class="fill" style="width:${pct}%"></div><i class="tk" style="left:25%"></i><i class="tk" style="left:50%"></i><i class="tk" style="left:80%"></i></div>
    <div class="ticks">${TIERS.map(x => `<span class="${x===t?'cur':''}">${x.n}</span>`).join('')}</div>
    <p class="note">${next ? `Master ${plural(toNext,'more formula')} to reach ${next.n}.` : 'Top level reached. Keep reviews coming to hold it.'} A formula is mastered once it has 3 of its 5 dots. A dot fills only when you answer a card correctly on or after its review date.</p>
  </div>`;
}
function bar(list){
  const m = mastCount(list), sn = list.filter(c => get(c.id).seen).length, N = list.length || 1;
  return `<span class="bar"><i class="seen" style="width:${sn/N*100}%"></i><i class="mast" style="width:${m/N*100}%"></i></span>`;
}
const flagCount = () => Object.keys(S.flags).length;

/* ---------- home ---------- */
function home(){
  go('home');
  const now = Date.now();
  const all = CARDS, m = mastCount(all), R = ready();
  const pool = allCards().filter(c => S.pick.includes(c.s));
  const due = pool.filter(c => { const s = get(c.id); return s.seen && s.due <= now; }).length;
  const fresh_ = pool.filter(c => !get(c.id).seen).length;
  const DAQ = PAPER_QS.filter(x => isDA(x[0])), totalQ = DAQ.length, plan = dailyPlan();
  app.innerHTML = `
  <header class="top">
    <div class="brand"><span class="eyebrow">GATE DA · Formula & concept drills</span><h1>Formula Quizzer</h1></div>
    <nav class="navrow"><button class="ghost" id="myqBtn">My questions (${(S.qs || []).length})</button><button class="ghost" id="notesBtn">My notes (${S.mine.length})</button><button class="ghost" id="covBtn">Coverage</button></nav>
  </header>
  <div class="stats">
    <div class="stat"><span class="lbl">Points</span><b>${S.pts.toLocaleString('en-IN')}</b><span class="sub">${plural(S.sets,'set')} played</span></div>
    <div class="stat"><span class="lbl">Day streak</span><b>${streakNow()}</b><span class="sub">${S.last===today()?'done today':'play to extend'}</span></div>
    <div class="stat"><span class="lbl">Mastered</span><b>${m}<small> / ${all.length}</small></b><span class="sub">formulas</span></div>
    <div class="stat"><span class="lbl">Subjects ready</span><b>${BUILT.length}<small> / ${SUBJECTS.length}</small></b><span class="sub">${BUILT.length === SUBJECTS.length ? 'all subjects built' : 'more coming'}</span></div>
  </div>

  <section class="hero">
    <div>
      <h2>Daily set</h2>
      <p>${plan.rounds} rounds, about ${plan.minutes} minutes: ${plan.k > 1 ? `about 6 questions from each of your ${plan.k} subjects` : `${plan.n} questions from ${SUBJ[S.pick.find(s => bySubj(s).length) || S.pick[0]].name}`}${plan.matches ? `, plus ${plural(plan.matches,'matching round')}` : ''}. Formulas you missed come back first, then new ones.</p>
      <div class="chips" role="group" aria-label="Subjects in the daily set">${R.map(id => `<button class="pickchip ${S.pick.includes(id)?'on':''}" data-s="${id}" aria-pressed="${S.pick.includes(id)}">${SUBJ[id].short}</button>`).join('')}</div>
      <p class="meta mono">${due} due for review · ${fresh_} not seen yet</p>
    </div>
    <button class="primary" id="startBtn" ${pool.length?'':'disabled'}>Start set</button>
  </section>

  <section>
    <h3 class="sec">Subjects</h3>
    <div class="subjects">${SUBJECTS.map(s => {
      const l = bySubj(s.id), q = DAQ.filter(x => x[2]===s.id).length;
      const share = Math.round(q/totalQ*100);
      if (!l.length) return `<div class="subj off"><div class="sh"><span class="sn">${s.name}</span><span class="pill">Coming next</span></div>
        <span class="sm2 mono">${q} of ${totalQ} DA paper questions · ${share}%</span></div>`;
      const t = tier(s.id), off = official(s.id).length, mine = l.length - off, nq = impOf(s.id).length, nn = mine - nq, rq = recsOf(s.id);
      const incl = [nn ? plural(nn,'note') : '', rq.length ? `your ${mixLabel(rq)}` : ''].filter(Boolean).join(', ');
      if (!off) return `<button class="subj" data-s="${s.id}"><div class="sh"><span class="sn">${s.name}</span><span class="pill">Cards coming next</span></div>
        <span class="sm2 mono">${incl} · ${q} paper questions · ${share}%</span>${bar(l)}</button>`;
      return `<button class="subj" data-s="${s.id}"><div class="sh"><span class="sn">${s.name}</span><span class="chip">${t.n}</span></div>
        <span class="sm2 mono">${mastCount(l)}/${l.length} mastered${mine ? ` · incl. ${incl}` : ''} · ${q} paper questions · ${share}%</span>${bar(l)}</button>`;
    }).join('')}</div>
    <div class="legend"><span>Mastered</span><span class="l-seen">Seen</span></div>
  </section>

  <section>
    <h3 class="sec">Round types</h3>
    <ul class="kinds">${Object.keys(KIND).map(k => `<li><span class="chip">${KIND[k]}</span>${KIND_DESC[k]}</li>`).join('')}</ul>
    <p class="note">Stuck? Press <b>Skip</b> (or the S key). A skipped question earns no points and breaks your combo, but its dots don’t change and it comes back in a later set. Skips are listed for review at the end.</p>
  </section>

  <footer>
    <span>${CARDS.length} formulas so far. Progress and notes are saved in this browser only, so download a backup now and then.</span>
    <span class="frow"><button class="ghost sm" id="repBtn">Reported cards (${flagCount()})</button><button class="ghost sm" id="bkBtn">Download backup</button>${canShareFile() ? '<button class="ghost sm" id="shBtn">Share backup</button>' : ''}<label class="ghost sm filebtn">Restore backup<input type="file" id="rsIn" accept=".json,application/json" hidden></label><button class="ghost sm" id="resetBtn">Reset progress</button></span>
    <span class="note" id="bkMsg" role="status"></span>
  </footer>`;
  $('#startBtn').onclick = () => startSet(pool, plan.n, 'Daily set', null, {per:6, matches:plan.matches});
  $('#covBtn').onclick = coverage;
  $('#repBtn').onclick = reports;
  $('#notesBtn').onclick = () => notes();
  $('#myqBtn').onclick = () => myQuestions();
  $('#bkBtn').onclick = () => { backup(); $('#bkMsg').textContent = 'Backup downloaded to your Downloads folder. To move progress to another device, send this file there and use Restore backup → Merge.'; };
  if ($('#shBtn')) $('#shBtn').onclick = () => shareBackup().then(() => { $('#bkMsg').textContent = 'Backup shared.'; }).catch(e => { if (e && e.name !== 'AbortError') $('#bkMsg').textContent = 'Sharing didn’t work here. Use Download backup instead.'; });
  $('#rsIn').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) restorePrompt(f); };
  app.querySelectorAll('.pickchip').forEach(b => b.onclick = () => {
    const id = b.dataset.s, i = S.pick.indexOf(id);
    if (i >= 0){ if (S.pick.length > 1) S.pick.splice(i,1); } else S.pick.push(id);
    save(); home();
  });
  app.querySelectorAll('button.subj').forEach(b => b.onclick = () => subject(b.dataset.s));
  confirmBtn($('#resetBtn'), 'Tap again to erase progress', () => { const f = S.flags, mn = S.mine, qq = S.qs; S = fresh(); S.flags = f; S.mine = mn; S.qs = qq; IMP = null; save(); home(); });
}

/* ---------- subject page ---------- */
function subject(sid){
  go('subject');
  const s = SUBJ[sid], l = bySubj(sid), t = tier(sid);
  app.innerHTML = `
  <header class="top">
    <div class="brand"><span class="eyebrow">${s.name}</span><h1>${t.n} · ${t.m}× points</h1></div>
    <nav class="navrow"><button class="ghost" id="myQ">My questions (${recsOf(sid).length})</button><button class="ghost" id="addN">Add a note</button><button class="ghost" id="deckBtn">Formula deck</button><button class="ghost" id="back">Home</button></nav>
  </header>
  ${official(sid).length ? ladder(official(sid), t) : '<p class="note">Built-in cards for this subject are coming next. Until then, your own notes for it are drilled here.</p>'}
  <section class="hero">
    <div><h2>${s.short} set</h2><p>Nine rounds from ${s.name} plus a matching round.</p></div>
    <button class="primary" id="startBtn">Start set</button>
  </section>
  ${recsOf(sid).length ? `<section class="hero"><div><h2>Only mine</h2><p>${mixLabel(recsOf(sid))} you imported for ${s.name}. Good for checking a new batch.</p></div><button class="ghost" id="mineOnly">Drill mine</button></section>` : ''}
  <section>
    <h3 class="sec">Drill one topic</h3>
    <div class="topics">${s.topics.map(tp => {
      const cs_ = l.filter(c => c.t === tp.id);
      if (!cs_.length) return '';
      return `<button class="topic" data-t="${tp.id}"><span>${tp.name}</span><span class="tc mono">${mastCount(cs_)}/${cs_.length}</span>${bar(cs_)}</button>`;
    }).join('')}</div>
    <div class="legend"><span>Mastered</span><span class="l-seen">Seen</span></div>
  </section>`;
  $('#back').onclick = home;
  $('#addN').onclick = () => notes(sid);
  $('#myQ').onclick = () => myQuestions(sid);
  const mq = $('#mineOnly'); if (mq) mq.onclick = () => { const pool = impOf(sid); startSet(pool, Math.min(9, nItems(pool)), 'Mine · ' + s.short, sid, {matches:1}); };
  $('#deckBtn').onclick = () => deck(sid);
  $('#startBtn').onclick = () => startSet(l, 9, s.name, sid);
  app.querySelectorAll('.topic').forEach(b => b.onclick = () => {
    const pool = l.filter(c => c.t === b.dataset.t);
    startSet(pool, Math.min(8, nItems(pool)), TL[sid+'.'+b.dataset.t], sid);
  });
}

/* ---------- play ---------- */
function startSet(pool, n, label, sid, opt){
  G = {qs:build(pool, n, opt), i:0, pts:0, right:0, combo:0, best:0, missed:[], seen:[], skipped:[], res:[], label, pool, n, sid, opt};
  VIEW = 'play'; renderQ();
}
function playHead(){
  const n = G.qs.length;
  return `<div class="playbar">
    <button class="ghost sm" id="quit">Quit</button>
    <button class="ghost sm" id="skip" title="Skip this question (S)">Skip</button>
    <span class="mono">${G.i+1} / ${n} · ${esc(G.label)}</span>
    <span class="sp"></span>
    <span class="combo mono ${G.combo>=2?'on':''}" id="combo">Combo ×${G.combo}</span>
    <span class="mono ptsv" id="ptsv">${G.pts} pts</span>
  </div>
  <div class="track"><i id="tbar"></i><span class="mark"></span></div>
  <div class="trackcap"><span>speed bonus</span><span>${TLIM}s</span></div>
  <div class="steps">${G.qs.map((_,j) => `<i class="${j<G.i?(G.res[j] === null ? 'skip' : G.res[j] ? 'ok' : 'no'):j===G.i?'cur':''}"></i>`).join('')}</div>`;
}
function bindHead(){
  confirmBtn($('#quit'), 'Tap again to quit', () => { stopTimer(); G.sid ? subject(G.sid) : home(); });
  $('#skip').onclick = skip;
  G.t0 = performance.now(); G.answered = false;
  const b = $('#tbar');
  (function tick(){
    const dt = (performance.now()-G.t0)/1000;
    if (b){ b.style.width = Math.min(100, dt/TLIM*100)+'%'; b.classList.toggle('slow', dt > SPEED); }
    if (dt < TLIM && !G.answered && VIEW === 'play') raf = requestAnimationFrame(tick);
  })();
}
/* cards with gen() produce fresh numbers each time they are shown */
function resolve(q){
  const c = q.card;
  if (!c.gen) return c;
  if (!q.inst){
    let g; try { g = c.gen(Math.random); } catch(e){ console.warn('gen failed', c.id, e); g = null; }
    q.inst = g ? Object.assign({}, c, {q:g.q, why:g.why, gp:JSON.stringify(g.p ?? {})}, g.o ? {o:g.o} : {}, c.k === 'nat' ? {n:{v:g.v, tol:g.tol ?? c.n.tol}} : {}) : c;
  }
  return q.inst;
}
function renderQ(){
  stopTimer(); window.scrollTo(0,0);
  const q = G.qs[G.i];
  if (q.match) return renderMatch(q);
  if (q.card.k === 'recall') return renderRecall(q);
  const c = resolve(q);
  let h = playHead() + `<article class="qcard">
    <div class="qmeta"><span class="chip">${KIND[kindOf(c)]}</span><span class="topic-l">${SUBJ[c.s].short} · ${TL[c.s+'.'+c.t]}</span>
    ${c.imp ? tagLine(c) : ''}<span class="pips" title="Difficulty ${c.lv} of 3">${'●'.repeat(c.lv)}${'○'.repeat(3-c.lv)}</span></div>
    <div class="qtext">${c.q || DEFQ[c.k] || ''}</div>
    ${c.f ? `<div class="fx">${D(c.f)}</div>` : ''}`;
  if (c.k === 'nat'){
    h += `<form class="nat" id="natf"><label class="lbl" for="nat">Your answer</label>
      <div class="natrow"><input id="nat" inputmode="decimal" autocomplete="off" placeholder="e.g. 0.25 or 1/4"><button class="primary" type="submit">Check</button></div>
      <span class="nathint">Decimals or a simple fraction. Press Enter to check.</span></form>`;
  } else if (c.k === 'msq'){
    q.order = q.order || shuffle(c.o.map((x,i) => ({x,i})));
    h += `<p class="nathint">Select every correct option, then press Check. Like GATE MSQs, there is no partial credit.</p>
      <div class="opts" role="group" aria-label="Options">${q.order.map((o,j) => `<button class="opt msq" role="checkbox" aria-checked="false" data-j="${j}"><span class="key box mono">${'ABCD'[j]}</span><span class="ot">${c.om ? I(o.x) : o.x}<span class="oex" hidden></span></span></button>`).join('')}</div>
      <div class="fbrow"><span class="nathint" id="msqcount">None selected</span><button class="primary" id="msqgo" disabled>Check</button></div>`;
  } else {
    q.order = q.order || shuffle(c.o.map((x,i) => ({x,i})));
    h += `<div class="opts">${q.order.map((o,j) => `<button class="opt" data-j="${j}"><span class="key mono">${'ABCD'[j]}</span><span class="ot">${c.om ? I(o.x) : o.x}</span></button>`).join('')}</div>`;
  }
  h += `<div id="fb"></div></article>`;
  app.innerHTML = h; typeset(app); bindHead();
  if (c.k === 'nat'){
    const inp = $('#nat');
    $('#natf').addEventListener('submit', e => {
      e.preventDefault(); if (G.answered) return;
      const v = parseNum(inp.value);
      if (v === null){ inp.focus(); inp.select(); return; }
      const tol = c.n.tol ?? 0.001, ok = Math.abs(v - c.n.v) <= tol + 1e-12;
      inp.disabled = true; $('#natf button').disabled = true; inp.classList.add(ok ? 'right' : 'wrong');
      const lo = +(c.n.v - tol).toFixed(4), hi = +(c.n.v + tol).toFixed(4);
      answer(ok, `<p class="acc mono">Answer ${c.n.v} · accepted ${tol > 0.001 ? `${lo} to ${hi}` : 'exact value'} · you entered ${+v.toFixed(6)}</p>`);
    });
    if (matchMedia('(pointer:fine)').matches) inp.focus();
  } else if (c.k === 'msq'){
    const sel = new Set(), go_ = $('#msqgo'), cnt = $('#msqcount');
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (G.answered) return;
      const j = +b.dataset.j;
      if (sel.has(j)) sel.delete(j); else sel.add(j);
      b.classList.toggle('picked', sel.has(j)); b.setAttribute('aria-checked', sel.has(j));
      go_.disabled = !sel.size; cnt.textContent = sel.size ? `${sel.size} selected` : 'None selected';
    });
    go_.onclick = () => {
      if (G.answered || !sel.size) return;
      const right = new Set(c.a);
      let ok = true;
      app.querySelectorAll('.opt').forEach((x,k) => {
        const isRight = right.has(q.order[k].i), picked = sel.has(k);
        if (isRight !== picked) ok = false;
        x.disabled = true;
        x.classList.add(isRight ? (picked ? 'right' : 'missed') : (picked ? 'wrong' : 'plain'));
        const ex = x.querySelector('.oex');
        ex.innerHTML = `<b>${isRight ? 'True' : 'False'}${isRight && !picked ? ', missed' : ''}.</b> ${c.ex ? c.ex[q.order[k].i] : ''}`; ex.hidden = false;
      });
      go_.parentElement.remove();
      typeset($('.opts'));
      answer(ok, '');
    };
  } else {
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if (G.answered) return;
      const j = +b.dataset.j, ok = q.order[j].i === c.a;
      app.querySelectorAll('.opt').forEach((x,k) => { x.disabled = true; if (q.order[k].i === c.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      answer(ok, '');
    });
  }
}
function parseNum(s){
  s = String(s).trim().replace(/,/g,'').replace(/^−/,'-'); if (!s) return null;
  const f = s.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/);
  if (f){ const a = +f[1], b = +f[2]; return b ? a/b : null; }
  const v = Number(s); return Number.isFinite(v) ? v : null;
}
function award(ok, base, sid){
  const m = tier(sid).m, dt = (performance.now()-G.t0)/1000;
  let g = 0, fast = false, combo = false;
  if (ok){
    g = base*m; if (dt < SPEED){ g += 5*m; fast = true; }
    G.combo++; G.best = Math.max(G.best, G.combo); if (G.combo >= 3){ g += 5; combo = true; }
    G.right++;
  } else G.combo = 0;
  G.pts += g; S.pts += g; G.res[G.i] = ok;
  const tags = [g ? `+${g} pts` : '0 pts']; if (fast) tags.push('speed bonus'); if (combo) tags.push(`combo ×${G.combo}`);
  $('#ptsv').textContent = G.pts+' pts';
  const cb = $('#combo'); cb.textContent = 'Combo ×'+G.combo; cb.classList.toggle('on', G.combo >= 2);
  return tags.join(' · ');
}
function paperRefs(c){
  const refs = [...new Set(unitsOf(c).flatMap(u => HITS[u] || []))];
  return refs.length ? `<p class="refs"><span class="lbl">Tested in</span> ${refs.slice(0,4).join(' · ')}${refs.length>4?` · +${refs.length-4} more`:''}</p>` : '';
}
function answer(ok, extra){
  if (G.answered) return; G.answered = true; stopTimer(); hideSkip();
  const c = resolve(G.qs[G.i]);
  const tags = award(ok, 10, c.s);
  markShown(c); const r = review(c, ok); save();
  G.seen.push(c); if (!ok) G.missed.push(c);
  const fb = $('#fb');
  const nextBtn = `<button class="primary" id="next">${G.i+1 < G.qs.length ? 'Next' : 'See results'}</button>`;
  fb.innerHTML = `<div class="verdict ${ok?'ok':'no'}"><b>${c.k === 'recall' ? (ok ? 'Good recall.' : 'Marked to review.') : ok ? pick(OKW) : 'Not quite.'}</b><span class="mono">${tags}</span></div>
    ${dotLine(c, r)}
    ${c.mine ? `<div class="fbrow"><button class="link" id="editN">Edit this note</button>${nextBtn}</div>` : c.imp ? `
    ${c.k === 'recall' ? '' : `${extra}${c.why ? `<p class="why">${c.why}</p>` : ''}
    <div class="sheet"><span class="lbl">${c.name}</span>${SH(c)}</div>`}
    <div class="fbrow"><span><button class="link" id="editQ">Edit</button> · <button class="link" id="delQ">Delete</button> <span class="sm2">(your ${c.fx ? 'formula' : 'question'})</span></span>${nextBtn}</div>` : `
    ${extra}<p class="why">${c.why}</p>
    <div class="sheet"><span class="lbl">${c.name}</span>${SH(c)}</div>
    ${paperRefs(c)}
    <div class="fbrow"><button class="link" id="flag">${S.flags[c.id] ? 'Reported' : 'Report a problem'}</button>${nextBtn}</div>
    <form class="flagf" id="flagf" hidden><label class="lbl" for="flagnote">What looks wrong?</label>
      <div class="natrow"><input id="flagnote" autocomplete="off" placeholder="e.g. option B is also correct" value="${esc(S.flags[c.id]?.note || '')}"><button class="ghost" type="submit">Save</button></div></form>`}`;
  typeset(fb);
  const nx = $('#next'); nx.onclick = advance; nx.focus({preventScroll:true});
  if (c.mine){
    $('#editN').onclick = () => { stopTimer(); notes(null, c.id.slice(3)); };
  } else if (c.imp){
    const back = G.sid ? () => subject(G.sid) : () => myQuestions(c.s, c.t);
    $('#editQ').onclick = () => { stopTimer(); editQuestion(c.qid, back); };
    confirmBtn($('#delQ'), 'Tap again to delete', () => {
      dropQ(c.qid); save();
      const d = $('#delQ'); d.textContent = 'Deleted'; d.disabled = true; $('#editQ').disabled = true;
    });
  } else {
    $('#flag').onclick = () => { const f = $('#flagf'); f.hidden = !f.hidden; if (!f.hidden) $('#flagnote').focus(); };
    $('#flagf').addEventListener('submit', e => {
      e.preventDefault();
      S.flags[c.id] = {note: $('#flagnote').value.trim(), at: today(), ...(c.gp ? {nums: c.gp} : {})}; save();
      $('#flagf').hidden = true; $('#flag').textContent = 'Reported'; nx.focus({preventScroll:true});
    });
  }
  fb.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest'});
}
function advance(){ G.i++; if (G.i >= G.qs.length) finish(); else renderQ(); }
/* skip: no points, no change to the card's dots (it stays due, so it comes back in a later set); breaks the combo */
function skip(){
  if (!G || G.answered) return;
  G.answered = true; stopTimer();
  const q = G.qs[G.i];
  G.res[G.i] = null; G.combo = 0;
  if (q.card){ markShown(q.card); save(); }
  if (q.card) G.skipped.push(q.card.mine ? q.card : resolve(q));
  advance();
}
function markShown(c){ (S.shown = S.shown || {})[c.id] = Date.now(); }
function hideSkip(){ const b = $('#skip'); if (b) b.hidden = true; }

/* recall round for the student's own notes: think, reveal, self-grade */
function noteBody(c){
  return `${c.sheet ? `<div class="fx">${D(esc(c.sheet))}</div>` : ''}${c.note ? `<p class="ntext">${esc(c.note)}</p>` : ''}`;
}
function renderRecall(q){
  const c = q.card;
  app.innerHTML = playHead() + `<article class="qcard">
    <div class="qmeta"><span class="chip">${KIND.recall}</span><span class="topic-l">${SUBJ[c.s].short} · ${TL[c.s+'.'+c.t] || ''}</span>${c.imp ? tagLine(c) : ''}</div>
    <p class="qtext">${c.imp ? 'Write or say this formula from memory, with its conditions, then reveal it.' : 'Recall this from memory, then reveal your note.'}</p>
    <h2 class="recallname">${c.mine ? esc(c.name) : c.name}</h2>
    <div id="reveal" class="reveal" hidden></div>
    <div class="fbrow" id="rbtns"><span class="nathint">Press Enter to reveal</span><button class="primary" id="show">${c.imp ? 'Show formula' : 'Show my note'}</button></div>
    <div id="fb"></div></article>`;
  typeset(app); bindHead();
  const show = $('#show'); show.focus({preventScroll:true});
  show.onclick = () => {
    const rv = $('#reveal'); rv.innerHTML = noteBody(c) || '<p class="ntext">This note has only a title.</p>'; rv.hidden = false; typeset(rv);
    $('#rbtns').innerHTML = `<button class="ghost" id="miss">I didn’t know it</button><button class="primary" id="knew">I knew it</button>`;
    $('#knew').onclick = () => { $('#rbtns').remove(); answer(true, ''); };
    $('#miss').onclick = () => { $('#rbtns').remove(); answer(false, ''); };
    $('#knew').focus({preventScroll:true});
  };
}

function renderMatch(q){
  const cards = q.match;
  q.L = q.L || shuffle(cards.slice()); q.Rt = q.Rt || shuffle(cards.slice());
  app.innerHTML = playHead() + `<article class="qcard">
    <div class="qmeta"><span class="chip">${KIND.match}</span><span class="topic-l">${SUBJ[cards[0].s].short} · bonus round</span></div>
    <p class="qtext">Tap a name, then the formula it belongs to.</p>
    <div class="match">
      <div class="mcol">${q.L.map(c => `<button class="mb" data-s="L" data-id="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="mcol">${q.Rt.map(c => `<button class="mb" data-s="R" data-id="${c.id}"><span class="ot">${ID(c.imp ? esc(c.sheet) : c.sheet)}</span></button>`).join('')}</div>
    </div>
    <div id="fb"></div></article>`;
  typeset(app); bindHead();
  let sel = null, miss = 0; const done = new Set();
  app.querySelectorAll('.mb').forEach(b => b.onclick = () => {
    if (G.answered || b.disabled) return;
    if (!sel || sel.dataset.s === b.dataset.s){ if (sel) sel.classList.remove('sel'); sel = sel === b ? null : b; if (sel) sel.classList.add('sel'); return; }
    const a = sel; sel.classList.remove('sel'); sel = null;
    if (a.dataset.id === b.dataset.id){
      [a,b].forEach(x => { x.classList.add('done'); x.disabled = true; }); done.add(b.dataset.id);
      if (done.size === 4) finishMatch(miss, cards[0].s);
    } else {
      miss++; [a,b].forEach(x => { x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); });
    }
  });
}
function finishMatch(miss, sid){
  G.answered = true; stopTimer(); hideSkip();
  const ok = miss <= 1, base = miss === 0 ? 15 : miss === 1 ? 10 : 0;
  const tags = award(ok, base, sid); save();
  const fb = $('#fb');
  fb.innerHTML = `<div class="verdict ${ok?'ok':'no'}"><b>${miss === 0 ? 'All four, no slips.' : `Matched with ${plural(miss,'slip')}.`}</b><span class="mono">${tags}</span></div>
    <div class="fbrow"><span></span><button class="primary" id="next">${G.i+1 < G.qs.length ? 'Next' : 'See results'}</button></div>`;
  const nx = $('#next'); nx.onclick = advance; nx.focus({preventScroll:true});
}

function finish(){
  go('summary');
  const td = today();
  if (S.last !== td){ S.streak = (S.last === yesterday()) ? S.streak+1 : 1; S.last = td; }
  S.sets++; save();
  const n = G.qs.length, ns = G.res.filter(x => x === null).length, done = n - ns;
  const review_ = G.missed.concat(G.skipped), list = review_.length ? review_ : G.seen;
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">Set complete · ${esc(G.label)}</span><h1>${G.right} of ${n} right${ns ? ` · ${ns} skipped` : ''}</h1></div></header>
  <div class="res"><span class="big">+${G.pts}</span><span class="lbl">points this set</span></div>
  <div class="stats rstats">
    <div class="stat"><span class="lbl">Accuracy${ns ? ' (answered)' : ''}</span><b>${done ? Math.round(G.right/done*100) + '%' : '–'}</b></div>
    <div class="stat"><span class="lbl">Best combo</span><b>×${G.best}</b></div>
    <div class="stat"><span class="lbl">Day streak</span><b>${S.streak}</b></div>
  </div>
  <section>
    <h3 class="sec">${review_.length ? `Review what you ${G.missed.length && G.skipped.length ? 'missed or skipped' : G.missed.length ? 'missed' : 'skipped'} (${review_.length})` : 'No misses. Formulas from this set'}</h3>
    ${list.length ? carousel(list) : ''}
  </section>
  <div class="actions"><button class="primary" id="again">Play another set</button><button class="ghost" id="homeB">${G.sid ? SUBJ[G.sid].short+' page' : 'Home'}</button></div>`;
  typeset(app);
  if (list.length) bindCarousel(list.length);
  $('#again').onclick = () => startSet(G.pool, G.n, G.label, G.sid, G.opt);
  $('#homeB').onclick = () => G.sid ? subject(G.sid) : home();
}
function carousel(cards){
  return `<div class="car"><div class="car-track" id="ctrack">${cards.map(c => `
    <div class="slide"><span class="eyebrow">${SUBJ[c.s].short} · ${TL[c.s+'.'+c.t]}${c.mine ? ' · your note' : ''}</span><h4>${c.mine ? esc(c.name) : c.name}</h4>
    ${c.mine ? noteBody(c) : `${SH(c,'fx')}<p class="why">${c.why}</p>`}</div>`).join('')}</div>
    <div class="car-nav"><button class="ghost sm" id="cprev">Previous</button><span class="mono" id="cpos"></span><button class="ghost sm" id="cnext">Next</button></div></div>`;
}
function bindCarousel(n){
  let k = 0; const tr = $('#ctrack'), pv = $('#cprev'), nx = $('#cnext'), pos = $('#cpos');
  const to = i => { k = Math.max(0, Math.min(n-1, i)); tr.style.transform = `translateX(${-k*100}%)`; pos.textContent = `${k+1} / ${n}`; pv.disabled = k===0; nx.disabled = k===n-1; };
  pv.onclick = () => to(k-1); nx.onclick = () => to(k+1);
  let x0 = null;
  tr.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive:true});
  tr.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) to(k + (dx < 0 ? 1 : -1)); x0 = null; });
  to(0);
}

/* ---------- deck ---------- */
function deck(sid){
  go('deck');
  const s = SUBJ[sid], l = bySubj(sid).filter(c => !(c.fx && c.k !== 'recall'));
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">${s.name}</span><h1>${s.deck || 'Formula deck'}</h1></div>
  <button class="ghost" id="back">Back</button></header>
  <p class="note">The 5 dots track how well you know each formula. A correct answer on or after its review date fills one dot and pushes the next review further out (1, 2, 4, 7, then 15 days). A wrong answer empties them. Three dots means mastered.</p>
  ${s.topics.map(tp => { const cs_ = l.filter(c => c.t === tp.id); if (!cs_.length) return '';
    return `<section class="dsec"><h3>${tp.name}<span>${mastCount(cs_)}/${cs_.length} mastered</span></h3>
    <div class="dgrid">${cs_.map(c => { const b = get(c.id).b; return `<div class="dcard ${c.mine?'minecard':''}"><div class="dhead"><b>${c.mine ? esc(c.name) : c.name}</b>
      <span class="boxes" title="${b} of 5 dots">${[1,2,3,4,5].map(i => `<i class="${i<=b?'f':''}"></i>`).join('')}</span></div>
      ${c.mine ? `<span class="lbl">Your note</span>${c.sheet ? `<div class="fxi">${D(esc(c.sheet))}</div>` : ''}${c.note ? `<p class="ntext">${esc(c.note)}</p>` : ''}` : SH(c)}</div>`; }).join('')}</div></section>`; }).join('')}`;
  typeset(app);
  $('#back').onclick = () => subject(sid);
}

/* ---------- coverage ---------- */
function coverage(){
  go('coverage');
  const cnt = {};
  for (const c of CARDS) for (const u of unitsOf(c)) cnt[u] = (cnt[u]||0) + 1;
  const rows = SUBJECTS.map(s => {
    const units = s.topics.flatMap(t => Object.keys(t.units).map(k => s.id+'.'+k));
    const covered = units.filter(u => cnt[u]).length;
    const qs = PAPER_QS.filter(x => x[2] === s.id);
    const qcov = qs.filter(x => x[3].every(u => cnt[s.id+'.'+u])).length;
    return {s, units, covered, qs, qcov};
  });
  const U = rows.reduce((a,r) => a + r.units.length, 0), UC = rows.reduce((a,r) => a + r.covered, 0);
  const Q = PAPER_QS.length, QC = rows.reduce((a,r) => a + r.qcov, 0);
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">Syllabus checklist</span><h1>Coverage</h1></div>
  <button class="ghost" id="back">Home</button></header>
  <p class="note">Every line of the GATE DA syllabus is split into concept units. Every subject question from the IISc 2024 sample and the DA 2024, 2025 and 2026 papers is tagged with the units it needs, and so is every General Aptitude question from the DA 2024–2026 and CS 2022–2025 papers. A unit with no cards is a gap.</p>
  <div class="stats rstats">
    <div class="stat"><span class="lbl">Units with cards</span><b>${UC}<small> / ${U}</small></b></div>
    <div class="stat"><span class="lbl">Paper questions covered</span><b>${QC}<small> / ${Q}</small></b></div>
    <div class="stat"><span class="lbl">Cards</span><b>${CARDS.length}</b></div>
  </div>
  <div class="covlist">${rows.map(r => {
    const built = BUILT.includes(r.s.id);
    return `<details class="cov" ${built?'open':''}><summary><span class="sn">${r.s.name}</span>
      <span class="mono sm2">${r.covered}/${r.units.length} units · ${r.qcov}/${r.qs.length} questions</span></summary>
      ${r.s.topics.map(t => `<div class="ctopic"><h4>${t.name}</h4><table class="ctab"><thead><tr><th>Unit</th><th>Cards</th><th>Paper Qs</th><th>Status</th></tr></thead><tbody>${Object.entries(t.units).map(([k,label]) => {
        const key = r.s.id+'.'+k, n = cnt[key]||0, hits = HITS[key]||[];
        const st = !n ? ['gap','Gap'] : (hits.length >= 2 && n < 2) ? ['thin','Thin'] : ['ok','Covered'];
        return `<tr><td class="ul">${label}${hits.length?`<span class="hits">${hits.join(' · ')}</span>`:''}</td>
          <td class="mono num">${n}</td><td class="mono num">${hits.length}</td><td><span class="st ${st[0]}">${st[1]}</span></td></tr>`;
      }).join('')}</tbody></table></div>`).join('')}</details>`;
  }).join('')}</div>`;
  $('#back').onclick = home;
}

/* ---------- reports ---------- */
function reports(){
  go('reports');
  const ids = Object.keys(S.flags);
  const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
  const text = ids.map(id => `${id} | ${byId[id]?.name || '?'} | ${S.flags[id].note || '(no note)'}${S.flags[id].nums ? ` | numbers ${S.flags[id].nums}` : ''}`).join('\n');
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">Card fixes</span><h1>Reported cards</h1></div>
  <button class="ghost" id="back">Home</button></header>
  <p class="note">${ids.length ? 'Copy this list and paste it to Claude in the chat. Each line gets checked and fixed.' : 'Nothing reported yet. Use “Report a problem” under any answer when a card looks wrong.'}</p>
  ${ids.length ? `<textarea class="reptext mono" id="rep" readonly rows="${Math.min(14, ids.length+1)}">${esc(text)}</textarea>
  <div class="actions"><button class="primary" id="copy">Copy list</button><button class="ghost" id="clear">Clear list</button></div>` : ''}`;
  $('#back').onclick = home;
  if (ids.length){
    $('#copy').onclick = async () => {
      const ta = $('#rep');
      try { await navigator.clipboard.writeText(ta.value); $('#copy').textContent = 'Copied'; }
      catch(e){ ta.focus(); ta.select(); $('#copy').textContent = 'Press Ctrl+C'; }
    };
    confirmBtn($('#clear'), 'Tap again to clear', () => { S.flags = {}; save(); reports(); });
  }
}

/* ---------- my notes ---------- */
function exportNotes(){
  return S.mine.map(n => `[${SUBJ[n.s].short} · ${TL[n.s+'.'+n.t] || n.t}] ${n.name}${n.sheet ? ` | formula: ${n.sheet}` : ''}${n.note ? ` | note: ${n.note.replace(/\s*\n\s*/g,' ')}` : ''}`).join('\n');
}
function notes(prefS, editId, msg){
  go('notes');
  const ed = editId ? S.mine.find(n => n.id === editId) : null;
  const sSel = ed ? ed.s : (prefS || S.lastNoteS || SUBJECTS[0].id);
  const list = S.mine.slice().reverse();
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">Your additions</span><h1>My notes</h1></div>
  <button class="ghost" id="back">Home</button></header>
  <p class="note">Add a formula or note point you don't want to forget. It joins your sets as a “Your note” card: you recall it, reveal it, and mark whether you knew it. Later, copy the list at the bottom into a chat with Claude to turn your notes into full quiz cards.</p>
  <form class="qcard noteform" id="nf" novalidate>
    <h2>${ed ? 'Edit note' : 'Add a note'}</h2>
    <div class="frow2">
      <label class="fld"><span class="lbl">Subject</span><select id="ns">${SUBJECTS.map(s => `<option value="${s.id}" ${s.id===sSel?'selected':''}>${s.name}</option>`).join('')}</select></label>
      <label class="fld"><span class="lbl">Topic</span><select id="nt"></select></label>
    </div>
    <label class="fld"><span class="lbl">Title</span><input id="nn" maxlength="120" autocomplete="off" placeholder="e.g. Chebyshev's inequality" value="${esc(ed?.name || '')}"></label>
    <label class="fld"><span class="lbl">Formula (optional)</span><input id="nfx" class="mono" maxlength="400" autocomplete="off" spellcheck="false" placeholder="e.g. P(|X-\\mu|\\ge k\\sigma)\\le \\frac{1}{k^2}" value="${esc(ed?.sheet || '')}"></label>
    <span class="nathint">Written in LaTeX: <code>\\frac{a}{b}</code> <code>x^2</code> <code>x_i</code> <code>\\sqrt{x}</code> <code>\\sum_{i=1}^{n}</code> <code>\\mu</code> <code>\\sigma</code> <code>\\le</code> <code>\\ne</code>. The preview shows how it will look.</span>
    <div class="fx" id="nprev" hidden></div>
    <label class="fld"><span class="lbl">Note (optional)</span><textarea id="nnote" rows="3" maxlength="1000" placeholder="When it applies, a trap to remember, where you saw it">${esc(ed?.note || '')}</textarea></label>
    <p class="formerr" id="nerr" role="alert" hidden></p>
    <div class="fbrow">${ed ? '<button class="ghost" type="button" id="cancel">Cancel</button>' : `<span class="nathint" role="status">${msg || ''}</span>`}<button class="primary" type="submit">${ed ? 'Save changes' : 'Add note'}</button></div>
  </form>
  <section><h3 class="sec">Saved notes (${list.length})</h3>
    ${list.length ? `<div class="dgrid">${list.map(n => `<div class="dcard minecard"><div class="dhead"><b>${esc(n.name)}</b><span class="sm2 mono">${SUBJ[n.s].short} · ${TL[n.s+'.'+n.t] || ''}</span></div>
      ${n.sheet ? `<div class="fxi">${D(esc(n.sheet))}</div>` : ''}${n.note ? `<p class="ntext">${esc(n.note)}</p>` : ''}
      <div class="frow"><button class="ghost sm" data-ed="${n.id}">Edit</button><button class="ghost sm" data-del="${n.id}">Delete</button></div></div>`).join('')}</div>`
      : '<p class="note">No notes yet. Your first one will appear here.</p>'}
  </section>
  ${list.length ? `<section><h3 class="sec">Send to Claude</h3>
    <p class="note">Copy this list and paste it into a chat with Claude. Each note becomes a checked quiz card, and you can then delete the note here.</p>
    <textarea class="reptext mono" id="exp" readonly rows="${Math.min(12, list.length + 1)}">${esc(exportNotes())}</textarea>
    <div class="actions"><button class="primary" id="copyN">Copy list</button></div></section>` : ''}`;
  typeset(app);

  const ns = $('#ns'), nt = $('#nt');
  const fillTopics = (sid, sel) => { nt.innerHTML = SUBJ[sid].topics.map(t => `<option value="${t.id}" ${t.id===sel?'selected':''}>${t.name}</option>`).join(''); };
  fillTopics(sSel, ed ? ed.t : (S.lastNoteS === sSel ? S.lastNoteT : null));
  ns.onchange = () => fillTopics(ns.value);
  const fx = $('#nfx'), pv = $('#nprev'); let tmr = 0;
  const preview = () => { const v = fx.value.trim(); pv.hidden = !v; pv.innerHTML = v ? D(esc(v)) : ''; if (v) typeset(pv); };
  fx.oninput = () => { clearTimeout(tmr); tmr = setTimeout(preview, 350); };
  preview();
  $('#back').onclick = home;
  $('#nf').addEventListener('input', () => { $('#nerr').hidden = true; });
  if (ed) $('#cancel').onclick = () => notes(ed.s);
  $('#nf').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#nn').value.trim(), sheet = fx.value.trim(), note = $('#nnote').value.trim(), err = $('#nerr');
    if (!name){ err.textContent = 'Give the note a title, so the quiz can ask you to recall it.'; err.hidden = false; $('#nn').focus(); return; }
    if (!sheet && !note){ err.textContent = 'Add a formula, a note, or both. That’s what you’ll check yourself against.'; err.hidden = false; fx.focus(); return; }
    const rec = {id: ed ? ed.id : Date.now().toString(36), s: ns.value, t: nt.value, name, sheet, note, at: ed ? ed.at : today(), up: Date.now()};
    if (ed) S.mine[S.mine.indexOf(ed)] = rec; else S.mine.push(rec);
    S.lastNoteS = rec.s; S.lastNoteT = rec.t;
    if (!S.pick.includes(rec.s)) S.pick.push(rec.s);
    save();
    notes(rec.s, null, ed ? 'Changes saved.' : `Added “${name}”. It will show up in your sets.`);
  });
  app.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => notes(null, b.dataset.ed));
  app.querySelectorAll('[data-del]').forEach(b => confirmBtn(b, 'Tap again to delete', () => {
    S.mine = S.mine.filter(n => n.id !== b.dataset.del); delete S.c['my.'+b.dataset.del]; save(); notes(null, null, 'Note deleted.');
  }));
  const cp = $('#copyN');
  if (cp) cp.onclick = async () => {
    const ta = $('#exp');
    try { await navigator.clipboard.writeText(ta.value); cp.textContent = 'Copied'; }
    catch(e){ ta.focus(); ta.select(); cp.textContent = 'Press Ctrl+C'; }
  };
  if (ed) $('#nn').focus();
}

/* ---------- my questions (imported from ChatGPT / Gemini) ---------- */
/* Stored in S.qs as plain records; turned into cards by impCards(). They mix into sets but don't count for levels (official() is BANK only). */
const AL = 'ABCD';
const shortName = q => { const t = q.replace(/```[\s\S]*?```/g, ' [code] ').replace(/\\\(.*?\\\)/g, '…').replace(/\s+/g, ' ').trim(); return t.length > 60 ? t.slice(0, 57) + '…' : t; };
/* imported text → safe HTML: ```code blocks``` become <pre><code>, `inline` becomes <code>, line breaks are kept */
const fmt = s => String(s || '').split(/```[A-Za-z0-9+#-]*[ \t]*\n?([\s\S]*?)```/).map((p, i) => i % 2 ? `<pre><code>${esc(p.replace(/\n+$/, ''))}</code></pre>` : esc(p).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>')).join('');
/* an imported formula (k:'formula') becomes up to three cards that share its name, so a set shows only one of them:
   recall it (.r), fill the gap (.f) and spot the bug (.b). Its recall card can also appear in Match it rounds. */
const isF = x => x.k === 'formula';
function buildImp(){
  return (S.qs || []).filter(x => SUBJ[x.s]).flatMap(x => {
    const base = {qid:x.id, s:x.s, t:x.t, imp:true};
    if (isF(x)){
      const name = esc(x.name), why = fmt(x.note || ''), lv = x.lv || 1, head = `<b>${name}</b><br>`;
      const out = [Object.assign({}, base, {id:'q.'+x.id+'.r', k:'recall', lv:1, fx:1, name, sheet:x.formula, note:x.note || '', why})];
      if (x.fill) out.push(Object.assign({}, base, {id:'q.'+x.id+'.f', k:'fill', lv, fx:1, name, sheet:x.formula, why,
        q: head + (x.fill.q ? fmt(x.fill.q) : DEFQ.fill), f: esc(x.fill.f), o: x.fill.o.map(esc), om:1, a: x.fill.a}));
      if (x.bug) out.push(Object.assign({}, base, {id:'q.'+x.id+'.b', k:'bug', lv:Math.min(3, lv+1), fx:1, name, sheet:x.formula, why,
        q: head + DEFQ.bug, f: esc(x.bug.f), o: x.bug.o.map(fmt), a: x.bug.a}));
      return out;
    }
    return [Object.assign({}, base, {
      id:'q.'+x.id, k:x.k, lv:x.lv || 2,
      name: esc(x.concept || shortName(x.q)), sheet: x.formula || '',
      q: fmt(x.q), o: x.o ? x.o.map(fmt) : undefined, a: x.a, n: x.n, ex: x.ex ? x.ex.map(fmt) : undefined,
      why: fmt(x.note || '')
    })];
  });
}
const impCards = () => IMP || (IMP = buildImp());
const impOf = (sid, tid) => impCards().filter(c => c.s === sid && (!tid || c.t === tid));
const recsOf = sid => (S.qs || []).filter(x => x.s === sid);
/* same question / same formula name = duplicate */
const qKey = x => x.s + '|' + (isF(x) ? 'f ' + normQ(x.name || '') : normQ(x.q || ''));
const itemLabel = x => isF(x) ? x.name : shortName(x.q);
const mixLabel = l => { const f = l.filter(isF).length, q = l.length - f; return [q ? plural(q, 'question') : '', f ? plural(f, 'formula') : ''].filter(Boolean).join(' and ') || '0 questions'; };
/* one round per question or formula (a formula's three cards count once) */
const nItems = pool => new Set(pool.map(c => c.qid || c.id)).size;
/* delete a question or formula and the progress of all its cards */
function dropQ(qid){
  S.qs = (S.qs || []).filter(y => y.id !== qid);
  for (const k of Object.keys(S.c)) if (k === 'q.'+qid || k.startsWith('q.'+qid+'.')) delete S.c[k];
  IMP = null;
}

/* AI replies often contain LaTeX with single backslashes (\frac, \times), which is invalid or silently wrong JSON.
   Inside strings, keep \" and \\ and \uXXXX; turn every other backslash into a literal backslash. */
/* AI replies often contain LaTeX with single backslashes (\frac, \times), which is invalid or silently wrong JSON.
   Inside strings: keep \" \\ \/ \uXXXX; keep \n (new line, used in code) unless it starts a LaTeX command such as \nabla or \neq;
   keep \t \r \b \f only when not followed by a letter (\times, \rho, \beta, \frac are LaTeX); every other backslash becomes a literal one. */
const NCMD = new Set(['nabla','neq','ne','nu','ni','not','notin','nmid','nleq','ngeq','nless','ngtr','nexists','nrightarrow','nleftarrow','nRightarrow','nLeftarrow','newline','natural','nparallel','nsubseteq','nsupseteq','nsim','ncong','neg','nearrow','nwarrow']);
function fixBackslashes(t){
  let out = '', inStr = false;
  for (let i = 0; i < t.length; i++){
    const ch = t[i];
    if (!inStr){ if (ch === '"') inStr = true; out += ch; continue; }
    if (ch === '\\'){
      const n = t[i+1], word = (t.slice(i+1).match(/^[A-Za-z]+/) || [''])[0];
      if (n === '"' || n === '\\' || n === '/'){ out += ch + n; i++; continue; }
      if (n === 'u' && /^[0-9a-fA-F]{4}$/.test(t.slice(i+2, i+6))){ out += t.slice(i, i+6); i += 5; continue; }
      if (n === 'n' && !NCMD.has(word)){ out += '\\n'; i++; continue; }
      if ('trbf'.includes(n) && word.length === 1){ out += ch + n; i++; continue; }
      out += '\\\\'; continue;
    }
    if (ch === '"'){ inStr = false; out += ch; continue; }
    if (ch === '\n'){ out += '\\n'; continue; }   /* raw line breaks inside a string are invalid JSON; keep them as \n */
    if (ch === '\r' || ch === '\t'){ out += ch === '\t' ? '    ' : ''; continue; }
    out += ch;
  }
  return out;
}
function parseImport(raw){
  let t = String(raw || '').trim();
  if (!t) throw new Error('Nothing pasted yet.');
  if (!/^[\[{]/.test(t)){
    const open = t.match(/```[A-Za-z]*\s*(?=[\[{])/);
    if (open){ const st = open.index + open[0].length, en = t.lastIndexOf('```'); t = (en > st ? t.slice(st, en) : t.slice(st)).trim(); }
  }
  t = t.replace(/[“”]/g, '"');                     /* curly quotes used as JSON quotes */
  const a = t.indexOf('['), b = t.lastIndexOf(']'), o1 = t.indexOf('{');
  if (a >= 0 && b > a && (o1 < 0 || a < o1)) t = t.slice(a, b + 1);
  else if (o1 >= 0) t = '[' + t.slice(o1, t.lastIndexOf('}') + 1) + ']';
  t = fixBackslashes(t);
  let data;
  try { data = JSON.parse(t); }
  catch(e){
    try { data = JSON.parse(t.replace(/,\s*([\]}])/g, '$1')); }   /* trailing commas */
    catch(e2){ throw new Error('The reply isn’t valid JSON (' + e.message.replace(/^JSON\.parse: /,'') + '). Ask the AI to “reply again with only the JSON array, nothing else”, then paste that.'); }
  }
  if (data && !Array.isArray(data) && Array.isArray(data.questions)) data = data.questions;
  if (!Array.isArray(data)) data = [data];
  return data;
}
const dollars = s => s.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((p, i) => i % 2 ? p : p.replace(/\$\$([^$]+)\$\$/g, '\\($1\\)').replace(/\$([^$\n]+)\$/g, '\\($1\\)')).join('');
const txt = (v, max) => typeof v === 'string' || typeof v === 'number' ? dollars(String(v).replace(/\r/g, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()).slice(0, max) : '';
const normQ = s => s.toLowerCase().replace(/\\\(|\\\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function letterIdx(v, opts){
  if (typeof v === 'string'){
    const s = v.trim().replace(/^\(?([A-Da-d])[).:]?$/, '$1');
    if (/^[A-Da-d]$/.test(s)) return AL.indexOf(s.toUpperCase());
    const k = opts.findIndex(o => o.trim().toLowerCase() === v.trim().toLowerCase()); if (k >= 0) return k;
    const m = v.trim().match(/^(?:option\s*)?([A-Da-d])\b/i); if (m) return AL.indexOf(m[1].toUpperCase());
    return -1;
  }
  if (typeof v === 'number' && Number.isInteger(v)){
    const k = opts.findIndex(o => o.trim() === String(v)); if (k >= 0) return k;
    if (v === 0) return 0;
    if (v === 4) return 3;
    return -2;   /* 1–3 is ambiguous: 0-based or 1-based? */
  }
  return -1;
}
function numVal(v){
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[,\s₹%]/g, '').replace(/^−/, '-');
  const f = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/); if (f){ const b = +f[2]; return b ? +f[1]/b : null; }
  const x = Number(s); return s && Number.isFinite(x) ? x : null;
}
/* subject and topic: the item's own if valid, else the ones picked on the page */
function place(x, sid, tid){
  const s = SUBJ[x.subject] ? x.subject : sid;
  const t = SUBJ[s].topics.some(tp => tp.id === x.topic) ? x.topic : (s === sid ? tid : SUBJ[s].topics[0].id);
  return {s, t};
}
/* formulas: LaTeX without delimiters. The gap is \boxed{?} (also accepted: \square, ___, [?]).
   normTex ignores spacing and braces, so "the right option put back into the gap gives the formula" can be checked. */
const MARK = /\\boxed\s*\{[^{}]*\}|\\square|_{3,}|\[\s*\?\s*\]/;
const normTex = s => String(s).replace(/\\(?:left|right|displaystyle|textstyle|qquad|quad)\b|\\[,;:! ]|[\s{}]/g, '');
const tex = v => txt(v, 400).trim().replace(/^\\\(([\s\S]*)\\\)$/, '$1').replace(/^\\\[([\s\S]*)\\\]$/, '$1').replace(/^\$+|\$+$/g, '').trim();
function normFormula(x, i, sid, tid, seen){
  const name = txt(x.name || x.concept || x.title || '', 120);
  const no = m => ({err:`Formula ${i+1}${name ? ` (${name})` : ''}: ${m}`});
  const formula = tex(x.formula);
  if (!name) return no('no name.');
  if (!formula) return no('no formula.');
  const {s, t} = place(x, sid, tid), key = s + '|f ' + normQ(name);
  if (seen.has(key)) return no('you already have a formula with this name.');
  const rec = {s, t, k:'formula', name, formula, note: txt(x.note || x.explanation || '', 1500), lv: [1,2,3].includes(+x.difficulty) ? +x.difficulty : 1}, warn = [];
  const ans = (v, o) => letterIdx(Array.isArray(v) ? v[0] : v, o);
  const f = x.fill;
  if (f && typeof f === 'object'){
    const blank = tex(f.blank || f.formula || f.f || ''), o = Array.isArray(f.options) ? f.options.map(tex) : [], k = ans(f.answer, o);
    const why = !MARK.test(blank) ? 'there is no \\boxed{?} gap'
      : o.length !== 4 || o.some(y => !y) ? 'it needs exactly 4 options'
      : new Set(o.map(normTex)).size !== 4 ? 'two options are the same'
      : k < 0 ? 'its answer must be a letter A–D'
      : normTex(blank.replace(MARK, () => o[k])) !== normTex(formula) ? 'its answer put into the gap doesn’t give the formula back'
      : '';
    if (why) warn.push(`fill-the-gap round dropped (${why}).`);
    else rec.fill = Object.assign({f: blank.replace(MARK, () => '\\boxed{\\;?\\;}'), o, a:k}, f.question ? {q: txt(f.question, 300)} : {});
  }
  const b = x.bug;
  if (b && typeof b === 'object'){
    const wrong = tex(b.wrong || b.formula || b.f || ''), o = Array.isArray(b.options) ? b.options.map(y => txt(y, 300)) : [], k = ans(b.answer, o);
    const why = !wrong ? 'the wrong formula is missing'
      : normTex(wrong) === normTex(formula) ? 'its “wrong” formula is the same as the right one'
      : o.length !== 4 || o.some(y => !y) ? 'it needs exactly 4 options'
      : new Set(o.map(y => y.toLowerCase())).size !== 4 ? 'two options are the same'
      : k < 0 ? 'its answer must be a letter A–D'
      : '';
    if (why) warn.push(`spot-the-bug round dropped (${why}).`);
    else rec.bug = {f: wrong, o, a:k};
  }
  seen.add(key);
  return {rec, warn: warn.map(w => `Formula ${i+1} (${name}): ${w}`)};
}
/* one AI item → stored record, or an error message */
function normItem(x, i, sid, tid, seen){
  const no = m => ({err:`Question ${i+1}: ${m}`});
  if (!x || typeof x !== 'object') return no('not a question object.');
  const type = String(x.type || x.kind || (x.formula && (x.fill || x.bug) && !x.question ? 'formula' : x.options ? (Array.isArray(x.answer) ? 'msq' : 'mcq') : 'nat')).toLowerCase().trim();
  if (type === 'formula') return normFormula(x, i, sid, tid, seen);
  if (!['mcq','msq','nat'].includes(type)) return no(`unknown type “${type}” (use mcq, msq, nat or formula).`);
  const q = txt(x.question || x.q, 4000);
  if (!q) return no('no question text.');
  const {s, t} = place(x, sid, tid);
  const key = s + '|' + normQ(q);
  if (seen.has(key)) return no('duplicate of a question you already have.');
  const rec = {s, t, k:type, q, note: txt(x.note || x.explanation || x.solution || '', 1500),
    concept: txt(x.concept || x.topic_name || '', 80), formula: txt(x.formula || '', 400).replace(/^\\\(|\\\)$/g, '').replace(/^\$+|\$+$/g, ''),
    lv: [1,2,3].includes(+x.difficulty) ? +x.difficulty : 2};
  if (type === 'nat'){
    const v = numVal(x.answer);
    if (v === null) return no('a NAT answer must be a single number.');
    let tol = numVal(x.tolerance);
    if (tol === null || tol < 0){ const d = (String(x.answer).split('.')[1] || '').replace(/\D/g, '').length; tol = d ? Math.pow(10, -d) : undefined; }
    rec.n = {v, tol};
  } else {
    const o = Array.isArray(x.options) ? x.options.map(y => txt(y, 400)) : [];
    if (o.length !== 4 || o.some(y => !y)) return no('needs exactly 4 non-empty options.');
    if (new Set(o.map(y => y.toLowerCase())).size !== 4) return no('two options are the same.');
    rec.o = o;
    if (type === 'mcq'){
      const k = letterIdx(Array.isArray(x.answer) ? x.answer[0] : x.answer, o);
      if (k === -2) return no('answer given as a number 1–3 is ambiguous; use a letter A–D.');
      if (k < 0) return no('answer must be a letter A–D.');
      rec.a = k;
    } else {
      let ans = x.answer;
      if (typeof ans === 'string') ans = ans.split(/[\s,;&]+|and/).filter(Boolean);
      if (!Array.isArray(ans) || !ans.length) return no('an MSQ answer must be a list of letters, e.g. ["A","C"].');
      const ks = ans.map(v => letterIdx(v, o));
      if (ks.some(k => k < 0)) return no('MSQ answers must be letters A–D.');
      rec.a = [...new Set(ks)].sort();
      const ex = Array.isArray(x.explanations) ? x.explanations.map(y => txt(y, 800)) : null;
      if (ex && ex.length === 4 && ex.every(Boolean)){
        for (let k = 0; k < 4; k++){
          const says = /^\W*(true|correct)\b/i.test(ex[k]) ? true : /^\W*(false|incorrect|wrong)\b/i.test(ex[k]) ? false : null;
          if (says !== null && says !== rec.a.includes(k)) return no(`the explanation for option ${AL[k]} says “${says ? 'true' : 'false'}” but the answer key ${rec.a.includes(k) ? 'marks it correct' : 'doesn’t include it'}. The AI contradicted itself; fix the answer or ask it again.`);
        }
        rec.ex = ex;
      }
    }
  }
  seen.add(key);
  return {rec};
}
function importQuestions(raw, sid, tid){
  const items = parseImport(raw), seen = new Set((S.qs || []).map(qKey)), added = [], errs = [], warns = [];
  const batch = Date.now().toString(36);
  items.slice(0, 300).forEach((x, i) => {
    const r = normItem(x, i, sid, tid, seen);
    if (r.err) errs.push(r.err);
    else { r.rec.id = batch + '-' + i; r.rec.b = batch; r.rec.at = today(); r.rec.up = Date.now(); added.push(r.rec); if (r.warn) warns.push(...r.warn); }
  });
  if (items.length > 300) errs.push(`Only the first 300 items were read (the reply had ${items.length}).`);
  if (added.length){ S.qs = (S.qs || []).concat(added); IMP = null; if (!S.pick.includes(sid)) S.pick.push(sid); save(); }
  return {added, errs, warns, batch};
}
/* export / edit format = the same JSON the AI writes, plus subject and topic */
function toPortable(x){
  if (isF(x)) return Object.assign({type:'formula', subject:x.s, topic:x.t, name:x.name, formula:x.formula, note:x.note},
    x.fill ? {fill: Object.assign(x.fill.q ? {question:x.fill.q} : {}, {blank:x.fill.f, options:x.fill.o, answer:AL[x.fill.a]})} : {},
    x.bug ? {bug: {wrong:x.bug.f, options:x.bug.o, answer:AL[x.bug.a]}} : {}, {difficulty:x.lv});
  const o = {type:x.k, subject:x.s, topic:x.t, concept:x.concept || undefined, question:x.q};
  if (x.k === 'nat'){ o.answer = x.n.v; if (x.n.tol !== undefined) o.tolerance = x.n.tol; }
  else { o.options = x.o; o.answer = x.k === 'mcq' ? AL[x.a] : x.a.map(k => AL[k]); if (x.ex) o.explanations = x.ex; }
  o.note = x.note; if (x.formula) o.formula = x.formula; o.difficulty = x.lv;
  return o;
}
const CHECK_PROMPT = [
  'Check these GATE practice items (JSON below).',
  'For each question:',
  '1. Solve it yourself from scratch without looking at the given answer. For code, trace exactly what it prints, line by line.',
  '2. Make sure the answer key is right, that an mcq has exactly one correct option, and that every msq explanation starts with "True." or "False." matching the answer.',
  'For each formula (type "formula"):',
  '1. Make sure the formula is standard and correct, and the note states its conditions correctly.',
  '2. In "fill", the correct option put into \\boxed{?} must give the formula exactly; the other 3 options must be wrong.',
  '3. In "bug", the wrong formula must have exactly one mistake, and the answer option must describe that mistake.',
  'Fix anything wrong. Delete items that are ambiguous or can’t be fixed. Keep every LaTeX backslash doubled inside JSON strings.',
  'Reply with ONLY the corrected JSON array in one ```json code block (same fields), then nothing else.',
  '',
  'JSON:',
  ''
].join('\n');
function buildPrompt(sid, tid, n, types, level){
  const s = SUBJ[sid], tp = s.topics.find(x => x.id === tid);
  const ideas = Object.values(tp.units).join('; ');
  const share = {mcq:'"mcq" (exactly one correct option)', nat:'"nat" (a numeric answer the student types in)', msq:'"msq" (one or more correct options)'};
  const have = (S.qs || []).filter(x => x.s === sid && x.t === tid && !isF(x)).slice(-40).map(x => '- ' + shortName(x.q));
  const ex = {
    mcq:'{"type":"mcq","concept":"short name of the idea","question":"...","options":["...","...","...","..."],"answer":"B","note":"...","formula":"optional LaTeX, e.g. \\\\det(kA)=k^n\\\\det A","difficulty":2}',
    msq:'{"type":"msq","concept":"...","question":"...","options":["...","...","...","..."],"answer":["A","C"],"explanations":["why A is true","why B is false","why C is true","why D is false"],"note":"...","difficulty":2}',
    nat:'{"type":"nat","concept":"...","question":"... (to 2 decimals)","answer":12.5,"tolerance":0.01,"note":"...","difficulty":3}'};
  return [
    'You are writing practice questions for a GATE DA (Data Science & Artificial Intelligence) exam revision app.',
    '',
    `Subject: ${s.name}`,
    `Topic: ${tp.name}`,
    `Cover these ideas, spread across them: ${ideas}`,
    '',
    `Write ${n} questions. Use these types${types.length > 1 ? ', mixed roughly evenly' : ''}: ${types.map(k => share[k]).join(', ')}.`,
    `Difficulty: ${level}.`,
    '',
    'Rules:',
    '- Test each idea from different angles: recalling the formula, when it holds or fails, a common trap, and a small calculation. Never ask the same thing twice, even with different numbers.',
    '- Wrong options must be mistakes students really make (sign errors, n vs n-1, swapped terms, a missing condition), not silly ones. Exactly 4 options for mcq and msq.',
    '- mcq: exactly one option is fully correct. msq: every option is clearly true or clearly false on its own, and each of the 4 explanations starts with "True." or "False." matching the answer.',
    '- Code questions: put the code in a ```python block inside the question text, with \\n for new lines. The answer must be exactly what the code prints (order, spaces, new lines, mutation of shared lists). Trace it line by line, as if running it.',
    '- For nat, the answer is one number; state the rounding in the question (e.g. "to 2 decimals") and give a tolerance.',
    '- Work out every answer step by step before writing it, then check it again from scratch. A wrong answer key is worse than no question; drop any question you are not sure about.',
    '- Write maths in LaTeX inside \\( and \\), e.g. \\(\\det(kA)=k^n\\det A\\). Do not use $ signs.',
    '- "note" is shown after the student answers: 1–3 sentences on why the answer is right and the trap to avoid.',
    '- "concept" is a 2–6 word name of the idea tested; questions on the same idea use the same concept.',
    '- "difficulty" is 1 (direct recall), 2 (apply once) or 3 (combine ideas or a trap).',
    ...(have.length ? ['', 'I already have these questions on this topic, so write different ones:', ...have] : []),
    '',
    'Reply with ONLY a JSON array inside one ```json code block and no other text. Use exactly these fields (one example per type):',
    '[',
    types.map(k => '  ' + ex[k]).join(',\n'),
    ']'
  ].join('\n');
}
const R_ = String.raw;
const FX_EXAMPLE = {type:'formula', name:"Chebyshev's inequality", formula:R_`P(|X-\mu|\ge k\sigma)\le\frac{1}{k^2}`,
  note:R_`Holds for any distribution with finite mean \(\mu\) and variance \(\sigma^2\), for \(k>0\). It is only a bound, not the exact probability.`,
  fill:{blank:R_`P(|X-\mu|\ge k\sigma)\le\boxed{?}`, options:[R_`\frac{1}{k^2}`, R_`\frac{1}{k}`, R_`\frac{\sigma^2}{k}`, R_`e^{-k^2/2}`], answer:'A'},
  bug:{wrong:R_`P(|X-\mu|\ge k\sigma)\ge\frac{1}{k^2}`, options:[R_`The inequality should be \(\le\), not \(\ge\)`, R_`It should be \(\frac{1}{k}\)`, R_`It holds only for normal distributions`, R_`\(\sigma\) should be squared`], answer:'A'},
  difficulty:1};
function buildFormulaPrompt(sid, tid, n){
  const s = SUBJ[sid], tp = s.topics.find(x => x.id === tid);
  /* what the app already has for this topic, one line per formula name: "name: formula" (text rules in plain words) */
  const plain = v => String(v || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  const seenN = new Set(), have = [];
  for (const [n, f] of BANK.filter(c => c.s === sid && c.t === tid).map(c => [c.name, c.sheet])
       .concat((S.qs || []).filter(x => isF(x) && x.s === sid && x.t === tid).map(x => [x.name, x.formula]))){
    const k = plain(n).toLowerCase(); if (!k || seenN.has(k)) continue; seenN.add(k);
    const fx = plain(f); have.push(fx ? `${plain(n)}: ${fx.length > 220 ? fx.slice(0, 217) + '…' : fx}` : plain(n));
  }
  have.splice(60);
  return [
    'You are listing formulas for a GATE DA (Data Science & Artificial Intelligence) exam revision app.',
    '',
    `Subject: ${s.name}`,
    `Topic: ${tp.name}`,
    `Ideas in this topic: ${Object.values(tp.units).join('; ')}`,
    '',
    `List up to ${n} important formulas, identities, results or rules from this topic that GATE DA questions rely on. Only standard, textbook-correct ones; fewer is fine if the topic has fewer.`,
    ...(have.length ? ['', 'The app already has these formulas and rules for this topic (name: formula). Do not repeat them or write the same one in another form; add the important ones that are missing:', ...have.map(x => '- ' + x)] : []),
    '',
    'For each formula give:',
    '- "name": a 2–6 word name.',
    '- "formula": the formula in LaTeX, without $ or \\( \\) around it.',
    '- "note": 1–3 sentences: when it holds (conditions), what an unclear symbol means, and the usual trap. Maths inside \\( \\).',
    '- "fill": a fill-the-gap round. "blank" is the same formula with ONE important piece replaced by \\boxed{?}. "options" are 4 LaTeX pieces; the correct one, put back into the gap, must give the formula exactly. The 3 wrong ones are mistakes students really make (wrong power, n vs n-1, missing factor, wrong sign).',
    '- "bug": a spot-the-bug round. "wrong" is the formula with exactly ONE realistic mistake. "options" are 4 short descriptions of what is wrong (maths inside \\( \\)); exactly one describes the real mistake. Never use "nothing is wrong" as an option.',
    '- "difficulty": 1 (core formula), 2 (less common) or 3 (easy to confuse with another).',
    '',
    'Check every formula, fill answer and bug again before replying. A wrong formula is worse than none.',
    'Inside JSON strings, write every LaTeX backslash twice (\\\\frac, \\\\mu), as in the example.',
    '',
    'Reply with ONLY a JSON array inside one ```json code block and no other text, in exactly this format:',
    '[',
    '  ' + JSON.stringify(FX_EXAMPLE),
    ']'
  ].join('\n');
}
const tagLine = c => `<span class="pill">Your ${c.fx ? 'formula' : 'question'}</span>`;
function myQuestions(prefS, prefT, msg){
  go('myq');
  const sSel = prefS || S.lastQS || S.lastNoteS || SUBJECTS[0].id, groups = {};
  for (const x of (S.qs || [])) if (SUBJ[x.s]) (groups[x.s + '.' + x.t] = groups[x.s + '.' + x.t] || []).push(x);
  const total = (S.qs || []).length;
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">Your additions</span><h1>My questions</h1></div>
  <button class="ghost" id="back">Home</button></header>
  <p class="note">Grow the bank yourself: copy a ready-made prompt into ChatGPT or Gemini, paste its reply here, and the new questions or formulas join your sets. Each formula becomes three rounds: recall it, fill the gap, and spot the bug, and it can turn up in Match it rounds. They get dots and points like any card, but don’t change your subject level. AI answers can be wrong, so each one has Edit and Delete after you answer it.</p>
  <form class="qcard noteform" id="qf" novalidate>
    <h2>Add questions or formulas</h2>
    <span class="lbl">1 · Where they go</span>
    <div class="frow2">
      <label class="fld"><span class="lbl">Subject</span><select id="qs">${SUBJECTS.map(s => `<option value="${s.id}" ${s.id===sSel?'selected':''}>${s.name}</option>`).join('')}</select></label>
      <label class="fld"><span class="lbl">Topic</span><select id="qt"></select></label>
    </div>
    <span class="lbl">2 · Get them from ChatGPT or Gemini</span>
    <div class="checks" role="radiogroup" aria-label="What to add">${[['q','Questions'],['f','Formulas']].map(([k,l]) => `<label><input type="radio" name="qm" value="${k}" ${(S.lastQM || 'q') === k ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    <div class="frow2">
      <label class="fld"><span class="lbl">How many</span><select id="qn">${[10,15,20,30].map(k => `<option ${k===S.lastQN||(!S.lastQN&&k===15)?'selected':''}>${k}</option>`).join('')}</select></label>
      <label class="fld" id="qlw"><span class="lbl">Difficulty</span><select id="ql">${[['GATE exam level, mixed easy to hard','Mixed (GATE level)'],['mostly easy (direct recall)','Mostly easy'],['mostly hard (GATE 2-mark level)','Mostly hard']].map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
    </div>
    <div class="checks" id="qtypes" role="group" aria-label="Question types">${[['mcq','MCQ'],['nat','NAT'],['msq','MSQ']].map(([k,l]) => `<label><input type="checkbox" value="${k}" checked> ${l}</label>`).join('')}</div>
    <div class="fbrow"><span class="nathint">Copy the prompt, paste it into ChatGPT or Gemini, and copy its whole reply.</span><button class="primary" type="button" id="cpP">Copy prompt</button></div>
    <details><summary class="nathint">Show the prompt</summary><textarea class="reptext mono" id="pt" readonly rows="10"></textarea></details>
    <span class="lbl">3 · Optional: get it checked</span>
    <div class="fbrow"><span class="nathint">AI answer keys are often wrong. Paste this check prompt plus the reply into a <b>different</b> AI (e.g. Gemini if ChatGPT wrote them), and use its corrected reply.</span><button class="ghost" type="button" id="cpC">Copy check prompt</button></div>
    <span class="lbl">4 · Paste the reply</span>
    <textarea class="reptext mono" id="qin" rows="7" placeholder="Paste the AI’s whole reply here (the JSON code block). Questions and formulas can be mixed."></textarea>
    <div class="fbrow"><label class="ghost sm filebtn">Or upload a .json file<input type="file" id="qfile" accept=".json,.txt,application/json,text/plain" hidden></label><button class="primary" type="submit">Add them</button></div>
    <div id="qres" role="status">${msg || ''}</div>
  </form>
  <section><h3 class="sec">Yours: ${mixLabel(S.qs || [])}</h3>
    ${total ? `<div class="mqlist">${SUBJECTS.flatMap(s => s.topics.map(tp => [s, tp])).filter(([s,tp]) => groups[s.id+'.'+tp.id]).map(([s,tp]) => { const g = groups[s.id+'.'+tp.id];
      return `<details class="cov"><summary><span class="sn">${s.short} · ${tp.name}</span><span class="mono sm2">${mixLabel(g)}</span></summary>
        <div class="frow"><button class="primary sm" data-drill="${s.id}|${tp.id}">Drill these</button><button class="ghost sm" data-delall="${s.id}|${tp.id}">Delete all ${g.length}</button></div>
        <ol class="mq">${g.map(x => `<li><span class="mqt">${esc(itemLabel(x))}</span> <span class="sm2 mono">${x.k.toUpperCase()}</span> <button class="link" data-edq="${x.id}">Edit</button></li>`).join('')}</ol></details>`; }).join('')}</div>
      <div class="actions"><button class="ghost" id="expQ">Download all as JSON</button></div>
      <p class="note">The download uses the same format, so you can re-import it on another device, keep it as a copy, or give it to the VS Code agent to turn good questions into permanent built-in cards (see AGENTS.md).</p>`
      : '<p class="note">Nothing yet. Your first batch will appear here, grouped by topic.</p>'}
  </section>`;
  typeset(app);
  const qs = $('#qs'), qt = $('#qt'), pt = $('#pt');
  const fillTopics = (sid, sel) => { qt.innerHTML = SUBJ[sid].topics.map(t => `<option value="${t.id}" ${t.id===sel?'selected':''}>${t.name}</option>`).join(''); };
  const types = () => [...app.querySelectorAll('#qtypes input:checked')].map(i => i.value);
  const mode = () => (app.querySelector('input[name="qm"]:checked') || {}).value || 'q';
  const refresh = () => {
    const f = mode() === 'f', ty = types();
    $('#qtypes').hidden = f; $('#qlw').hidden = f;
    $('#cpP').textContent = f ? 'Copy formula prompt' : 'Copy prompt';
    pt.value = f ? buildFormulaPrompt(qs.value, qt.value, +$('#qn').value) : ty.length ? buildPrompt(qs.value, qt.value, +$('#qn').value, ty, $('#ql').value) : 'Tick at least one question type.';
  };
  fillTopics(sSel, prefT || (S.lastQS === sSel ? S.lastQT : null));
  qs.onchange = () => { fillTopics(qs.value); refresh(); };
  [qt, $('#qn'), $('#ql')].forEach(el => el.onchange = refresh);
  app.querySelectorAll('.checks input').forEach(el => el.onchange = () => { S.lastQM = mode(); refresh(); });
  refresh();
  $('#back').onclick = home;
  $('#cpP').onclick = async () => {
    refresh(); const b = $('#cpP'); S.lastQM = mode();
    S.lastQS = qs.value; S.lastQT = qt.value; S.lastQN = +$('#qn').value; save();
    try { await navigator.clipboard.writeText(pt.value); b.textContent = 'Copied ✓'; }
    catch(e){ app.querySelector('details').open = true; pt.focus(); pt.select(); b.textContent = 'Select all & copy'; }
    setTimeout(() => { if (b.isConnected) refresh(); }, 2500);
  };
  $('#cpC').onclick = async () => {
    const b = $('#cpC'), pasted = $('#qin').value.trim(), text = CHECK_PROMPT + (pasted || '(paste the questions JSON here)');
    try { await navigator.clipboard.writeText(text); b.textContent = pasted ? 'Copied with your reply ✓' : 'Copied ✓'; }
    catch(e){ b.textContent = 'Copy failed'; }
    setTimeout(() => { if (b.isConnected) b.textContent = 'Copy check prompt'; }, 2500);
  };
  const run = raw => {
    const res = $('#qres');
    let r; try { r = importQuestions(raw, qs.value, qt.value); }
    catch(e){ res.innerHTML = `<p class="formerr">${esc(e.message)}</p>`; return; }
    S.lastQS = qs.value; S.lastQT = qt.value; save();
    const places = [...new Set(r.added.map(x => x.s + '.' + x.t))];
    const where = places.length === 1 ? `${SUBJ[r.added[0].s].short} · ${TL[places[0]]}` : `${places.length} topics`;
    const list = (l, cls) => l.length ? `<ul class="${cls}">${l.slice(0,12).map(e => `<li>${esc(e)}</li>`).join('')}${l.length > 12 ? `<li>…and ${l.length - 12} more</li>` : ''}</ul>` : '';
    if (!r.added.length){ res.innerHTML = `<p class="formerr">Nothing added.</p>${list(r.errs, 'errl')}`; return; }
    const nf = r.added.filter(isF).length;
    myQuestions(qs.value, qt.value, `<p class="okmsg">Added ${mixLabel(r.added)} to ${esc(where)}.${r.errs.length ? ` Skipped ${r.errs.length}:` : ''}</p>${list(r.errs, 'errl')}`
      + (r.warns.length ? `<p class="nathint">${plural(r.warns.length, 'round')} dropped, the rest of ${nf === 1 ? 'that formula' : 'those formulas'} was kept:</p>${list(r.warns, 'errl')}` : '')
      + `<div class="fbrow"><span></span><button class="primary" type="button" id="tryB" data-b="${r.batch}">Try them now</button></div>`);
  };
  $('#qf').addEventListener('submit', e => { e.preventDefault(); run($('#qin').value); });
  $('#qfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const rd = new FileReader(); rd.onload = () => run(String(rd.result)); rd.readAsText(f); };
  const tb = $('#tryB');
  if (tb) tb.onclick = () => { const pool = impCards().filter(c => c.qid.startsWith(tb.dataset.b + '-')); startSet(pool, nItems(pool), 'New batch', null, {matches:1}); };
  app.querySelectorAll('[data-drill]').forEach(b => b.onclick = () => { const [s, t] = b.dataset.drill.split('|'), pool = impOf(s, t); startSet(pool, Math.min(9, nItems(pool)), 'Mine · ' + TL[s+'.'+t], null, {matches:1}); });
  app.querySelectorAll('[data-delall]').forEach(b => confirmBtn(b, 'Tap again to delete them all', () => {
    const [s, t] = b.dataset.delall.split('|');
    for (const x of S.qs.filter(x => x.s === s && x.t === t)) dropQ(x.id);
    save(); myQuestions(s, t, '<p class="okmsg">Deleted.</p>');
  }));
  app.querySelectorAll('[data-edq]').forEach(b => b.onclick = () => editQuestion(b.dataset.edq));
  const ex = $('#expQ');
  if (ex) ex.onclick = () => {
    const blob = new Blob([JSON.stringify((S.qs || []).map(toPortable), null, 1)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `gate-da-my-questions-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
}
function editQuestion(id, back){
  go('myq');
  const x = (S.qs || []).find(y => y.id === id);
  if (!x){ myQuestions(); return; }
  app.innerHTML = `
  <header class="top"><div class="brand"><span class="eyebrow">My questions · ${SUBJ[x.s].short} · ${TL[x.s+'.'+x.t] || ''}</span><h1>Edit ${isF(x) ? 'formula' : 'question'}</h1></div>
  <button class="ghost" id="back">Back</button></header>
  <p class="note">${isF(x) ? 'Fix the formula, the fill-the-gap or spot-the-bug round, or the note below, then save. Formulas and options are plain LaTeX; maths in the note and bug options goes inside <code>\\(</code> and <code>\\)</code>. Remove the "fill" or "bug" part to drop that round.' : 'Fix the text, options, answer letter(s) or note below, then save. Same format as the AI reply. Maths goes inside <code>\\(</code> and <code>\\)</code>.'}</p>
  <div class="qcard"><textarea class="reptext mono" id="ej" rows="16" spellcheck="false">${esc(JSON.stringify(toPortable(x), null, 1))}</textarea>
    <div id="eerr" role="alert"></div>
    <div class="fbrow"><button class="ghost" id="edel">Delete</button><button class="primary" id="esave">Save</button></div></div>`;
  const leave = () => back ? back() : myQuestions(x.s, x.t);
  $('#back').onclick = leave;
  $('#esave').onclick = () => {
    let r;
    try { const items = parseImport($('#ej').value); r = normItem(items[0], 0, x.s, x.t, new Set((S.qs || []).filter(y => y.id !== id).map(qKey))); }
    catch(e){ r = {err: e.message}; }
    if (!r.err && r.warn && r.warn.length) r.err = r.warn[0].replace(' round dropped (', ' round: ').replace(/\)\.$/, '. Fix it, or remove that part to drop the round.');
    if (r.err){ $('#eerr').innerHTML = `<p class="formerr">${esc(r.err.replace(/^(Question|Formula) 1( \([^)]*\))?: /, ''))}</p>`; return; }
    Object.assign(r.rec, {id: x.id, b: x.b, at: x.at, up: Date.now()});
    S.qs[S.qs.indexOf(x)] = r.rec; IMP = null; save(); leave();
  };
  confirmBtn($('#edel'), 'Tap again to delete', () => { dropQ(id); save(); leave(); });
}

/* ---------- backup ---------- */
const backupName = () => `gate-da-quizzer-backup-${today()}.json`;
const backupBlob = () => new Blob([JSON.stringify(Object.assign({}, S, {exported: new Date().toISOString()}))], {type:'application/json'});
function backup(){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(backupBlob()); a.download = backupName();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
/* phones: hand the backup file to WhatsApp, Drive, Gmail, Files... (Web Share API) */
function canShareFile(){
  try { return !!(navigator.canShare && navigator.canShare({files:[new File(['{}'], 'x.json', {type:'application/json'})]})); } catch(e){ return false; }
}
async function shareBackup(){
  const f = new File([backupBlob()], backupName(), {type:'application/json'});
  await navigator.share({files:[f], title:'GATE DA Quizzer backup'});
}
function readBackup(file, done){
  const r = new FileReader();
  r.onload = () => {
    try { const s = JSON.parse(r.result); if (!s || s.v !== 2 || typeof s.c !== 'object') throw 0; done(s); }
    catch(e){ done(null); }
  };
  r.onerror = () => done(null);
  r.readAsText(file);
}
/* Merge another device's backup into this one: for each card keep the record answered most recently,
   keep every note and report from both, and keep the higher points / streak. Subject picks stay as on this device. */
function mergeState(a, b){
  const newer = (x, y) => (x.at || 0) !== (y.at || 0) ? ((x.at || 0) > (y.at || 0) ? x : y) : ((x.seen || 0) >= (y.seen || 0) ? x : y);
  const c = Object.assign({}, a.c);
  for (const [id, rec] of Object.entries(b.c || {})) c[id] = c[id] ? newer(c[id], rec) : rec;
  const notes = {};
  for (const n of (a.mine || []).concat(b.mine || [])) if (n && n.id) notes[n.id] = notes[n.id] && (notes[n.id].up || 0) >= (n.up || 0) ? notes[n.id] : n;
  const flags = Object.assign({}, b.flags || {}, a.flags || {});
  const qsm = {};
  for (const x of (a.qs || []).concat(b.qs || [])) if (x && x.id) qsm[x.id] = qsm[x.id] && (qsm[x.id].up || 0) >= (x.up || 0) ? qsm[x.id] : x;
  const seenQ = {};   /* the same question imported separately on two devices is kept once (the most recently edited copy) */
  for (const [id, x] of Object.entries(qsm)){ const k = qKey(x), o = seenQ[k];
    if (!o) seenQ[k] = id; else if ((x.up || 0) > (qsm[o].up || 0)){ delete qsm[o]; seenQ[k] = id; } else delete qsm[id]; }
  const later = (b.last || '') > (a.last || '') ? b : a;
  return Object.assign({}, a, {c, mine: Object.values(notes), qs: Object.values(qsm), flags, pts: Math.max(a.pts || 0, b.pts || 0),
    sets: Math.max(a.sets || 0, b.sets || 0), last: later.last, streak: (a.last === b.last) ? Math.max(a.streak || 0, b.streak || 0) : later.streak});
}
function restorePrompt(file){
  const msg = $('#bkMsg');
  readBackup(file, b => {
    if (!b){ msg.textContent = 'That file isn’t a quizzer backup. Pick a file named gate-da-quizzer-backup-….json.'; return; }
    const when = b.exported ? new Date(b.exported).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : 'an earlier date';
    msg.innerHTML = `Backup from ${esc(when)}: ${plural(Object.keys(b.c).length, 'card')} practised, ${plural((b.mine || []).length, 'note')}, ${mixLabel(b.qs || [])} of your own.
      <span class="frow"><button class="primary sm" id="rsMerge">Merge with this device</button><button class="ghost sm" id="rsReplace">Replace this device’s data</button><button class="ghost sm" id="rsCancel">Cancel</button></span>`;
    $('#rsMerge').onclick = () => { S = tidy(mergeState(S, b)); delete S.exported; save(); home(); $('#bkMsg').textContent = 'Merged. Progress from both devices is kept.'; };
    confirmBtn($('#rsReplace'), 'Tap again: this device’s progress will be lost', () => { const keep = S.pick; S = tidy(b); delete S.exported; S.pick = S.pick || keep; save(); home(); $('#bkMsg').textContent = 'Replaced with the backup.'; });
    $('#rsCancel').onclick = () => { msg.textContent = ''; };
  });
}

/* ---------- keyboard ---------- */
document.addEventListener('keydown', e => {
  if (VIEW !== 'play' || !G || e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
  const q = G.qs[G.i];
  if (!G.answered && q && q.card && q.card.k !== 'nat'){
    let j = '1234'.indexOf(e.key); if (j < 0) j = 'abcd'.indexOf(e.key.toLowerCase());
    if (j >= 0){ const b = app.querySelector(`.opt[data-j="${j}"]`); if (b){ e.preventDefault(); b.click(); } }
    else if (e.key.toLowerCase() === 's'){ e.preventDefault(); skip(); }
    else if (e.key === 'Enter' && q.card.k === 'msq' && !e.target.classList.contains('opt')){ const g = $('#msqgo'); if (g && !g.disabled){ e.preventDefault(); g.click(); } }
  } else if (!G.answered && e.key.toLowerCase() === 's'){ e.preventDefault(); skip();
  } else if (G.answered && e.key === 'Enter'){
    const nx = $('#next'); if (nx && document.activeElement !== nx && document.activeElement?.id !== 'flagnote'){ e.preventDefault(); nx.click(); }
  }
});

home();
})();
