# location-map

Renders an interactive Google Map above the location list on the
`/locations/branches` and `/locations/partners` pages. Pins come from the
shipped `locations.json`; on the branches page, clicking a location card pans
and zooms the map to that pin and opens its popup. Works in English and Arabic
(RTL) — pins and popups use the language of the page.

The block is synthesized automatically (see `buildLocationMap` in
`scripts/scripts.js`); it is not authored into the page.

## Enabling the map (Google Maps API key)

The map needs a Google Maps JavaScript API key. **Without a key the block
removes itself and the page shows the plain location list** — nothing breaks.

The key is read from page metadata, so it lives in the authored content, never
in code. To turn the map on:

1. In the Google Cloud console, create an API key with the **Maps JavaScript
   API** enabled.
2. Restrict it to **HTTP referrers** for the site's domains, e.g.
   `*.aem.page/*`, `*.aem.live/*`, and the production domain. A referrer-
   restricted browser key is safe to expose in client-side code.
3. Add the key to the pages' metadata as **`maps-api-key`**. In Document
   Authoring, add a page metadata row with key `maps-api-key` and the key as
   the value (site-wide metadata works too, so both locations pages inherit it).

The block reads `<meta name="maps-api-key">`. As a local dev fallback it also
accepts `window.TAQA_MAPS_KEY`.

## Coordinates (`locations.json`)

- **branches** — the 11 TAQA service centers, one pin each, with verified
  coordinates. `name` (English) / `ar` (Arabic) match the location card titles
  so cards link to pins.
- **partners** — the ~275 partner offices are grouped into one pin per emirate
  with a count (e.g. "Abu Dhabi area — 184 partner locations"), because the
  source partner addresses only resolve to city level. These pins are marked
  `approx` and show an "Approximate location" note in the popup.

To adjust a pin, edit its `lat`/`lng` in `locations.json`.
