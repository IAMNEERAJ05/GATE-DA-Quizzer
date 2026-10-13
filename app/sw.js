/* Offline support when the app is served from a website (GitHub Pages, Netlify, ...).
   Not used when the app is opened as a local file. Every file in PRECACHE is saved on first visit;
   after that the app opens without internet. Files are refreshed in the background whenever you are online,
   and when a new VERSION is found the page reloads itself once (see index.html), so an upload shows up within seconds.
   When you add a new file to app/ (e.g. a new data/*.js), add it to PRECACHE and change VERSION. */
const VERSION = 'gdq-2026-10-13d';
const PRECACHE = [
  './', './index.html', './manifest.webmanifest', './js/app.js', './vendor/tex-svg-full.js',
  './data/syllabus.js', './data/papers.js', './data/ps.js', './data/la.js', './data/calc.js', './data/dsa.js',
  './data/ml.js', './data/db.js', './data/ai.js', './data/ga.js', './data/generators.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* only remove this app's own old caches: another app on the same site (e.g. an EE version) keeps its own */
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('gdq-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* stale-while-revalidate: answer from the cache at once, refresh the cache from the network in the background */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true});
    /* no-cache: ask the server whether the file changed, instead of trusting the browser's 10-minute cache */
    const net = (url.origin === location.origin ? fetch(req.url, {cache: 'no-cache'}) : fetch(req)).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit){ e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  }));
});
