import { loadFragment } from '../fragment/fragment.js';

// Inline brand SVG social icons keyed by a token found in the link URL.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 320 512" aria-hidden="true"><path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
  linkedin: '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/></svg>',
  instagram: '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>',
  'twitter.com': '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>',
  youtube: '<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M549.65 124.08c-6.28-23.65-24.79-42.28-48.29-48.6C458.78 64 288 64 288 64S117.22 64 74.64 75.48c-23.5 6.32-42.01 24.95-48.29 48.6C15 167.35 15 256.02 15 256.02s0 88.67 11.35 131.94c6.28 23.65 24.79 41.5 48.29 47.82C117.22 448 288 448 288 448s170.78 0 213.36-11.48c23.5-6.32 42.01-24.17 48.29-47.82C561 344.69 561 256.02 561 256.02s0-88.67-11.35-131.94zM232.15 337.6V174.43l142.77 81.59-142.77 81.58z"/></svg>',
  snapchat: '<svg viewBox="0 0 496 512" aria-hidden="true"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 349.5c-2.6 6.1-13.3 10.5-31.8 13.2-1 1.3-1.8 6.9-3.1 11.4-.8 2.8-2.8 4.4-6.2 4.4h-.3c-4.8 0-9.8-2.2-19.6-2.2-13.2 0-17.8 3-25.5 8.5-9.1 6.4-18.4 12.2-32.5 11.6-14.9.9-25.9-6.4-32-11.6-7.7-5.4-12.3-8.5-25.5-8.5-9.4 0-15.5 2.4-19.6 2.4-4.2 0-5.8-2.6-6.5-4.6-1.3-4.4-2.1-10.1-3.1-11.4-18.5-2.9-29.2-7.3-31.8-13.3-.4-.9-.6-1.8-.7-2.8-.2-2.6 1.6-4.9 4.2-5.3 20.6-3.4 38.9-14.3 54.3-32.4 1.2-1.4 2.3-2.8 3.3-4.3 4.5-6.5 5.6-12 3.3-16.6-4.1-8.7-19.5-12.9-29.7-16.9-2.8-1.1-5.4-2.2-7.4-3.2-11.9-5.9-13.1-11.9-12.6-16 .9-6.7 9.4-11.4 16.7-11.4 2 0 3.8.4 5.4 1.2 6 2.8 11.4 4.3 16 4.3 5 0 7.9-1.9 8.5-2.3-.2-3.9-.4-7.9-.7-12-1.9-30.3-4.3-68 5.5-90 29.5-66.1 91.9-71.2 110.3-71.2l8-.1c18.4 0 80.9 5.1 110.4 71.2 9.8 22 7.4 59.7 5.5 90l-.1 1.5c-.2 3.5-.4 6.9-.6 10.4.6.3 3.2 2.1 7.8 2.3 4.4-.2 9.5-1.7 15.1-4.3 2.5-1.2 5.3-1.4 7.4-1.4 3.3 0 6.5.6 9.1 1.7l.2.1c7.6 2.7 12.5 8.1 12.6 13.9.1 7.3-6.8 13.6-20.5 18.7-1.7.6-3.9 1.3-6.2 2-10.2 3.2-24.2 7.6-28.3 16.3-2.3 4.6-1.2 10.1 3.3 16.6 1 1.5 2.1 2.9 3.3 4.3 15.4 18.1 33.7 29 54.3 32.4 2.7.4 4.4 2.9 4.2 5.5 0 .8-.3 1.7-.7 2.6z"/></svg>',
  tiktok: '<svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M448 209.9a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/></svg>',
};

function iconFor(href) {
  const url = (href || '').toLowerCase();
  const key = Object.keys(SOCIAL_ICONS).find((k) => url.includes(k));
  return key ? SOCIAL_ICONS[key] : '';
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  let fragment = await loadFragment('/content/footer');
  if (!fragment) {
    fragment = await loadFragment('/footer');
  }
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const sections = [...footer.children];

  // Brand section: only an image, no headings.
  const brand = sections.find((s) => s.querySelector('img') && !s.querySelector('h4'));
  if (brand) brand.classList.add('footer-brand');

  // Accordion columns: the section that holds the <h4>-titled link groups.
  const columnsSection = sections.find((s) => s.querySelector('h4'));
  if (columnsSection) {
    columnsSection.classList.add('footer-columns');
    [...columnsSection.children].forEach((col) => {
      col.classList.add('footer-column');
      const heading = col.querySelector('h4');
      const list = col.querySelector('ul');
      if (heading && list) {
        heading.setAttribute('role', 'button');
        heading.setAttribute('tabindex', '0');
        heading.setAttribute('aria-expanded', 'false');
        const toggle = () => {
          const expanded = heading.getAttribute('aria-expanded') === 'true';
          heading.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        };
        heading.addEventListener('click', toggle);
        heading.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
      }
    });
  }

  // Social bar: the link list whose links are all social URLs.
  const socialSection = sections.find((s) => {
    const links = s.querySelectorAll('a');
    return links.length && [...links].every((a) => iconFor(a.getAttribute('href')));
  });
  if (socialSection) {
    socialSection.classList.add('footer-social');
    socialSection.querySelectorAll('a').forEach((a) => {
      const svg = iconFor(a.getAttribute('href'));
      if (svg) {
        a.setAttribute('aria-label', a.textContent.trim());
        a.innerHTML = svg;
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
  }

  // Bottom bar: the remaining section with secondary links + copyright.
  const bottom = sections.find((s) => s !== brand && s !== columnsSection
    && s !== socialSection && (s.querySelector('p') || s.querySelector('ul')));
  if (bottom) bottom.classList.add('footer-bottom');

  block.append(footer);
}
