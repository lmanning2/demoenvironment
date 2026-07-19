/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-quicklink. Base: cards.
 * Source: https://www.nileair.com/
 *   Instance A: div.feature-area.demo_bg  -> .single-feature (icon + h4.title>a)
 *   Instance B: div.choose-area .row       -> .single-choose (icon + h4.title>span, card wrapped in <a>)
 * Structure (library convention): 2 columns per row [image/icon | text content (title + optional CTA)].
 *   Row 1: block name.
 */
export default function parse(element, { document }) {
  // Unified card selector covering both instance layouts.
  let cards = Array.from(element.querySelectorAll('.single-feature, .single-choose'));
  // Fallback: direct column wrappers if the inner class names differ.
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll(':scope > .col, :scope > [class*="col-"]'));
  }

  const cells = [];

  cards.forEach((card) => {
    const image = card.querySelector('img');
    const title = card.querySelector('h1, h2, h3, h4, h5, h6, .title');
    // The card (choose-area) or the title (feature-area) may carry the link.
    const cardLink = card.querySelector(':scope > a[href], a[href]');

    if (!image && !title) return;

    const contentCell = [];
    if (title) {
      // If the heading has no link of its own but the card is a link, wrap the
      // heading text in that link so the CTA/href is preserved.
      const titleHasLink = title.querySelector('a[href]');
      if (!titleHasLink && cardLink && cardLink.getAttribute('href')) {
        const link = document.createElement('a');
        link.setAttribute('href', cardLink.getAttribute('href'));
        link.textContent = title.textContent.trim();
        const heading = document.createElement(title.tagName.match(/^H[1-6]$/) ? title.tagName : 'h4');
        heading.append(link);
        contentCell.push(heading);
      } else {
        contentCell.push(title);
      }
    }

    // 2-column row: [icon image | text content].
    cells.push([image || '', contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quicklink', cells });
  element.replaceWith(block);
}
