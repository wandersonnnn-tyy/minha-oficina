// Guarda o app no celular para abrir sem internet.
const VERSAO = 'minha-oficina-v6';
const ARQUIVOS = [
  './', './index.html', './login.html', './aprovacao.html',
  './dc-runtime.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './img/honda.png', './img/yamaha.png', './img/pix.png', './img/whatsapp.png',
  './img/mt03.jpg', './img/nmax.jpg', './img/pcx.jpg', './img/xmax.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// páginas: tenta a internet primeiro (para pegar atualizações), senão usa a cópia guardada.
// resto (imagens, fontes, scripts): usa a cópia guardada e atualiza em segundo plano.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const copia = r.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((guardado) => {
      const daRede = fetch(req).then((r) => {
        if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
        return r;
      }).catch(() => guardado);
      return guardado || daRede;
    })
  );
});
