# location-map

Renders an interactive map above the location list on the
`/locations/branches` and `/locations/partners` pages using **Leaflet +
OpenStreetMap**. On the branches page, clicking a location card pans and zooms
the map to that pin and opens its popup. Works in English and Arabic (RTL) —
pins and popups use the language of the page.

The block is synthesized automatically (see `buildLocationMap` in
`scripts/scripts.js`); it is not authored into the page.

## No API key required

Leaflet and OpenStreetMap tiles are free and open — **no account, API key, or
billing is needed**, and the map renders as soon as the code is deployed.
Leaflet is loaded on demand from the unpkg CDN. If the library or tiles are
unavailable, the block removes itself and the page shows the plain location
list, so nothing breaks.

> Note: OpenStreetMap's public tile server is fine for this traffic. If usage
> grows, point the `L.tileLayer(...)` URL in `location-map.js` at a dedicated
> tile provider (e.g. a free MapTiler/Stadia Maps key) — no other change needed.

## Coordinates (`locations.json`)

- **branches** — the 11 TAQA service centers, one pin each, with verified
  coordinates. `name` (English) / `ar` (Arabic) match the location card titles
  so cards link to pins.
- **partners** — the ~275 partner offices are grouped into one pin per emirate
  with a count (e.g. "Abu Dhabi area — 184 partner locations"), because the
  source partner addresses only resolve to city level. These pins are marked
  `approx` and show an "Approximate location" note in the popup.

To adjust a pin, edit its `lat`/`lng` in `locations.json`.
