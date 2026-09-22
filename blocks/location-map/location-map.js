/*
 * Location Map Block
 * Renders an interactive map beside the location list on the branches /
 * partners pages using Leaflet + OpenStreetMap. Clicking a location card
 * pans/zooms the map to that pin and opens its popup. Works in English and
 * Arabic (RTL) — pins and popups use the language of the page.
 *
 * Leaflet is loaded from a CDN on demand; no API key, account, or billing is
 * required. The pin coordinates ship in locations.json alongside this block.
 */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

// Center + zoom that frames the Abu Dhabi emirate (covers Al Ain to Al Dhafra).
const DEFAULT_CENTER = [24.0, 54.0];
const DEFAULT_ZOOM = 7;

let leafletLoader;
/** Load the Leaflet library (JS + CSS) once, resolving with `window.L`. */
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoader) {
    leafletLoader = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.append(link);
      }
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('Leaflet failed to load'));
      document.head.append(script);
    });
  }
  return leafletLoader;
}

const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Fetch the shipped coordinate file for this block. */
let coordsPromise;
async function loadCoords() {
  if (!coordsPromise) {
    coordsPromise = (async () => {
      const url = `${window.hlx?.codeBasePath || ''}/blocks/location-map/locations.json`;
      const resp = await fetch(url).catch(() => null);
      if (!resp || !resp.ok) return { branches: [], partners: [] };
      return resp.json().catch(() => ({ branches: [], partners: [] }));
    })();
  }
  return coordsPromise;
}

/** Which dataset does this page use — partners page vs. the branches page. */
function datasetForPage() {
  return /\/locations\/partners/i.test(window.location.pathname) ? 'partners' : 'branches';
}

/** True on Arabic (`/ar` or `/ar-xx/`) paths. */
function isArabicPage() {
  return /\/ar(-[a-z]{2})?\//i.test(window.location.pathname);
}

/** The label for a point in the current page language (falls back to English). */
function labelFor(point, arabic) {
  return (arabic && point.ar) ? point.ar : point.name;
}

export default async function decorate(block) {
  // The location cards are rendered by the sibling cards-location block.
  const section = block.closest('.section') || block.parentElement;

  const arabic = isArabicPage();
  const data = await loadCoords();
  const points = (data[datasetForPage()] || [])
    .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
  if (!points.length) { block.remove(); return; }

  const canvas = document.createElement('div');
  canvas.className = 'location-map-canvas';
  block.textContent = '';
  block.append(canvas);

  let L;
  try {
    L = await loadLeaflet();
  } catch {
    // Tiles/library unavailable — fall back to the plain list.
    block.remove();
    return;
  }

  const map = L.map(canvas, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const approxNote = arabic ? 'موقع تقريبي' : 'Approximate location';
  const markersByName = new Map();
  const latlngs = [];
  points.forEach((p) => {
    const label = labelFor(p, arabic);
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    const suffix = p.approx ? `<br><em>${approxNote}</em>` : '';
    marker.bindPopup(`<strong>${label}</strong>${suffix}`);
    markersByName.set(normalize(label), marker);
    latlngs.push([p.lat, p.lng]);
  });
  if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [30, 30] });
  else map.setView(latlngs[0], 13);

  // Link one location card to its map pin: clicking (or keyboard-activating)
  // the card focuses the pin and opens its popup. No-op if the card's name
  // has no matching pin, or if it was already wired.
  const wireCard = (li) => {
    if (li.dataset.mapLinked) return;
    const name = normalize(li.querySelector('h3')?.textContent);
    const marker = markersByName.get(name);
    if (!marker) return;
    li.dataset.mapLinked = 'true';
    li.classList.add('location-map-linked');
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    const focus = () => {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13));
      marker.openPopup();
      canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    li.addEventListener('click', focus);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(); }
    });
  };

  // The cards-location block decorates independently and may finish before or
  // after this one, so we can't rely on a fixed wait. Wire whatever cards exist
  // now, then observe the section for cards that appear later.
  const wireAll = (root) => root.querySelectorAll('.cards-location ul > li').forEach(wireCard);
  const scope = section || document;
  wireAll(scope);
  const observer = new MutationObserver(() => {
    wireAll(scope);
    if (scope.querySelector('.cards-location ul > li')) observer.disconnect();
  });
  observer.observe(scope, { childList: true, subtree: true });
  // Safety valve: stop observing after 10s regardless.
  setTimeout(() => observer.disconnect(), 10000);

  // Leaflet measures the container on init; if it was hidden/resized, correct it.
  requestAnimationFrame(() => map.invalidateSize());
}
