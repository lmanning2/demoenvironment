/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-location. Base: cards.
 * Source: locations template — div[class*='locator_container']
 *
 * The source is a location finder: a list of branch/partner cards (name,
 * address, phone) beside a Google Map. The map needs a billed API key and is
 * not migratable. The card buttons render asynchronously, so at import time the
 * locator container exposes the data as a flat run of paragraphs:
 *   "Find a location" (h4), "All services", "N locations found",
 *   then repeating [name, address, phone, "More"] per location.
 * We group those into location cards.
 *
 * Cards (no images) library structure: 1 column, multiple rows. First row is
 * the block name; each subsequent row is one location card (name heading +
 * address + phone).
 */
const SKIP = /^(find a location|all services|\d+\s+locations?\s+found|more|filter|search)$/i;

export default function parse(element, { document }) {
  // Collect the meaningful text lines in order.
  const lines = [...element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, span')]
    .map((n) => n.textContent.trim())
    .filter(Boolean);

  // De-duplicate consecutive repeats and drop UI chrome lines.
  const cleaned = [];
  lines.forEach((t) => {
    if (SKIP.test(t)) return;
    if (cleaned[cleaned.length - 1] === t) return;
    cleaned.push(t);
  });

  // Group into [name, address, phone] triples. A phone (8002332-style) marks
  // the end of a card.
  const rows = [];
  let current = [];
  cleaned.forEach((t) => {
    current.push(t);
    if (/^\+?\d[\d\s-]{4,}$/.test(t)) {
      // current = [name, ...address parts, phone]
      const phone = current[current.length - 1];
      const name = current[0];
      const address = current.slice(1, -1).join(', ');
      const cell = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = name;
      cell.append(h);
      if (address) {
        const p = document.createElement('p');
        p.textContent = address;
        cell.append(p);
      }
      const pPhone = document.createElement('p');
      const a = document.createElement('a');
      a.href = `tel:${phone.replace(/\s+/g, '')}`;
      a.textContent = phone;
      pPhone.append(a);
      cell.append(pPhone);
      rows.push([cell]);
      current = [];
    }
  });

  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-location', cells: rows });
  element.replaceWith(block);
}
