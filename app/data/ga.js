/* General Aptitude cards (GATE GA: verbal, quantitative, analytical, spatial).
   Numeric cards carry gen(r): every time one appears it draws fresh numbers and fresh options.
   gen returns {p, q, o, why}: p = the drawn numbers (used by checking scripts), o[0] = the correct option (the app shuffles).
   G(card) fills the card's written q / o / why from a fixed seed, so the deck and validator see a normal card.
   Verbal and logic cards are ordinary cards; tx:1 means the sheet is a plain-text rule instead of LaTeX. */
(function(){
const R = String.raw;

/* ---------- helpers ---------- */
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const rd = (x, d = 2) => Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * 10 ** d) / 10 ** d;
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const lcm = (a, b) => a / gcd(a, b) * b;
const C = (n, k) => { if (k < 0 || k > n) return 0; let v = 1; for (let i = 1; i <= k; i++) v = v * (n - k + i) / i; return Math.round(v); };
const fact = n => n <= 1 ? 1 : n * fact(n - 1);
const inr = x => Number(x).toLocaleString('en-IN', {maximumFractionDigits: 2});
const shuf = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* exact fraction of a float (all our answers are small rationals) */
function frac(x){
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
  for (let i = 0; i < 40; i++){
    const a = Math.floor(b); [h1, h0] = [a * h1 + h0, h1]; [k1, k0] = [a * k1 + k0, k1];
    if (Math.abs(x - h1 / k1) < 1e-9 || b - a < 1e-12) break;
    b = 1 / (b - a);
  }
  return [s * h1, k1];
}
/* option formatters */
const N = x => inr(rd(x));                                   // 1,15,000 or 12.5
const P = x => inr(rd(x)) + '%';
const RS = x => '₹' + inr(rd(x));
const U = u => x => inr(rd(x)) + ' ' + u;
const F = x => { const [n, d] = frac(x); return d === 1 ? `${n}` : (n < 0 ? R`\(-\tfrac{${-n}}{${d}}\)` : R`\(\tfrac{${n}}{${d}}\)`); };
const MX = x => { const w = Math.floor(x + 1e-9), [n, d] = frac(x - w); return n === 0 ? `${w}` : (w ? R`\(${w}\tfrac{${n}}{${d}}\)` : R`\(\tfrac{${n}}{${d}}\)`); };
const RAT = x => { const [n, d] = frac(x); return `${n} : ${d}`; };
const CHG = x => { x = rd(x); return x > 0 ? `${inr(x)}% increase` : x < 0 ? `${inr(-x)}% decrease` : 'No change'; };
const PL = x => { x = rd(x); return x > 0 ? `${inr(x)}% profit` : x < 0 ? `${inr(-x)}% loss` : 'No profit, no loss'; };
/* four distinct options: correct first, then the listed slips, then nearby values */
function opts(c, ds, f, step){
  const out = [f(c)];
  for (const d of ds){
    if (typeof d !== 'number' || !Number.isFinite(d)) continue;
    if (c > 0 && d <= 0 && f !== CHG && f !== PL) continue;
    const s = f(d); if (!out.includes(s)) out.push(s);
    if (out.length === 4) return out;
  }
  step = step || Math.max(1, Math.abs(c) * 0.1);
  for (let k = 1; out.length < 4 && k < 60; k++){
    for (const d of [c + k * step, c - k * step]){
      if (c > 0 && d <= 0) continue;
      const s = f(d); if (!out.includes(s) && out.length < 4) out.push(s);
    }
  }
  return out;
}
/* strings: correct first, then unique distractors */
const sopts = (c, ds) => { const out = [c]; for (const d of ds) if (!out.includes(d) && out.length < 4) out.push(d); return out; };
function seeded(str){
  let h = 1779033703 ^ str.length;
  for (const ch of str){ h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function G(c){ const g = c.gen(seeded(c.id)); c.q = g.q; c.o = g.o; c.a = 0; c.why = g.why; return c; }
const table = (head, rows) => `<table class="dt"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(rw => `<tr>${rw.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

addCards('ga', [
/* ================= ARITHMETIC ================= */
/* ---------- percentages ---------- */
{id:'succfill',t:'arith',u:'pct',lv:1,k:'fill',name:'Successive percentage change',sheet:R`\text{net \% change}=a+b+\frac{ab}{100}`,
 q:R`A quantity changes by a% and then by b% (a negative number means a decrease). Complete the net change.`,
 f:R`\text{net \% change}=a+b+\boxed{\;?\;}`,
 o:[R`\frac{ab}{100}`,R`ab`,R`\frac{a+b}{2}`,R`\frac{ab}{a+b}`],om:1,a:0,
 why:R`The changes multiply: \((1+\tfrac{a}{100})(1+\tfrac{b}{100})=1+\tfrac{a+b}{100}+\tfrac{ab}{100^2}\). So +20% then −20% is a 4% fall, not zero.`},
G({id:'succ',t:'arith',u:'pct',lv:2,k:'mcq',name:'Successive percentage change',sheet:R`\text{net \% change}=a+b+\frac{ab}{100}`,
 gen: r => { const a = pk(r,[10,20,25,30,40,50]), b = pk(r,[10,20,25,30,40,50]), net = a - b - a*b/100;
   return {p:{a,b}, q:R`A price is raised by ${a}% and the new price is then cut by ${b}%. What is the overall change in the price?`,
     o: opts(net, [a - b, a - b + a*b/100, -a*b/100, (a - b)/2], CHG, 1),
     why:R`\(${a}+(-${b})+\tfrac{${a}\times(-${b})}{100}=${rd(net)}\), so a ${CHG(net).toLowerCase()}. The second change acts on the raised price, so the two percentages don't simply cancel.`}; }}),
G({id:'lessthan',t:'arith',u:'pct',lv:2,k:'mcq',name:'“More than” vs “less than”',sheet:R`\text{A is }p\%\text{ more than B}\Rightarrow\text{B is }\frac{100p}{100+p}\%\text{ less than A}`,
 gen: r => { const p = pk(r,[10,20,25,40,50,60,75,100]), v = 100*p/(100 + p);
   return {p:{p}, q:R`A’s salary is ${p}% more than B’s. By what percentage is B’s salary less than A’s?`,
     o: opts(v, [p, 100*p/(100 - p), p/2, 100 - p], P, 2),
     why:R`Take B = 100, so A = ${100 + p}. B is less by ${p} out of ${100 + p}: \(\tfrac{${p}}{${100 + p}}\times100\approx${rd(v)}\%\). The base changes, so it isn’t ${p}%.`}; }}),
G({id:'consume',t:'arith',u:'pct',lv:2,k:'mcq',name:'Keeping expenditure constant',sheet:R`\text{price }-p\%\Rightarrow\text{quantity }+\frac{100p}{100-p}\%\ \text{(same spend)}`,
 gen: r => { const p = pk(r,[10,20,25,40,50]), v = 100*p/(100 - p);
   return {p:{p}, q:R`The price of rice falls by ${p}%. By what percentage can a family increase the quantity it buys without changing its spending?`,
     o: opts(v, [p, 100*p/(100 + p), 2*p, 1.5*p, 100 - p], P, 5),
     why:R`Spend = price × quantity is fixed, so quantity scales by \(\tfrac{100}{${100 - p}}\): an increase of \(\tfrac{${p}}{${100 - p}}\times100\approx${rd(v)}\%\).`}; }}),
G({id:'passed',t:'arith',u:['pct','infer'],lv:3,k:'mcq',name:'Percentages of different bases',sheet:R`\text{share of girls among passed}=\frac{g\,y}{b\,x+g\,y}`,
 gen: r => { const b = pk(r,[40,60,65,70,75]), x = pk(r,[20,30,40,50]), y = pk(r,[30,40,50,60]), g = 100 - b, v = 100*g*y/(b*x + g*y);
   return {p:{b,x,y}, q:R`Of the candidates who took a test, ${b}% were boys and the rest girls. ${x}% of the boys and ${y}% of the girls passed. What percentage of the candidates who passed were girls?`,
     o: opts(v, [g*y/100, g, 100*y/(x + y), 100 - v], P, 3),
     why:R`Take 100 candidates: boys passing \(=${b}\times${x/100}=${rd(b*x/100)}\), girls passing \(=${g}\times${y/100}=${rd(g*y/100)}\). Girls’ share \(=${rd(g*y/100)}/${rd(b*x/100 + g*y/100)}\approx${rd(v)}\%\).`}; }}),

/* ---------- ratio and proportion ---------- */
{id:'ratiodiv',t:'arith',u:'ratio',lv:1,k:'fill',name:'Dividing in a ratio',sheet:R`N\text{ in ratio }a:b\Rightarrow\text{shares }\frac{Na}{a+b},\ \frac{Nb}{a+b}`,
 q:R`An amount N is divided between A and B in the ratio a : b. Complete A’s share.`,
 f:R`\text{A’s share}=N\times\boxed{\;?\;}`,
 o:[R`\frac{a}{a+b}`,R`\frac{a}{b}`,R`\frac{b}{a+b}`,R`\frac{a+b}{a}`],om:1,a:0,
 why:R`There are \(a+b\) equal parts and A gets a of them. Using \(a/b\) is the common slip.`},
G({id:'coins',t:'arith',u:['ratio','pct'],lv:2,k:'mcq',name:'Counts vs values',sheet:R`\text{share of value}=\frac{\text{count}\times\text{face value}}{\sum\text{count}\times\text{face value}}`,
 gen: r => { const a = ri(r,2,9), b = ri(r,2,9), c = ri(r,2,15), tot = a + 5*b + 10*c, v = 100*5*b/tot;
   return {p:{a,b,c}, q:R`A person’s ₹1, ₹5 and ₹10 coins are in the ratio ${a} : ${b} : ${c} by number. What percentage of the total money is in ₹5 coins?`,
     o: opts(v, [100*b/(a + b + c), 100*5/16, 100*10*c/tot, 100*b/(a + c)], P, 3),
     why:R`Take ${a}, ${b}, ${c} coins: values ${a}, ${5*b}, ${10*c}, total ${tot}. Share \(=${5*b}/${tot}\approx${rd(v)}\%\). The ratio is by count, so weight by face value.`}; }}),
G({id:'ratadd',t:'arith',u:'ratio',lv:2,k:'mcq',name:'Ratio after adding to both',sheet:R`\frac{ak+x}{bk+x}=\frac{c}{d}\Rightarrow k=\frac{x(d-c)}{bc-ad}`,
 gen: r => { let a, b, k, x, c, d, g;
   do { a = ri(r,1,6); b = ri(r,a + 1,9); k = ri(r,2,12); x = ri(r,2,15); g = gcd(a*k + x, b*k + x); c = (a*k + x)/g; d = (b*k + x)/g; } while (gcd(a,b) !== 1 || c > 30 || d > 30);
   return {p:{a,b,k,x}, q:R`Two numbers are in the ratio ${a} : ${b}. If ${x} is added to each, the ratio becomes ${c} : ${d}. What is the smaller number?`,
     o: opts(a*k, [b*k, a*k + x, a*(k + 1), c], N, a),
     why:R`Let them be ${a}k and ${b}k: \(\frac{${a}k+${x}}{${b}k+${x}}=\frac{${c}}{${d}}\Rightarrow k=${k}\), so the numbers are ${a*k} and ${b*k}.`}; }}),
G({id:'partner',t:'arith',u:'ratio',lv:2,k:'mcq',name:'Partnership: capital × time',sheet:R`\text{profit share}\propto\text{capital}\times\text{time}`,
 gen: r => { let P1, P2, t1, t2, u1, u2, g;
   do { P1 = pk(r,[20,30,40,50,60]); P2 = pk(r,[20,30,40,50,60]); t1 = pk(r,[6,8,9,12]); t2 = pk(r,[4,6,8,12]); g = gcd(P1*t1, P2*t2); u1 = P1*t1/g; u2 = P2*t2/g; } while (u1 + u2 > 20 || P1*t2 === P2*t1);
   const m = ri(r,1,5), Pi = m*(u1 + u2)*1000, v = m*u1*1000;
   return {p:{P1,P2,t1,t2,Pi}, q:R`A invests ₹${P1},000 for ${t1} months and B invests ₹${P2},000 for ${t2} months. The profit is ₹${inr(Pi)}. What is A’s share?`,
     o: opts(v, [Pi*P1/(P1 + P2), Pi*t1/(t1 + t2), Pi - v, Pi/2], RS, 1000),
     why:R`Weights: \(${P1}\times${t1}=${P1*t1}\) and \(${P2}\times${t2}=${P2*t2}\), i.e. ${u1} : ${u2}. A gets \(\tfrac{${u1}}{${u1 + u2}}\times${Pi}=${v}\).`}; }}),

/* ---------- averages ---------- */
{id:'avgfixf',t:'arith',u:'avg',lv:1,k:'fill',name:'Correcting a wrong entry',sheet:R`n=\frac{\text{correct}-\text{wrong}}{\bar x_{\text{new}}-\bar x_{\text{old}}}`,
 q:R`One value in a list of n was entered wrongly. After fixing it the average changes. Complete the formula for n.`,
 f:R`n=\frac{\text{correct}-\text{wrong}}{\boxed{\;?\;}}`,
 o:[R`\bar x_{\text{new}}-\bar x_{\text{old}}`,R`\bar x_{\text{new}}+\bar x_{\text{old}}`,R`\bar x_{\text{new}}`,R`\bar x_{\text{old}}`],om:1,a:0,
 why:R`The total changes by \(\text{correct}-\text{wrong}\), and the average by that amount divided by n.`},
G({id:'avgfix',t:'arith',u:'avg',lv:2,k:'mcq',name:'Correcting a wrong entry',sheet:R`n=\frac{\text{correct}-\text{wrong}}{\bar x_{\text{new}}-\bar x_{\text{old}}}`,
 gen: r => { let n, dl, w, c;
   do { n = pk(r,[20,25,30,40,50]); dl = pk(r,[0.2,0.4,0.5,0.6,0.8]); w = ri(r,10,60); c = w + rd(n*dl); } while (!Number.isInteger(rd(n*dl)) || c > 99);
   const a1 = rd(ri(r,250,700)/10, 1), a2 = rd(a1 + dl, 1);
   return {p:{a1,a2,w,c}, q:R`A class’s average mark was computed as ${a1}. One student’s mark had been entered as ${w} instead of ${c}. After correcting it, the average is ${a2}. How many students are in the class?`,
     o: opts(n, [c - w, n + 5, n - 5, Math.round((c - w)/(a2 + a1)*100)], N, 5),
     why:R`The total rose by \(${c}-${w}=${c - w}\) and the average by ${dl}, so \(n=${c - w}/${dl}=${n}\).`}; }}),
G({id:'avgjoin',t:'arith',u:'avg',lv:2,k:'mcq',name:'Combined average',sheet:R`\bar x=\frac{n_1\bar x_1+n_2\bar x_2}{n_1+n_2}`,
 gen: r => { let n1, n2, a1, a2, v;
   do { n1 = pk(r,[10,20,30,40]); n2 = pk(r,[10,20,30,40,60]); a1 = ri(r,40,80); a2 = ri(r,40,80); v = (n1*a1 + n2*a2)/(n1 + n2); } while (n1 === n2 || a1 === a2 || !Number.isInteger(rd(v*10)));
   return {p:{n1,a1,n2,a2}, q:R`Section A has ${n1} students with average ${a1}; section B has ${n2} students with average ${a2}. What is the average of all ${n1 + n2} students?`,
     o: opts(v, [(a1 + a2)/2, (n1*a2 + n2*a1)/(n1 + n2), (n1*a1 + n2*a2)/Math.max(n1,n2)/2], N, 1),
     why:R`\(\frac{${n1}(${a1})+${n2}(${a2})}{${n1 + n2}}=\frac{${n1*a1 + n2*a2}}{${n1 + n2}}=${rd(v)}\). Averaging the two averages ignores the different sizes.`}; }}),
G({id:'avgleave',t:'arith',u:'avg',lv:2,k:'mcq',name:'Value of a removed item',sheet:R`x=n\bar x_{\text{old}}-(n-1)\bar x_{\text{new}}`,
 gen: r => { let n, A, B, v;
   do { n = ri(r,8,30); A = ri(r,30,60); B = A + pk(r,[-2,-1,1,2]); v = n*A - (n - 1)*B; } while (v <= 0 || v > 120);
   return {p:{n,A,B}, q:R`The average weight of ${n} people is ${A} kg. One person leaves and the average of the rest becomes ${B} kg. What is the weight of the person who left?`,
     o: opts(v, [A, n*(A - B), A - (n - 1)*(A - B), A + n*(A - B)], U('kg'), 2),
     why:R`\(${n}\times${A}-${n - 1}\times${B}=${n*A}-${(n - 1)*B}=${v}\) kg.`}; }}),

/* ---------- profit, loss and discount ---------- */
{id:'discf',t:'arith',u:'profit',lv:1,k:'fill',name:'Successive discounts',sheet:R`\text{single discount}=d_1+d_2-\frac{d_1d_2}{100}`,
 q:R`Two successive discounts of \(d_1\%\) and \(d_2\%\) equal one discount of:`,
 f:R`d=d_1+d_2-\boxed{\;?\;}`,
 o:[R`\frac{d_1d_2}{100}`,R`d_1d_2`,R`\frac{d_1+d_2}{2}`,R`0`],om:1,a:0,
 why:R`The second discount acts on the already reduced price, so 20% then 10% is 28%, not 30%.`},
G({id:'samesp',t:'arith',u:'profit',lv:2,k:'mcq',name:'Same selling price, x% profit and x% loss',sheet:R`\text{same SP},\ \pm x\%\Rightarrow\text{loss of }\frac{x^2}{100}\%`,
 gen: r => { const x = pk(r,[5,10,12,15,20,25,30]), v = -x*x/100;
   return {p:{x}, q:R`A trader sells two items at the same price. He makes a ${x}% profit on one and a ${x}% loss on the other. Overall he makes:`,
     o: opts(v, [0, x*x/100, -2*x*x/100, -x/10], PL, 1),
     why:R`The loss-making item cost more, so the loss outweighs the profit. Net \(=-\tfrac{${x}^2}{100}=-${rd(x*x/100)}\%\).`}; }}),
G({id:'markup',t:'arith',u:'profit',lv:2,k:'mcq',name:'Mark-up then discount',sheet:R`\text{profit \%}=m-d-\frac{md}{100}`,
 gen: r => { const m = pk(r,[20,25,30,40,50,60]), d = pk(r,[10,15,20,25,30]), v = m - d - m*d/100;
   return {p:{m,d}, q:R`A shopkeeper marks goods ${m}% above cost and then gives a ${d}% discount on the marked price. What is the profit or loss?`,
     o: opts(v, [m - d, m - d + m*d/100, (m - d)/2], PL, 2),
     why:R`\((1+${m/100})(1-${d/100})=${rd((1 + m/100)*(1 - d/100), 4)}\), i.e. \(${m}-${d}-\tfrac{${m}\times${d}}{100}=${rd(v)}\%\).`}; }}),
G({id:'cpfind',t:'arith',u:'profit',lv:1,k:'mcq',name:'Cost price from selling price',sheet:R`CP=\frac{100\,SP}{100+p}`,
 gen: r => { const p = pk(r,[10,20,25,50]), cp = 20*ri(r,10,100), sp = cp*(100 + p)/100;
   return {p:{p,sp}, q:R`An article sold for ₹${inr(sp)} gives a profit of ${p}%. What did it cost?`,
     o: opts(cp, [sp*(100 - p)/100, sp*100/(100 - p), cp*(100 - p)/100], RS, 20),
     why:R`Profit is a percentage of cost: \(CP=\tfrac{100\times${sp}}{${100 + p}}=${cp}\). Taking ${p}% off the selling price is the common slip.`}; }}),

/* ---------- interest ---------- */
{id:'cif',t:'arith',u:'interest',lv:1,k:'fill',name:'Compound interest',sheet:R`A=P\left(1+\frac{r}{100}\right)^{n},\quad SI=\frac{Prn}{100}`,
 q:R`Complete the amount after n years at r% compounded annually.`,
 f:R`A=P\left(\boxed{\;?\;}\right)^{n}`,
 o:[R`1+\frac{r}{100}`,R`1+\frac{rn}{100}`,R`\frac{r}{100}`,R`1+r`],om:1,a:0,
 why:R`Each year multiplies the amount by \(1+r/100\). \(1+rn/100\) is the simple-interest growth factor.`},
G({id:'cisi',t:'arith',u:'interest',lv:2,k:'mcq',name:'CI − SI for two years',sheet:R`CI-SI\ (2\text{ yrs})=P\left(\frac{r}{100}\right)^2`,
 gen: r => { const P_ = 1000*ri(r,2,20), rr = pk(r,[5,10,15,20]), v = P_*(rr/100)**2;
   return {p:{P:P_,r:rr}, q:R`What is the difference between compound interest (compounded annually) and simple interest on ₹${inr(P_)} at ${rr}% per year for 2 years?`,
     o: opts(v, [2*v, v/2, P_*rr/100, P_*rr/100*2/10], RS, 5),
     why:R`In year 2, CI also earns interest on year 1’s interest: \(${P_}\times(${rr/100})^2=${rd(v)}\).`}; }}),
G({id:'sitimes',t:'arith',u:'interest',lv:2,k:'mcq',name:'Simple interest multiples',sheet:R`SI:\ \text{doubles in }n\text{ yrs}\Rightarrow k\text{ times in }(k-1)n\text{ yrs}`,
 gen: r => { const n = pk(r,[4,5,6,8,10,12,16,20]), k = pk(r,[3,4,5]), v = (k - 1)*n;
   return {p:{n,k}, q:R`At simple interest, a sum doubles in ${n} years. In how many years will it become ${k} times itself?`,
     o: opts(v, [k*n, n*2**(k - 2), (k - 1)*n/2], U('years'), n),
     why:R`Doubling means interest = P in ${n} years. Becoming ${k} times needs interest \(${k - 1}P\), so \(${k - 1}\times${n}=${v}\) years. (Under compound interest it would be \(n\log_2 ${k}\).)`}; }}),
G({id:'ci2',t:'arith',u:'interest',lv:2,k:'mcq',name:'Compound interest for two years',sheet:R`CI=P\left[\left(1+\frac{r}{100}\right)^{n}-1\right]`,
 gen: r => { const P_ = 1000*ri(r,2,25), rr = pk(r,[5,10,15,20]), v = P_*((1 + rr/100)**2 - 1);
   return {p:{P:P_,r:rr}, q:R`Find the compound interest on ₹${inr(P_)} at ${rr}% per year for 2 years, compounded annually.`,
     o: opts(v, [2*P_*rr/100, P_*(1 + rr/100)**2, P_*rr/100], RS, 10),
     why:R`\(${P_}\left[(${1 + rr/100})^2-1\right]=${rd(v)}\). Simple interest would be ${2*P_*rr/100}; the extra is interest on interest.`}; }}),

/* ---------- mixtures ---------- */
{id:'alligf',t:'arith',u:'mix',lv:1,k:'fill',name:'Alligation rule',sheet:R`\frac{q_{\text{cheap}}}{q_{\text{dear}}}=\frac{d-m}{m-c}`,
 q:R`Items costing c (cheaper) and d (dearer) per unit are mixed to get a mean price m. Complete the ratio.`,
 f:R`\frac{q_{\text{cheap}}}{q_{\text{dear}}}=\frac{\boxed{\;?\;}}{m-c}`,
 o:[R`d-m`,R`m-d`,R`d-c`,R`m`],om:1,a:0,
 why:R`Cross the differences: the cheaper item’s share is the dearer price minus the mean. The mean always lies between c and d.`},
G({id:'allig',t:'arith',u:'mix',lv:2,k:'mcq',name:'Alligation in numbers',sheet:R`\frac{q_{\text{cheap}}}{q_{\text{dear}}}=\frac{d-m}{m-c}`,
 gen: r => { let c, d, m; do { c = ri(r,20,60); d = c + ri(r,6,40); m = ri(r,c + 1,d - 1); } while (false);
   const v = (d - m)/(m - c);
   return {p:{c,d,m}, q:R`Rice at ₹${c}/kg is mixed with rice at ₹${d}/kg to get a mixture worth ₹${m}/kg. In what ratio (cheaper : dearer) must they be mixed?`,
     o: opts(v, [(m - c)/(d - m), (m - c)/(d - c), (d - c)/(d - m), c/d], RAT, 0.25),
     why:R`\((${d}-${m}) : (${m}-${c}) = ${d - m} : ${m - c} = ${RAT(v)}\). The mean is closer to the price used more.`}; }}),
G({id:'milkadd',t:'arith',u:['mix','ratio'],lv:2,k:'mcq',name:'Adding water to change a ratio',sheet:R`\frac{M}{W+x}=\frac{c}{d}\Rightarrow x=\frac{Md}{c}-W`,
 gen: r => { let a, b, u, c, d, x;
   do { [a, b] = pk(r,[[3,1],[4,1],[5,3],[7,3],[3,2],[5,1],[2,1]]); u = ri(r,2,12); [c, d] = pk(r,[[1,1],[3,2],[2,1],[4,3],[5,4],[3,1]]); x = a*u*d/c - b*u; } while (!(x > 0) || !Number.isInteger(x) || c*b >= d*a);
   const V = (a + b)*u;
   return {p:{V,a,b,c,d}, q:R`${V} litres of a mixture contain milk and water in the ratio ${a} : ${b}. How much water must be added to make the ratio ${c} : ${d}?`,
     o: opts(x, [a*u*d/c, V*d/c - V, x + b*u, (V*d/(c + d)) - b*u], U('litres'), 2),
     why:R`Milk stays ${a*u} L and water is ${b*u} L. Need \(\tfrac{${a*u}}{${b*u}+x}=\tfrac{${c}}{${d}}\Rightarrow x=${x}\) L.`}; }}),
G({id:'replace',t:'arith',u:'mix',lv:3,k:'mcq',name:'Repeated replacement',sheet:R`\text{left}=V\left(1-\frac{x}{V}\right)^{n}`,
 gen: r => { const V = pk(r,[40,50,60,80,100]), x = V/pk(r,[4,5,10]), n = pk(r,[2,3]), v = V*(1 - x/V)**n;
   return {p:{V,x,n}, q:R`A vessel holds ${V} litres of milk. ${x} litres are taken out and replaced with water, and this is done ${n} times in all. How much milk is left?`,
     o: opts(v, [V - n*x, V*(1 - x/V)**(n - 1), V*(1 - x/V)**(n + 1)], U('litres'), 1),
     why:R`Each round keeps \(1-\tfrac{${x}}{${V}}\) of the milk: \(${V}\times(${rd(1 - x/V, 3)})^{${n}}=${rd(v)}\) L. Subtracting ${x} L each time ignores that later draws are diluted.`}; }}),

/* ================= TIME, WORK & SPEED ================= */
{id:'togf',t:'rate',u:'work',lv:1,k:'fill',name:'Working together',sheet:R`\frac1T=\frac1a+\frac1b\Rightarrow T=\frac{ab}{a+b}`,
 q:R`A finishes a job in a days, B in b days. Working together they need T days:`,
 f:R`T=\boxed{\;?\;}`,
 o:[R`\frac{ab}{a+b}`,R`\frac{a+b}{2}`,R`a+b`,R`\frac{a+b}{ab}`],om:1,a:0,
 why:R`Rates add, times don’t: \(1/a+1/b\) of the job per day. \(\tfrac{a+b}{ab}\) is the combined rate, not the time.`},
G({id:'together',t:'rate',u:'work',lv:1,k:'mcq',name:'Working together',sheet:R`T=\frac{ab}{a+b}`,
 gen: r => { const [a, b] = pk(r,[[3,6],[4,12],[6,12],[10,15],[12,24],[20,30],[12,36],[6,30],[15,30],[18,36],[8,24],[24,40]]), v = a*b/(a + b);
   return {p:{a,b}, q:R`A can finish a job in ${a} days and B in ${b} days. How long do they take working together?`,
     o: opts(v, [(a + b)/2, a + b, b - a], U('days'), 1),
     why:R`Together they do \(\tfrac1{${a}}+\tfrac1{${b}}=\tfrac{${a + b}}{${a*b}}\) per day, so \(${a*b}/${a + b}=${v}\) days.`}; }}),
G({id:'pipes',t:'rate',u:'work',lv:2,k:'mcq',name:'Filling and emptying pipes',sheet:R`T=\frac{ab}{b-a}\quad(\text{fill in }a,\ \text{empty in }b)`,
 gen: r => { const [a, b] = pk(r,[[2,3],[3,4],[4,6],[5,10],[6,9],[4,12],[10,15],[12,18],[6,10],[8,12]]), v = a*b/(b - a);
   return {p:{a,b}, q:R`A pipe fills a tank in ${a} hours and a drain empties the full tank in ${b} hours. If both are open, how long does the empty tank take to fill?`,
     o: opts(v, [a*b/(a + b), b - a, (a + b)/2], U('hours'), 1),
     why:R`Net rate \(\tfrac1{${a}}-\tfrac1{${b}}=\tfrac{${b - a}}{${a*b}}\), so \(${a*b}/${b - a}=${v}\) hours. The drain’s rate is subtracted, not added.`}; }}),
G({id:'bfind',t:'rate',u:'work',lv:2,k:'mcq',name:'One worker’s time from the pair',sheet:R`\frac1b=\frac1c-\frac1a\Rightarrow b=\frac{ac}{a-c}`,
 gen: r => { const [x, y] = pk(r,[[3,6],[4,12],[6,12],[10,15],[12,24],[20,30],[12,36],[6,30],[15,30],[8,24]]), sw = r() < 0.5, a = sw ? y : x, b = sw ? x : y, c = x*y/(x + y);
   return {p:{a,c}, q:R`A alone can do a job in ${a} days; A and B together can do it in ${c} days. How long would B take alone?`,
     o: opts(b, [a - c, a*c/(a + c), 2*c], U('days'), 1),
     why:R`B’s rate \(=\tfrac1{${c}}-\tfrac1{${a}}=\tfrac{${a - c}}{${a*c}}\), so B takes \(${a*c}/${a - c}=${b}\) days.`}; }}),
G({id:'mandays',t:'rate',u:'work',lv:1,k:'mcq',name:'Man-days',sheet:R`M_1D_1=M_2D_2`,
 gen: r => { let m1, d1, m2; do { m1 = ri(r,4,30); d1 = ri(r,5,40); m2 = ri(r,3,40); } while (m2 === m1 || (m1*d1) % m2 !== 0);
   const v = m1*d1/m2;
   return {p:{m1,d1,m2}, q:R`${m1} workers finish a job in ${d1} days. How many days would ${m2} workers take, working at the same rate?`,
     o: opts(v, [d1*m2/m1, d1, d1 + m1 - m2, m1*m2/d1], U('days'), 2),
     why:R`The job is \(${m1}\times${d1}=${m1*d1}\) worker-days, so \(${m1*d1}/${m2}=${v}\) days. More workers means fewer days.`}; }}),

{id:'avgspf',t:'rate',u:'speed',lv:1,k:'fill',name:'Average speed over equal distances',sheet:R`\bar v=\frac{2xy}{x+y}\quad(\text{equal distances})`,
 q:R`A car goes a distance at x km/h and returns the same distance at y km/h. Its average speed is:`,
 f:R`\bar v=\boxed{\;?\;}`,
 o:[R`\frac{2xy}{x+y}`,R`\frac{x+y}{2}`,R`\sqrt{xy}`,R`\frac{xy}{x+y}`],om:1,a:0,
 why:R`Average speed = total distance ÷ total time; the slower leg takes longer, so the answer is the harmonic mean, below \((x+y)/2\).`},
G({id:'avgspd',t:'rate',u:'speed',lv:1,k:'mcq',name:'Average speed over equal distances',sheet:R`\bar v=\frac{2xy}{x+y}`,
 gen: r => { const [x, y] = pk(r,[[40,60],[30,60],[20,30],[60,90],[45,90],[40,120],[50,75],[36,45],[30,45],[24,40]]), v = 2*x*y/(x + y);
   return {p:{x,y}, q:R`A cyclist rides to a town at ${x} km/h and returns along the same road at ${y} km/h. What is the average speed for the whole trip?`,
     o: opts(v, [(x + y)/2, x*y/(x + y), y - x], U('km/h'), 2),
     why:R`\(\tfrac{2\times${x}\times${y}}{${x + y}}=${v}\) km/h. It is below \((${x}+${y})/2=${(x + y)/2}\) because more time is spent at the lower speed.`}; }}),
G({id:'train',t:'rate',u:'speed',lv:2,k:'mcq',name:'Train crossing a platform',sheet:R`t=\frac{L_{\text{train}}+L_{\text{platform}}}{v},\quad 1\text{ km/h}=\tfrac{5}{18}\text{ m/s}`,
 gen: r => { let v, L, Pl, t; do { v = pk(r,[36,54,72,90,108]); L = 25*ri(r,4,12); Pl = 25*ri(r,4,16); t = (L + Pl)*18/(5*v); } while (!Number.isInteger(t));
   return {p:{v,L,Pl}, q:R`A ${L} m long train runs at ${v} km/h. How long does it take to cross a ${Pl} m long platform?`,
     o: opts(t, [L*18/(5*v), Pl*18/(5*v), (L + Pl)/v], U('s'), 2),
     why:R`It must cover its own length plus the platform: \(${L + Pl}\) m at \(${v}\times\tfrac5{18}=${v*5/18}\) m/s gives ${t} s.`}; }}),
G({id:'boat',t:'rate',u:'speed',lv:2,k:'mcq',name:'Boats and streams',sheet:R`b=\frac{d+u}{2},\quad s=\frac{d-u}{2}\ \ (d,u:\text{ down/upstream speeds})`,
 gen: r => { let b, s; do { b = ri(r,6,20); s = ri(r,1,5); } while (s >= b);
   const D = lcm(b + s, b - s)*ri(r,1,2), t1 = D/(b + s), t2 = D/(b - s);
   return {p:{D,t1,t2}, q:R`A boat goes ${D} km downstream in ${t1} hours and comes back the same ${D} km upstream in ${t2} hours. What is the speed of the stream?`,
     o: opts(s, [b, 2*s, (D/t1 + D/t2)/2 - s], U('km/h'), 1),
     why:R`Downstream \(${D}/${t1}=${b + s}\), upstream \(${D}/${t2}=${b - s}\). Stream \(=(${b + s}-${b - s})/2=${s}\) km/h; the boat’s own speed is ${b}.`}; }}),
G({id:'cross',t:'rate',u:'speed',lv:2,k:'mcq',name:'Two trains crossing',sheet:R`t=\frac{L_1+L_2}{v_1\pm v_2}\quad(+\text{ opposite},\ -\text{ same direction})`,
 gen: r => { let L1, L2, v1, v2, opp, t; do { L1 = 50*ri(r,2,6); L2 = 50*ri(r,2,6); v1 = pk(r,[36,54,72,90]); v2 = pk(r,[18,36,54]); opp = r() < 0.5; t = (L1 + L2)*18/(5*(opp ? v1 + v2 : v1 - v2)); } while (v2 >= v1 || !Number.isInteger(t));
   const other = (L1 + L2)*18/(5*(opp ? v1 - v2 : v1 + v2));
   return {p:{L1,L2,v1,v2,opp}, q:R`Trains of length ${L1} m and ${L2} m run on parallel tracks at ${v1} km/h and ${v2} km/h in ${opp ? 'opposite directions' : 'the same direction'}. How long do they take to cross each other completely?`,
     o: opts(t, [other, L1*18/(5*(opp ? v1 + v2 : v1 - v2)), t*2], U('s'), 2),
     why:R`Relative speed \(=${opp ? v1 + v2 : v1 - v2}\) km/h \(=${rd((opp ? v1 + v2 : v1 - v2)*5/18)}\) m/s, distance \(=${L1 + L2}\) m, so ${t} s.`}; }}),

/* ================= NUMBERS & ALGEBRA ================= */
/* ---------- number theory ---------- */
{id:'divrules',t:'num',u:'numth',lv:1,k:'mcq',name:'Divisibility tests',sheet:R`3,9:\ \text{digit sum};\ \ 4:\ \text{last 2 digits};\ \ 8:\ \text{last 3};\ \ 11:\ \text{alternating sum}`,
 q:R`Which test tells you whether a number is divisible by 11?`,
 o:[R`The difference between the sums of digits in odd and even places is divisible by 11`,R`The sum of its digits is divisible by 11`,R`Its last two digits form a number divisible by 11`,R`It ends in 1 or 11`],a:0,
 why:R`Because \(10\equiv-1\pmod{11}\), the digits count with alternating signs. Example: 918082 → (9+8+8)−(1+0+2) = 22, so it is divisible by 11.`},
G({id:'hcflcm',t:'num',u:'numth',lv:1,k:'mcq',name:'HCF × LCM = product',sheet:R`\text{HCF}(a,b)\times\text{LCM}(a,b)=a\times b`,
 gen: r => { let h, m, n; do { h = ri(r,2,15); m = ri(r,2,11); n = ri(r,2,11); } while (m === n || gcd(m,n) !== 1);
   const a = h*m, b = h*n, l = h*m*n;
   return {p:{h,l,a}, q:R`The HCF of two numbers is ${h} and their LCM is ${l}. One of the numbers is ${a}. What is the other?`,
     o: opts(b, [l/a, l/h, a*n, h*n + h], N, h),
     why:R`\(\text{other}=\tfrac{\text{HCF}\times\text{LCM}}{${a}}=\tfrac{${h}\times${l}}{${a}}=${b}\). This holds for two numbers only.`}; }}),
G({id:'digprod',t:'num',u:'numth',lv:2,k:'mcq',name:'Digits from their product',sheet:R`\text{factor the product into primes; each prime }\ge5\text{ must be a digit itself}`,
 gen: r => { const x = pk(r,[1,2,3,4,6,8,9]), pr = 35*x, v = 12 + x;
   return {p:{pr}, q:R`The product of the digits of a three-digit number is ${pr}. What is the sum of its digits?`,
     o: opts(v, [v + 2, v - 2, v + 4, v - 3], N, 1),
     why:R`\(${pr}=5\times7\times${x}\). The only digits divisible by 5 and 7 are 5 and 7 themselves, so the digits are 5, 7 and ${x}: sum ${v}.`}; }}),
G({id:'divcount',t:'num',u:'numth',lv:2,k:'mcq',name:'Number of divisors',sheet:R`n=p_1^{a_1}p_2^{a_2}\cdots\Rightarrow d(n)=(a_1+1)(a_2+1)\cdots`,
 gen: r => { let a, b, c, n; do { a = ri(r,1,5); b = ri(r,0,3); c = ri(r,0,2); n = 2**a*3**b*5**c; } while (n > 20000 || b + c === 0);
   const v = (a + 1)*(b + 1)*(c + 1), fs = [`2^{${a}}`, b ? `3^{${b}}` : '', c ? `5^{${c}}` : ''].filter(Boolean).join(R`\cdot `);
   return {p:{n}, q:R`How many positive divisors does ${inr(n)} have?`,
     o: opts(v, [a*Math.max(b,1)*Math.max(c,1), a + b + c + 1, v - 2, 2*(a + b + c)], N, 2),
     why:R`\(${inr(n).replace(/,/g,'')}=${fs}\), so \(d=${[a,b,c].filter((x,i) => x || i === 0).map(x => `(${x}+1)`).join('')}=${v}\) (including 1 and the number itself).`}; }}),
G({id:'unitdig',t:'num',u:'numth',lv:2,k:'mcq',name:'Last digit of a power',sheet:R`\text{last digits of }b^n\text{ repeat with period 4 (or less)}`,
 gen: r => { const b = pk(r,[2,3,7,8,4,9,13,17]), n = ri(r,21,199), cyc = [1,2,3,4].map(k => (b % 10)**k % 10), v = cyc[(n - 1) % 4];
   return {p:{b,n}, q:R`What is the last digit of \(${b}^{${n}}\)?`,
     o: sopts(String(v), [...new Set(cyc.concat([1,5,6,0]).map(String))]),
     why:R`Last digits of \(${b}^1,${b}^2,${b}^3,${b}^4\) are ${cyc.join(', ')}, repeating. Since \(${n}=4\times${Math.floor((n - 1)/4)}+${(n - 1) % 4 + 1}\), take position ${(n - 1) % 4 + 1} of the cycle: ${v}.`}; }}),
{id:'primes',t:'num',u:'numth',lv:2,k:'mcq',name:'Facts about primes',sheet:R`p_1p_2\ \text{is never prime};\ \ 2\ \text{is the only even prime}`,
 q:R`\(p_1\) and \(p_2\) are any two prime numbers (possibly equal). Which statement is true for every choice?`,
 o:[R`\(p_1p_2\) is not prime`,R`\(p_1+p_2\) is not prime`,R`\(p_1p_2+1\) is prime`,R`\(p_1+p_2+1\) is prime`],a:0,
 why:R`A product of two primes has at least three divisors. Counterexamples for the rest: 2 + 3 = 5 is prime; 3·5 + 1 = 16; 3 + 5 + 1 = 9.`},

/* ---------- powers and logarithms ---------- */
{id:'logswap',t:'num',u:'powlog',lv:2,k:'fill',name:'Swapping base and exponent in logs',sheet:R`a^{\log b}=b^{\log a}`,
 q:R`For positive a and b (any fixed log base), complete the identity.`,
 f:R`a^{\log b}=\boxed{\;?\;}`,
 o:[R`b^{\log a}`,R`\log(ab)`,R`a^{b}`,R`b^{a}`],om:1,a:0,
 why:R`Take logs of both sides: \(\log b\cdot\log a=\log a\cdot\log b\). So \(n^{\log m}\) and \(m^{\log n}\) are always equal.`},
G({id:'expeq',t:'num',u:'powlog',lv:2,k:'mcq',name:'Equations with powers',sheet:R`\text{write both sides with the same base, then equate exponents}`,
 gen: r => { const B = pk(r,[2,3,5]), x = pk(r,[3,4,5,6]), m = x*x - 2*x, rhs = B**m <= 1e6 ? inr(B**m).replace(/,/g,'') : `${B}^{${m}}`;
   return {p:{B,m}, q:R`A positive real x satisfies \(${B}^{x^2}=${rhs}\times${B*B}^{x}\). Find x.`,
     o: opts(x, [m, x + 1, x - 2, 2*x], N, 1),
     why:R`\(${rhs}=${B}^{${m}}\) and \(${B*B}^x=${B}^{2x}\), so \(x^2=${m}+2x\Rightarrow(x-${x})(x+${x - 2})=0\Rightarrow x=${x}\).`}; }}),
G({id:'numdigits',t:'num',u:'powlog',lv:2,k:'mcq',name:'Number of digits via log',sheet:R`\#\text{digits of }N=\lfloor\log_{10}N\rfloor+1`,
 gen: r => { let b, n, v, L; do { b = pk(r,[2,3]); n = ri(r,20,120); L = b === 2 ? 0.3010 : 0.4771; v = String(BigInt(b)**BigInt(n)).length; } while (Math.floor(n*L) + 1 !== v || Math.abs(n*L - Math.round(n*L)) < 0.02);
   return {p:{b,n}, q:R`Given \(\log_{10}${b}=${L}\), how many digits does \(${b}^{${n}}\) have?`,
     o: opts(v, [v - 1, v + 1, v + 2, n], N, 1),
     why:R`\(\log_{10}${b}^{${n}}=${n}\times${L}=${rd(n*L,3)}\), so the number of digits is \(\lfloor${rd(n*L,3)}\rfloor+1=${v}\).`}; }}),
G({id:'logsq',t:'num',u:'powlog',lv:3,k:'mcq',name:'Log equation to an algebraic identity',sheet:R`\frac{p}{q}+\frac{q}{p}=k\Rightarrow\frac{p^2}{q^2}+\frac{q^2}{p^2}=k^2-2`,
 gen: r => { const c = pk(r,[2,3,4,5,6,7,8,9]), sq = r() < 0.5 && c <= 3, k = sq ? c*c : c, v = k*k - 2;
   return {p:{k}, q:R`For positive p and q, \(\log(p^2+q^2)=\log p+\log q+${sq ? R`2\log ${c}` : R`\log ${c}`}\). Find \(\dfrac{p^4+q^4}{p^2q^2}\).`,
     o: opts(v, [k*k, k*k + 2, k, 2*k], N, 2),
     why:R`\(p^2+q^2=${k}pq\), so \(\tfrac pq+\tfrac qp=${k}\). Square it: \(\tfrac{p^2}{q^2}+\tfrac{q^2}{p^2}=${k}^2-2=${v}\), which is the asked ratio.`}; }}),
{id:'amgmlog',t:'num',u:'powlog',lv:3,k:'mcq',name:'Log of the mean vs mean of logs',sheet:R`\ln\frac{x+y}{2}\ge\frac{\ln x+\ln y}{2},\ \text{equality iff }x=y`,
 q:R`Positive x and y satisfy \(\ln\!\left(\frac{x+y}{2}\right)=\frac12(\ln x+\ln y)\). What is \(\frac xy+\frac yx\)?`,
 o:[R`2`,R`1`,R`\(\tfrac12\)`,R`4`],a:0,
 why:R`The equation says \(\tfrac{x+y}{2}=\sqrt{xy}\) (AM = GM), which forces \(x=y\). Then \(\tfrac xy+\tfrac yx=2\).`},

/* ---------- series ---------- */
{id:'gpinf',t:'num',u:'series',lv:1,k:'fill',name:'Sum of an infinite GP',sheet:R`a+ar+ar^2+\cdots=\frac{a}{1-r},\ |r|\lt1`,
 q:R`Complete the sum of an infinite geometric series.`,
 f:R`a+ar+ar^2+\cdots=\boxed{\;?\;}`,
 o:[R`\frac{a}{1-r}`,R`\frac{a}{1+r}`,R`\frac{ar}{1-r}`,R`\frac{1}{1-r}`],om:1,a:0,
 why:R`Valid only when \(|r|\lt1\). \(\tfrac{ar}{1-r}\) is the sum that starts from the second term.`},
G({id:'gpmix',t:'num',u:'series',lv:2,k:'mcq',name:'Two infinite GPs mixed together',sheet:R`\sum_{k\ge1}\frac{1}{m^k}=\frac{1}{m-1}`,
 gen: r => { let m, n; do { m = ri(r,2,5); n = ri(r,2,6); } while (m >= n); const a = ri(r,1,3), v = a + 1/(m - 1) + 1/(n - 1);
   const terms = [m, n, m*m, n*n].map(d => R`\tfrac{1}{${d}}`).join('+');
   return {p:{a,m,n}, q:R`Find the sum \(${a}+${terms}+\cdots\) (the terms are powers of \(\tfrac1{${m}}\) and of \(\tfrac1{${n}}\)).`,
     o: opts(v, [a + m/(m - 1) + n/(n - 1), 1/(m - 1) + 1/(n - 1), a + 1/m + 1/n, a + 1/(m - 1)], F, 0.5),
     why:R`\(\sum_{k\ge1}${m}^{-k}=\tfrac{1}{${m - 1}}\) and \(\sum_{k\ge1}${n}^{-k}=\tfrac{1}{${n - 1}}\). Total \(=${a}+\tfrac1{${m - 1}}+\tfrac1{${n - 1}}\), i.e. ${F(v)}.`}; }}),
G({id:'apsum',t:'num',u:'series',lv:1,k:'mcq',name:'Sum of an AP',sheet:R`S_n=\frac n2\big(2a+(n-1)d\big)`,
 gen: r => { const a = ri(r,1,20), d = ri(r,2,9), n = ri(r,8,30), v = n*(2*a + (n - 1)*d)/2;
   return {p:{a,d,n}, q:R`Find the sum of the first ${n} terms of ${a}, ${a + d}, ${a + 2*d}, …`,
     o: opts(v, [n*(2*a + n*d)/2, n*(a + (n - 1)*d), n*(a + (n - 1)*d)/2], N, d),
     why:R`\(\tfrac{${n}}{2}\big(2\times${a}+${n - 1}\times${d}\big)=${v}\). The last term is \(a+(n-1)d=${a + (n - 1)*d}\), not \(a+nd\).`}; }}),
G({id:'quadseq',t:'num',u:'series',lv:2,k:'mcq',name:'Sequences with growing differences',sheet:R`\text{check the differences; if they change by a constant, the next difference is predictable}`,
 gen: r => { const t1 = ri(r,1,15), d0 = ri(r,1,6), e = ri(r,1,4), t = [t1]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + d0 + (i - 1)*e);
   const k = ri(r,2,4), v = t[k], shown = t.map((x,i) => i === k ? 'x' : x).join(', ');
   return {p:{t}, q:R`In the sequence ${shown}, what is x?`,
     o: opts(v, [v + e, v - e, v + 1, (t[k - 1] + t[k + 1])/2 === v ? v + 2*e : (t[k - 1] + t[k + 1])/2], N, 1),
     why:R`Differences are ${t.slice(1).map((x,i) => x - t[i]).join(', ')}: they grow by ${e} each time, so x = ${v}.`}; }}),
G({id:'fibback',t:'num',u:'series',lv:2,k:'mcq',name:'Running a recurrence backwards',sheet:R`F_{n+1}=F_n+F_{n-1}\Rightarrow F_{n-1}=F_{n+1}-F_n`,
 gen: r => { const F = [0, ri(r,1,9), ri(r,1,9)]; for (let i = 3; i <= 7; i++) F.push(F[i - 1] + F[i - 2]);
   return {p:{F6:F[6], F7:F[7]}, q:R`A sequence obeys \(F_{n+1}=F_n+F_{n-1}\) for \(n\ge2\). If \(F_6=${F[6]}\) and \(F_7=${F[7]}\), what is \(F_1\)?`,
     o: opts(F[1], [F[2], F[1] + 1, F[3], F[7] - F[6]], N, 1),
     why:R`Go backwards with \(F_{n-1}=F_{n+1}-F_n\): \(F_5=${F[5]},\ F_4=${F[4]},\ F_3=${F[3]},\ F_2=${F[2]},\ F_1=${F[1]}\).`}; }}),

/* ---------- algebra and functions ---------- */
G({id:'sumsq',t:'num',u:'alg',lv:2,k:'mcq',name:'Symmetric functions of roots',sheet:R`\alpha+\beta=s,\ \alpha\beta=p\Rightarrow\alpha^2+\beta^2=s^2-2p`,
 gen: r => { let r1, r2; do { r1 = ri(r,-5,7); r2 = ri(r,-5,7); } while (r1 === 0 || r2 === 0 || r1 + r2 === 0);
   const s = r1 + r2, p = r1*r2, v = s*s - 2*p, eq = `x^2${s > 0 ? '-' + s : '+' + (-s)}x${p > 0 ? '+' + p : '-' + (-p)}=0`;
   return {p:{s,p}, q:R`\(\alpha\) and \(\beta\) are the roots of \(${eq}\). Find \(\alpha^2+\beta^2\).`,
     o: opts(v, [s*s, s*s + 2*p, s - 2*p, p*p], N, 2),
     why:R`\(\alpha+\beta=${s}\), \(\alpha\beta=${p}\), so \(\alpha^2+\beta^2=(${s})^2-2(${p})=${v}\). No need to find the roots.`}; }}),
G({id:'overtake',t:'num',u:'alg',lv:2,k:'mcq',name:'When a faster-growing function overtakes',sheet:R`at^2\gt bt\iff t\gt\frac ba\ \ (a,b,t\gt0)`,
 gen: r => { const a = pk(r,[0.01,0.02,0.05,0.1,0.5]), b = pk(r,[1,2,3,4,5,10]), v = b/a;
   return {p:{a,b}, q:R`\(f(t)=${a}\,t^2\) and \(g(t)=${b}\,t\) for \(t\gt0\). Beyond what value of t is \(f(t)\gt g(t)\) for all larger t?`,
     o: opts(v, [Math.sqrt(b/a), a/b, a*b, v*2], N, 10),
     why:R`\(${a}t^2\gt${b}t\iff t\gt${b}/${a}=${rd(v)}\). Before that \(g\) is larger; the quadratic always wins eventually.`}; }}),
{id:'fgconst',t:'num',u:'alg',lv:2,k:'mcq',name:'f(x) = g(y) for all x and y',sheet:R`f(x)=g(y)\ \forall x,y\Rightarrow f\equiv g\equiv\text{constant}`,
 q:R`\(f(x)\) and \(g(y)\) are functions with \(f(x)=g(y)\) for all real x and y. Which must be true?`,
 o:[R`f and g are both equal to the same constant`,R`\(f(x)=g(y)=0\) for all x, y`,R`f and g are both non-constant`,R`\(f(x)=x\) and \(g(y)=y\)`],a:0,
 why:R`Fix y: then \(f(x)\) equals one number for every x, so f is constant, and g equals that same constant. It need not be 0.`},
{id:'expzero',t:'num',u:'alg',lv:2,k:'mcq',name:'Identities that hold for all x',sheet:R`Pe^{x}=Qe^{-x}\ \forall x\Rightarrow P=Q=0`,
 q:R`If \(Pe^{x}=Qe^{-x}\) for all real x, then:`,
 o:[R`\(P=Q=0\)`,R`\(P=Q=1\)`,R`\(P=1,\ Q=-1\)`,R`\(P/Q=1\)`],a:0,
 why:R`Then \(Pe^{2x}=Q\) for every x. The left side changes with x unless \(P=0\), and then \(Q=0\) too.`},
{id:'propconst',t:'num',u:['alg','ratio'],lv:2,k:'mcq',name:'Proportional sums and differences',sheet:R`x+y=k(x-y)\Rightarrow\frac xy=\frac{k+1}{k-1}\ (\text{constant})`,
 q:R`Non-zero x and y (with \(x\ne y\)) are such that \(x+y\) is proportional to \(x-y\). Then \(x/y\):`,
 o:[R`is a constant`,R`depends on xy`,R`depends only on x`,R`depends only on y`],a:0,
 why:R`\(x+y=k(x-y)\Rightarrow x(k-1)=y(k+1)\Rightarrow\tfrac xy=\tfrac{k+1}{k-1}\), fixed once k is fixed.`},
{id:'monotone',t:'num',u:'alg',lv:3,k:'mcq',name:'Equal values of a rise-then-fall function',sheet:R`f\uparrow\text{ till }c,\ f\downarrow\text{ after}\Rightarrow f(a_1)=f(a_2),\ a_1\lt a_2\Rightarrow a_1\lt c\lt a_2`,
 q:R`A function rises steadily up to \(t=50\) and falls steadily after that. Two different inputs \(a_1\lt a_2\) give the same value. Which must be true?`,
 o:[R`\(a_1\lt50\lt a_2\)`,R`\(a_1\lt a_2\lt50\)`,R`\(50\lt a_1\lt a_2\)`,R`\(a_1=50\) or \(a_2=50\)`],a:0,
 why:R`On each strictly monotone side the function is one-to-one, so two equal values must sit on opposite sides of the peak. If one were exactly 50, it would be the unique maximum.`},

/* ================= COUNTING, PROBABILITY, STATISTICS ================= */
{id:'starsf',t:'cp',u:'pnc',lv:1,k:'fill',name:'Choosing with repetition',sheet:R`\text{n identical items into k types}=\binom{n+k-1}{k-1}`,
 q:R`The number of ways to buy n scoops from k flavours (order doesn’t matter, repeats allowed) is:`,
 f:R`\boxed{\;?\;}`,
 o:[R`\binom{n+k-1}{n}`,R`k^n`,R`\binom{k}{n}`,R`\frac{k!}{(k-n)!}`],om:1,a:0,
 why:R`Stars and bars: n stars and \(k-1\) bars. \(k^n\) counts ordered choices.`},
G({id:'scoops',t:'cp',u:'pnc',lv:2,k:'mcq',name:'Choosing with repetition',sheet:R`\binom{n+k-1}{n}`,
 gen: r => { const k = ri(r,3,7), n = ri(r,2,5), v = C(n + k - 1, n);
   return {p:{k,n}, q:R`An ice-cream shop has ${k} flavours. In how many ways can you buy ${n} scoops if order doesn’t matter and flavours can repeat?`,
     o: opts(v, [k**n, C(k,n), n**k, C(n + k, n)], N, 3),
     why:R`Stars and bars: \(\binom{${n}+${k}-1}{${n}}=\binom{${n + k - 1}}{${n}}=${v}\). \(${k}^{${n}}\) would count ordered purchases.`}; }}),
G({id:'div3',t:'cp',u:['pnc','numth'],lv:3,k:'mcq',name:'Counting numbers divisible by 3',sheet:R`\text{divisible by 3}\iff\text{digit sum divisible by 3}`,
 gen: r => { let S, v; do { S = shuf(r,[1,2,3,4,5,6,7,8,9]).slice(0,5).sort((a,b) => a - b); v = 0;
     for (let i = 0; i < 5; i++){ const sub = S.filter((_,j) => j !== i); if (sub.reduce((a,b) => a + b, 0) % 3 === 0) v += 24; } } while (v === 0);
   return {p:{S}, q:R`How many 4-digit numbers divisible by 3 can be formed from the digits {${S.join(', ')}}, with no digit used twice?`,
     o: opts(v, [120, 40, v*2, v/2], N, 24),
     why:R`Drop one digit so the other four sum to a multiple of 3: ${S.map((d,i) => { const s = S.reduce((a,b) => a + b, 0) - d; return s % 3 === 0 ? `drop ${d} (sum ${s})` : null; }).filter(Boolean).join(', ')}. Each such set gives \(4!=24\) numbers: ${v}.`}; }}),
G({id:'word',t:'cp',u:'pnc',lv:2,k:'mcq',name:'Arrangements with repeated letters',sheet:R`\frac{n!}{n_1!\,n_2!\cdots}`,
 gen: r => { const w = pk(r,['BANANA','LETTER','APPLE','COFFEE','GOOGLE','BALLOON','PEPPER','SUCCESS','ACCESS','ASSESS','TATTOO']), cnt = {};
   for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1;
   const reps = Object.values(cnt).filter(x => x > 1), v = fact(w.length)/reps.reduce((a,x) => a*fact(x), 1);
   return {p:{w}, q:R`In how many distinct ways can the letters of the word ${w} be arranged?`,
     o: opts(v, [fact(w.length), fact(w.length)/fact(Math.max(...reps)), v*2, v/2], N, 10),
     why:R`${w.length} letters with repeats ${Object.entries(cnt).filter(([,x]) => x > 1).map(([c,x]) => `${c}×${x}`).join(', ')}: \(\tfrac{${w.length}!}{${reps.map(x => x + '!').join('\\,')}}=${v}\).`}; }}),

{id:'binomf',t:'cp',u:'prob',lv:1,k:'fill',name:'Exactly k successes',sheet:R`P(k\text{ of }n)=\binom nk p^k(1-p)^{n-k}`,
 q:R`Complete the probability of exactly k successes in n independent trials.`,
 f:R`P=\boxed{\;?\;}\,p^k(1-p)^{n-k}`,
 o:[R`\binom nk`,R`k`,R`n`,R`\frac{1}{k!}`],om:1,a:0,
 why:R`\(\binom nk\) counts which k of the n trials are the successes. Forgetting it gives the probability of one particular order.`},
G({id:'kids',t:'cp',u:'prob',lv:1,k:'mcq',name:'Boys and girls',sheet:R`P(k\text{ girls of }n)=\binom nk\big/2^n`,
 gen: r => { const n = ri(r,3,5), k = ri(r,1,n - 1), v = C(n,k)/2**n;
   return {p:{n,k}, q:R`Each child is equally likely to be a boy or a girl. In a family with ${n} children, what is the probability of exactly ${k} girls?`,
     o: opts(v, [1/2**n, k/n, C(n,k)/2**(n - 1), 1/(n + 1)], F, 1/16),
     why:R`\(\binom{${n}}{${k}}/2^{${n}}=${C(n,k)}/${2**n}\). The ${C(n,k)} orders (which children are girls) are all equally likely.`}; }}),
G({id:'dice1',t:'cp',u:'prob',lv:2,k:'mcq',name:'Exactly one six',sheet:R`P=\binom n1\frac16\left(\frac56\right)^{n-1}`,
 gen: r => { const n = ri(r,2,4), v = n*5**(n - 1)/6**n;
   return {p:{n}, q:R`A fair die is rolled ${n} times. What is the probability of getting a six exactly once?`,
     o: opts(v, [5**(n - 1)/6**n, 1/6, n/6, 1 - (5/6)**n], F, 1/36),
     why:R`Choose which roll is the six (${n} ways): \(${n}\times\tfrac16\times(\tfrac56)^{${n - 1}}=\tfrac{${n*5**(n - 1)}}{${6**n}}\).`}; }}),
G({id:'twodice',t:'cp',u:'prob',lv:1,k:'mcq',name:'Sum of two dice',sheet:R`P(\text{sum}=s)=\frac{6-|s-7|}{36}`,
 gen: r => { const s = ri(r,3,11), w = 6 - Math.abs(s - 7), v = w/36;
   return {p:{s}, q:R`Two fair dice are rolled. What is the probability that the sum is ${s}?`,
     o: opts(v, [1/11, (w + 1)/36, (w - 1)/36 || 2/36, 1/6 === v ? 5/36 : 1/6], F, 1/36),
     why:R`${w} of the 36 equally likely pairs give ${s}, so \(${w}/36\). The 11 possible sums are not equally likely.`}; }}),
G({id:'urnrule',t:'cp',u:'prob',lv:3,k:'mcq',name:'Two-stage draws with a replacement rule',sheet:R`P(B)=P(A)P(B\mid A)+P(A^c)P(B\mid A^c)`,
 gen: r => { const g = ri(r,2,5), o = ri(r,1,4), T = g + o, v = (g/T)*(o/(T - 1)) + (o/T)*(o/T);
   return {p:{g,o}, q:R`A box has ${g} green and ${o} orange balls. Balls are drawn one at a time: a green ball drawn is not put back, but an orange ball drawn is put back. What is the probability that the second ball drawn is orange?`,
     o: opts(v, [o/T, (g/T)*(o/(T - 1)), o/(T - 1), (o/T)**2], F, 1/50),
     why:R`Condition on the first draw: \(\tfrac{${g}}{${T}}\cdot\tfrac{${o}}{${T - 1}}+\tfrac{${o}}{${T}}\cdot\tfrac{${o}}{${T}}=${F(v).replace(/\\\(|\\\)/g,'')}\).`}; }}),

{id:'medianf',t:'cp',u:'stats',lv:1,k:'mcq',name:'Median of an even-sized sample',sheet:R`\text{sort; even }n:\ \text{median}=\frac{x_{(n/2)}+x_{(n/2+1)}}{2}`,
 q:R`To find the median of 10 numbers you should:`,
 o:[R`Sort them and average the 5th and 6th values`,R`Average the 5th and 6th values as listed`,R`Take the 5th value after sorting`,R`Average the smallest and largest values`],a:0,
 why:R`Always sort first. With an even count there are two middle values and the median is their mean.`},
G({id:'median10',t:'cp',u:'stats',lv:1,k:'mcq',name:'Median vs mean with an outlier',sheet:R`\text{median ignores how extreme an outlier is; the mean doesn't}`,
 gen: r => { let xs; do { xs = Array.from({length:9}, () => ri(r,8,20)); xs.push(ri(r,55,95)); xs = shuf(r, xs); } while (false);
   const s = xs.slice().sort((a,b) => a - b), v = (s[4] + s[5])/2, mean = xs.reduce((a,b) => a + b, 0)/10;
   return {p:{xs}, q:R`Find the median of ${xs.join(', ')}.`,
     o: opts(v, [mean, (xs[4] + xs[5])/2, s[4], s[5] + 0.5], N, 0.5),
     why:R`Sorted: ${s.join(', ')}. Median \(=(${s[4]}+${s[5]})/2=${v}\). The mean (${rd(mean)}) is pulled up by ${Math.max(...xs)}.`}; }}),
G({id:'freqavg',t:'cp',u:['stats','ditab'],lv:2,k:'mcq',name:'Mean from a frequency table',sheet:R`\bar x=\frac{\sum f_ix_i}{\sum f_i},\quad E[a(X-b)]=a(\bar x-b)`,
 gen: r => { let f; do { f = [ri(r,1,4), ri(r,1,4), ri(r,1,4), ri(r,1,4)].map(x => x*10); } while (f.reduce((a,b) => a + b, 0) !== 100);
   const xs = [5,6,7,8], mean = xs.reduce((a,x,i) => a + x*f[i], 0)/100, v = 1000*(mean - 0.2), mode = xs[f.indexOf(Math.max(...f))];
   return {p:{f}, q:R`A doctor saw X patients per shift over 100 shifts:${table(['Patients per shift (X)','5','6','7','8'],[['Number of shifts',...f]])}She earns ₹1000(X − 0.2) per shift. What is her average earning per shift?`,
     o: opts(v, [1000*mean, 1000*(mode - 0.2), 1000*(6.5 - 0.2), 1000*mean - 0.2], RS, 100),
     why:R`Mean X \(=\tfrac{${xs.map((x,i) => `${x}\times${f[i]}`).join('+')}}{100}=${rd(mean)}\). Earnings are linear in X, so the average is \(1000(${rd(mean)}-0.2)=${rd(v)}\).`}; }}),
G({id:'missing5',t:'cp',u:'stats',lv:1,k:'mcq',name:'Finding a missing value from the mean',sheet:R`x_{\text{missing}}=n\bar x-\sum\text{(others)}`,
 gen: r => { let xs, m, v; do { xs = Array.from({length:4}, () => ri(r,10,60)); m = ri(r,20,50); v = 5*m - xs.reduce((a,b) => a + b, 0); } while (v <= 0 || v > 99);
   return {p:{xs,m}, q:R`The mean of five numbers is ${m}. Four of them are ${xs.join(', ')}. What is the fifth?`,
     o: opts(v, [m, 4*m - xs.reduce((a,b) => a + b, 0), v + 5, v - 5], N, 3),
     why:R`Total \(=5\times${m}=${5*m}\); the four sum to ${xs.reduce((a,b) => a + b, 0)}, leaving ${v}.`}; }}),

{id:'incexc3',t:'cp',u:'sets',lv:1,k:'fill',name:'Inclusion–exclusion for three sets',sheet:R`|A\cup B\cup C|=\sum|A|-\sum|A\cap B|+|A\cap B\cap C|`,
 q:R`Complete the formula.`,
 f:R`|A\cup B\cup C|=|A|+|B|+|C|-|A\cap B|-|B\cap C|-|A\cap C|+\boxed{\;?\;}`,
 o:[R`|A\cap B\cap C|`,R`0`,R`2|A\cap B\cap C|`,R`|A\cup B|`],om:1,a:0,
 why:R`The triple overlap is added three times and subtracted three times, so it must be added back once.`},
G({id:'venn',t:'cp',u:'sets',lv:2,k:'mcq',name:'Venn diagram with a ratio',sheet:R`n=|A|+|B|-|A\cap B|+|\text{neither}|`,
 gen: r => { let A, k, w, z; do { A = 100*ri(r,5,30); k = pk(r,[2,3,4]); w = 100*ri(r,1,10); z = 100*ri(r,5,40); } while (w >= A);
   const B = k*A, Ntot = A + B - w + z;
   return {p:{Ntot,z,w,k}, q:R`Of ${inr(Ntot)} students, ${inr(z)} like neither music nor sport. ${inr(w)} like both. The number who like sport is ${k} times the number who like music. How many like music?`,
     o: opts(A, [(Ntot - z)/(k + 1), (Ntot - z - w)/(k + 1), B, A + w], N, 100),
     why:R`Let music = M, so sport = ${k}M. \(M+${k}M-${w}=${Ntot}-${z}\Rightarrow${k + 1}M=${Ntot - z + w}\Rightarrow M=${A}\).`}; }}),
G({id:'onlyone',t:'cp',u:'sets',lv:1,k:'mcq',name:'Exactly one of two sets',sheet:R`\text{exactly one}=|A|+|B|-2|A\cap B|`,
 gen: r => { let a, b, w; do { a = ri(r,20,90); b = ri(r,20,90); w = ri(r,5,40); } while (w >= Math.min(a,b));
   const v = a + b - 2*w;
   return {p:{a,b,w}, q:R`In a group, ${a} people speak Hindi, ${b} speak Tamil, and ${w} speak both. How many speak exactly one of the two?`,
     o: opts(v, [a + b - w, a + b, a - w], N, 2),
     why:R`Only Hindi \(=${a - w}\), only Tamil \(=${b - w}\); total ${v}. The overlap is removed from both sets, hence \(-2|A\cap B|\).`}; }}),

/* ================= MENSURATION & GEOMETRY ================= */
{id:'sectorf',t:'geo',u:'plane',lv:1,k:'fill',name:'Sector area and arc length',sheet:R`A=\frac{\theta}{360^\circ}\pi r^2,\quad \ell=\frac{\theta}{360^\circ}2\pi r`,
 q:R`Complete the area of a sector with angle θ (in degrees).`,
 f:R`A=\boxed{\;?\;}\times\pi r^2`,
 o:[R`\frac{\theta}{360^\circ}`,R`\frac{\theta}{180^\circ}`,R`\theta`,R`\frac{\theta}{2\pi}`],om:1,a:0,
 why:R`A sector is the fraction \(\theta/360^\circ\) of the full circle. \(\theta/2\pi\) is right only when θ is in radians.`},
G({id:'polyang',t:'geo',u:'plane',lv:1,k:'mcq',name:'Angles of a regular polygon',sheet:R`\text{exterior}=\frac{360^\circ}{n},\quad\text{interior}=180^\circ-\frac{360^\circ}{n}`,
 gen: r => { const n = pk(r,[5,6,8,9,10,12,15,18,20,24,36]), X = 180 - 360/n;
   return {p:{X}, q:R`Each interior angle of a regular polygon is ${X}°. How many sides does it have?`,
     o: opts(n, [Math.round(360/X), n + 2, n - 2, 2*(n - 2)], N, 1),
     why:R`Exterior angle \(=180^\circ-${X}^\circ=${180 - X}^\circ\), and the exterior angles add to 360°: \(n=360/${180 - X}=${n}\).`}; }}),
G({id:'inscribed',t:'geo',u:'plane',lv:2,k:'mcq',name:'Inscribed angle theorem',sheet:R`\angle\text{at centre}=2\times\angle\text{at circumference}`,
 gen: r => { const th = 5*ri(r,4,17), v = 2*th;
   return {p:{th}, q:R`P, Q, R lie on a circle with centre O, and \(\angle PQR=${th}^\circ\) (Q on the major arc). Find \(\angle POR\).`,
     o: opts(v, [th, 180 - th, 90 + th/2, 360 - 2*th], x => inr(rd(x)) + '°', 5),
     why:R`The angle at the centre is twice the angle at the circumference on the same arc: \(2\times${th}^\circ=${v}^\circ\). For \(\angle PQR=45^\circ\), \(\angle POR=90^\circ\) and triangle POR has area \(r^2/2\).`}; }}),
G({id:'simtri',t:'geo',u:['plane','scale'],lv:3,k:'mcq',name:'Areas cut by a parallel line',sheet:R`\frac{[\triangle PST]}{[\triangle PQR]}=\left(\frac{h_1}{h}\right)^2`,
 gen: r => { const [k, m] = pk(r,[[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5]]), v = k*k/(m*m - k*k);
   return {p:{k,m}, q:R`In triangle PQR, a line ST (S on PQ, T on PR) is parallel to QR. The distance from P to ST is \(\tfrac{${k}}{${m}}\) of the distance from P to QR. Find area(PST) : area(trapezium SQRT).`,
     o: opts(v, [k/(m - k), k*k/(m*m), k/m, (k*k)/(m - k)**2], F, 0.1),
     why:R`The triangles are similar with ratio \(${k}/${m}\), so their areas are in ratio \(${k*k}:${m*m}\). The trapezium is the rest: \(${k*k}:${m*m - k*k}\).`}; }}),
G({id:'rectsq',t:'geo',u:'plane',lv:3,k:'mcq',name:'Rectangle through a square’s corner',sheet:R`\text{a triangle and a parallelogram on the same base and between the same parallels: }[\triangle]=\tfrac12[\square]`,
 gen: r => { const s = ri(r,2,9), v = s*s;
   return {p:{s}, q:R`PQRS is a square of side ${s} cm. PLMN is a rectangle with L on side QR, and side MN passes through S. What is the area of PLMN?`,
     o: opts(v, [v/2, 2*v, s*(s + 1)], U('cm²'), 2),
     why:R`Triangle PLS has base PL and height = PN (S lies on MN), so it is half the rectangle. It also has base PS and height = side of the square, so it is half the square. Hence both areas are \(${s}^2=${v}\).`}; }}),

{id:'volf',t:'geo',u:'solid',lv:1,k:'fill',name:'Volumes of solids',sheet:R`V_{\text{cyl}}=\pi r^2h,\ V_{\text{cone}}=\tfrac13\pi r^2h,\ V_{\text{sphere}}=\tfrac43\pi r^3`,
 q:R`Complete the volume of a cone.`,
 f:R`V_{\text{cone}}=\boxed{\;?\;}\,\pi r^2h`,
 o:[R`\frac13`,R`\frac12`,R`\frac43`,R`1`],om:1,a:0,
 why:R`A cone holds a third of the cylinder with the same base and height. \(\tfrac43\) belongs to the sphere \(\tfrac43\pi r^3\).`},
G({id:'sheettube',t:'geo',u:'solid',lv:3,k:'mcq',name:'Rolling a sheet into a tube',sheet:R`2\pi r=\text{edge rolled};\ V=\pi r^2h`,
 gen: r => { let s, a, b; do { s = ri(r,2,6); const A = 6*s*s; b = pk(r,[2,3,4,6]); a = A/b; } while (!Number.isInteger(a) || a <= b);
   const v = b*b*a/(4*s**3);
   return {p:{a,b,s}, q:R`A ${a} cm × ${b} cm sheet is rolled so that its two longer edges meet, forming a tube ${a} cm long. A cube has surface area equal to the sheet’s area. Find (volume of tube) / (volume of cube).`,
     o: opts(v, [a*a*b/(4*s**3), v*2, v/2], x => { const [n, d] = frac(x); return n === 1 && d === 1 ? R`\(\tfrac{1}{\pi}\)` : R`\(\tfrac{${n}}{${d === 1 ? '' : d}\pi}\)`; }, 0.25),
     why:R`The ${b} cm edge becomes the circumference: \(r=\tfrac{${b}}{2\pi}\), so \(V=\pi r^2\times${a}=\tfrac{${b*b*a}}{4\pi}\). The cube has \(6s^2=${a*b}\Rightarrow s=${s}\), \(V=${s**3}\). Ratio \(=\tfrac{${b*b*a}}{${4*s**3}\pi}\).`}; }}),
G({id:'melt',t:'geo',u:['solid','scale'],lv:2,k:'mcq',name:'Melting and recasting',sheet:R`\text{volume is conserved: }\#=\left(\frac{R}{r}\right)^3`,
 gen: r => { const k = ri(r,2,6), rr = ri(r,1,3), R_ = k*rr, v = k**3;
   return {p:{R:R_,r:rr}, q:R`A metal sphere of radius ${R_} cm is melted and recast into spheres of radius ${rr} cm. How many small spheres are made?`,
     o: opts(v, [k*k, k, 3*k, 4*k], N, 2),
     why:R`Volume scales with the cube of the radius: \((${R_}/${rr})^3=${v}\).`}; }}),
{id:'dcone',t:'geo',u:'solid',lv:2,k:'mcq',name:'Cross-section of a double cone',sheet:R`\text{plane through both apexes of two base-to-base cones}\Rightarrow\text{rhombus}`,
 q:R`Two identical right circular cones are joined base to base. A plane passes through both apexes. The cross-section is:`,
 o:[R`A rhombus`,R`A triangle`,R`An ellipse`,R`A hexagon`],a:0,
 why:R`The plane contains the common axis, cutting each cone in an isosceles triangle on the same base (a diameter). Two such triangles back to back form a rhombus with all sides equal to the slant height.`},

{id:'scalef',t:'geo',u:'scale',lv:1,k:'fill',name:'Scaling lengths',sheet:R`\text{lengths}\times k\Rightarrow\text{area}\times k^2,\ \text{volume}\times k^3`,
 q:R`Every length of a solid is multiplied by k. Its volume is multiplied by:`,
 f:R`\boxed{\;?\;}`,
 o:[R`k^3`,R`k^2`,R`k`,R`3k`],om:1,a:0,
 why:R`Volume has three length dimensions. Doubling all lengths gives 8 times the volume and 4 times the surface area.`},
G({id:'areachg',t:'geo',u:['scale','pct'],lv:2,k:'mcq',name:'Change in area of a rectangle',sheet:R`\text{area \% change}=a+b+\frac{ab}{100}`,
 gen: r => { const a = pk(r,[10,20,25,30,40,50]), b = pk(r,[10,20,25,30,40]), v = a - b - a*b/100;
   return {p:{a,b}, q:R`The length of a rectangle is increased by ${a}% and its width is decreased by ${b}%. What happens to its area?`,
     o: opts(v, [a - b, a - b + a*b/100, -a*b/100], CHG, 1),
     why:R`\((1+${a/100})(1-${b/100})=${rd((1 + a/100)*(1 - b/100), 4)}\), a ${CHG(v).toLowerCase()}.`}; }}),
G({id:'radinc',t:'geo',u:'scale',lv:2,k:'mcq',name:'Increasing a radius',sheet:R`r\to(1+p)r\Rightarrow\text{area}\times(1+p)^2,\ \text{volume}\times(1+p)^3`,
 gen: r => { const p = pk(r,[10,20,50,100]), vol = r() < 0.5, f = (1 + p/100)**(vol ? 3 : 2), v = 100*(f - 1);
   return {p:{p,vol}, q:R`The radius of a ${vol ? 'sphere' : 'circle'} is increased by ${p}%. By what percentage does its ${vol ? 'volume' : 'area'} increase?`,
     o: opts(v, [p, 2*p, 3*p, 100*((1 + p/100)**(vol ? 2 : 3) - 1)], P, 5),
     why:R`\((1+${p/100})^{${vol ? 3 : 2}}=${rd(f, 4)}\), an increase of ${rd(v)}%.`}; }}),
{id:'wplus',t:'geo',u:'scale',lv:2,k:'mcq',name:'Changing one side of a rectangle',sheet:R`\text{area}\propto\text{each side; perimeter and diagonal are not}`,
 q:R`A rectangle has length L greater than width W. If W is increased by 10%, which statement holds for all L and W?`,
 o:[R`The area increases by 10%`,R`The perimeter increases by 10%`,R`The diagonal increases by 10%`,R`The rectangle becomes a square`],a:0,
 why:R`Area = LW is proportional to W. The perimeter \(2(L+W)\) and the diagonal \(\sqrt{L^2+W^2}\) grow by less than 10% because L is unchanged.`},

/* ================= DATA INTERPRETATION ================= */
G({id:'salestab',t:'di',u:'ditab',lv:2,k:'mcq',name:'Percentage change from a table',sheet:R`\%\text{ change}=\frac{\text{new}-\text{old}}{\text{old}}\times100`,
 gen: r => { let a, b, A, B; do { a = [ri(r,20,80), ri(r,20,80), ri(r,20,80)]; b = a.map(x => x + ri(r,-10,30)); A = a.reduce((s,x) => s + x, 0); B = b.reduce((s,x) => s + x, 0); } while (A === B);
   const v = 100*(B - A)/A, avgPct = a.reduce((s,x,i) => s + 100*(b[i] - x)/x, 0)/3;
   return {p:{a,b}, q:R`Sales (₹ crore) of a company’s three products:${table(['Product','2023','2024'],[['P',a[0],b[0]],['Q',a[1],b[1]],['R',a[2],b[2]]])}By what percentage did total sales change from 2023 to 2024?`,
     o: opts(v, [B - A, avgPct, 100*(B - A)/B], CHG, 2),
     why:R`Totals: ${A} → ${B}. Change \(=\tfrac{${B - A}}{${A}}\times100\approx${rd(v)}\%\). Averaging the three product percentages is wrong because the products have different sizes.`}; }}),
G({id:'mfund',t:'di',u:['ditab','pct'],lv:3,k:'mcq',name:'Unknown rate of return from a table',sheet:R`\text{gain}=\sum\text{amount}\times\text{rate};\ \text{set up one equation in the unknown rate}`,
 gen: r => { let a1, b1, c1, a2, b2, c2, x, rr, d;
   do { a1 = 5*ri(r,1,6); b1 = 5*ri(r,1,6); c1 = 5*ri(r,1,6); a2 = 5*ri(r,1,6); b2 = 5*ri(r,1,6); c2 = a1 + b1 + c1 - a2 - b2; x = pk(r,[5,7.5,10,12,20]); rr = pk(r,[10,12,15]); d = 10*((a1 - a2)*x + (b1 + c1 - b2 - c2)*rr); }
   while (c2 < 5 || c2 > 30 || a1 === a2 || d === 0 || x === rr);
   const k = v => `₹${v},000`;
   return {p:{a1,b1,c1,a2,b2,c2,rr,d}, q:R`Two people invest in mutual funds A, B and C:${table(['','Fund A','Fund B','Fund C'],[['Person 1',k(a1),k(b1),k(c1)],['Person 2',k(a2),k(b2),k(c2)]])}After one year, Person 1’s total is ₹${inr(Math.abs(d))} ${d > 0 ? 'more' : 'less'} than Person 2’s. Funds B and C each returned ${rr}%. What did fund A return?`,
     o: opts(x, [rr, x + 2.5, x - 2.5, x*2], P, 2.5),
     why:R`Both invested ₹${a1 + b1 + c1},000, so only the gains differ: \(1000[(${a1}-${a2})x+(${b1 + c1}-${b2 + c2})\tfrac{${rr}}{100}]=${d}\) gives \(x=${x}\%\).`}; }}),
{id:'ppoints',t:'di',u:['ditab','dipie'],lv:2,k:'mcq',name:'Percent vs percentage points',sheet:R`20\%\to30\%:\ +10\text{ percentage points}=+50\%\ \text{relative}`,
 q:R`A party’s vote share rises from 20% to 30%. Which statement is correct?`,
 o:[R`It rose by 10 percentage points, which is a 50% increase`,R`It rose by 10%, which is 10 percentage points`,R`It rose by 50 percentage points`,R`It rose by 33.3%`],a:0,
 why:R`The difference of two percentages is in percentage points (30 − 20 = 10). The relative change is \(10/20=50\%\). 33.3% would be the fall going from 30% back to 20%.`},
G({id:'votes',t:'di',u:['dipie','pct'],lv:2,k:'mcq',name:'Pie chart of valid votes',sheet:R`\text{count}=\text{share}\times\text{the base the chart is drawn on}`,
 gen: r => { let s; do { s = [ri(r,2,10), ri(r,2,10), ri(r,2,10)].map(x => 5*x); } while (s[0] + s[1] + s[2] >= 95);
   s.push(100 - s[0] - s[1] - s[2]); const T = 5000*ri(r,15,40), I = 1000*ri(r,2,9), Vd = T - I, v = Vd*(s[1] + s[2])/100;
   return {p:{T,I,s}, q:R`${inr(T)} votes were cast in an election, of which ${inr(I)} were invalid. The valid votes were shared:${table(['Candidate','A','B','C','D'],[['Share of valid votes',...s.map(x => x + '%')]])}How many votes did B and C get together?`,
     o: opts(v, [T*(s[1] + s[2])/100, Vd*s[1]/100, I*(s[1] + s[2])/100 + v/2], N, 1000),
     why:R`The chart is of valid votes: \(${inr(T)}-${inr(I)}=${inr(Vd)}\). B + C \(=${s[1] + s[2]}\%\) of that \(=${inr(v)}\).`}; }}),
G({id:'pieshift',t:'di',u:['dipie','pct'],lv:2,k:'mcq',name:'Change in a combined share',sheet:R`\text{relative change}=\frac{s_2-s_1}{s_1}\times100\%`,
 gen: r => { let h1, s1, w1, h2, s2, w2; do { h1 = 5*ri(r,2,8); s1 = 5*ri(r,1,4); w1 = 5*ri(r,1,4); h2 = 5*ri(r,2,8); s2 = 5*ri(r,1,6); w2 = 5*ri(r,1,6); } while (h2 + s2 + w2 <= h1 + s1 + w1 || h1 + s1 + w1 > 60 || h2 + s2 + w2 > 80);
   const A = h1 + s1 + w1, B = h2 + s2 + w2, v = 100*(B - A)/A;
   return {p:{A,B}, q:R`Shares of total electricity generation (the total is the same in both years):${table(['Source','2010','2024'],[['Hydro',h1 + '%',h2 + '%'],['Solar',s1 + '%',s2 + '%'],['Wind',w1 + '%',w2 + '%'],['Other',(100 - A) + '%',(100 - B) + '%']])}By what percentage did the share of renewables (hydro + solar + wind) increase?`,
     o: opts(v, [B - A, 100*(B - A)/B, 100*(B - A)/(100 - A)], P, 5),
     why:R`Renewables: ${A}% → ${B}%. That is \(${B - A}\) percentage points, a relative increase of \(\tfrac{${B - A}}{${A}}\times100\approx${rd(v)}\%\).`}; }}),
G({id:'pieangle',t:'di',u:'dipie',lv:1,k:'mcq',name:'Pie-chart angles',sheet:R`\text{angle}=3.6^\circ\times\text{percentage}`,
 gen: r => { const p = 5*ri(r,1,14), toAngle = r() < 0.5, v = toAngle ? 3.6*p : p;
   return {p:{p,toAngle}, q: toAngle ? R`A category is ${p}% of a pie chart. What is the angle of its sector?` : R`A pie-chart sector has an angle of ${rd(3.6*p)}°. What percentage of the total does it show?`,
     o: toAngle ? opts(v, [p, 3*p, 1.8*p], x => inr(rd(x)) + '°', 9) : opts(v, [3.6*p/3, 3.6*p/2, p/3.6*10], P, 5),
     why: toAngle ? R`\(${p}\times3.6^\circ=${rd(3.6*p)}^\circ\) (100% = 360°).` : R`\(${rd(3.6*p)}/3.6=${p}\%\) (360° = 100%).`}; }}),
G({id:'piegrams',t:'di',u:'dipie',lv:2,k:'mcq',name:'From energy share to grams',sheet:R`\text{grams}=\frac{\text{share}\times\text{total kcal}}{\text{kcal per gram}}`,
 gen: r => { const D = pk(r,[1800,2000,2400,2700,3600]), f = 5*ri(r,4,9), dens = 9, v = D*f/100/dens;
   return {p:{D,f}, q:R`In a ${inr(D)} kcal daily diet, fats supply ${f}% of the energy. Fat gives 9 kcal per gram. How many grams of fat is that?`,
     o: opts(v, [D*f/100, D*f/100/4, D/dens], U('g'), 10),
     why:R`Fat energy \(=${f}\%\times${D}=${D*f/100}\) kcal; at 9 kcal/g that is \(${D*f/100}/9\approx${rd(v)}\) g.`}; }}),

/* ================= NUMERICAL REASONING ================= */
{id:'clockf',t:'nr',u:'clock',lv:1,k:'fill',name:'Angle between clock hands',sheet:R`\theta=|30H-5.5M|\ (\text{take }360^\circ-\theta\text{ if above }180^\circ)`,
 q:R`At H hours M minutes, the angle between the hands is:`,
 f:R`\theta=\left|30H-\boxed{\;?\;}\,M\right|`,
 o:[R`5.5`,R`6`,R`0.5`,R`5`],om:1,a:0,
 why:R`The minute hand moves 6° per minute and the hour hand 0.5° per minute, so their gap changes by 5.5° per minute.`},
G({id:'clockang',t:'nr',u:'clock',lv:2,k:'mcq',name:'Angle between clock hands',sheet:R`\theta=|30H-5.5M|`,
 gen: r => { const H = ri(r,1,12), M = ri(r,10,59); let v = Math.abs(30*(H % 12) - 5.5*M); if (v > 180) v = 360 - v;
   let w = Math.abs(30*(H % 12) - 6*M); if (w > 180) w = 360 - w;
   return {p:{H,M}, q:R`What is the smaller angle between the hour and minute hands of a clock at ${H}:${String(M).padStart(2,'0')}?`,
     o: opts(v, [w, 360 - v, Math.abs(v - 30) === v ? v + 15 : Math.abs(v - 30)], x => inr(rd(x)) + '°', 2.5),
     why:R`\(|30\times${H % 12}-5.5\times${M}|=${rd(Math.abs(30*(H % 12) - 5.5*M))}^\circ\)${Math.abs(30*(H % 12) - 5.5*M) > 180 ? R`, and the smaller angle is \(360^\circ-\) that \(=${rd(v)}^\circ\)` : ''}. The hour hand keeps moving (0.5° per minute), so it isn’t at the ${H % 12 || 12} mark.`}; }}),
G({id:'mirror',t:'nr',u:['clock','transform'],lv:2,k:'mcq',name:'Mirror image of a clock',sheet:R`\text{mirror time}=11{:}60-\text{actual time}`,
 gen: r => { const H = ri(r,1,11), M = ri(r,1,59), t = 60*H + M, mt = 720 - t, fm = x => { x = ((x % 720) + 720) % 720; const h = Math.floor(x/60) || 12, m = x % 60; return `${h}:${String(m).padStart(2,'0')}`; };
   const c = fm(mt);
   return {p:{H,M}, q:R`A clock shows ${H}:${String(M).padStart(2,'0')}. What time does its image in a vertical mirror appear to show?`,
     o: sopts(c, [fm(60*(12 - H) + M), fm(60*H + (60 - M)), fm(mt + 60), fm(mt - 60), fm(mt + 30), fm(mt + 120)]),
     why:R`Subtract from 11:60 (i.e. 12:00): \(11{:}60-${H}{:}${String(M).padStart(2,'0')}=${c}\). The minute hand reflects to 60 − M and the hour hand reflects too.`}; }}),
G({id:'coincide',t:'nr',u:'clock',lv:2,k:'mcq',name:'When the hands coincide',sheet:R`\text{together at }\frac{60H}{11}=5H\cdot\frac{12}{11}\text{ min past }H`,
 gen: r => { const H = ri(r,1,10), v = 60*H/11;
   return {p:{H}, q:R`Between ${H} o’clock and ${H + 1} o’clock, how many minutes past ${H} are the hands of a clock exactly together?`,
     o: opts(v, [5*H, 5*H + 5, 60*(H + 1)/11], x => MX(x) + ' min', 1),
     why:R`The minute hand must gain \(30\times${H}=${30*H}^\circ\) at 5.5° per minute: \(${30*H}/5.5=${MX(v).replace(/\\\(|\\\)/g,'')}\) minutes. (The hands coincide 11 times in 12 hours.)`}; }}),

{id:'leapyr',t:'nr',u:'calendar',lv:1,k:'mcq',name:'Leap-year rule',sheet:R`\text{leap}\iff 4\mid y\ \text{and}\ (100\nmid y\ \text{or}\ 400\mid y)`,
 q:R`Which of these years is a leap year?`,
 o:[R`2000`,R`1900`,R`2100`,R`1800`],a:0,
 why:R`Century years are leap years only if divisible by 400. 2000 is; 1800, 1900 and 2100 are not.`},
{id:'oddday',t:'nr',u:'calendar',lv:1,k:'mcq',name:'Odd days',sheet:R`365=52\cdot7+1,\ 366=52\cdot7+2:\ \text{a date shifts 1 weekday per year, 2 across a 29 Feb}`,
 q:R`15 June 2025 is a Sunday. What day is 15 June 2026?`,
 o:[R`Monday`,R`Sunday`,R`Tuesday`,R`Saturday`],a:0,
 why:R`No 29 February falls between the two dates, so there are 365 days = 52 weeks + 1 day: one weekday later.`},
G({id:'dayafter',t:'nr',u:'calendar',lv:1,k:'mcq',name:'Day after N days',sheet:R`\text{shift}=N\bmod7`,
 gen: r => { const W = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], d = ri(r,0,6), n = ri(r,30,400), v = W[(d + n) % 7];
   return {p:{d,n}, q:R`Today is ${W[d]}. What day of the week will it be ${n} days from today?`,
     o: sopts(v, [W[(d + n + 1) % 7], W[(d + n + 6) % 7], W[(d + n + 2) % 7]]),
     why:R`\(${n}=7\times${Math.floor(n/7)}+${n % 7}\), so move ${n % 7} day${n % 7 === 1 ? '' : 's'} on from ${W[d]}: ${v}.`}; }}),
G({id:'nextyear',t:'nr',u:'calendar',lv:2,k:'mcq',name:'Same date next year',sheet:R`+1\text{ weekday; }+2\text{ if a 29 Feb lies in between}`,
 gen: r => { const W = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
   const Y = ri(r,1995,2035), m = ri(r,0,11), dd = ri(r,1,28), w0 = new Date(Date.UTC(Y, m, dd)).getUTCDay(), w1 = new Date(Date.UTC(Y + 1, m, dd)).getUTCDay(), sh = (w1 - w0 + 7) % 7;
   return {p:{Y,m:m + 1,d:dd}, q:R`${dd} ${MN[m]} ${Y} was a ${W[w0]}. What day of the week was ${dd} ${MN[m]} ${Y + 1}?`,
     o: sopts(W[w1], [W[(w0 + (sh === 1 ? 2 : 1)) % 7], W[w0], W[(w0 + 6) % 7]]),
     why:R`From ${dd} ${MN[m]} ${Y} to ${dd} ${MN[m]} ${Y + 1} is ${sh === 2 ? 366 : 365} days${sh === 2 ? ' (a 29 February lies in between)' : ''}, i.e. 52 weeks + ${sh} day${sh === 1 ? '' : 's'}: ${W[w1]}.`}; }}),

G({id:'ageratio',t:'nr',u:['ages','ratio'],lv:2,k:'mcq',name:'Ages in a ratio',sheet:R`\text{set ages }ak,\,bk;\ \frac{ak+n}{bk+n}=\frac cd`,
 gen: r => { let a, b, k, n, c, d, g;
   do { a = ri(r,1,5); b = ri(r,a + 1,8); k = ri(r,2,9); n = ri(r,2,12); g = gcd(a*k + n, b*k + n); c = (a*k + n)/g; d = (b*k + n)/g; } while (gcd(a,b) !== 1 || c > 25 || d > 25 || a*k < 4);
   return {p:{a,b,k,n}, q:R`The ages of Asha and her uncle are in the ratio ${a} : ${b}. After ${n} years the ratio will be ${c} : ${d}. How old is Asha now?`,
     o: opts(a*k, [b*k, a*k + n, a*(k + 1), c], U('years'), a),
     why:R`Let the ages be ${a}k and ${b}k: \(\tfrac{${a}k+${n}}{${b}k+${n}}=\tfrac{${c}}{${d}}\Rightarrow k=${k}\). Asha is ${a*k}.`}; }}),
G({id:'fatherson',t:'nr',u:'ages',lv:2,k:'mcq',name:'Multiples of ages',sheet:R`ks+n=m(s+n)\Rightarrow s=\frac{n(m-1)}{k-m}`,
 gen: r => { let s, k, n, m; do { s = ri(r,4,15); k = ri(r,3,6); n = ri(r,3,20); m = (k*s + n)/(s + n); } while (!Number.isInteger(m) || m < 2 || m >= k);
   return {p:{k,n,m}, q:R`A father is ${k} times as old as his son. In ${n} years he will be ${m} times as old as the son. How old is the son now?`,
     o: opts(s, [s + n, k*s, n*(m - 1)/(k - m + 1), s + 2], U('years'), 1),
     why:R`\(${k}s+${n}=${m}(s+${n})\Rightarrow${k - m}s=${n*(m - 1)}\Rightarrow s=${s}\). Check: father ${k*s}; in ${n} years ${k*s + n} = ${m} × ${s + n}.`}; }}),
{id:'agediff',t:'nr',u:'ages',lv:1,k:'mcq',name:'Age differences are fixed',sheet:R`\text{difference of ages is constant; their ratio moves towards 1}`,
 q:R`A mother is 30 years older than her daughter. Which statement is true as the years pass?`,
 o:[R`The difference stays 30 and the ratio of their ages keeps falling towards 1`,R`The difference and the ratio both stay the same`,R`The ratio stays the same and the difference grows`,R`The difference shrinks as the daughter grows up`],a:0,
 why:R`Both add one year at a time, so the gap is fixed. The ratio \((d+30)/d\) decreases as d grows.`},

/* ================= SPATIAL APTITUDE ================= */
{id:'rotref',t:'spatial',u:'transform',lv:2,k:'mcq',name:'Rotation then reflection',sheet:R`\text{rotate }90^\circ\text{ then reflect in a horizontal line}=\text{reflection in a diagonal}`,
 q:R`A figure is rotated 90° clockwise and then reflected in a horizontal line. The combined result is the same as:`,
 o:[R`A single reflection in a diagonal line`,R`A rotation by 90° anticlockwise`,R`A rotation by 180°`,R`A reflection in a vertical line`],a:0,
 why:R`A rotation followed by a reflection reverses orientation, so the result is a reflection. Track the point (1, 0): rotate → (0, −1), reflect → (0, 1). So x-axis points go to the y-axis: a reflection in the line y = x.`},
{id:'tworef',t:'spatial',u:'transform',lv:2,k:'mcq',name:'Two reflections',sheet:R`\text{two reflections in lines meeting at }\theta=\text{rotation by }2\theta`,
 q:R`A figure is reflected in a line, and then in a second line meeting the first at 45°. The result is:`,
 o:[R`A rotation by 90° about the intersection point`,R`A rotation by 45°`,R`A reflection in the bisector of the two lines`,R`The original figure, unchanged`],a:0,
 why:R`Two reflections keep orientation, so the result is a rotation, by twice the angle between the lines. Parallel mirrors give a translation instead.`},
{id:'mirrorword',t:'spatial',u:'transform',lv:2,k:'mcq',name:'Words unchanged in a mirror',sheet:R`\text{needs vertically symmetric letters (A H I M O T U V W X Y) and a palindrome}`,
 q:R`Which word looks exactly the same in a vertical mirror placed beside it?`,
 o:[R`OTTO`,R`NOON`,R`LEVEL`,R`RADAR`],a:0,
 why:R`A mirror reverses the order of the letters and flips each letter. OTTO is a palindrome made only of symmetric letters. N, L, E, D and R change when flipped.`},
G({id:'symm',t:'spatial',u:'transform',lv:1,k:'mcq',name:'Symmetry of regular polygons',sheet:R`\text{regular }n\text{-gon: }n\text{ lines of symmetry, rotational order }n`,
 gen: r => { const n = ri(r,5,12), lines = r() < 0.5, NM = {5:'pentagon',6:'hexagon',7:'heptagon',8:'octagon',9:'nonagon',10:'decagon',11:'hendecagon',12:'dodecagon'};
   return {p:{n,lines}, q: lines ? R`How many lines of symmetry does a regular ${NM[n]} have?` : R`What is the smallest angle by which a regular ${NM[n]} can be rotated to look the same?`,
     o: lines ? opts(n, [n/2, 2*n, n - 1], N, 1) : opts(360/n, [180/n, 720/n, 180 - 360/n], x => inr(rd(x)) + '°', 5),
     why: lines ? R`A regular n-gon has n lines of symmetry (through vertices and/or midpoints of sides): ${n}.` : R`It has rotational symmetry of order ${n}: \(360^\circ/${n}=${rd(360/n)}^\circ\).`}; }}),

G({id:'foldper',t:'spatial',u:'fold',lv:2,k:'mcq',name:'Perimeter after folding',sheet:R`\text{each fold halves the current longer side; recheck which side is longer}`,
 gen: r => { let L, W, k, a, b; do { L = pk(r,[16,20,24,32,36,40]); W = pk(r,[4,6,8,10,12]); k = pk(r,[2,3]); } while (W >= L);
   a = L; b = W; const steps = []; for (let i = 0; i < k; i++){ if (a >= b) a /= 2; else b /= 2; steps.push(`${a} × ${b}`); }
   const v = 2*(a + b);
   return {p:{L,W,k}, q:R`A ${L} cm × ${W} cm sheet is folded ${k} times. Each fold is along the line of symmetry perpendicular to the current longer edge. What is the perimeter of the folded sheet?`,
     o: opts(v, [2*(L/2**k + W), 2*(L + W)/2**k, 2*(L + W)/k], U('cm'), 2),
     why:R`Sizes after each fold: ${steps.join(' → ')}. Perimeter \(=2(${a}+${b})=${v}\) cm. Watch for the long edge changing.`}; }}),
G({id:'holes',t:'spatial',u:'fold',lv:1,k:'mcq',name:'Holes through folded paper',sheet:R`\text{folded in half }k\text{ times}\Rightarrow2^k\text{ layers: each punch makes }2^k\text{ holes}`,
 gen: r => { const k = ri(r,1,4), h = ri(r,1,3), v = h*2**k;
   return {p:{k,h}, q:R`A square sheet is folded in half ${k} time${k > 1 ? 's' : ''}, and ${h} hole${h > 1 ? 's are' : ' is'} punched through all the layers. How many holes are there when it is unfolded?`,
     o: opts(v, [h*k, h*2*k, h*2**(k - 1), h*2**(k + 1)], N, 1),
     why:R`Each fold doubles the layers: \(2^{${k}}=${2**k}\) layers, so \(${h}\times${2**k}=${v}\) holes, mirrored across every fold line.`}; }}),
{id:'foldrule',t:'spatial',u:'fold',lv:2,k:'mcq',name:'Unfolding a cut',sheet:R`\text{a cut on folded paper is reflected across every fold line when unfolded}`,
 q:R`A square sheet is folded in half along its vertical centre line, then along its horizontal centre line. A small notch is cut at the folded corner (the centre of the original sheet). When unfolded, the sheet has:`,
 o:[R`One hole at the centre`,R`Four holes, one near each corner`,R`Two holes on the vertical centre line`,R`A notch on one edge only`],a:0,
 why:R`The folded corner is the centre of the sheet, where both fold lines meet. Reflecting the cut across both folds puts all four copies at the centre, making one hole.`},

{id:'opp7',t:'spatial',u:'dice',lv:1,k:'mcq',name:'Opposite faces of a standard die',sheet:R`\text{standard die: opposite faces add to 7}`,
 q:R`A standard die is placed with 2 on top and 3 facing you. Which number is on the bottom?`,
 o:[R`5`,R`4`,R`6`,R`1`],a:0,
 why:R`Opposite faces of a standard die add to 7, so the bottom is \(7-2=5\). The face toward you doesn’t change that.`},
{id:'netopp',t:'spatial',u:'dice',lv:2,k:'mcq',name:'Opposite faces in a cube net',sheet:R`\text{in a net, two squares with exactly one square between them in a straight line are opposite}`,
 q:R`A cube net has four squares in a row labelled P, Q, R, S, with T attached above Q and U attached below Q. Which face is opposite P?`,
 o:[R`R`,R`Q`,R`S`,R`T`],a:0,
 why:R`In a row of four, alternate squares are opposite: P–R and Q–S. T and U, on either side of the row, are opposite each other.`},
{id:'views',t:'spatial',u:'dice',lv:2,k:'mcq',name:'Opposite face from two views',sheet:R`\text{the face never seen next to X (in any view) is opposite X}`,
 q:R`Two views of a die with faces 1–6 show 1 next to 2 and 3 in one view, and 1 next to 4 and 5 in the other. Which number is opposite 1?`,
 o:[R`6`,R`2`,R`4`,R`Cannot be determined`],a:0,
 why:R`Faces 2, 3, 4 and 5 all touch 1, and a face has exactly four neighbours. The only face left, 6, must be opposite.`},

G({id:'paint',t:'spatial',u:'cubecut',lv:2,k:'mcq',name:'Painted cube cut into small cubes',sheet:R`n^3\text{ cubes: }3\text{ faces}=8,\ 2=12(n-2),\ 1=6(n-2)^2,\ 0=(n-2)^3`,
 gen: r => { const n = ri(r,3,8), kind = ri(r,0,3), vals = [(n - 2)**3, 6*(n - 2)**2, 12*(n - 2), 8], names = ['no painted face','exactly one painted face','exactly two painted faces','three painted faces'], v = vals[kind];
   return {p:{n,kind}, q:R`A wooden cube is painted on all faces and then cut into ${n**3} identical small cubes. How many small cubes have ${names[kind]}?`,
     o: opts(v, vals.filter((_,i) => i !== kind).concat([n**3 - v, 6*n]), N, 2),
     why:R`With \(n=${n}\): corners (3 faces) = 8, edges (2 faces) = \(12(n-2)=${12*(n - 2)}\), face centres (1 face) = \(6(n-2)^2=${6*(n - 2)**2}\), inside (none) = \((n-2)^3=${(n - 2)**3}\). They add to ${n**3}.`}; }}),
G({id:'mincut',t:'spatial',u:'cubecut',lv:2,k:'mcq',name:'Fewest cuts to dice a cube',sheet:R`n^3\text{ equal cubes (pieces not moved)}: 3(n-1)\text{ cuts}`,
 gen: r => { const n = ri(r,2,6), v = 3*(n - 1);
   return {p:{n}, q:R`A cube is to be cut into ${n**3} identical smaller cubes with straight cuts that go right through, without moving the pieces between cuts. What is the minimum number of cuts?`,
     o: opts(v, [n**3 - 1, 3*n, n - 1, 3*n*(n - 1)], N, 1),
     why:R`Each direction needs \(n-1=${n - 1}\) parallel cuts, and there are three directions: ${v}. For 8 pieces that is just 3 cuts.`}; }}),
{id:'maxpiece',t:'spatial',u:'cubecut',lv:2,k:'mcq',name:'Most pieces from three cuts',sheet:R`3\text{ plane cuts of a solid}\Rightarrow\text{at most }8\text{ pieces}`,
 q:R`What is the largest number of pieces a cake (a solid block) can be cut into with 3 straight plane cuts, without moving the pieces?`,
 o:[R`8`,R`6`,R`7`,R`9`],a:0,
 why:R`Three mutually crossing planes split space into 8 regions (like the 8 octants). On a flat 2D cake, 3 straight lines give at most 7 pieces.`},

{id:'fourcol',t:'spatial',u:'colour',lv:1,k:'mcq',name:'Four-colour theorem',sheet:R`\text{any flat map needs at most 4 colours (regions sharing an edge differ)}`,
 q:R`Regions of a flat map must be coloured so that regions sharing a border (not just a corner) differ. The fewest colours that always suffice for any such map is:`,
 o:[R`4`,R`3`,R`5`,R`6`],a:0,
 why:R`This is the four-colour theorem. Some maps need all 4 (e.g. one region surrounded by an odd ring of three regions), and no map needs 5.`},
G({id:'wheel',t:'spatial',u:'colour',lv:2,k:'mcq',name:'A region surrounded by a ring',sheet:R`\text{ring of }n\text{ around a centre: }n\text{ even}\Rightarrow3\text{ colours},\ n\text{ odd}\Rightarrow4`,
 gen: r => { const n = ri(r,3,9), v = n % 2 ? 4 : 3;
   return {p:{n}, q:R`A circular map has one central region surrounded by a ring of ${n} regions. Each ring region touches the centre and its two neighbours in the ring. What is the fewest number of colours needed?`,
     o: opts(v, [n % 2 ? 3 : 4, 2, n + 1 > 5 ? 5 : n + 1], N, 1),
     why:R`The centre needs its own colour. The ring is a cycle of ${n}: ${n % 2 ? 'an odd cycle needs 3 colours' : 'an even cycle can alternate 2 colours'}. Total ${v}.`}; }}),
{id:'strip',t:'spatial',u:'colour',lv:1,k:'mcq',name:'Colouring a strip and a grid',sheet:R`\text{chessboard-like grid (edge-adjacency only)}\Rightarrow2\text{ colours}`,
 q:R`A 4 × 4 grid of squares is to be coloured so that squares sharing an edge differ (corners may match). The fewest colours needed is:`,
 o:[R`2`,R`3`,R`4`,R`16`],a:0,
 why:R`Colour it like a chessboard. Squares sharing an edge always differ in colour; only diagonal neighbours share one.`},

/* ================= LOGICAL REASONING ================= */
{id:'contrary',t:'logic',u:'syllog',lv:2,k:'mcq',tx:1,name:'Statements that cannot both be true',sheet:R`<i>All S are P</i> and <i>No S is P</i> cannot both be true (if any S exists), but both can be false. <i>Some S are P</i> and <i>Some S are not P</i> can both be true.`,
 q:R`Consider: (1) All managers are punctual. (2) Some managers are punctual. (3) No manager is punctual. (4) Some managers are not punctual. Assuming at least one manager exists, which two statements CANNOT both be true?`,
 o:[R`(1) and (3)`,R`(1) and (2)`,R`(2) and (4)`,R`(3) and (4)`],a:0,
 why:R`If every manager is punctual, it can’t be that none is. (1) implies (2); (2) and (4) can both hold; (3) implies (4).`},
{id:'contradict',t:'logic',u:'syllog',lv:2,k:'mcq',tx:1,name:'Contradictory statements',sheet:R`Exactly one of each pair is true: <i>All S are P</i> vs <i>Some S are not P</i>; <i>No S is P</i> vs <i>Some S are P</i>.`,
 q:R`For which pair is it certain that exactly one statement is true?`,
 o:[R`“All cars are electric” and “Some cars are not electric”`,R`“All cars are electric” and “No car is electric”`,R`“Some cars are electric” and “Some cars are not electric”`,R`“No car is electric” and “Some cars are not electric”`],a:0,
 why:R`A statement and its exact negation are contradictories. “Some are not” is precisely the negation of “all are”. The other pairs can be both false or both true.`},
{id:'syll1',t:'logic',u:'syllog',lv:2,k:'mcq',tx:1,name:'A valid syllogism',sheet:R`<i>All A are B</i> + <i>Some C are A</i> ⇒ <i>Some C are B</i>. Draw a Venn diagram: the overlap of C with A sits inside B.`,
 q:R`All poets are dreamers. Some engineers are poets. Which conclusion follows for certain?`,
 o:[R`Some engineers are dreamers`,R`All engineers are dreamers`,R`All dreamers are poets`,R`No conclusion follows`],a:0,
 why:R`The engineers who are poets are inside “poets”, which is inside “dreamers”. Nothing is known about the other engineers, and “all A are B” can’t be reversed.`},
{id:'syll2',t:'logic',u:'syllog',lv:3,k:'mcq',tx:1,name:'An invalid syllogism',sheet:R`<i>All A are B</i> + <i>Some B are C</i> ⇒ no conclusion about A and C (the C part of B may miss A entirely).`,
 q:R`All squares are rectangles. Some rectangles are red. Which conclusion follows for certain?`,
 o:[R`Nothing definite follows about squares and red`,R`Some squares are red`,R`No square is red`,R`Some red things are squares`],a:0,
 why:R`The red rectangles could all be non-squares, or some could be squares. A possible conclusion is not a certain one.`},

G({id:'revshift',t:'logic',u:'code',lv:2,k:'mcq',name:'Reverse-and-shift codes',sheet:R`\text{test simple rules on the example: shift each letter, reverse, or both}`,
 gen: r => { const W = ['PLANT','RIVER','CLOUD','STONE','LIGHT','BRAIN','MANGO','TRAIN','HOUSE','DREAM','GLASS','WATER','CHAIR','BREAD'];
   const sh = (w,k) => w.split('').map(ch => String.fromCharCode((ch.charCodeAt(0) - 65 + k + 26) % 26 + 65)).join(''), rev = w => w.split('').reverse().join('');
   const [E, T] = shuf(r, W).slice(0,2), k = pk(r,[1,2,-1]), code = w => sh(rev(w), k);
   return {p:{E,T,k}, q:R`In a code, ${E} is written as ${code(E)}. How is ${T} written in that code?`,
     o: sopts(code(T), [sh(T,k), sh(rev(T), k + (k === 1 ? 1 : -1)), rev(T), sh(rev(T), -k), sh(T, -k), sh(rev(T), 3*k)]),
     why:R`${E} reversed is ${rev(E)}; shifting each letter ${Math.abs(k)} place${Math.abs(k) > 1 ? 's' : ''} ${k > 0 ? 'forward' : 'back'} gives ${code(E)}. Same for ${T}: ${rev(T)} → ${code(T)}.`}; }}),
G({id:'opposite',t:'logic',u:'code',lv:2,k:'mcq',name:'Opposite-letter codes',sheet:R`\text{opposite letters: A}\leftrightarrow\text{Z, B}\leftrightarrow\text{Y, ... (positions add to 27)}`,
 gen: r => { const W = ['GATE','CODE','MATH','DATA','WORD','PLAN','TIME','BOLD','FIRE','KING','SNOW','RAIN'];
   const op = w => w.split('').map(ch => String.fromCharCode(90 - (ch.charCodeAt(0) - 65))).join(''), sh = (w,k) => w.split('').map(ch => String.fromCharCode((ch.charCodeAt(0) - 65 + k + 26) % 26 + 65)).join('');
   const [E, T] = shuf(r, W).slice(0,2);
   return {p:{E,T}, q:R`In a code, ${E} is written as ${op(E)}. How is ${T} written?`,
     o: sopts(op(T), [sh(op(T),1), op(T).split('').reverse().join(''), sh(T,13), sh(op(T),-1)]),
     why:R`Each letter is replaced by its mirror in the alphabet (A↔Z, B↔Y, …; positions add to 27). ${T} → ${op(T)}.`}; }}),
G({id:'lettersum',t:'logic',u:'code',lv:1,k:'mcq',name:'Number codes from letter positions',sheet:R`\text{A}=1,\ \text{B}=2,\dots,\ \text{Z}=26;\ \text{try the sum of positions first}`,
 gen: r => { const W = ['CAT','BAG','DOG','PEN','SUN','MAP','BOX','CUP','HAT','KEY','FAN','JAR'], val = w => w.split('').reduce((s,ch) => s + ch.charCodeAt(0) - 64, 0);
   const [E1, E2, T] = shuf(r, W).slice(0,3), v = val(T);
   return {p:{T}, q:R`In a code, ${E1} = ${val(E1)} and ${E2} = ${val(E2)}. What is ${T}?`,
     o: opts(v, [v + 1, v - 1, v + 3, 2*v], N, 2),
     why:R`Add alphabet positions: ${T.split('').map(ch => `${ch}=${ch.charCodeAt(0) - 64}`).join(', ')}, total ${v}. Check it on both examples.`}; }}),

{id:'relchain',t:'logic',u:'relation',lv:2,k:'mcq',tx:1,name:'Chains of relations',sheet:R`Draw a family tree: generations in rows, ＋/− for gender. Don’t assume a gender the statements don’t give.`,
 q:R`Ravi is Meena’s brother. Meena is Kiran’s mother. Arun is Ravi’s father. Which statement must be true?`,
 o:[R`Arun is Kiran’s grandfather`,R`Ravi is Kiran’s father`,R`Kiran is Arun’s grandson`,R`Meena is Arun’s daughter-in-law`],a:0,
 why:R`Arun is the father of Ravi and of his sister Meena, so he is Kiran’s grandfather. Kiran’s gender is never given, so “grandson” need not be true.`},
{id:'relgender',t:'logic',u:'relation',lv:1,k:'mcq',tx:1,name:'What a relation does not tell you',sheet:R`“P is the brother of Q” fixes P’s gender only. Q may be male or female.`,
 q:R`“P is the brother of Q.” What can be concluded about Q?`,
 o:[R`Nothing about Q’s gender`,R`Q is male`,R`Q is female`,R`Q is younger than P`],a:0,
 why:R`The statement describes P (male sibling). Q could be a brother or a sister, older or younger.`},
{id:'relonly',t:'logic',u:'relation',lv:2,k:'mcq',tx:1,name:'“Only daughter of my mother”',sheet:R`“My mother’s only daughter”, said by a woman, is the speaker herself.`,
 q:R`Pointing to a young man, Sita says, “His mother is the only daughter of my mother.” How is Sita related to him?`,
 o:[R`She is his mother`,R`She is his aunt`,R`She is his sister`,R`She is his grandmother`],a:0,
 why:R`Sita is a daughter of her mother, and that mother has only one daughter, so it is Sita herself. Sita is his mother.`},

G({id:'walk',t:'logic',u:'direction',lv:2,k:'mcq',name:'Distance from the start',sheet:R`\text{net displacement}=\sqrt{(\Delta x)^2+(\Delta y)^2}`,
 gen: r => { const [dy, dx] = pk(r,[[3,4],[6,8],[5,12],[8,6],[4,3],[12,5],[9,12],[8,15]]), c = ri(r,2,10), a = c + dy, v = Math.hypot(dx, dy);
   return {p:{a,b:dx,c}, q:R`Anu walks ${a} km north, then ${dx} km east, then ${c} km south. How far is she from her starting point?`,
     o: opts(v, [a + dx + c, dx + dy, Math.hypot(a, dx), dx], U('km'), 1),
     why:R`Net north \(=${a}-${c}=${dy}\) km, net east \(=${dx}\) km: \(\sqrt{${dy}^2+${dx}^2}=${v}\) km (north-east of the start).`}; }}),
G({id:'turns',t:'logic',u:'direction',lv:1,k:'mcq',name:'Following turns',sheet:R`\text{right}=+90^\circ,\ \text{left}=-90^\circ,\ \text{about-turn}=180^\circ\ (\text{clockwise from N: E, S, W})`,
 gen: r => { const D = ['north','east','south','west'], T = [['right',1],['left',3],['turns around',2]];
   const s = ri(r,0,3), moves = [pk(r,T), pk(r,T), pk(r,T)], f = (s + moves.reduce((a,m) => a + m[1], 0)) % 4;
   const txt = moves.map(m => m[0] === 'turns around' ? 'turns around' : `turns ${m[0]}`).join(', then ');
   return {p:{s,m:moves.map(m => m[1])}, q:R`A man is facing ${D[s]}. He ${txt}. Which direction is he facing now?`,
     o: sopts(D[f], [D[(f + 2) % 4], D[(f + 1) % 4], D[(f + 3) % 4]]),
     why:R`Count quarter-turns clockwise: ${moves.map(m => m[1] === 3 ? '−1' : '+' + m[1]).join(' ')} from ${D[s]} gives ${D[f]}.`}; }}),
{id:'shadow',t:'logic',u:'direction',lv:2,k:'mcq',tx:1,name:'Shadows and the sun',sheet:R`Morning: sun in the east, shadows point west. Evening: sun in the west, shadows point east.`,
 q:R`Early in the morning, Rahul’s shadow falls to his right. Which direction is he facing?`,
 o:[R`South`,R`North`,R`East`,R`West`],a:0,
 why:R`In the morning the shadow points west. If west is on his right, he is facing south.`},

G({id:'knockout',t:'logic',u:'puzzle',lv:1,k:'mcq',name:'Matches in a knockout',sheet:R`\text{knockout with }n\text{ players: }n-1\text{ matches (each eliminates exactly one)}`,
 gen: r => { const n = ri(r,9,64), v = n - 1;
   return {p:{n}, q:R`${n} players enter a knockout tournament (byes allowed). How many matches are played to find the champion?`,
     o: opts(v, [n, Math.ceil(n/2), Math.ceil(Math.log2(n)), n/2 | 0], N, 2),
     why:R`Every match eliminates exactly one player, and all but the champion must be eliminated: ${n} − 1 = ${v}.`}; }}),
G({id:'roundrobin',t:'logic',u:'puzzle',lv:1,k:'mcq',name:'Matches in a round robin',sheet:R`\text{each pair plays once: }\binom n2`,
 gen: r => { const n = ri(r,5,14), twice = r() < 0.4, v = C(n,2)*(twice ? 2 : 1);
   return {p:{n,twice}, q:R`In a league of ${n} teams, every team plays every other team ${twice ? 'twice (home and away)' : 'exactly once'}. How many matches are played?`,
     o: opts(v, [n*n, n*(n - 1)*(twice ? 1 : 2), C(n,2)*(twice ? 1 : 2), n*(n - 1)/2 + n], N, 5),
     why:R`\(\binom{${n}}{2}=${C(n,2)}\) pairs${twice ? ', each playing twice' : ''}: ${v}.`}; }}),
G({id:'handshake',t:'logic',u:['puzzle','pnc'],lv:2,k:'mcq',name:'People from handshakes',sheet:R`\binom n2=H\Rightarrow n(n-1)=2H`,
 gen: r => { const n = ri(r,6,20), H = C(n,2);
   return {p:{H}, q:R`At a meeting, everyone shook hands with everyone else exactly once. There were ${H} handshakes. How many people were there?`,
     o: opts(n, [n + 1, n - 1, Math.round(Math.sqrt(H)), Math.round(Math.sqrt(2*H))], N, 2),
     why:R`\(n(n-1)/2=${H}\Rightarrow n(n-1)=${2*H}=${n}\times${n - 1}\), so \(n=${n}\).`}; }}),
{id:'winnerstays',t:'logic',u:'puzzle',lv:2,k:'mcq',tx:1,name:'Winner-stays games',sheet:R`If every game knocks out its loser, k games eliminate exactly k players.`,
 q:R`Four players play three games, one after another. The loser of each game drops out and the winner plays a player who has not yet played. How many players never lose a game?`,
 o:[R`1`,R`0`,R`2`,R`3`],a:0,
 why:R`Each game eliminates one player, so three games eliminate three of the four. Exactly one player (the last winner) never loses.`},

/* ================= VERBAL: GRAMMAR ================= */
{id:'svaneither',t:'gram',u:'sva',lv:2,k:'mcq',tx:1,name:'Either/or, neither/nor agreement',sheet:R`With <i>either…or</i> / <i>neither…nor</i> / <i>not only…but also</i>, the verb agrees with the subject nearer to it.`,
 q:R`Neither the manager nor the clerks ___ aware of the change.`,
 o:[R`were`,R`was`,R`is`,R`has been`],a:0,
 why:R`The nearer subject is “the clerks” (plural), so the verb is plural: “were”. Swap the order and it becomes “Neither the clerks nor the manager was…”.`},
{id:'svaeach',t:'gram',u:'sva',lv:1,k:'mcq',tx:1,name:'Each, every, either: singular',sheet:R`<i>Each, every, either, neither, everyone, anybody</i> take a singular verb, even when followed by “of + plural noun”.`,
 q:R`Each of the students ___ a laptop.`,
 o:[R`has`,R`have`,R`are having`,R`have been`],a:0,
 why:R`The subject is “each” (one at a time), not “students”. Ignore the “of …” phrase when matching the verb.`},
{id:'svaalong',t:'gram',u:'sva',lv:2,k:'mcq',tx:1,name:'Along with, as well as',sheet:R`<i>Along with, as well as, together with, in addition to, accompanied by</i> do not make a singular subject plural.`,
 q:R`The teacher, along with her students, ___ visiting the museum today.`,
 o:[R`is`,R`are`,R`were`,R`have`],a:0,
 why:R`The subject is “the teacher”; the phrase between commas is extra information. Only “and” joins subjects into a plural.`},
{id:'svanumber',t:'gram',u:'sva',lv:1,k:'mcq',tx:1,name:'A number of / the number of',sheet:R`<i>A number of</i> (= many) takes a plural verb; <i>the number of</i> (= the count) takes a singular verb.`,
 q:R`A number of errors ___ found in the report.`,
 o:[R`were`,R`was`,R`has`,R`is`],a:0,
 why:R`“A number of errors” means “several errors”, so plural. Compare: “The number of errors was small.”`},

{id:'tenseppc',t:'gram',u:'tense',lv:2,k:'mcq',tx:1,name:'Past perfect continuous',sheet:R`An action going on for a while <i>before</i> another past event: <i>had been + -ing</i> (“We had been waiting for an hour when…”).`,
 q:R`We ___ cricket for two hours when the lights went out.`,
 o:[R`had been playing`,R`have been playing`,R`would have been playing`,R`are playing`],a:0,
 why:R`The playing lasted up to a past moment (the lights going out), so it needs the past perfect continuous. “Have been” would tie it to now.`},
{id:'tensesince',t:'gram',u:'tense',lv:1,k:'mcq',tx:1,name:'Since and for with the present perfect',sheet:R`<i>Since</i> + a point in time, <i>for</i> + a length of time, both with the present perfect for actions continuing till now.`,
 q:R`She ___ in this company since 2019.`,
 o:[R`has worked`,R`works`,R`worked`,R`is working`],a:0,
 why:R`“Since 2019” runs up to the present, so use the present perfect (or “has been working”). Simple past would mean the job is over.`},
{id:'tensebytime',t:'gram',u:'tense',lv:2,k:'mcq',tx:1,name:'Future perfect with “by the time”',sheet:R`<i>By the time</i> + simple present → main clause in future perfect (“will have + past participle”).`,
 q:R`By the time you reach the station, the train ___.`,
 o:[R`will have left`,R`will leave`,R`has left`,R`had left`],a:0,
 why:R`The leaving will be complete before a future moment. Note that the time clause stays in the simple present (“reach”, not “will reach”).`},
{id:'tensepast',t:'gram',u:'tense',lv:1,k:'mcq',tx:1,name:'Finished time needs simple past',sheet:R`With a finished time (<i>yesterday, last week, in 2010, ago</i>) use the simple past, not the present perfect.`,
 q:R`I ___ him at the station yesterday.`,
 o:[R`saw`,R`have seen`,R`had saw`,R`have saw`],a:0,
 why:R`“Yesterday” is a finished time, so the present perfect is wrong, and “saw” is the past form of “see” (“seen” is the participle).`},
{id:'tensenosooner',t:'gram',u:'tense',lv:2,k:'mcq',tx:1,name:'No sooner … than',sheet:R`<i>No sooner had + subject + past participle … than</i> (not “when”). Similarly <i>hardly/scarcely … when</i>.`,
 q:R`No sooner ___ the bell rung than the students rushed out.`,
 o:[R`had`,R`has`,R`did`,R`was`],a:0,
 why:R`Fronted “no sooner” takes inverted past perfect: “No sooner had the bell rung than…”. Its partner word is “than”.`},

{id:'artsound',t:'gram',u:'article',lv:2,k:'mcq',tx:1,name:'A or an: go by the sound',sheet:R`<i>An</i> before a vowel <b>sound</b> (an hour, an MBA, an honest man); <i>a</i> before a consonant sound (a university, a one-way street, a European).`,
 q:R`He waited for ___ hour to meet ___ one-eyed sailor who sold him ___ useful map.`,
 o:[R`an; a; a`,R`a; an; an`,R`an; an; a`,R`a; a; an`],a:0,
 why:R`“Hour” starts with a vowel sound (silent h); “one” starts with a “w” sound; “useful” starts with a “y” sound.`},
{id:'artthe',t:'gram',u:'article',lv:1,k:'mcq',tx:1,name:'The with superlatives and unique things',sheet:R`Use <i>the</i> with superlatives (the tallest), ordinals (the first), unique things (the sun) and things already identified.`,
 q:R`It is ___ tallest building in ___ city.`,
 o:[R`the; the`,R`a; the`,R`the; a`,R`a; a`],a:0,
 why:R`A superlative picks out one particular building, and “the city” refers to a specific city both speakers know.`},
{id:'artnone',t:'gram',u:'article',lv:2,k:'mcq',tx:1,name:'No article with general abstract nouns',sheet:R`No article for abstract or uncountable nouns used in a general sense (honesty, water, music), but <i>the</i> once they are specified.`,
 q:R`___ honesty is ___ best policy.`,
 o:[R`no article; the`,R`The; a`,R`An; the`,R`The; the`],a:0,
 why:R`“Honesty” in general takes no article. “Best” is a superlative, so “the best policy”.`},

{id:'preptime',t:'gram',u:'prep',lv:1,k:'mcq',tx:1,name:'At, on, in for time and place',sheet:R`Time: <i>at</i> a clock time, <i>on</i> a day or date, <i>in</i> a month, year or part of the day. Place: <i>at</i> a point, <i>in</i> an enclosed space, <i>on</i> a surface.`,
 q:R`The meeting is ___ Monday ___ 10 a.m. ___ the conference room.`,
 o:[R`on; at; in`,R`at; on; in`,R`in; at; on`,R`on; in; at`],a:0,
 why:R`On + day, at + clock time, in + an enclosed room.`},
{id:'prepfrom',t:'gram',u:'prep',lv:1,k:'mcq',tx:1,name:'Fixed prepositions',sheet:R`Some words take fixed prepositions: <i>absent from, accused of, charged with, aware of, depend on, interested in, prefer … to</i>.`,
 q:R`She has been absent ___ school since Monday, and he has been accused ___ theft.`,
 o:[R`from; of`,R`of; for`,R`at; with`,R`in; of`],a:0,
 why:R`“Absent from” and “accused of” are fixed pairs. Compare “charged with theft”.`},
{id:'prepfor',t:'gram',u:'prep',lv:1,k:'mcq',tx:1,name:'For vs since',sheet:R`<i>For</i> + a duration (for ten years); <i>since</i> + a starting point (since 2015).`,
 q:R`I have lived in this town ___ ten years.`,
 o:[R`for`,R`since`,R`from`,R`by`],a:0,
 why:R`“Ten years” is a length of time. “Since” needs a starting point: “since 2015”.`},
{id:'prepphrasal',t:'gram',u:['prep','idiom'],lv:2,k:'mcq',tx:1,name:'Particles in phrasal verbs',sheet:R`A phrasal verb’s meaning comes from verb + particle together: <i>look up</i> (search), <i>put off</i> (postpone), <i>turn down</i> (reject), <i>carry on</i> (continue).`,
 q:R`The committee decided to put ___ the decision until next month, and then turned ___ the proposal.`,
 o:[R`off; down`,R`on; off`,R`up; out`,R`down; up`],a:0,
 why:R`“Put off” = postpone; “turn down” = reject. “Put on” is to wear or stage; “turn out” is to produce or attend.`},

{id:'conjalthough',t:'gram',u:'conj',lv:1,k:'mcq',tx:1,name:'Although … (no “but”)',sheet:R`One clause, one link: <i>although/though</i> is not paired with <i>but</i>. <i>Despite/in spite of</i> take a noun or -ing, not a clause.`,
 q:R`Which sentence is correct?`,
 o:[R`Although it was raining, we went out.`,R`Although it was raining, but we went out.`,R`Despite it was raining, we went out.`,R`In spite of it was raining, we went out.`],a:0,
 why:R`“Although” already links the clauses, so “but” is redundant. “Despite” needs a noun: “Despite the rain”.`},
{id:'conjhowever',t:'gram',u:'conj',lv:1,k:'mcq',tx:1,name:'Contrast connectors',sheet:R`Contrast: <i>however, nevertheless, yet</i>. Result: <i>therefore, hence, so</i>. Addition: <i>moreover, furthermore</i>. Pick the connector that matches the logic.`,
 q:R`He is very rich; ___, he is unhappy.`,
 o:[R`however`,R`therefore`,R`moreover`,R`because`],a:0,
 why:R`Being rich would suggest happiness, so the second clause contrasts with the first.`},
{id:'conjnotonly',t:'gram',u:['conj','parallel'],lv:1,k:'mcq',tx:1,name:'Not only … but also',sheet:R`Correlative pairs: <i>not only … but also, either … or, neither … nor, both … and, whether … or</i>.`,
 q:R`She is not only intelligent ___ hard-working.`,
 o:[R`but also`,R`and also`,R`as well as`,R`so`],a:0,
 why:R`“Not only” must be completed by “but also”, with matching parts on both sides (adjective, adjective).`},
{id:'conjlest',t:'gram',u:'conj',lv:2,k:'mcq',tx:1,name:'Lest … should',sheet:R`<i>Lest</i> means “so that … not”; it takes <i>should</i> + verb (or the bare verb), never “not”.`,
 q:R`Walk carefully lest you ___ fall.`,
 o:[R`should`,R`will`,R`would not`,R`do not`],a:0,
 why:R`“Lest” already carries the negative, so “lest you should not fall” is a double negative.`},

{id:'adjnearly',t:'gram',u:'adjadv',lv:1,k:'mcq',tx:1,name:'Adverbs that modify adjectives',sheet:R`An adverb modifies an adjective: <i>nearly complete, fully aware</i>. <i>Near, nearby</i> are prepositions/adjectives and can’t do this job.`,
 q:R`The bridge was ___ complete when the funds ran out.`,
 o:[R`nearly`,R`near`,R`nearby`,R`closely`],a:0,
 why:R`“Complete” is an adjective, so it needs an adverb meaning “almost”: nearly. “Closely complete” is not idiomatic.`},
{id:'adjcompare',t:'gram',u:'adjadv',lv:1,k:'mcq',tx:1,name:'Comparative for two',sheet:R`Two things → comparative (<i>better, taller</i>); three or more → superlative. Never double them (<i>more taller</i>).`,
 q:R`Of the two plans, this one is ___.`,
 o:[R`better`,R`the best`,R`more better`,R`most good`],a:0,
 why:R`Only two plans are compared, so the comparative. “Better” is already comparative, so “more better” is wrong.`},
{id:'adjhard',t:'gram',u:'adjadv',lv:1,k:'mcq',tx:1,name:'Hard vs hardly',sheet:R`<i>Hard</i> (adverb) = with effort; <i>hardly</i> = almost not. Similarly <i>late</i>/<i>lately</i>, <i>high</i>/<i>highly</i>.`,
 q:R`He works ___ to support his family.`,
 o:[R`hard`,R`hardly`,R`hardy`,R`hardness`],a:0,
 why:R`“Hardly works” would mean he barely works, the opposite of the intended meaning.`},
{id:'adjorder',t:'gram',u:'adjadv',lv:2,k:'mcq',tx:1,name:'Order of adjectives',sheet:R`Opinion – size – age – shape – colour – origin – material – purpose + noun (<i>a lovely small old round red Italian wooden dining table</i>).`,
 q:R`Which phrase has the natural order of adjectives?`,
 o:[R`a beautiful old red car`,R`a red old beautiful car`,R`an old beautiful red car`,R`a beautiful red old car`],a:0,
 why:R`Opinion (beautiful) comes before age (old), which comes before colour (red).`},

{id:'pronme',t:'gram',u:'pron',lv:1,k:'mcq',tx:1,name:'Object pronoun after a preposition',sheet:R`After a preposition use object forms: <i>between you and me, for him and her, with us</i>.`,
 q:R`Keep this secret between you and ___.`,
 o:[R`me`,R`I`,R`myself`,R`mine`],a:0,
 why:R`“Between” is a preposition, so it takes the object pronoun. Drop “you and” to check: “between … me”.`},
{id:'pronwhom',t:'gram',u:'pron',lv:2,k:'mcq',tx:1,name:'Who vs whom',sheet:R`<i>Who</i> is a subject (he); <i>whom</i> is an object (him). Answer the question with he/him to check.`,
 q:R`To ___ did you give the book?`,
 o:[R`whom`,R`who`,R`whose`,R`which`],a:0,
 why:R`“You gave the book to him”, so the object form “whom”, especially right after a preposition.`},
{id:'pronself',t:'gram',u:'pron',lv:1,k:'mcq',tx:1,name:'Reflexive pronouns',sheet:R`Reflexives: <i>myself, yourself, himself, herself, itself, ourselves, themselves</i>. “Hisself” and “theirselves” are not words.`,
 q:R`He hurt ___ while playing football.`,
 o:[R`himself`,R`him`,R`hisself`,R`his self`],a:0,
 why:R`The subject and object are the same person, so a reflexive is needed, and its correct form is “himself”.`},

{id:'cond3',t:'gram',u:'condl',lv:2,k:'mcq',tx:1,name:'Third conditional',sheet:R`Past unreal: <i>If + had + past participle, would/could/might have + past participle</i>. It means the condition did <b>not</b> happen.`,
 q:R`If she had studied harder, she ___ the exam.`,
 o:[R`would have passed`,R`will have passed`,R`would pass`,R`had passed`],a:0,
 why:R`“Had studied” sets up the past unreal conditional, so the result is “would have passed”. It implies she didn’t study harder and didn’t pass.`},
{id:'cond2',t:'gram',u:'condl',lv:1,k:'mcq',tx:1,name:'Second conditional',sheet:R`Present unreal: <i>If + past simple, would + verb</i>; formal English uses <i>were</i> for all persons (“If I were you”).`,
 q:R`If I ___ you, I would accept the offer.`,
 o:[R`were`,R`am`,R`had been`,R`will be`],a:0,
 why:R`It is an imaginary present situation, so “were” with “would accept”. “Had been” would need “would have accepted”.`},
{id:'cond1',t:'gram',u:'condl',lv:1,k:'mcq',tx:1,name:'First conditional',sheet:R`Real future: <i>If + present simple, will + verb</i>. No “will” inside the if-clause.`,
 q:R`If it rains tomorrow, we ___ the match.`,
 o:[R`will cancel`,R`would cancel`,R`cancelled`,R`would have cancelled`],a:0,
 why:R`A real possibility in the future: present in the if-clause (“rains”), will in the result.`},
{id:'modalshould',t:'gram',u:'condl',lv:2,k:'mcq',tx:1,name:'Should have / must have',sheet:R`<i>Should have + pp</i> = it was the right thing but didn’t happen (regret). <i>Must have + pp</i> = a confident guess about the past.`,
 q:R`You ___ told me earlier; I could have helped you.`,
 o:[R`should have`,R`must have`,R`can have`,R`will have`],a:0,
 why:R`The speaker regrets that it didn’t happen. “Must have told me” would mean “I’m sure you told me”, which contradicts the second clause.`},

{id:'parlist',t:'gram',u:'parallel',lv:1,k:'mcq',tx:1,name:'Parallel lists',sheet:R`Items joined by <i>and, or, but</i> or in a list must have the same form (all -ing, all nouns, all “to + verb”).`,
 q:R`She likes swimming, cycling and ___.`,
 o:[R`reading`,R`to read`,R`she reads`,R`read books`],a:0,
 why:R`The first two items are -ing forms, so the third must be too.`},
{id:'dangling',t:'gram',u:'parallel',lv:2,k:'mcq',tx:1,name:'Dangling modifiers',sheet:R`An opening phrase like “Walking home, …” describes the subject that comes right after the comma. If that subject can’t do the action, the modifier dangles.`,
 q:R`Which sentence is correct?`,
 o:[R`While I was walking home, it started to rain.`,R`Walking home, the rain started.`,R`Having finished the work, the TV was switched on.`,R`Being a rainy day, we stayed indoors.`],a:0,
 why:R`In the others the rain is “walking”, the TV “finished the work”, and “we” are “a rainy day”. The first sentence names who was walking.`},
{id:'parverb',t:'gram',u:'parallel',lv:1,k:'mcq',tx:1,name:'Parallel verbs after “not only”',sheet:R`<i>Not only X but also Y</i>: X and Y must match in form, and “not only” sits right before X.`,
 q:R`She not only plays the violin but also ___ the piano.`,
 o:[R`plays`,R`playing`,R`to play`,R`played`],a:0,
 why:R`“Plays” after “not only” must be matched by “plays” after “but also”.`},

/* ================= VERBAL: VOCABULARY ================= */
{id:'affect',t:'vocab',u:'confused',lv:1,k:'mcq',tx:1,name:'Affect vs effect',sheet:R`<i>Affect</i> is usually a verb (to influence); <i>effect</i> is usually a noun (a result). “To effect” means to bring about.`,
 q:R`The new rule will ___ all employees.`,
 o:[R`affect`,R`effect`,R`effects`,R`affection`],a:0,
 why:R`A verb meaning “influence” is needed. “The rule will have an effect on all employees” uses the noun.`},
{id:'principal',t:'vocab',u:'confused',lv:1,k:'mcq',tx:1,name:'Principal vs principle',sheet:R`<i>Principal</i>: main, or the head of a school, or a sum of money. <i>Principle</i>: a rule or belief.`,
 q:R`The ___ reason for his success is that he sticks to his ___.`,
 o:[R`principal; principles`,R`principle; principals`,R`principle; principles`,R`principal; principals`],a:0,
 why:R`“Main reason” → principal; “rules he follows” → principles.`},
{id:'stationary',t:'vocab',u:'confused',lv:1,k:'mcq',tx:1,name:'Stationary vs stationery',sheet:R`<i>Stationary</i> = not moving (a for “at rest”); <i>stationery</i> = paper, pens (e for “envelopes”).`,
 q:R`The truck remained ___ while we bought ___ from the shop.`,
 o:[R`stationary; stationery`,R`stationery; stationary`,R`stationery; stationery`,R`stationary; stationary`],a:0,
 why:R`The truck was not moving; we bought paper and pens.`},
{id:'loose',t:'vocab',u:'confused',lv:1,k:'mcq',tx:1,name:'Lose vs loose',sheet:R`<i>Lose</i> (verb) = misplace or fail to win; <i>loose</i> (adjective) = not tight. Also: <i>fare/fair, vain/vein, faze/phase, compliment/complement</i>.`,
 q:R`If you ___ weight, your clothes will become ___.`,
 o:[R`lose; loose`,R`loose; lose`,R`loose; loose`,R`lose; lose`],a:0,
 why:R`First a verb (to lose weight), then an adjective (not tight).`},
{id:'complement',t:'vocab',u:'confused',lv:2,k:'mcq',tx:1,name:'Complement vs compliment',sheet:R`<i>Complement</i> = complete or go well with; <i>compliment</i> = praise. Similarly <i>complementary</i> (matching) vs <i>complimentary</i> (praising or free).`,
 q:R`The chef received a ___ on how well the sauce ___ the fish.`,
 o:[R`compliment; complemented`,R`complement; complimented`,R`compliment; complimented`,R`complement; complemented`],a:0,
 why:R`Praise → compliment; “went well with” → complemented.`},

{id:'intensity',t:'vocab',u:'context',lv:2,k:'mcq',tx:1,name:'Words in order of intensity',sheet:R`For “→ increasing intensity” questions, rank the given words first, then choose the word that sits between the two ends in the same way. Watch for look-alike spellings among the options.`,
 q:R`If “→” means increasing intensity, then [warm → hot → scorching] is analogous to [cool → ___ → freezing].`,
 o:[R`cold`,R`tepid`,R`warm`,R`mild`],a:0,
 why:R`Cool → cold → freezing rises in coldness, just as warm → hot → scorching rises in heat. Tepid, warm and mild are all milder than cool.`},
{id:'ambiguous',t:'vocab',u:'context',lv:1,k:'mcq',tx:1,name:'Words in context',sheet:R`Read the whole sentence for clues (cause, contrast, result) before choosing the word. The clue usually sits in another clause.`,
 q:R`His remarks were so ___ that nobody could tell what he really meant.`,
 o:[R`ambiguous`,R`candid`,R`concise`,R`explicit`],a:0,
 why:R`The result clause (“nobody could tell what he meant”) points to unclear remarks. Candid and explicit mean clear and open.`},
{id:'resolve',t:'vocab',u:'context',lv:1,k:'mcq',tx:1,name:'Contrast clues',sheet:R`<i>Despite, although, but, yet</i> signal that the blank contrasts with the other part of the sentence.`,
 q:R`Despite many setbacks, her ___ to finish the project never weakened.`,
 o:[R`determination`,R`reluctance`,R`indifference`,R`hesitation`],a:0,
 why:R`“Despite setbacks … never weakened” needs a positive, firm quality: determination.`},
{id:'frugal',t:'vocab',u:'context',lv:2,k:'mcq',tx:1,name:'Antonyms: opposite meaning, same part of speech',sheet:R`For an antonym, first pin down the exact meaning and part of speech, then reject synonyms and near-misses.`,
 q:R`Which word is most nearly OPPOSITE in meaning to “frugal”?`,
 o:[R`extravagant`,R`thrifty`,R`careful`,R`poor`],a:0,
 why:R`Frugal = sparing with money. Thrifty and careful are close in meaning; “poor” is about having little, not spending habits.`},

{id:'lookup',t:'vocab',u:'idiom',lv:1,k:'mcq',tx:1,name:'Common phrasal verbs',sheet:R`<i>look up</i> (search), <i>take up</i> (start or raise an issue), <i>bring up</i> (mention or raise a child), <i>clear up</i> (explain or tidy), <i>call off</i> (cancel), <i>put up with</i> (tolerate).`,
 q:R`Please ___ the meaning of this word in a dictionary.`,
 o:[R`look up`,R`take up`,R`bring up`,R`clear up`],a:0,
 why:R`To search for information in a reference is to “look it up”.`},
{id:'catbag',t:'vocab',u:'idiom',lv:1,k:'mcq',tx:1,name:'Let the cat out of the bag',sheet:R`<i>Let the cat out of the bag</i> = reveal a secret by mistake. <i>Spill the beans</i> means the same.`,
 q:R`“She let the cat out of the bag about the surprise party.” This means she:`,
 o:[R`revealed the secret`,R`cancelled the party`,R`created confusion`,R`invited a pet`],a:0,
 why:R`The idiom means accidentally giving away a secret.`},
{id:'nailhead',t:'vocab',u:'idiom',lv:1,k:'mcq',tx:1,name:'Hit the nail on the head',sheet:R`<i>Hit the nail on the head</i> = describe exactly what is causing a situation. <i>Beat around the bush</i> is the opposite.`,
 q:R`“When he said the project failed because of poor planning, he hit the nail on the head.” This means he:`,
 o:[R`was exactly right`,R`was too harsh`,R`was guessing`,R`was avoiding the issue`],a:0,
 why:R`The idiom praises a precise, accurate statement.`},
{id:'calloff',t:'vocab',u:'idiom',lv:1,k:'mcq',tx:1,name:'Call off, put off, put up with',sheet:R`<i>Call off</i> = cancel; <i>put off</i> = postpone; <i>put up with</i> = tolerate; <i>keep up with</i> = stay level with.`,
 q:R`The match was ___ because of heavy rain, so it will not be played at all.`,
 o:[R`called off`,R`put off`,R`put up with`,R`kept up with`],a:0,
 why:R`“Not played at all” means cancelled, not postponed.`},

{id:'anasyn',t:'vocab',u:'analogy',lv:1,k:'mcq',tx:1,name:'Synonym analogies',sheet:R`State the relation of the first pair in a sentence (“A means the same as B”), then apply the same sentence to the second pair.`,
 q:R`Candid : Frank :: Obstinate : ___`,
 o:[R`Stubborn`,R`Flexible`,R`Obvious`,R`Obscure`],a:0,
 why:R`Candid and frank are synonyms; obstinate means stubborn. Flexible is its opposite; obvious and obscure only look similar.`},
{id:'anaant',t:'vocab',u:'analogy',lv:1,k:'mcq',tx:1,name:'Antonym analogies',sheet:R`If the first pair are opposites (verbose : brief), the answer must be the opposite of the third word, not a synonym of it.`,
 q:R`Generous : Stingy :: Humble : ___`,
 o:[R`Arrogant`,R`Modest`,R`Meek`,R`Kind`],a:0,
 why:R`Generous and stingy are opposites, so look for the opposite of humble. Modest and meek are synonyms.`},
{id:'anahome',t:'vocab',u:'analogy',lv:1,k:'mcq',tx:1,name:'Animal and dwelling',sheet:R`Common pairs: bird–nest, bee–hive, lion–den, dog–kennel, horse–stable, pig–sty, spider–web.`,
 q:R`Lion : Den :: Horse : ___`,
 o:[R`Stable`,R`Kennel`,R`Sty`,R`Hive`],a:0,
 why:R`The relation is animal : its home. A kennel is for a dog, a sty for a pig, a hive for bees.`},
{id:'anafunc',t:'vocab',u:'analogy',lv:1,k:'mcq',tx:1,name:'Tool and function',sheet:R`Tool : what it does (pen : write, knife : cut). Don’t pick a property (sharp) or a material (steel).`,
 q:R`Pen : Write :: Knife : ___`,
 o:[R`Cut`,R`Sharp`,R`Steel`,R`Kitchen`],a:0,
 why:R`A pen is used to write; a knife is used to cut. The other options describe the knife, not its use.`},

/* ================= VERBAL: READING & INFERENCE ================= */
{id:'mustbe',t:'reason',u:'infer',lv:2,k:'mcq',tx:1,name:'What must be true',sheet:R`“Based only on the passage” means: no outside knowledge. A correct inference must follow from the given statements in every possible case.`,
 q:R`Every train that stops at Rampur also stops at Sitapur. The 5:15 express does not stop at Sitapur. Which must be true?`,
 o:[R`The 5:15 express does not stop at Rampur`,R`The 5:15 express stops at Rampur`,R`No train stops at both stations`,R`The 5:15 express is always late`],a:0,
 why:R`If it stopped at Rampur it would have to stop at Sitapur, which it doesn’t. The last option uses information not given.`},
{id:'most',t:'reason',u:'infer',lv:2,k:'mcq',tx:1,name:'“Most” and cause',sheet:R`“Most” supports “at least one” but not “all”. A pattern (A and B together) does not prove that A causes B.`,
 q:R`Most students who joined the coding club improved their grades. Which can be inferred?`,
 o:[R`At least one student who joined the club improved their grades`,R`Joining the club causes better grades`,R`Students who did not join did not improve`,R`Every club member improved their grades`],a:0,
 why:R`“Most” guarantees some. Nothing is said about cause, about non-members, or about every member.`},
{id:'assume',t:'reason',u:'infer',lv:2,k:'mcq',tx:1,name:'Spotting the assumption',sheet:R`An assumption is an unstated belief the argument needs. Test it: if it were false, would the argument fall apart?`,
 q:R`To reduce air pollution, the government will pay people who cycle to work. What does this plan assume?`,
 o:[R`Cycling to work causes less pollution than the way these people would otherwise travel`,R`Everyone will start cycling to work`,R`Air pollution is the country’s only problem`,R`Cars will soon be banned`],a:0,
 why:R`If cycling didn’t replace more polluting travel, the payments wouldn’t reduce pollution. The plan doesn’t need everyone to cycle.`},
{id:'pctinfer',t:'reason',u:['infer','pct'],lv:3,k:'mcq',tx:1,name:'Percent of a percent',sheet:R`“x% of them” refers to the previous group, not to everyone. Multiply the fractions before comparing with one half.`,
 q:R`80% of a firm’s employees attended at least one training session. Of these, 70% attended a session led by a manager. Which follows with certainty?`,
 o:[R`More than half of all employees attended a session led by a manager`,R`Less than half of all employees attended a session led by a manager`,R`70% of all employees attended a session led by a manager`,R`30% of all employees attended no session`],a:0,
 why:R`\(0.8\times0.7=0.56\), so 56% of all employees: more than half. 20% (not 30%) attended no session.`},

{id:'hadbeen',t:'reason',u:'condinf',lv:2,k:'mcq',tx:1,name:'What a past unreal conditional implies',sheet:R`“If X had happened, Y would have happened” implies X did <b>not</b> happen (and usually that Y did not either).`,
 q:R`“Had the bridge been completed on time, the village would have received supplies before the floods.” Based only on this, which is true?`,
 o:[R`The bridge was not completed on time`,R`The bridge was completed on time`,R`The village received supplies before the floods`,R`The floods destroyed the bridge`],a:0,
 why:R`The past unreal conditional describes something that didn’t happen. Nothing is said about the floods damaging the bridge.`},
{id:'evenif',t:'reason',u:'condinf',lv:2,k:'mcq',tx:1,name:'“Even if …had”',sheet:R`“Even if X had been true, Y would not have happened” implies X was false, and that Y would not depend on X.`,
 q:R`“Even if the tickets had been free, Rahul would not have attended the concert.” Which is the logically correct inference?`,
 o:[R`The tickets were not free`,R`Rahul attended the concert`,R`Rahul dislikes music`,R`The tickets were free`],a:0,
 why:R`“Had been free” is a counterfactual, so they weren’t free. Why Rahul wouldn’t attend is not stated.`},
{id:'onlyif',t:'reason',u:'condinf',lv:2,k:'mcq',tx:1,name:'“Only if” and contrapositives',sheet:R`“A only if B” means A ⇒ B. From “if P then Q” and “not Q” you may conclude “not P”; from “Q” alone you may not conclude P.`,
 q:R`“You can enter the hall only if you have a pass.” Meera entered the hall. Which must be true?`,
 o:[R`Meera had a pass`,R`Meera did not have a pass`,R`Everyone with a pass entered the hall`,R`Meera bought her pass at the gate`],a:0,
 why:R`Entering ⇒ having a pass. Having a pass does not force anyone to enter, and where she got it is not stated.`},
{id:'contrapos',t:'reason',u:'condinf',lv:2,k:'mcq',tx:1,name:'Contrapositive',sheet:R`“If P then Q” is equivalent to “if not Q then not P”. It is NOT equivalent to “if Q then P” or “if not P then not Q”.`,
 q:R`“If the alarm is set, the red light is on.” The red light is off. What follows?`,
 o:[R`The alarm is not set`,R`The alarm is set`,R`The light is broken`,R`Nothing follows`],a:0,
 why:R`This is the contrapositive: no light ⇒ no alarm. If the light were on, nothing would follow about the alarm.`},

{id:'seqopen',t:'reason',u:'seq',lv:1,k:'mcq',tx:1,name:'Finding the opening sentence',sheet:R`The first sentence introduces the topic and doesn’t point back. Sentences starting with <i>This, These, Thus, However, Such, It</i> refer to something earlier.`,
 q:R`Which sentence is most likely the first in a jumbled paragraph?`,
 o:[R`Many cities have started planting trees along busy roads.`,R`This has reduced noise as well as heat.`,R`However, the saplings need years to grow.`,R`Thus, the benefits are slow to appear.`],a:0,
 why:R`It introduces the topic on its own. “This”, “However” and “Thus” all need a previous sentence.`},
{id:'seqorder',t:'reason',u:'seq',lv:2,k:'mcq',tx:1,name:'Ordering with link words',sheet:R`Chain the sentences by their links: a pronoun or “this” follows the sentence it refers to; “however” follows the expectation it overturns; keep time order.`,
 q:R`Arrange into a coherent passage. P: This made her late for the interview. Q: Priya left home early to catch the 8 o’clock bus. R: However, the bus broke down halfway. S: Fortunately, the interviewer had also been delayed.`,
 o:[R`QRPS`,R`QPRS`,R`RQPS`,R`QRSP`],a:0,
 why:R`Q sets the scene, R’s “However” overturns Q’s plan, P’s “This” refers to the breakdown, and S resolves the problem. In QRSP, “This made her late” would wrongly follow the interviewer’s delay.`},
{id:'seqthese',t:'reason',u:'seq',lv:1,k:'mcq',tx:1,name:'Backward-pointing words',sheet:R`<i>These findings, such methods, the latter, this problem</i>: each needs an earlier sentence that introduces the thing named.`,
 q:R`In a jumbled passage, one sentence begins “These findings suggest that…”. What does this tell you?`,
 o:[R`It must come after a sentence that describes the findings`,R`It must be the opening sentence`,R`It must be the closing sentence`,R`It can go anywhere`],a:0,
 why:R`“These findings” refers back, so the sentence presenting the findings comes before it. It could still be in the middle or at the end.`}
]);
})();
