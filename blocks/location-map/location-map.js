/*
 * Location Map Block
 * Renders an interactive Google Map beside the location list on the branches /
 * partners pages. Pins come from a shipped coordinate file (locations.json);
 * clicking a location card pans/zooms the map to that pin and opens its popup.
 *
 * The Google Maps API key is read from page metadata (`maps-api-key`) so it
 * lives in the authored content, never in code. It must be a browser key that
 * is HTTP-referrer-restricted to the site's domains. When no key is present the
 * block degrades to the plain list (no map), so pages never break.
 */

const MAPS_KEY = () => (
  document.querySelector('meta[name="maps-api-key"]')?.content
  || window.TAQA_MAPS_KEY
  || ''
).trim();

// Center + zoom that frames the Abu Dhabi emirate (covers Al Ain to Al Dhafra).
const DEFAULT_CENTER = { lat: 24.0, lng: 54.0 };
const DEFAULT_ZOOM = 7;

let mapsLoader;
/** Load the Google Maps JS API once, resolving when `google.maps` is ready. */
function loadGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!mapsLoader) {
    mapsLoader = new Promise((resolve, reject) => {
      const cb = `__taqaMapsInit_${Date.now()}`;
      window[cb] = () => resolve(window.google.maps);
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&loading=async`;
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.append(script);
    });
  }
  return mapsLoader;
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
  const key = MAPS_KEY();
  // The location cards are rendered by the sibling cards-location block.
  const section = block.closest('.section') || block.parentElement;
  const cardsList = section?.querySelector('.cards-location ul')
    || document.querySelector('.cards-location ul');

  if (!key) {
    // No key configured — leave the list as the only UI and remove the empty
    // map shell so nothing looks broken.
    block.remove();
    return;
  }

  const arabic = isArabicPage();
  const data = await loadCoords();
  const points = data[datasetForPage()] || [];
  if (!points.length) { block.remove(); return; }

  const canvas = document.createElement('div');
  canvas.className = 'location-map-canvas';
  block.textContent = '';
  block.append(canvas);

  let maps;
  try {
    maps = await loadGoogleMaps(key);
  } catch {
    block.remove();
    return;
  }

  const map = new maps.Map(canvas, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });
  const bounds = new maps.LatLngBounds();
  const info = new maps.InfoWindow();
  const markersByName = new Map();

  const approxNote = arabic ? 'موقع تقريبي' : 'Approximate location';
  points.forEach((p) => {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
    const label = labelFor(p, arabic);
    const marker = new maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, title: label });
    const suffix = p.approx ? `<br><em>${approxNote}</em>` : '';
    marker.addListener('click', () => {
      info.setContent(`<strong>${label}</strong>${suffix}`);
      info.open(map, marker);
    });
    // Key by the language-appropriate label so cards on this page can match.
    markersByName.set(normalize(label), marker);
    bounds.extend(marker.getPosition());
  });
  if (!bounds.isEmpty()) map.fitBounds(bounds);

  // Wire each location card to focus its pin on the map.
  if (cardsList) {
    cardsList.querySelectorAll(':scope > li').forEach((li) => {
      const name = normalize(li.querySelector('h3')?.textContent);
      const marker = markersByName.get(name);
      if (!marker) return;
      li.classList.add('location-map-linked');
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      const focus = () => {
        map.panTo(marker.getPosition());
        map.setZoom(Math.max(map.getZoom(), 13));
        maps.event.trigger(marker, 'click');
        canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      li.addEventListener('click', focus);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(); }
      });
    });
  }
}
