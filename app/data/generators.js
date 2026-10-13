/* Number generators: these NAT cards get fresh numbers every time they appear.
   gen(id, fn): fn(rand) returns {q, v, why, tol?, p}. p holds the drawn numbers (used by checking scripts).
   The card's written q / n stay as the fallback and as the example shown in the deck. Load after all card files. */
(function(){
const R = String.raw;
const byId = Object.fromEntries(BANK.map(c => [c.id, c]));
function gen(id, fn){ const c = byId[id]; if (!c || c.k !== 'nat') { console.warn('generator skipped:', id); return; } c.gen = fn; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const rd = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
const C = (n, k) => { if (k < 0 || k > n) return 0; let v = 1; for (let i = 1; i <= k; i++) v = v * (n - k + i) / i; return Math.round(v); };
const fact = n => n <= 1 ? 1 : n * fact(n - 1);
const sig = z => 1 / (1 + Math.exp(-z));

/* ---------------- Probability & Statistics ---------------- */
gen('ps.stars', r => { const k = ri(r,3,4), n = ri(r,4,9), v = C(n+k-1, k-1);
  const vars = Array.from({length:k}, (_,i) => `x_${i+1}`).join('+');
  return {p:{k,n}, v, q:R`How many non-negative integer solutions does \(${vars}=${n}\) have?`,
    why:R`\(\binom{${n}+${k}-1}{${k}-1}=\binom{${n+k-1}}{${k-1}}=${v}\).`}; });
gen('ps.circ', r => { const n = ri(r,5,8), v = fact(n-1);
  return {p:{n}, v, q:R`In how many ways can ${n} people sit around a round table, if rotations count as the same seating?`,
    why:R`Fix one person, arrange the other ${n-1}: \(${n-1}!=${v}\).`}; });
gen('ps.compl', r => { const m = ri(r,2,5), v = rd(1 - (5/6)**m);
  return {p:{m}, v, tol:0.002, q:R`A fair die is rolled ${m} times. Find \(P(\text{at least one six})\), to 3 decimals.`,
    why:R`\(1-(5/6)^{${m}}\approx${v.toFixed(3)}\).`}; });
gen('ps.bayesnat', r => { const pr = pk(r,[0.005,0.01,0.02,0.05]), se = pk(r,[0.8,0.9,0.95,0.99]), fp = pk(r,[0.02,0.05,0.1]);
  const num = se*pr, den = num + fp*(1-pr), v = rd(num/den);
  return {p:{pr,se,fp}, v, tol:0.002, q:R`${+(pr*100).toFixed(1)}% of people have a disease. The test detects ${se*100}% of cases and gives a false positive ${fp*100}% of the time. Someone tests positive. Find \(P(\text{disease}\mid\text{positive})\), to 3 decimals.`,
    why:R`\(\frac{${se}\times${pr}}{${se}\times${pr}+${fp}\times${rd(1-pr,3)}}=\frac{${rd(num,5)}}{${rd(den,5)}}\approx${v.toFixed(3)}\). The base rate matters a lot.`}; });
gen('ps.totalnat', r => { const s = pk(r,[0.5,0.6,0.7,0.8]), q = pk(r,[0.2,0.3,0.4,0.5]), v = rd(s + (1-s)*(1-q));
  return {p:{s,q}, v, q:R`${s*100}% of students never change their vote; the rest switch with probability ${q} between two votes. Find \(P(\text{a random student votes the same way twice})\).`,
    why:R`\(${s}\times1+${rd(1-s,2)}\times${rd(1-q,2)}=${v}\).`}; });
gen('ps.median', r => { const xs = []; while (xs.length < 6){ const x = ri(r,1,30); if (!xs.includes(x)) xs.push(x); }
  const s = xs.slice().sort((a,b) => a-b), v = (s[2]+s[3])/2;
  return {p:{xs}, v, q:R`Find the median of ${xs.join(', ')}.`,
    why:R`Sorted: ${s.join(', ')}. Average the middle two: \((${s[2]}+${s[3]})/2=${v}\).`}; });
gen('ps.znorm', r => { const mu = ri(r,40,70), sd = pk(r,[4,5,8,10]), k = pk(r,[-4,-3,-2,-1,1,2,3,4]), x = mu + k*sd/2, v = k/2;
  return {p:{mu,sd,x}, v, q:R`Scores have mean ${mu} and standard deviation ${sd}. Find the z-score of a score of ${x}.`,
    why:R`\((${x}-${mu})/${sd}=${v}\).`}; });
gen('ps.meanupd', r => { const n = ri(r,10,30), m = ri(r,20,50), d = ri(r,1,4), x = (m+d)*(n+1) - n*m;
  return {p:{n,m,x}, v:m+d, q:R`${n} values have mean ${m}. A new value ${x} is added. Find the new mean.`,
    why:R`New total \(=${n}\times${m}+${x}=${n*m+x}\); divide by ${n+1} to get ${m+d}.`}; });
gen('ps.varcombo', r => { const sx = pk(r,[2,3,4]), sy = pk(r,[1,2,3,5]), rho = pk(r,[-0.5,0,0.5]), a = pk(r,[1,2,3]), b = pk(r,[-2,-1,1,2]);
  const cov = rho*sx*sy, v = rd(a*a*sx*sx + b*b*sy*sy + 2*a*b*cov);
  const co = k => k === 1 ? '' : k, bs = `${co(a)}X${b < 0 ? '-' : '+'}${co(Math.abs(b))}Y`;
  return {p:{sx,sy,rho,a,b}, v, q:R`\(\operatorname{Var}(X)=${sx*sx}\), \(\operatorname{Var}(Y)=${sy*sy}\), \(\rho_{XY}=${rho}\). Find \(\operatorname{Var}(${bs})\).`,
    why:R`\(\operatorname{Cov}=${rho}\times${sx}\times${sy}=${rd(cov)}\). Then \(${a*a}(${sx*sx})+${b*b}(${sy*sy})+2(${a})(${b})(${rd(cov)})=${v}\).`}; });
gen('ps.binvar', r => { const n = ri(r,10,50), p = pk(r,[0.1,0.2,0.25,0.3,0.4,0.5,0.6,0.8]), v = rd(n*p*(1-p));
  return {p:{n,pp:p}, v, q:R`\(X\sim\text{Bin}(${n},\,${p})\). Find \(\operatorname{Var}(X)\).`,
    why:R`\(np(1-p)=${n}\times${p}\times${rd(1-p,2)}=${v}\).`}; });
gen('ps.binexp', r => { const red = ri(r,2,8), blue = ri(r,2,8), n = pk(r,[20,30,40,50,60]), v = rd(n*red/(red+blue)), exact = (n*red) % (red+blue) === 0;
  return {p:{red,blue,n}, v, tol: exact ? undefined : 0.006, q:R`A bag has ${red} red and ${blue} blue balls. ${n} balls are drawn one at a time with replacement. Expected number of red balls${exact ? '' : ', to 2 decimals'}?`,
    why:R`Each draw is red with probability \(${red}/${red+blue}\), so \(E=${n}\times${red}/${red+blue}=${v}\).`}; });
gen('ps.geomnat', r => { const p = pk(r,[0.1,0.2,0.25,0.5]), k = ri(r,2,5), v = rd((1-p)**(k-1)*p);
  return {p:{pp:p,k}, v, tol:0.0015, q:R`Each attempt succeeds with probability ${p}. Find \(P(\text{first success on attempt }${k})\), to 3 decimals.`,
    why:R`\(${k-1}\) failures then a success: \(${rd(1-p,2)}^{${k-1}}\times${p}\approx${v}\).`}; });
gen('ps.expsurv', r => { const lam = pk(r,[0.2,0.25,0.5,1]), x = ri(r,1,4), v = rd(Math.exp(-lam*x));
  return {p:{lam,x}, v, tol:0.002, q:R`Lifetimes are exponential with rate \(\lambda=${lam}\) per year. Find \(P(X>${x})\), to 3 decimals.`,
    why:R`\(e^{-${lam}\times${x}}=e^{-${rd(lam*x,3)}}\approx${v.toFixed(3)}\).`}; });
gen('ps.memnat', r => { const a = pk(r,[2,3,4,5,10]), p = pk(r,[0.3,0.4,0.5,0.6,0.7,0.8]);
  return {p:{a,pp:p}, v:p, q:R`X is exponential and \(P(X>${a})=${p}\). Find \(P(X>${2*a}\mid X>${a})\).`,
    why:R`Memorylessness: it equals \(P(X>${a})=${p}\).`}; });
gen('ps.normnat', r => { const z = pk(r,[1,2,3]), Phi = {1:0.8413,2:0.9772,3:0.9987}[z], mu = pk(r,[40,50,60,100]), s = pk(r,[5,10,15]), x = mu + z*s, v = rd(1-Phi);
  return {p:{z}, v, tol:0.0005, q:R`\(X\sim N(${mu},\,${s}^2)\). Given \(\Phi(${z})=${Phi}\), find \(P(X>${x})\).`,
    why:R`\(z=(${x}-${mu})/${s}=${z}\), so \(P=1-${Phi}=${v}\).`}; });
gen('ps.se', r => { const s = pk(r,[6,8,10,12,15,20]), n = pk(r,[4,9,16,25,36,64,100]), v = rd(s/Math.sqrt(n)), exact = Math.abs(v*100 - Math.round(v*100)) < 1e-9;
  return {p:{s,n}, v, tol: exact ? undefined : 0.002, q:R`\(\sigma=${s}\), \(n=${n}\). Find the standard error of \(\bar X\)${exact ? '' : ', to 3 decimals'}.`,
    why:R`\(${s}/\sqrt{${n}}=${s}/${Math.sqrt(n)}=${v}\).`}; });
gen('ps.cinat', r => { const xb = pk(r,[50,80,100,120]), s = pk(r,[10,12,15,20]), n = pk(r,[16,25,36,64,100]), m = 1.96*s/Math.sqrt(n), v = rd(xb+m, 2);
  return {p:{xb,s,n}, v, tol:0.01, q:R`\(\bar x=${xb}\), \(\sigma=${s}\), \(n=${n}\). Find the upper limit of the 95% CI for \(\mu\), using \(z=1.96\).`,
    why:R`Margin \(=1.96\times${s}/${Math.sqrt(n)}=${rd(m,3)}\), so the upper limit is \(${v}\).`}; });
gen('ps.indepdf', r => { const a = ri(r,2,5), b = ri(r,2,6), v = (a-1)*(b-1);
  return {p:{a,b}, v, q:R`A chi-squared test of independence is run on a ${a} × ${b} contingency table. How many degrees of freedom?`,
    why:R`\((${a}-1)(${b}-1)=${v}\).`}; });
gen('ps.dunifnat', r => { const n = ri(r,5,20), v = (n+1)/2;
  return {p:{n}, v, q:R`X is uniform on {1, 2, …, ${n}}. Find \(E[X]\).`, why:R`\((${n}+1)/2=${v}\).`}; });
gen('ps.znat', r => { const mu = pk(r,[50,60,100]), s = pk(r,[4,6,8,10]), n = pk(r,[16,36,64,100]), z = pk(r,[-2.5,-2,-1.5,-1,1,1.5,2,2.5]), se = s/Math.sqrt(n), xb = rd(mu + z*se, 3);
  return {p:{mu,s,n,xb}, v:z, q:R`\(H_0:\mu=${mu}\), \(\sigma=${s}\), \(n=${n}\), \(\bar x=${xb}\). Find the z statistic.`,
    why:R`Standard error \(${s}/\sqrt{${n}}=${rd(se,3)}\), so \(z=(${xb}-${mu})/${rd(se,3)}=${z}\).`}; });
gen('ps.mutexnat', r => { const a = pk(r,[0.1,0.2,0.3,0.4]), b = pk(r,[0.1,0.2,0.3,0.4,0.5]), v = rd(a+b);
  return {p:{a,b}, v, q:R`A and B are mutually exclusive, \(P(A)=${a}\) and \(P(B)=${b}\). Find \(P(A\cup B)\).`, why:R`No overlap: \(${a}+${b}=${v}\).`}; });
gen('ps.unionnat', r => { const a = pk(r,[0.4,0.5,0.6]), b = pk(r,[0.3,0.4,0.5]), ab = pk(r,[0.1,0.2,0.25]), v = rd(a+b-ab);
  return {p:{a,b,ab}, v, q:R`\(P(A)=${a}\), \(P(B)=${b}\) and \(P(A\cap B)=${ab}\). Find \(P(A\cup B)\).`, why:R`\(${a}+${b}-${ab}=${v}\).`}; });
gen('ps.permnat', r => { const n = ri(r,5,9), k = ri(r,2,4); let v = 1; for (let i = 0; i < k; i++) v *= n-i;
  return {p:{n,k}, v, q:R`How many ${k}-letter arrangements (no repeated letters) can be made from ${n} distinct letters?`,
    why:R`\({}^{${n}}P_{${k}}=${Array.from({length:k},(_,i)=>n-i).join('\\times')}=${v}\).`}; });
gen('ps.combnat', r => { const men = ri(r,5,9), wom = ri(r,4,7), size = pk(r,[3,4]), k = ri(r,1,size-1), v = C(wom,k)*C(men,size-k);
  return {p:{men,wom,size,k}, v, q:R`A committee of ${size} is chosen from ${men} men and ${wom} women. In how many ways can it have exactly ${k} women?`,
    why:R`\(\binom{${wom}}{${k}}\binom{${men}}{${size-k}}=${C(wom,k)}\times${C(men,size-k)}=${v}\).`}; });
gen('ps.hypernat', r => { const N = ri(r,8,12), K = ri(r,3,5), n = 3, k = ri(r,1,2), v = rd(C(K,k)*C(N-K,n-k)/C(N,n));
  return {p:{N,K,n,k}, v, tol:0.002, q:R`A box has ${N} items, ${K} of them defective. 3 are drawn without replacement. Find \(P(\text{exactly ${k} defective})\), to 3 decimals.`,
    why:R`\(\binom{${K}}{${k}}\binom{${N-K}}{${n-k}}/\binom{${N}}{3}=${C(K,k)*C(N-K,n-k)}/${C(N,n)}\approx${v.toFixed(3)}\).`}; });
gen('ps.chebynat', r => { const k = pk(r,[2,3,4,5]), mu = pk(r,[50,60,100]), s = pk(r,[2,4,5]), v = rd(1-1/(k*k));
  return {p:{k}, v, tol:0.002, q:R`X has mean ${mu} and standard deviation ${s}, with unknown distribution. Using Chebyshev, find the smallest guaranteed value of \(P(${mu-k*s}\lt X\lt${mu+k*s})\), to 3 decimals.`,
    why:R`The interval is \(\mu\pm${k}\sigma\), so the bound is \(1-1/${k*k}\approx${v.toFixed(3)}\).`}; });
gen('ps.urnchain', r => { const red = ri(r,4,7), blue = ri(r,2,5), d = pk(r,[2,3]); let v = 1; for (let i = 0; i < d; i++) v *= (red-i)/(red+blue-i); v = rd(v);
  return {p:{red,blue,d}, v, tol:0.002, q:R`An urn has ${red} red and ${blue} blue balls. ${d} are drawn without replacement. Find \(P(\text{all red})\), to 3 decimals.`,
    why:R`\(${Array.from({length:d},(_,i)=>`\\frac{${red-i}}{${red+blue-i}}`).join('\\cdot')}\approx${v.toFixed(3)}\).`}; });
gen('ps.ciprop', r => { const n = pk(r,[100,200,400]), ph = pk(r,[0.2,0.3,0.4,0.5]), m = 1.96*Math.sqrt(ph*(1-ph)/n), v = rd(m);
  return {p:{n,ph}, v, tol:0.002, q:R`In a sample of ${n}, ${Math.round(ph*n)} support a policy. Find the margin of error of the 95% confidence interval for the proportion (z = 1.96), to 3 decimals.`,
    why:R`\(1.96\sqrt{${ph}\times${rd(1-ph,2)}/${n}}\approx${v.toFixed(3)}\).`}; });
gen('ps.expmv', r => { const c = pk(r,[2,4,5,10]), v = rd(1/c);
  return {p:{c}, v, q:R`\(X\sim\text{Exp}(\lambda)\) and \(\operatorname{Var}(X)=${c}\,E[X]\). Find \(\lambda\).`,
    why:R`\(1/\lambda^2=${c}/\lambda\Rightarrow\lambda=1/${c}=${v}\).`}; });

/* ---------------- Linear Algebra ---------------- */
gen('la.depk', r => { const a = pk(r,[1,2,3]), b = ri(r,1,5), c = a*ri(r,1,4), v = b*c/a;
  return {p:{a,b,c}, v, q:R`For what \(k\) are \((${a},${b})\) and \((${c},k)\) linearly dependent?`,
    why:R`\(${a}k-${b*c}=0\Rightarrow k=${v}\).`}; });
gen('la.pyth', r => { const [a,b,c] = pk(r,[[3,4,5],[5,12,13],[8,15,17],[6,8,10],[7,24,25],[9,12,15]]);
  return {p:{a,b}, v:c, q:R`\(x\perp y\), \(\|x\|=${a}\), \(\|y\|=${b}\). Find \(\|x+y\|\).`, why:R`\(\sqrt{${a*a}+${b*b}}=${c}\).`}; });
gen('la.othereig', r => { let l1 = ri(r,1,9), l2 = ri(r,1,9); if ((l1+l2) % 2) l2 += 1; if (l1 === l2) l2 += 2;
  const d = (l1+l2)/2, o = (l1-l2)/2;
  return {p:{l1,l2}, v:l2, q:R`\(H=\begin{bmatrix}${d}&${o}\\${o}&${d}\end{bmatrix}\) has one eigenvalue ${l1}. Find the other.`,
    why:R`Trace is ${l1+l2}, so the other is ${l2}. Check: \(${l1}\times${l2}=${l1*l2}=\det H\).`}; });
gen('la.deteig', r => { const a = ri(r,1,4), b = ri(r,1,3), c = ri(r,2,5), v = (a*a+b*b)*c;
  return {p:{a,b,c}, v, q:R`A real 3×3 matrix has eigenvalues \(${a}-${b}i\) and ${c}. Find \(\det A\).`,
    why:R`The third eigenvalue is \(${a}+${b}i\). \(\det=(${a*a}+${b*b})\times${c}=${v}\).`}; });
gen('la.trpoly', r => { const e = [ri(r,-3,3), ri(r,-3,3), ri(r,1,4)], al = pk(r,[-2,-1,1,2]), v = e.reduce((s,l) => s + l*l + al*l, 0);
  const ps = al < 0 ? `A^2-${-al === 1 ? '' : -al}A` : `A^2+${al === 1 ? '' : al}A`;
  return {p:{e,al}, v, q:R`A has eigenvalues ${e.join(', ')}. Find \(\operatorname{tr}(${ps})\).`,
    why:R`Apply \(\lambda^2${al<0?'-':'+'}${Math.abs(al)===1?'':Math.abs(al)}\lambda\) to each eigenvalue and add: ${e.map(l => l*l+al*l).join(' + ').replace(/\+ -/g, '− ')} = ${v}.`}; });
gen('la.detpoly', r => { const e = [ri(r,1,3), ri(r,1,4), ri(r,2,4)], al = ri(r,1,3), vals = e.map(l => l*l + al*l), v = vals.reduce((a,b) => a*b, 1);
  return {p:{e,al}, v, q:R`A has eigenvalues ${e.join(', ')}. Find \(\det(A^2+${al===1?'':al}A)\).`,
    why:R`\(\lambda^2+${al===1?'':al}\lambda\) gives ${vals.join(', ')}. Product = ${v}.`}; });
gen('la.rnullnat', r => { const m = ri(r,3,7), n = ri(r,3,8), rk = ri(r,1,Math.min(m,n)), v = n-rk;
  return {p:{m,n,rk}, v, q:R`A is \(${m}\times${n}\) with rank ${rk}. Find \(\dim N(A)\).`, why:R`\(${n}-${rk}=${v}\) (number of columns minus rank).`}; });
gen('la.centering', r => { const n = ri(r,3,12);
  return {p:{n}, v:n-1, q:R`\(C=I_{${n}}-\tfrac1{${n}}\mathbf 1\mathbf 1^\top\). Find \(\operatorname{tr}(C)\).`,
    why:R`Each diagonal entry is \(1-\tfrac1{${n}}\), so the trace is \(${n}-1=${n-1}\), the rank of this projection.`}; });
gen('la.rotpow', r => { const m = pk(r,[3,4,5,6,7,8]), N = ri(r,50,3000), v = N % m;
  return {p:{m,N}, v, q:R`M rotates the plane by \(2\pi/${m}\). Then \(M^{${N}}=M^k\) for which \(k\in\{0,\dots,${m-1}\}\)?`,
    why:R`\(M^{${m}}=I\), so only \(${N}\bmod${m}=${v}\) matters.`}; });
gen('la.raylnat', r => { const a = ri(r,2,6), b = pk(r,[-3,-2,-1,1,2,3]), v = a + Math.abs(b);
  return {p:{a,b}, v, q:R`Find \(\max x^\top Ax\) over unit vectors x, for \(A=\begin{bmatrix}${a}&${b}\\${b}&${a}\end{bmatrix}\).`,
    why:R`Eigenvalues are \(${a}\pm${Math.abs(b)}\); the maximum is ${v}.`}; });
gen('la.lsqw', r => { const xs = [1,2,3], ys = xs.map(() => ri(r,1,9)), sxy = xs.reduce((s,x,i) => s + x*ys[i], 0), v = rd(sxy/14);
  return {p:{ys}, v, tol:0.002, q:R`Fit \(y=wx\) by least squares to \((1,${ys[0]}),(2,${ys[1]}),(3,${ys[2]})\). Find \(\hat w\), to 3 decimals.`,
    why:R`\(\sum xy=${sxy}\), \(\sum x^2=14\), so \(\hat w=${sxy}/14\approx${v.toFixed(3)}\).`}; });
gen('la.projlen', r => { const a = [ri(r,1,3), ri(r,0,3)], b = [ri(r,-3,4), ri(r,1,4)], dot = a[0]*b[0]+a[1]*b[1], na = Math.hypot(a[0],a[1]), v = rd(Math.abs(dot)/na);
  return {p:{a,b}, v, tol:0.002, q:R`Find the length of the projection of \(b=(${b})\) onto \(a=(${a})\), to 3 decimals.`,
    why:R`\(|a^\top b|/\|a\|=${Math.abs(dot)}/\sqrt{${a[0]**2+a[1]**2}}\approx${v.toFixed(3)}\).`}; });
gen('la.idemtr', r => { const n = ri(r,3,9), t = ri(r,1,n-1);
  return {p:{n,t}, v:t, q:R`A \(${n}\times${n}\) matrix P satisfies \(P^2=P\) and \(\operatorname{tr}(P)=${t}\). Find \(\operatorname{rank}(P)\).`,
    why:R`Eigenvalues are 0 and 1, so the trace counts the 1s: rank ${t}.`}; });
gen('la.detcombo', r => { const d = ri(r,2,7), c = pk(r,[2,3]), v = c**3;
  return {p:{d,c}, v, q:R`A is 3×3 with \(\det A=${d}\). Find \(\det\big(${c}A^{-1}A^\top\big)\).`,
    why:R`\(${c}^3\cdot\frac1{${d}}\cdot${d}=${v}\). The value of \(\det A\) cancels.`}; });

/* determinants */
const bm = M => R`\begin{bmatrix}${M.map(row => row.join('&')).join(R`\\`)}\end{bmatrix}`;
const det2v = M => M[0][0]*M[1][1] - M[0][1]*M[1][0];
const det3v = M => M[0][0]*(M[1][1]*M[2][2] - M[1][2]*M[2][1]) - M[0][1]*(M[1][0]*M[2][2] - M[1][2]*M[2][0]) + M[0][2]*(M[1][0]*M[2][1] - M[1][1]*M[2][0]);
const minor = (M, i, j) => M.filter((_,a) => a !== i).map(row => row.filter((_,b) => b !== j));
const sgn = x => x < 0 ? `(${x})` : `${x}`;
gen('la.det2', r => { let M; do { M = [[ri(r,-6,9), ri(r,-6,9)], [ri(r,-6,9), ri(r,-6,9)]]; } while (det2v(M) === 0);
  const v = det2v(M);
  return {p:{M}, v, q:R`Find \(\det${bm(M)}\).`, why:R`\(ad-bc=${sgn(M[0][0])}\cdot${sgn(M[1][1])}-${sgn(M[0][1])}\cdot${sgn(M[1][0])}=${v}\).`}; });
gen('la.det3', r => { const M = Array.from({length:3}, () => Array.from({length:3}, () => ri(r,-3,4))), v = det3v(M);
  const t = [0,1,2].map(j => (j % 2 ? -1 : 1)*M[0][j]*det2v(minor(M,0,j)));
  return {p:{M}, v, q:R`Find \(\det${bm(M)}\).`,
    why:R`Expand along row 1: \(${M[0].map((a,j) => `${j ? (j % 2 ? '-' : '+') : ''}${sgn(a)}\cdot${sgn(det2v(minor(M,0,j)))}`).join('')}=${t.join('+').replace(/\+-/g,'-')}=${v}\). Expanding along a row or column with zeros saves work.`}; });
gen('la.dettri4', r => { const up = r() < 0.5, d = [0,1,2,3].map(() => pk(r,[-3,-2,-1,1,2,3,4]));
  const M = [0,1,2,3].map(i => [0,1,2,3].map(j => i === j ? d[i] : ((up ? j > i : j < i) ? ri(r,-5,9) : 0))), v = d.reduce((a,b) => a*b, 1);
  return {p:{d}, v, q:R`Find \(\det${bm(M)}\).`, why:R`It is ${up ? 'upper' : 'lower'} triangular, so multiply the diagonal: \(${d.map(sgn).join('\\cdot')}=${v}\). The other entries don’t matter.`}; });
gen('la.detrules', r => { const n = pk(r,[2,3,4]), d = pk(r,[-2,2,3,4,5]), k = pk(r,[2,3]), type = pk(r,['kA','kAinv','adj','ATA','kadj','inv']);
  const V = {kA: k**n*d, kAinv: k**n/d, adj: d**(n - 1), ATA: d*d, kadj: k**n*d**(n - 1), inv: 1/d}[type], v = rd(V, 4);
  const E = {kA:`${k}A`, kAinv:`${k}A^{-1}`, adj:R`\operatorname{adj}A`, ATA:R`A^\top A`, kadj:R`${k}\,\operatorname{adj}A`, inv:`A^{-1}`}[type];
  const W = {kA:R`${k}^{${n}}\cdot${sgn(d)}`, kAinv:R`${k}^{${n}}/${sgn(d)}`, adj:R`${sgn(d)}^{${n - 1}}`, ATA:R`${sgn(d)}^2`, kadj:R`${k}^{${n}}\cdot${sgn(d)}^{${n - 1}}`, inv:R`1/${sgn(d)}`}[type];
  const exact = Number.isInteger(V);
  return {p:{n,d,k,type}, v, tol: exact ? undefined : 0.002, q:R`A is \(${n}\times${n}\) with \(\det A=${d}\). Find \(\det(${E})\)${exact ? '' : ', to 3 decimals'}.`,
    why:R`\(${W}=${exact ? v : rd(V,3)}\). Rules: \(\det(kA)=k^n\det A\), \(\det(A^{-1})=1/\det A\), \(\det(\operatorname{adj}A)=(\det A)^{n-1}\), \(\det(A^\top)=\det A\).`}; });
gen('la.detsing', r => { if (r() < 0.5){ let a, b, c; do { a = ri(r,-6,9); b = ri(r,-6,9); c = pk(r,[-3,-2,-1,1,2,3,4,5,6]); } while ((a*b) % c !== 0 || a*b === 0);
    const x = a*b/c;
    return {p:{n:2, a, b, c}, v:x, q:R`For what x is \(\begin{bmatrix}x&${a}\\${b}&${c}\end{bmatrix}\) singular?`, why:R`\(${c}x-${sgn(a)}\cdot${sgn(b)}=0\Rightarrow x=${x}\).`}; }
  let M, i, j, al, be, x;
  do { M = Array.from({length:3}, () => Array.from({length:3}, () => ri(r,-3,5))); i = ri(r,0,2); j = ri(r,0,2);
       M[i][j] = 0; be = det3v(M); M[i][j] = 1; al = det3v(M) - be; x = al ? -be/al : NaN; }
  while (!al || !Number.isInteger(x) || Math.abs(x) > 15);
  const S = M.map((row,a) => row.map((e,b) => a === i && b === j ? 'x' : e));
  return {p:{n:3, M:S}, v:x, q:R`For what x is \(${bm(S)}\) singular?`,
    why:R`The determinant is linear in x: \(${al}x${be < 0 ? '' : '+'}${be}=0\Rightarrow x=${x}\).`}; });
gen('la.detrowop', r => { const d = pk(r,[2,3,4,5,-2,-3]), ops = [], txt = []; let f = 1;
  for (let t = 0; t < 3; t++){ const kind = pk(r,['swap','scale','add']);
    if (kind === 'swap'){ const [a,b] = shuf2(r); f *= -1; txt.push(`swapping rows ${a} and ${b}`); }
    else if (kind === 'scale'){ const k = pk(r,[2,3,-1,-2]), a = ri(r,1,3); f *= k; txt.push(`multiplying row ${a} by ${k}`); }
    else { const c = pk(r,[2,3,-1,5]), [a,b] = shuf2(r); txt.push(`adding ${c} × row ${a} to row ${b}`); }
    ops.push(kind); }
  const v = d*f;
  return {p:{d,f}, v, q:R`A is \(3\times3\) with \(\det A=${d}\). B is made from A by ${txt[0]}, then ${txt[1]}, then ${txt[2]}. Find \(\det B\).`,
    why:R`Swaps multiply by \(-1\), scaling a row by k multiplies by k, adding a multiple of a row changes nothing: \(${d}\times${sgn(f)}=${v}\).`}; });
function shuf2(r){ const a = ri(r,1,3); let b; do { b = ri(r,1,3); } while (b === a); return [a,b]; }
gen('la.detblock', r => { let A, D; do { A = [[ri(r,-3,5), ri(r,-3,5)], [ri(r,-3,5), ri(r,-3,5)]]; D = [[ri(r,-3,5), ri(r,-3,5)], [ri(r,-3,5), ri(r,-3,5)]]; } while (!det2v(A) || !det2v(D));
  const B = [[ri(r,-4,9), ri(r,-4,9)], [ri(r,-4,9), ri(r,-4,9)]], low = r() < 0.5;
  const M = low ? [[...A[0],0,0],[...A[1],0,0],[...B[0],...D[0]],[...B[1],...D[1]]] : [[...A[0],...B[0]],[...A[1],...B[1]],[0,0,...D[0]],[0,0,...D[1]]];
  const v = det2v(A)*det2v(D);
  return {p:{M}, v, q:R`Find \(\det${bm(M)}\).`,
    why:R`The ${low ? 'upper-right' : 'lower-left'} 2×2 block is zero, so \(\det=\det${bm(A)}\cdot\det${bm(D)}=${det2v(A)}\times${sgn(det2v(D))}=${v}\).`}; });
gen('la.detlemmanat', r => { const u = [0,1,2].map(() => ri(r,-2,3)), w = [0,1,2].map(() => ri(r,-2,3)), dot = u.reduce((s,x,i) => s + x*w[i], 0), v = 1 + dot;
  return {p:{u,w}, v, q:R`\(u=(${u.join(',')})^\top\), \(v=(${w.join(',')})^\top\). Find \(\det(I_3+uv^\top)\).`,
    why:R`\(\det(I+uv^\top)=1+v^\top u=1+(${u.map((x,i) => `${sgn(w[i])}\cdot${sgn(x)}`).join('+')})=${v}\).`}; });
gen('la.cofactor', r => { const M = Array.from({length:3}, () => Array.from({length:3}, () => ri(r,-3,6))), i = ri(r,0,2), j = ri(r,0,2), m = det2v(minor(M,i,j)), s_ = (i + j) % 2 ? -1 : 1, v = s_*m;
  return {p:{M,i,j}, v, q:R`For \(A=${bm(M)}\), find the cofactor \(C_{${i + 1}${j + 1}}\).`,
    why:R`Delete row ${i + 1} and column ${j + 1}: \(M_{${i + 1}${j + 1}}=\det${bm(minor(M,i,j))}=${m}\). The sign \((-1)^{${i + j + 2}}=${s_}\) gives \(C_{${i + 1}${j + 1}}=${v}\).`}; });
gen('la.cramer2', r => { let a, b, c, d, x, y; do { a = ri(r,1,6); b = ri(r,-4,6); c = ri(r,-4,6); d = ri(r,1,6); x = ri(r,-5,6); y = ri(r,-5,6); } while (a*d - b*c === 0);
  const e = a*x + b*y, f = c*x + d*y, askX = r() < 0.5, D = a*d - b*c, Dx = e*d - b*f, Dy = a*f - e*c;
  const lin = (p_, q_, rhs) => `${p_ === 1 ? '' : p_ === -1 ? '-' : p_}x${q_ < 0 ? '-' : '+'}${Math.abs(q_) === 1 ? '' : Math.abs(q_)}y=${rhs}`;
  const eq1 = b === 0 ? `${a === 1 ? '' : a}x=${e}` : lin(a,b,e), eq2 = c === 0 ? `${d === 1 ? '' : d}y=${f}` : lin(c,d,f);
  return {p:{a,b,c,d,e,f,askX}, v: askX ? x : y, q:R`Use Cramer’s rule on \(${eq1},\ ${eq2}\). Find ${askX ? 'x' : 'y'}.`,
    why:R`\(\det A=${D}\), \(\det A_${askX ? 'x' : 'y'}=${askX ? Dx : Dy}\), so ${askX ? 'x' : 'y'} \(=${askX ? Dx : Dy}/${sgn(D)}=${askX ? x : y}\).`}; });
gen('la.detperm', r => { const n = ri(r,3,9), sw = Math.floor(n/2), v = sw % 2 ? -1 : 1;
  return {p:{n}, v, q:R`\(J_{${n}}\) is the \(${n}\times${n}\) matrix with ones on the anti-diagonal and zeros elsewhere. Find \(\det J_{${n}}\).`,
    why:R`Reversing ${n} rows takes \(\lfloor ${n}/2\rfloor=${sw}\) swaps, so \(\det J_{${n}}=(-1)^{${sw}}=${v}\).`}; });
gen('la.deteigshift', r => { let e; do { e = [ri(r,-3,5), ri(r,-3,5), ri(r,-3,5)]; } while (new Set(e).size < 3);
  const k = ri(r,-2,4), v = e.reduce((s,l) => s*(l - k), 1), M = k === 0 ? 'A' : k > 0 ? `A-${k === 1 ? '' : k}I` : `A+${-k === 1 ? '' : -k}I`;
  return {p:{e,k}, v, q:R`A is \(3\times3\) with eigenvalues ${e.join(', ')}. Find \(\det(${M})\).`,
    why:R`\(A-kI\) has eigenvalues \(\lambda_i-k\): \(${e.map(l => `(${l}${k < 0 ? '+' + (-k) : '-' + k})`).join('')}=${v}\).`}; });

/* ---------------- Calculus ---------------- */
gen('calc.expx', r => { const a = pk(r,[2,3,4,5,-2,-3]);
  return {p:{a}, v:a, q:R`Evaluate \(\displaystyle\lim_{x\to0}\frac{e^{${a}x}-1}{x}\).`, why:R`\(e^{${a}x}\approx1+${a}x\) near 0, so the limit is ${a}.`}; });
gen('calc.sqrtlim', r => { const a = pk(r,[1,2,3,4,5,6]), v = a/2;
  return {p:{a}, v, q:R`Evaluate \(\displaystyle\lim_{t\to\infty}\big(\sqrt{t^2+${a}t}-t\big)\).`,
    why:R`Multiply by the conjugate: \(\frac{${a}t}{\sqrt{t^2+${a}t}+t}\to\frac{${a}}{2}=${v}\).`}; });
gen('calc.sigmoid', r => { const s = pk(r,[0.1,0.2,0.3,0.4,0.6,0.7,0.8,0.9]), v = rd(s*(1-s));
  return {p:{s}, v, q:R`At a point where \(\sigma(x)=${s}\), find \(\sigma'(x)\) for \(\sigma(x)=\frac{1}{1+e^{-x}}\).`,
    why:R`\(\sigma(1-\sigma)=${s}\times${rd(1-s,2)}=${v}\).`}; });
gen('calc.coef3', r => { const a = pk(r,[2,3]), k = pk(r,[2,3,4]), v = rd(a**k/fact(k));
  return {p:{a,k}, v, tol:0.002, q:R`Find the coefficient of \(x^${k}\) in the Maclaurin series of \(e^{${a}x}\), to 3 decimals.`,
    why:R`\(\frac{${a}^${k}}{${k}!}=\frac{${a**k}}{${fact(k)}}\approx${v.toFixed(3)}\).`}; });
gen('calc.costunit', r => { const P = pk(r,[20,30,40,50,60]), b = pk(r,[0.2,0.5,1]), d = rd(b*P*P, 2), c0 = pk(r,[50,100,200]);
  return {p:{b,d}, v:P, q:R`Cost per unit is \(C(P)=${c0}+${b}P+\frac{${d}}{P}\) for production level \(P>0\). Find the P that minimises it.`,
    why:R`\(C'=${b}-${d}/P^2=0\Rightarrow P^2=${d/b}\Rightarrow P=${P}\).`}; });
gen('calc.rect', r => { const p = 4*ri(r,3,15), v = (p/4)**2;
  return {p:{per:p}, v, q:R`A rectangle has perimeter ${p}. Find its largest possible area.`, why:R`A square of side ${p/4} is best: area ${v}.`}; });
gen('calc.x2ex', r => { const n = ri(r,2,6);
  return {p:{n}, v:n, q:R`Find the \(x\ge0\) that maximises \(f(x)=x^${n}e^{-x}\).`,
    why:R`\(f'=x^{${n-1}}e^{-x}(${n}-x)\), so the maximum is at \(x=${n}\).`}; });
gen('calc.mvtnat', r => { const a = ri(r,0,4), b = a + 2*ri(r,1,3), v = (a+b)/2;
  return {p:{a,b}, v, q:R`\(f(x)=x^2\) on [${a}, ${b}]. Find the c given by the mean value theorem.`,
    why:R`Chord slope \(=(${b*b}-${a*a})/${b-a}=${a+b}\); \(2c=${a+b}\Rightarrow c=${v}\).`}; });

/* ---------------- DSA ---------------- */
gen('dsa.fullbt', r => { const L = ri(r,5,60);
  return {p:{L}, v:2*L-1, q:R`Every node of a binary tree has 0 or 2 children, and it has ${L} leaves. How many nodes does it have?`,
    why:R`\(L=I+1\): ${L-1} internal nodes, total \(2L-1=${2*L-1}\).`}; });
gen('dsa.nulls', r => { const n = ri(r,5,60);
  return {p:{n}, v:n+1, q:R`A binary tree with ${n} nodes is stored with left and right pointers. How many of these pointers are null?`,
    why:R`\(2n=${2*n}\) fields, \(n-1=${n-1}\) used: \(${n+1}\) null.`}; });
gen('dsa.minheight', r => { const n = ri(r,10,500), v = Math.ceil(Math.log2(n+1)) - 1;
  return {p:{n}, v, q:R`What is the minimum possible height of a binary tree with ${n} nodes (a single node has height 0)?`,
    why:R`\(\lceil\log_2(${n}+1)\rceil-1=${v}\): height ${v} holds up to ${2**(v+1)-1} nodes.`}; });
gen('dsa.bincmp', r => { const n = ri(r,20,5000), v = Math.floor(Math.log2(n)) + 1;
  return {p:{n}, v, q:R`Binary search on a sorted array of ${n} elements, one three-way comparison per step. What is the maximum number of comparisons?`,
    why:R`\(\lfloor\log_2${n}\rfloor+1=${v}\).`}; });
gen('dsa.hand', r => { let n = ri(r,6,20), d = ri(r,2,5); if ((n*d) % 2) n += 1;
  return {p:{n,d}, v:n*d/2, q:R`A simple graph has ${n} vertices, each of degree ${d}. How many edges does it have?`,
    why:R`\(${n}\times${d}=${n*d}=2|E|\), so \(|E|=${n*d/2}\).`}; });
gen('dsa.disconn', r => { const n = ri(r,5,15), v = C(n-1,2);
  return {p:{n}, v, q:R`A simple undirected graph on ${n} vertices is disconnected. What is the maximum number of edges it can have?`,
    why:R`A complete graph on ${n-1} vertices plus one isolated vertex: \(\binom{${n-1}}{2}=${v}\).`}; });
gen('dsa.forest', r => { const n = ri(r,20,200), k = ri(r,1,15);
  return {p:{n,k}, v:k, q:R`DFS on an undirected graph with ${n} vertices produces a forest with ${n-k} tree edges. How many connected components does the graph have?`,
    why:R`A forest has \(n-k\) edges, so \(k=${n}-${n-k}=${k}\).`}; });
gen('dsa.hanoi', r => { const n = ri(r,3,10), v = 2**n - 1;
  return {p:{n}, v, q:R`Towers of Hanoi: \(T(n)=2T(n-1)+1\), \(T(1)=1\). How many moves for ${n} disks?`, why:R`\(2^{${n}}-1=${v}\).`}; });
gen('dsa.mergecmp', r => { const a = ri(r,3,20), b = ri(r,3,20);
  return {p:{a,b}, v:a+b-1, q:R`Two sorted lists of sizes ${a} and ${b} are merged. What is the maximum number of comparisons?`,
    why:R`\(${a}+${b}-1=${a+b-1}\).`}; });
gen('dsa.bubcmp', r => { const n = ri(r,4,20), v = n*(n-1)/2;
  return {p:{n}, v, q:R`Plain bubble sort (no early exit) on ${n} elements makes how many comparisons?`, why:R`\(\frac{${n}\cdot${n-1}}{2}=${v}\).`}; });
gen('dsa.collexp', r => { const n = ri(r,5,20), m = pk(r,[10,20,25,50,100]), v = rd(C(n,2)/m);
  return {p:{n,m}, v, q:R`${n} keys are hashed uniformly and independently into ${m} slots. What is the expected number of pairs of keys that collide?`,
    why:R`\(\binom{${n}}2/${m}=${C(n,2)}/${m}=${v}\).`}; });
gen('dsa.linprobe', r => { const m = pk(r,[7,11,13]), s = ri(r,0,m-1), mult = [0,1,2,3,4,5,6];
  for (let i = mult.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [mult[i], mult[j]] = [mult[j], mult[i]]; }
  const uniq = mult.slice(0,4).map(t => s + m*t);
  const T = new Array(m).fill(null); let last = -1;
  for (const k of uniq){ let h = k % m; while (T[h] !== null) h = (h+1) % m; T[h] = k; last = h; }
  return {p:{m,keys:uniq}, v:last, q:R`Table size ${m}, \(h(k)=k\bmod${m}\), linear probing. Keys ${uniq.join(', ')} are inserted in that order. At which index does ${uniq[3]} end up?`,
    why:R`All four keys hash to ${s}, so they fill ${s}, ${(s+1)%m}, ${(s+2)%m}, ${(s+3)%m} in turn (wrapping around). ${uniq[3]} lands at ${last}.`}; });
gen('dsa.postfix', r => { const a = ri(r,1,9), b = ri(r,2,9), c = ri(r,2,9), d = ri(r,1,9), v = a + b*c - d;
  return {p:{a,b,c,d}, v, q:R`Evaluate the postfix expression <code>${a} ${b} ${c} * + ${d} -</code>.`,
    why:R`\(${b}\times${c}=${b*c}\), then \(${a}+${b*c}=${a+b*c}\), then \(${a+b*c}-${d}=${v}\).`}; });

/* ---------------- Machine Learning ---------------- */
gen('ml.slopecorr', r => { const rr = pk(r,[-0.8,-0.5,0.4,0.5,0.6,0.8]), sx = pk(r,[2,4,5]), sy = pk(r,[4,6,10,20]), v = rd(rr*sy/sx);
  return {p:{rr,sx,sy}, v, q:R`The correlation between x and y is ${rr}, \(s_x=${sx}\) and \(s_y=${sy}\). Find the least-squares slope of y on x.`,
    why:R`\(${rr}\times${sy}/${sx}=${v}\).`}; });
gen('ml.marginnat', r => { const [a,b,c] = pk(r,[[3,4,5],[6,8,10],[5,12,13],[8,6,10],[0,4,4],[1,0,1]]), v = rd(2/c);
  return {p:{c}, v, q:R`A hard-margin SVM has \(w=(${a},${b})\). Find the margin width (to 4 decimals if needed).`,
    why:R`\(\|w\|=${c}\), so the margin is \(2/${c}=${v}\).`}; });
gen('ml.params', r => { const L = [ri(r,3,20), ri(r,2,12), ri(r,2,8), ri(r,1,4)], v = L.slice(1).reduce((s,n,i) => s + (L[i]+1)*n, 0);
  return {p:{L}, v, q:R`A fully connected network has layer sizes ${L.join(' → ')}, with a bias on every non-input neuron. How many trainable parameters?`,
    why:R`${L.slice(1).map((n,i) => `(${L[i]}+1)·${n}`).join(' + ')} = ${v}.`}; });
gen('ml.paramsnb', r => { const L = [ri(r,5,30), ri(r,2,10), ri(r,2,6), ri(r,1,3)], v = L.slice(1).reduce((s,n,i) => s + L[i]*n, 0);
  return {p:{L}, v, q:R`A fully connected network has layer sizes ${L.join(' → ')} and no biases. How many weights does it have?`,
    why:R`${L.slice(1).map((n,i) => `${L[i]}·${n}`).join(' + ')} = ${v}.`}; });
gen('ml.kfoldnat', r => { const k = pk(r,[4,5,10]), n = k*ri(r,10,50), v = n*(k-1)/k;
  return {p:{k,n}, v, q:R`${k}-fold cross-validation on ${n} samples. How many samples is each model trained on?`,
    why:R`Each fold holds ${n/k}; train on the other ${k-1}: ${v}.`}; });
gen('ml.loocv', r => { const tot = ri(r,200,2000), test = ri(r,20,Math.floor(tot/4)), v = tot - test;
  return {p:{tot,test}, v, q:R`A dataset has ${tot} samples; ${test} are set aside as a test set. Leave-one-out cross-validation is used on the rest for model selection. How many train/validation splits are made?`,
    why:R`One split per non-test sample: ${v}.`}; });
gen('ml.f1', r => { const P = pk(r,[0.5,0.6,0.7,0.8,0.9]), Rc = pk(r,[0.4,0.5,0.6,0.75,0.8]), v = rd(2*P*Rc/(P+Rc));
  return {p:{P,Rc}, v, tol:0.002, q:R`A classifier has precision ${P} and recall ${Rc}. Find its F1 score, to 3 decimals.`,
    why:R`\(\frac{2(${P})(${Rc})}{${rd(P+Rc,2)}}\approx${v.toFixed(3)}\).`}; });
gen('ml.gini', r => { const a = ri(r,1,9), b = ri(r,1,9), n = a+b, v = rd(1 - (a*a+b*b)/(n*n));
  return {p:{a,b}, v, tol:0.002, q:R`Find the Gini impurity of a node with ${a} positive and ${b} negative examples, to 3 decimals.`,
    why:R`\(1-\big((${a}/${n})^2+(${b}/${n})^2\big)\approx${v.toFixed(3)}\).`}; });
gen('ml.entnat', r => { const a = ri(r,1,9), b = ri(r,1,9), n = a+b, H = -[a,b].reduce((s,x) => s + (x/n)*Math.log2(x/n), 0), v = rd(H);
  return {p:{a,b}, v, tol:0.002, q:R`A node has ${a} positive and ${b} negative examples. Find its entropy in bits, to 3 decimals.`,
    why:R`\(-\tfrac{${a}}{${n}}\log_2\tfrac{${a}}{${n}}-\tfrac{${b}}{${n}}\log_2\tfrac{${b}}{${n}}\approx${v.toFixed(3)}\).`}; });
gen('ml.sgdnat', r => { const w = ri(r,-2,3), x = pk(r,[1,2,-1]), y = ri(r,-3,5), eta = pk(r,[0.1,0.05,0.01]), g = 2*(w*x-y)*x, v = rd(w - eta*g);
  return {p:{w,x,y,eta}, v, q:R`Loss \(L=(wx-y)^2\), current \(w=${w}\), learning rate ${eta}. One SGD step on the sample \(x=${x},\ y=${y}\). Find the new w.`,
    why:R`Gradient \(2(${w*x}-${y})(${x})=${g}\). New \(w=${w}-${eta}(${g})=${v}\).`}; });
gen('ml.pcavar', r => { const e = [ri(r,4,9), ri(r,2,4), ri(r,1,2), 1].sort((a,b) => b-a), tot = e.reduce((a,b) => a+b, 0), v = rd((e[0]+e[1])/tot);
  return {p:{e}, v, tol:0.002, q:R`The covariance matrix has eigenvalues ${e.join(', ')}. What fraction of the total variance do the first two principal components explain (to 3 decimals)?`,
    why:R`\((${e[0]}+${e[1]})/${tot}\approx${v.toFixed(3)}\).`}; });
gen('ml.ldacomp', r => { const K = ri(r,2,10), d = ri(r,2,12), v = Math.min(K-1, d);
  return {p:{K,d}, v, q:R`LDA is used for dimensionality reduction on data with ${K} classes and ${d} features. At most how many discriminant directions can it produce?`,
    why:R`\(\min(K-1,d)=\min(${K-1},${d})=${v}\).`}; });
gen('ml.nbparams', r => { const D = ri(r,3,30), v = 2*D + 1;
  return {p:{D}, v, q:R`A naive Bayes classifier has 2 classes and ${D} binary features. How many independent parameters must be estimated?`,
    why:R`\(2\times${D}\) conditional probabilities plus one prior: ${v}.`}; });
gen('ml.lognat', r => { const w = pk(r,[-2,-1,1,2,3]), b = pk(r,[-2,-1,0,1]), x = pk(r,[-1,0.5,1,2]), z = w*x+b, v = rd(sig(z));
  return {p:{w,b,x}, v, tol:0.002, q:R`Logistic regression with \(w=${w},\ b=${b}\). Find \(P(y=1\mid x=${x})\), to 3 decimals.`,
    why:R`\(z=${w}(${x})+(${b})=${z}\), \(\sigma(${z})\approx${v.toFixed(3)}\).`}; });

/* ---------------- Databases ---------------- */
gen('db.cross', r => { const a = ri(r,5,100), b = ri(r,5,100);
  return {p:{a,b}, v:a*b, q:R`R has 3 attributes and ${a} tuples; S has 2 attributes and ${b} tuples. How many tuples are in \(R\times S\)?`, why:R`\(${a}\times${b}=${a*b}\).`}; });
gen('db.bfr', r => { const B = pk(r,[1024,2048,4096]), Rs = pk(r,[50,64,100,120,200]), n = ri(r,1000,50000), bfr = Math.floor(B/Rs), v = Math.ceil(n/bfr);
  return {p:{B,Rs,n}, v, q:R`Block size ${B} bytes, fixed-length records of ${Rs} bytes (unspanned), ${n} records. How many blocks does the file need?`,
    why:R`\(\lfloor${B}/${Rs}\rfloor=${bfr}\) records per block; \(\lceil${n}/${bfr}\rceil=${v}\) blocks.`}; });
gen('db.bporder', r => { const B = pk(r,[512,1024,2048,4096]), K = pk(r,[4,8,9,10,12]), P = pk(r,[4,6,8]), v = Math.floor((B+K)/(K+P));
  return {p:{B,K,P}, v, q:R`Block size ${B} bytes, key ${K} bytes, child pointer ${P} bytes. What is the maximum number of child pointers in an internal B+ tree node?`,
    why:R`\(${P}p+${K}(p-1)\le${B}\Rightarrow p\le${rd((B+K)/(K+P),3)}\Rightarrow p=${v}\).`}; });
gen('db.cube', r => { const a = ri(r,2,8), b = ri(r,2,8), v = a*b + a + b + 1;
  return {p:{a,b}, v, q:R`Facts(D1, D2, val): D1 takes ${a} values, D2 takes ${b}, and every combination occurs. How many rows does <code>GROUP BY CUBE (D1, D2)</code> return?`,
    why:R`\(${a*b}+${a}+${b}+1=${v}\).`}; });
gen('db.rollupsql', r => { const a = ri(r,2,8), b = ri(r,2,8), v = a*b + a + 1;
  return {p:{a,b}, v, q:R`Facts(D1, D2, val): D1 takes ${a} values, D2 takes ${b}, and every combination occurs. How many rows does <code>GROUP BY ROLLUP (D1, D2)</code> return?`,
    why:R`\(${a*b}+${a}+1=${v}\).`}; });
gen('db.cuboids', r => { const L = [ri(r,1,4), ri(r,1,4), ri(r,1,4)], v = L.reduce((s,l) => s*(l+1), 1);
  return {p:{L}, v, q:R`A data cube has 3 dimensions whose hierarchies have ${L.join(', ')} levels (not counting "all"). How many cuboids are there?`,
    why:R`\(${L.map(l => l+1).join('\\times')}=${v}\).`}; });
gen('db.cuboids0', r => { const n = ri(r,2,8);
  return {p:{n}, v:2**n, q:R`A data cube has ${n} dimensions and no hierarchies. How many cuboids (including the apex) are there?`, why:R`\(2^{${n}}=${2**n}\).`}; });
gen('db.superkeys', r => { const n = ri(r,3,7), v = 2*2**(n-1) - 2**(n-2), names = 'ABCDEFG'.slice(0,n).split('').join(', ');
  return {p:{n}, v, q:R`R(${names}) has exactly two candidate keys, A and B. How many superkeys does it have?`,
    why:R`\(2^{${n-1}}+2^{${n-1}}-2^{${n-2}}=${v}\).`}; });
gen('db.sortedfile', r => { const k = ri(r,6,16);
  return {p:{k}, v:k, q:R`A file sorted on its key occupies ${2**k} blocks. About how many block accesses does a binary search on the key need in the worst case?`,
    why:R`\(\log_2${2**k}=${k}\).`}; });
gen('db.minmaxnat', r => { const lo = 1000*ri(r,5,20), hi = lo + 1000*ri(r,30,90), x = lo + 100*ri(r,1,(hi-lo)/100-1), v = rd((x-lo)/(hi-lo));
  return {p:{lo,hi,x}, v, tol:0.002, q:R`Income ranges from ${lo} to ${hi}. Min–max normalise ${x} to [0, 1], to 3 decimals.`,
    why:R`\((${x}-${lo})/(${hi}-${lo})\approx${v.toFixed(3)}\).`}; });

/* ---------------- AI ---------------- */
gen('ai.bfsnodes', r => { const b = ri(r,2,5), d = ri(r,2,4), v = (b**(d+1)-1)/(b-1);
  return {p:{b,d}, v, q:R`A search tree has branching factor ${b}. How many nodes are there from depth 0 to depth ${d} inclusive?`,
    why:R`\(1+${b}+\dots+${b}^{${d}}=${v}\).`}; });
gen('ai.bnparams', r => { const names = ['A','B','C','D','E'], par = [[]];
  for (let i = 1; i < 5; i++){ const ps = names.slice(0,i).filter(() => r() < 0.4); par.push(ps.slice(0,3)); }
  const v = par.reduce((s,ps) => s + 2**ps.length, 0);
  const desc = names.map((n,i) => par[i].length ? `${n} has ${par[i].length > 1 ? 'parents' : 'parent'} ${par[i].join(', ')}` : `${n} has no parents`).join('; ');
  return {p:{k:par.map(x => x.length)}, v, q:R`Boolean variables: ${desc}. How many independent parameters do the CPTs need?`,
    why:R`Each node needs \(2^{\#\text{parents}}\): ${par.map(ps => 2**ps.length).join(' + ')} = ${v}. The full joint would need 31.`}; });
function chain(r){ return {pa: pk(r,[0.2,0.3,0.4,0.5]), b1: pk(r,[0.6,0.7,0.8,0.9]), b0: pk(r,[0.1,0.2,0.3]), c1: pk(r,[0.4,0.5,0.6,0.7]), c0: pk(r,[0.1,0.2,0.3])}; }
const chainTxt = c => R`Chain A → B → C with \(P(a)=${c.pa}\), \(P(b\mid a)=${c.b1}\), \(P(b\mid\neg a)=${c.b0}\), \(P(c\mid b)=${c.c1}\), \(P(c\mid\neg b)=${c.c0}\).`;
gen('ai.bnjointnat', r => { const c = chain(r), v = rd(c.pa*c.b1*c.c1);
  return {p:c, v, tol:0.001, q:R`${chainTxt(c)} Find \(P(a,b,c)\).`, why:R`\(${c.pa}\times${c.b1}\times${c.c1}=${v}\).`}; });
gen('ai.vemarg', r => { const c = chain(r), pb = c.pa*c.b1 + (1-c.pa)*c.b0, v = rd(c.c1*pb + c.c0*(1-pb));
  return {p:c, v, tol:0.002, q:R`${chainTxt(c)} Find \(P(c)\), to 3 decimals.`,
    why:R`\(P(b)=${rd(pb)}\), then \(P(c)=${c.c1}(${rd(pb)})+${c.c0}(${rd(1-pb)})\approx${v.toFixed(3)}\).`}; });
gen('ai.veposterior', r => { const c = chain(r), pb = c.pa*c.b1 + (1-c.pa)*c.b0, pc = c.c1*pb + c.c0*(1-pb), pac = c.pa*(c.b1*c.c1 + (1-c.b1)*c.c0), v = rd(pac/pc);
  return {p:c, v, tol:0.003, q:R`${chainTxt(c)} Find \(P(a\mid c)\), to 3 decimals.`,
    why:R`\(P(a,c)=${c.pa}[${c.b1}(${c.c1})+${rd(1-c.b1,2)}(${c.c0})]=${rd(pac)}\) and \(P(c)=${rd(pc)}\), so \(P(a\mid c)\approx${v.toFixed(3)}\).`}; });
})();
