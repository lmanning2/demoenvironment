/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news. Base: cards.
 * Source: https://www.nileair.com/ (div.container.news-room)
 * Cards are a.news-card links: .news-card-cover img + .news-card-content (h3, date p, description p).
 * The section title (h1) and "Read More" (.more_btn) are default content — excluded here.
 * Structure (library convention): 2 columns per row [image | text content (title + date + description)].
 *   Row 1: block name.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('a.news-card, .news-card'));

  const cells = [];

  cards.forEach((card) => {
    const image = card.querySelector('.news-card-cover img, img');
    const content = card.querySelector('.news-card-content') || card;
    const title = content.querySelector('h1, h2, h3, h4');
    const paragraphs = Array.from(content.querySelectorAll('p'));
    // The whole card is the link; preserve its href on the title.
    const href = card.matches('a[href]') ? card.getAttribute('href')
      : (card.querySelector('a[href]') ? card.querySelector('a[href]').getAttribute('href') : null);

    if (!image && !title && paragraphs.length === 0) return;

    const contentCell = [];
    if (title) {
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = title.textContent.trim();
        const heading = document.createElement(title.tagName.match(/^H[1-6]$/) ? title.tagName : 'h3');
        heading.append(link);
        contentCell.push(heading);
      } else {
        contentCell.push(title);
      }
    }
    paragraphs.forEach((p) => contentCell.push(p));

    // 2-column row: [image | text content].
    cells.push([image || '', contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
