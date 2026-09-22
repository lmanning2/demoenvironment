/**
 * loads and decorates the cards-location block
 * @param {Element} block The block element
 *
 * Renders each authored row (location name + address + phone) as a card in a
 * responsive grid.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cell = row.querySelector(':scope > div') || row;
    while (cell.firstChild) li.append(cell.firstChild);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
