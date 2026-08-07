/* Service worker for the PDF tools.
 *
 * ─── READ THIS BEFORE CHANGING ANYTHING ──────────────────────────────
 * A service worker installs onto visitors' devices and keeps running there,
 * so a bad one serves stale or broken pages to people who cannot easily
 * clear it. Every decision below is deliberately conservative:
 *
 *   1. HTML is ALWAYS network-first. Cached HTML would otherwise pin
 *      visitors to an old build whose fingerprinted CSS and JS no longer
 *      exist — the "site looks unstyled" failure this project has already
 *      hit once through caching.
 *   2. Only fingerprinted assets are cached aggressively, because their
 *      filename changes whenever their contents do.
 *   3. Bumping CACHE wipes every old cache on activate. That is the kill
 *      switch: change the version, push, every device cleans itself.
 *
 * ─── TWO BUGS THAT MADE v1 FAIL OFFLINE ──────────────────────────────
 * Both were found by testing on a real phone, and neither was visible in
 * any automated check:
 *
 *   TRAILING SLASHES. Astro builds directories, so the real URL is
 *   /merge-pdf/ — but v1 precached '/merge-pdf'. The Cache API matches on
 *   the full URL, so every offline lookup missed, and the offline fallback
 *   missed too because it had the same problem. Pages are now stored under
 *   both forms and looked up under both.
 *
 *   LAZY CHUNKS. pdf-lib is a 411KB chunk that no page's HTML references —
 *   it is imported at runtime when a widget hydrates. v1 only cached assets
 *   after they had been fetched once, so anyone who installed from /pdf and
 *   went offline without opening a tool had no PDF engine. The asset list is
 *   now generated at build time by scripts/build-sw.mjs, which is also why
 *   the placeholder below must stay exactly as it is.
 */

const CACHE = 'gazza-pdf-v2';

/* Written at build time by scripts/build-sw.mjs. Do not edit by hand and do
   not change the placeholder text — the script matches on it. */
const ASSETS = /*__PRECACHE_ASSETS__*/ [];

/* PDF tool pages, in the trailing-slash form the site actually serves. */
const PAGES = [
  '/pdf/',
  '/merge-pdf/',
  '/split-pdf/',
  '/delete-pdf-pages/',
  '/rotate-pdf/',
  '/reorder-pdf-pages/',
  '/images-to-pdf/',
  '/add-page-numbers/',
  '/watermark-pdf/',
  '/offline/',
];

/** Both spellings of a path, so a lookup can't miss on a slash. */
function variants(pathname) {
  const bare = pathname.replace(/\/$/, '');
  return bare === '' ? ['/'] : [bare, bare + '/'];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Individually, not addAll: addAll rejects the whole install if any one
      // URL fails, which would leave visitors with no worker at all.
      await Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => null))
      );
      await Promise.all(
        PAGES.map(async (page) => {
          try {
            const res = await fetch(page, { cache: 'reload' });
            if (!res.ok) return;
            // Store under both /x and /x/ so navigation matches either way.
            for (const v of variants(new URL(page, self.location.origin).pathname)) {
              await cache.put(v, res.clone());
            }
          } catch {
            /* offline at install time, or the page moved — skip it */
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch anything that isn't a plain GET on our own origin. That rules
  // out ad requests, analytics and any future POST endpoint.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => {
            for (const v of variants(url.pathname)) cache.put(v, copy.clone());
          });
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          for (const v of variants(url.pathname)) {
            const hit = await cache.match(v);
            if (hit) return hit;
          }
          return (
            (await cache.match('/offline/')) ||
            (await cache.match('/offline')) ||
            new Response('<h1>Offline</h1>', {
              status: 503,
              headers: { 'Content-Type': 'text/html' },
            })
          );
        })
    );
    return;
  }

  // Fingerprinted build output and icons: cache-first is safe, because the
  // filename changes whenever the contents do.
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});

/* Lets a page force an update without the user reinstalling anything. */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
