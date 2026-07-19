/*
 * Booking widget (visual replica of the nileair.com flight-search bar).
 * Static demo — fields are presentational only, no search is performed.
 */

const TABS = ['Flights', 'My Bookings', 'Flight Status'];
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
  TABS.forEach((label, i) => {
    const tab = el('button', `booking-widget-tab${i === 0 ? ' active' : ''}`);
    tab.type = 'button';
    tab.textContent = label;
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

  const swap = el('button', 'booking-widget-swap', '&#8646;');
  swap.type = 'button';
  swap.setAttribute('aria-label', 'Swap origin and destination');

  const toField = el('button', 'booking-widget-airport');
  toField.type = 'button';
  toField.innerHTML = '<span class="booking-widget-code">To</span><span class="booking-widget-city">Your Destination</span>';

  const trip = el('div', 'booking-widget-trip');
  const tripCurrent = el('span', 'booking-widget-trip-current', TRIP_TYPES[0]);
  const tripList = el('ul', 'booking-widget-trip-list');
  TRIP_TYPES.forEach((t) => {
    const li = el('li', null, t);
    li.addEventListener('click', () => { tripCurrent.textContent = t; trip.classList.remove('open'); });
    tripList.append(li);
  });
  trip.append(tripCurrent, tripList);
  trip.addEventListener('click', (e) => {
    if (e.target === tripList || tripList.contains(e.target)) return;
    trip.classList.toggle('open');
  });

  const dates = el('div', 'booking-widget-field booking-widget-dates');
  dates.innerHTML = '<span class="booking-widget-label">Dates</span><span class="booking-widget-value">Depart — Return</span>';

  const pax = el('div', 'booking-widget-field booking-widget-pax');
  pax.innerHTML = '<span class="booking-widget-label">Passengers</span><span class="booking-widget-value">1 Adult</span>';

  const search = el('button', 'booking-widget-search');
  search.type = 'button';
  search.setAttribute('aria-label', 'Search flights');
  search.innerHTML = '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>';

  form.append(fromField, swap, toField, trip, dates, pax, search);

  // --- options row ---
  const options = el('div', 'booking-widget-options');
  options.innerHTML = '<span class="booking-widget-options-label">Search Options</span>'
    + '<label class="booking-widget-check"><input type="checkbox"> Show Premium Business class only</label>';

  const inner = el('div', 'booking-widget-inner');
  inner.append(tabs, form, options);
  block.append(inner);
}
