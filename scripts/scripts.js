import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
  toClassName,
  toCamelCase,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Interior content pages open with a page title + banner image. Match the
 * source design by turning that opening section into a navy "page-hero" band
 * with the title on the left and the banner image blended into the navy on the
 * right. Runs before decorateSections so it operates on the raw section divs.
 * @param {Element} main The container element
 */
function buildPageHero(main) {
  if (main !== document.querySelector('main')) return;
  const sections = [...main.querySelectorAll(':scope > div')];
  // Interior page-title section = a plain default-content section (single
  // heading + banner image, no authored block). This deliberately excludes
  // the homepage, whose opening section is a carousel-hero block (a div with a
  // block class and multiple headings) — turning that into a page-hero band
  // was a regression.
  // The title section is the first plain default-content section whose only
  // heading is the page title. It may or may not include a banner image.
  const first = sections[0];
  if (!first) return;
  const headings = first.querySelectorAll('h1, h2, h3, h4');
  const isPlain = !first.querySelector('div[class]'); // no authored block
  if (!isPlain || headings.length !== 1) return;
  const titleSection = first;

  // If the title section includes a thin decorative banner strip, the source
  // tucks it into the top-right corner of the navy band; keep only the first
  // such image. A separate full-width cover (alt="cover") image, if any, stays
  // in its own section below to render as a normal full-bleed banner.
  const pictures = [...titleSection.querySelectorAll('picture')];
  if (pictures.length > 1) {
    pictures.slice(1).forEach((pic) => (pic.closest('p') || pic).remove());
  }

  titleSection.classList.add('page-hero');
}

/**
 * The Help & Support "Looking for answers" section is a two-column layout on the
 * source: the FAQ accordion fills a wide left column, while the energy-saving-tips
 * carousel and the "We are here to help" link panel stack in a narrow right column.
 * The imported section is a flat list of default-content + block wrappers; group
 * them into .faq-col-main (accordion + its intro) and .faq-col-side (everything
 * after the accordion) so CSS can lay them out side by side. Runs after
 * decorateSections, so it matches the wrapped block wrappers.
 * @param {Element} main The container element
 */
function buildFaqTwoColumn(main) {
  if (main !== document.querySelector('main')) return;
  main.querySelectorAll(':scope > .section').forEach((section) => {
    // Runs after decorateBlocks, so the per-block `<name>-wrapper` classes are
    // present. Grouping must happen after block decoration — wrapping earlier
    // would make the column wrappers look like blocks to decorateBlocks
    // (`div.section > div > div`).
    const accordion = section.querySelector(':scope > .accordion-faq-wrapper');
    const carousel = section.querySelector(':scope > .carousel-tips-wrapper');
    if (!accordion || !carousel) return;
    if (section.querySelector(':scope > .faq-col-main')) return;

    const children = [...section.children];
    const accordionIdx = children.indexOf(accordion);

    const mainCol = document.createElement('div');
    mainCol.className = 'faq-col-main';
    const sideCol = document.createElement('div');
    sideCol.className = 'faq-col-side';

    children.forEach((child, i) => {
      (i <= accordionIdx ? mainCol : sideCol).append(child);
    });

    section.append(mainCol, sideCol);
    section.classList.add('faq-two-column');
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildPageHero(main);
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Applies `.section-metadata` block config (e.g. style="dark") to its section.
 * This project's aem.js ships a trimmed decorateSections that does not handle
 * section metadata, so we process it here — reading the config, adding the
 * style classes / data attributes to the section, and removing the block so it
 * is not treated as a loadable block. Must run after decorateSections (which
 * wraps the block) and before decorateBlocks (which would try to load it).
 * @param {Element} main The container element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const sectionMeta = section.querySelector('div.section-metadata');
    if (!sectionMeta) return;
    const meta = readBlockConfig(sectionMeta);
    Object.keys(meta).forEach((key) => {
      if (key === 'style') {
        meta.style.split(',').map((style) => toClassName(style.trim()))
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toCamelCase(key)] = meta[key];
      }
    });
    (sectionMeta.parentElement || sectionMeta).remove();
  });
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateBlocks(main);
  buildFaqTwoColumn(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
