const CACHE_NAME = 'zenith-v3'; // Naikkan versi karena kita ubah arsitektur

// Hanya simpan Core App Shell yang PASTI berhasil didownload
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://i.ibb.co.com/0RBWMkhm/1772351178191.png'
];

// 1. INSTALASI & CACHING CORE ASSETS
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Langsung aktifkan versi terbaru
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Zenith Ultra: Memasang Arsitektur Offline...');
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. AKTIVASI & BERSIHKAN SAMPAH CACHE LAMA
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Zenith Ultra: Membersihkan Cache Lama ->', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Langsung ambil alih kontrol halaman
});

// 3. STRATEGI FETCH: CACHE FIRST + DYNAMIC CACHING
self.addEventListener('fetch', (e) => {
  // Abaikan request dari extension browser (chrome-extension://)
  if (!(e.request.url.indexOf('http') === 0)) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Jika sudah ada di cache lokal, langsung gunakan! (Super Cepat)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada di cache (misal: JS CDN, Web Fonts dari FontAwesome)
      // Ambil dari internet, LALU simpan otomatis ke cache untuk penggunaan offline berikutnya
      return fetch(e.request).then((networkResponse) => {
        // Jangan cache jika response error atau tipe opaque yang tidak aman
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // Clone response karena response hanya bisa dibaca satu kali
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.log('Zenith Ultra: Offline Mode Aktif - Tidak ada koneksi.', err);
      });
    })
  );
});
