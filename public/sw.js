/* Service worker for the PDF tools.
 *
 * ─── READ THIS BEFORE CHANGING ANYTHING ──────────────────────────────
 * A service worker is the most dangerous file on the site. It installs onto
 * visitors' devices and keeps running there, so a bad one can serve stale or
 * broken pages to people who then cannot easily clear it. Every decision below
 * is deliberately conservative for that reason:
 *
 *   1. HTML is ALWAYS network-first. A cached page would otherwise pin
 *      visitors to an old build whose fingerprinted CSS and JS no longer
 *      exist — the exact "everything looks unstyled" failure this project has
 *      already hit through caching once.
 *   2. Only fingerprinted assets are cached aggressively, and only because
 *      their filename changes whenever their content does.
 *   3. Bumping CACHE below wipes every old cache on activate. That is the
 *      kill switch: change the version, push, and every device cleans itself.
 *
 * WHY IT EXISTS: the PDF tools run entirely in the browser, so once the page
 * and pdf-lib are cached they work with no connection at all. "Merge PDFs on
 * a train with no signal, and the file never leaves your phone" is something
 * Smallpdf and iLovePDF structurally cannot offer, because their tools depend
 * on uploading.
 */

const CACHE = 'gazza-pdf-v1';

/* The PDF tool pages. Precached on install so the app works offline
   immediately after being added to the home screen. */
const PAGES = [
  '/pdf',
  '/merge-pdf',
  '/split-pdf',
  '/delete-pdf-pages',
  '/rotate-pdf',
  '/reorder-pdf-pages',
  '/images-to-pdf',
  '/add-page-numbers',
  '/watermark-pdf',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll rejects the whole install if any single URL fails, which would
      // leave visitors with no worker at all. Add them individually instead.
      Promise.all(PAGES.map((url) => cache.add(url).catch(() => null)))
    )
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

  // Never touch anything that isn't a plain GET on our own origin. That
  // rules out ad requests, analytics and any future POST endpoint.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network first. Fall back to cache only when genuinely offline, and to
    // the offline page when we have nothing better.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match('/offline') || Response.error())
        )
    );
    return;
  }

  // Fingerprinted build output and icons: safe to serve from cache first,
  // because the filename changes whenever the contents do.
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

/* Lets the page force an update without the user reinstalling anything. */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
