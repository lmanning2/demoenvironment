/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Sources:
 *   Home (div.faq-area.gray_bg): .card items -> .card-header button (title) + .collapse .card-body (content).
 *   Content pages (#pets, #*-faqs): same .card pattern (question label + rich answer body).
 * The section title (.faq-title h2) is default content — excluded here.
 * Structure (library convention): 2 columns per row [title | content]. Row 1 = block name.
 */
export default function parse(element, { document }) {
  // Accordion items. Prefer .card; fall back to generic accordion item patterns.
  let items = Array.from(element.querySelectorAll('.card'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('.accordion-item, [class*="accordion"] > [class*="item"]'));
  }

  const cells = [];

  items.forEach((item) => {
    // Title: the header button/label.
    const header = item.querySelector('.card-header button, .card-header, button, .accordion-header, [class*="header"]');
    // Content: the collapsible body. Prefer the innermost .card-body so its
    // rich children (p/ul/ol/links) become the content cell directly, rather
    // than an extra .collapse wrapper div.
    const body = item.querySelector('.card-body')
      || item.querySelector('.accordion-body')
      || item.querySelector('.collapse')
      || item.querySelector('[class*="body"]');

    if (!header && !body) return;

    // Title cell: use the header's text as a clean label.
    let titleCell;
    if (header) {
      const label = document.createElement('p');
      label.textContent = header.textContent.trim();
      titleCell = label;
    } else {
      titleCell = '';
    }

    // Content cell: preserve the body's rich content (paragraphs, lists, links).
    let contentCell;
    if (body) {
      // Collect the meaningful children of the body (p, ul, ol, etc.).
      const bodyChildren = Array.from(body.children).length
        ? Array.from(body.children)
        : [body];
      contentCell = bodyChildren;
    } else {
      contentCell = '';
    }

    // 2-column row: [title | content].
    cells.push([titleCell, contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
