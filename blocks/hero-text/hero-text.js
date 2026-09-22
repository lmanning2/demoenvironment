/**
 * loads and decorates the hero-text block
 * @param {Element} block The hero-text block element
 *
 * A simple text-only page intro: eyebrow (purple), heading, intro paragraph.
 * The authored structure is a single cell of default content.
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div') || block;

  // The first paragraph before the heading is the eyebrow.
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const firstPara = cell.querySelector('p');
  if (heading && firstPara) {
    const order = [...cell.children];
    if (order.indexOf(firstPara) < order.indexOf(heading)) {
      firstPara.classList.add('hero-text-eyebrow');
    }
  }
}
