/*
 * Location Map Block
 * Renders an interactive map beside the location list on the branches /
 * partners pages using MapLibre GL + OpenFreeMap vector tiles. Clicking a
 * location card pans/zooms the map to that pin and opens its popup. Works in
 * English and Arabic (RTL) — pins and popups use the language of the page.
 *
 * MapLibre GL is loaded from a CDN on demand and OpenFreeMap serves the vector
 * tiles; no API key, account, or billing is required, and OpenFreeMap permits
 * production use (unlike OpenStreetMap's raster tile servers). The pin
 * coordinates ship in locations.json alongside this block.
 */

const MAPLIBRE_VERSION = '4.7.1';
const MAPLIBRE_JS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_CSS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Center ([lng, lat] for MapLibre) + zoom that frames the Abu Dhabi emirate
// (covers Al Ain to Al Dhafra).
const DEFAULT_CENTER = [54.0, 24.0];
const DEFAULT_ZOOM = 6.5;

let maplibreLoader;
/** Load the MapLibre GL library (JS + CSS) once, resolving with `window.maplibregl`. */
function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (!maplibreLoader) {
    maplibreLoader = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = MAPLIBRE_CSS;
        document.head.append(link);
      }
      const script = document.createElement('script');
      script.src = MAPLIBRE_JS;
      script.async = true;
      script.onload = () => resolve(window.maplibregl);
      script.onerror = () => reject(new Error('MapLibre GL failed to load'));
      document.head.append(script);
    });
  }
  return maplibreLoader;
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

  let maplibregl;
  try {
    maplibregl = await loadMapLibre();
  } catch {
    // Library/tiles unavailable — fall back to the plain list.
    block.remove();
    return;
  }

  const map = new maplibregl.Map({
    container: canvas,
    style: MAP_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  map.scrollZoom.disable();

  const approxNote = arabic ? 'موقع تقريبي' : 'Approximate location';
  const markersByName = new Map();
  const bounds = new maplibregl.LngLatBounds();
  points.forEach((p) => {
    const label = labelFor(p, arabic);
    const suffix = p.approx ? `<br><em>${approxNote}</em>` : '';
    const popup = new maplibregl.Popup({ offset: 24 })
      .setHTML(`<strong>${label}</strong>${suffix}`);
    const marker = new maplibregl.Marker({ color: '#6b42d1' })
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map);
    markersByName.set(normalize(label), { marker, popup, lngLat: [p.lng, p.lat] });
    bounds.extend([p.lng, p.lat]);
  });
  if (points.length > 1) map.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 0 });
  else map.setCenter([points[0].lng, points[0].lat]);

  // Link one location card to its map pin: clicking (or keyboard-activating)
  // the card focuses the pin and opens its popup. No-op if the card's name
  // has no matching pin, or if it was already wired.
  const wireCard = (li) => {
    if (li.dataset.mapLinked) return;
    const name = normalize(li.querySelector('h3')?.textContent);
    const entry = markersByName.get(name);
    if (!entry) return;
    li.dataset.mapLinked = 'true';
    li.classList.add('location-map-linked');
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    const focus = () => {
      map.flyTo({ center: entry.lngLat, zoom: Math.max(map.getZoom(), 12) });
      if (!entry.popup.isOpen()) entry.marker.togglePopup();
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

  // MapLibre measures the container on init; if it was hidden/resized, correct it.
  requestAnimationFrame(() => map.resize());
}
