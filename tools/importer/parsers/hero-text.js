/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-text. Base: hero.
 * Source: locations template — div[class*='textOnlySpotLight_detailsContainer']
 *
 * A text-only page intro: an eyebrow line (e.g. "Branches") that sits as a
 * sibling above the details container, a large heading, and a short intro
 * paragraph. No banner image.
 *
 * Hero library structure: 1 column, 3 rows (block name, optional image, content).
 * This intro has no image, so only the name row and the content row are used.
 */
export default function parse(element, { document }) {
  // The eyebrow ("Branches") lives in the outer spotlight container, as a
  // sibling of the details container; climb up to include it.
  const scope = element.closest("div[class*='textOnlySpotLight_container']") || element;

  const heading = scope.querySelector('h1, h2, h3');
  const headingText = heading ? heading.textContent.trim() : '';

  // Ordered list of text nodes in the scope, excluding the heading text.
  const walker = document.createTreeWalker(scope, 4 /* SHOW_TEXT */);
  const texts = [];
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent.trim();
    if (t && t !== headingText && !texts.includes(t)) texts.push(t);
  }
  // Eyebrow = first (shortest, category label); intro = the descriptive line.
  const eyebrowText = texts[0] || '';
  const introText = texts.slice(1).sort((a, b) => b.length - a.length)[0] || '';

  const contentCell = [];
  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.textContent = eyebrowText;
    contentCell.push(eyebrow);
  }
  if (heading) {
    const h = document.createElement('h1');
    h.textContent = headingText;
    contentCell.push(h);
  }
  if (introText) {
    const p = document.createElement('p');
    p.textContent = introText;
    contentCell.push(p);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-text', cells: [[contentCell]] });
  (scope.parentNode ? scope : element).replaceWith(block);
}
