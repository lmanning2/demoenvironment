import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  // local dev serves content under /content; fall back to configured/root footer for production
  let fragment = await loadFragment('/content/footer');
  if (!fragment) {
    fragment = await loadFragment(footerPath);
  }

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Rebuild structure from content so it is resilient to how the source is stored.
  // Document Authoring flattens authored wrapper <div>s, so we cannot rely on them —
  // instead we group each heading with the list that follows it into a column.
  const headings = [...footer.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const socialList = [...footer.querySelectorAll('ul')].find(
    (ul) => ul.querySelector('a img') && !ul.previousElementSibling?.matches?.('h1, h2, h3, h4, h5, h6'),
  );
  const copyright = [...footer.querySelectorAll('p')].find((p) => /copyright/i.test(p.textContent));

  if (headings.length) {
    const columns = document.createElement('div');
    columns.className = 'footer-columns';
    headings.forEach((heading) => {
      const col = document.createElement('div');
      col.className = 'footer-column';
      const list = heading.nextElementSibling;
      col.append(heading);
      if (list && list.tagName === 'UL') col.append(list);
      columns.append(col);
    });

    const bottom = document.createElement('div');
    bottom.className = 'footer-bottom';
    if (copyright) bottom.append(copyright);
    if (socialList) {
      socialList.classList.add('footer-social');
      bottom.append(socialList);
    }

    footer.textContent = '';
    footer.append(columns);
    if (bottom.childElementCount) footer.append(bottom);
  }

  block.append(footer);
}
