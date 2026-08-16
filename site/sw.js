/* Sabine Research Desk 95 offline cache — SPDX-License-Identifier: Apache-2.0 */
'use strict';

const CACHE_NAME = 'sabine-research-desk-95-v1.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './js/app.js',
  './data/context.bundle.js',
  './data/projection-manifest.json',
  './assets/icon.svg',
  './manifest.webmanifest',
  './robots.txt',
  './llms.txt',
  './ai-access-policy.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('sabine-research-desk-95-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const cachedResponse = caches.match(event.request);
  const network = fetch(event.request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  });

  event.respondWith(
    cachedResponse
      .then((cached) => cached || network)
      .catch(() => (event.request.mode === 'navigate'
        ? caches.match('./index.html').then((response) => response || Response.error())
        : Response.error()))
  );
  event.waitUntil(network.catch(() => undefined));
});
