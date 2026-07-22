/*
 * Booking widget (visual replica of the nileair.com flight-search bar).
 * Static demo — fields are presentational only, no search is performed.
 */

const PLANE = '<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.2 495.9c-5.7 10-16.3 16.1-27.8 16.1l-56.2 0c-10.6 0-18.3-10.2-15.4-20.4l49-171.6L112 320 68.8 377.6c-3 4-7.8 6.4-12.8 6.4l-42 0c-7.8 0-14-6.3-14-14c0-1.3 .2-2.6 .5-3.9L32 256 .5 145.9c-.4-1.3-.5-2.6-.5-3.9c0-7.8 6.3-14 14-14l42 0c5 0 9.8 2.4 12.8 6.4L112 192l102.9 0-49-171.6C162.9 10.2 170.6 0 181.2 0l56.2 0c11.5 0 22.1 6.2 27.8 16.1L365.7 192l116.6 0z"/></svg>';
const TICKET = '<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M64 64C28.7 64 0 92.7 0 128l0 64c0 8.8 7.4 15.7 15.7 18.6C34.5 217.1 48 235 48 256s-13.5 38.9-32.3 45.4C7.4 304.3 0 311.2 0 320l0 64c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-64c0-8.8-7.4-15.7-15.7-18.6C541.5 294.9 528 277 528 256s13.5-38.9 32.3-45.4c8.3-2.9 15.7-9.8 15.7-18.6l0-64c0-35.3-28.7-64-64-64L64 64zm64 112l0 160c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16l0-160c0-8.8-7.2-16-16-16l-288 0c-8.8 0-16 7.2-16 16z"/></svg>';
const PLANE_LAND = '<svg viewBox="0 0 640 512" aria-hidden="true"><path fill="currentColor" d="M.3 166.9L0 68C0 57.7 9.5 50.1 19.5 52.3l35.6 7.9c10.6 2.3 19.2 9.9 23 20L96 128l127.3 37.6L181.8 20.4C178.9 10.2 186.6 0 197.2 0l40.1 0c11.6 0 22.2 6.2 27.9 16.3l109 193.8 107.2 31.7c15.9 4.7 30.8 12.5 43.7 22.8l34.4 27.6c24 19.2 18.1 57.3-10.7 68.2c-41.2 15.6-86.2 18.1-128.8 7.1L121.7 289.8c-11.1-2.9-21.2-8.7-29.3-16.9L9.5 189.4c-5.9-6-9.3-14.1-9.3-22.5zM32 448l576 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>';

const TABS = [
  { label: 'Flights', icon: PLANE },
  { label: 'My Bookings', icon: TICKET },
  { label: 'Flight Status', icon: PLANE_LAND },
];
const TRIP_TYPES = ['Round Trip', 'One Way', 'Multi-City'];

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

export default function decorate(block) {
  block.textContent = '';

  // --- tab strip ---
  const tabs = el('div', 'booking-widget-tabs');
  TABS.forEach(({ label, icon }, i) => {
    const tab = el('button', `booking-widget-tab${i === 0 ? ' active' : ''}`);
    tab.type = 'button';
    tab.innerHTML = `<span class="booking-widget-tab-icon">${icon}</span>${label}`;
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.booking-widget-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
    tabs.append(tab);
  });

  // --- search form row ---
  const form = el('div', 'booking-widget-form');

  const fromField = el('button', 'booking-widget-airport');
  fromField.type = 'button';
  fromField.innerHTML = '<span class="booking-widget-code">CAI</span><span class="booking-widget-city">Cairo, Egypt</span>';

  const swap = el('button', 'booking-widget-swap', '&#10231;');
  swap.type = 'button';
  swap.setAttribute('aria-label', 'Swap origin and destination');

  const toField = el('button', 'booking-widget-airport');
  toField.type = 'button';
  toField.innerHTML = '<span class="booking-widget-code">To</span><span class="booking-widget-city">Your Destination</span>';

  const trip = el('div', 'booking-widget-trip booking-widget-field');
  const tripCurrent = el('span', 'booking-widget-trip-current', TRIP_TYPES[0]);
  const tripList = el('ul', 'booking-widget-trip-list');
  TRIP_TYPES.forEach((t) => {
    const li = el('li', null, t);
    li.addEventListener('click', () => { tripCurrent.textContent = t; trip.classList.remove('open'); });
    tripList.append(li);
  });
  trip.append(tripCurrent, tripList);
  trip.addEventListener('click', (e) => {
    if (tripList.contains(e.target)) return;
    trip.classList.toggle('open');
  });

  const dates = el('div', 'booking-widget-field booking-widget-dates');
  dates.innerHTML = '<span class="booking-widget-value">07/14/2026 &ndash; 07/16/2026</span>';

  const pax = el('div', 'booking-widget-field booking-widget-pax');
  pax.innerHTML = '<span class="booking-widget-value">Passengers (1)</span>';

  const search = el('button', 'booking-widget-search');
  search.type = 'button';
  search.setAttribute('aria-label', 'Search flights');
  search.innerHTML = '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>';

  form.append(fromField, swap, toField, trip, dates, pax, search);

  // --- options row ---
  const options = el('div', 'booking-widget-options');
  options.innerHTML = '<span class="booking-widget-options-label">Search Options</span>'
    + '<label class="booking-widget-check"><input type="checkbox"> Show Premium Business class only</label>';

  const inner = el('div', 'booking-widget-inner');
  inner.append(tabs, form, options);
  block.append(inner);
}
