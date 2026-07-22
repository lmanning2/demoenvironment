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
 * Injects the static booking-widget block at the top of the homepage main,
 * overlapping the hero. Homepage only; safe to call on every page.
 * @param {Element} main The container element
 */
function buildBookingWidget(main) {
  // only the top-level page main, never fragments (e.g. the footer fragment,
  // which also runs decorateMain and would otherwise get its own widget).
  if (main !== document.querySelector('main')) return;
  if (main.querySelector('.booking-widget')) return;
  const section = document.createElement('div');
  section.append(buildBlock('booking-widget', { elems: [] }));
  main.prepend(section);
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
  const titleSection = sections.find((s) => {
    if (s.querySelector('div[class]')) return false; // contains an authored block
    const headings = s.querySelectorAll('h1, h2, h3, h4');
    return headings.length === 1 && s.querySelector('picture, img');
  });
  if (!titleSection) return;

  const isCover = (pic) => pic.querySelector('img[alt="cover" i]');
  const next = titleSection.nextElementSibling;

  if (next) {
    const nextCover = [...next.querySelectorAll('picture')].find(isCover);
    const hasOtherContent = next.querySelector('h1, h2, h3, h4, table, ul, ol')
      || [...next.querySelectorAll('p')].some((p) => p.textContent.trim() && !p.querySelector('picture, img'));
    if (nextCover && !hasOtherContent) {
      // next section is image-only: fold the whole thing into the band.
      titleSection.append(nextCover.closest('p') || nextCover);
      next.remove();
    } else if (nextCover) {
      // next section also has text/headings: lift only the cover image up so
      // it blends into the band, leaving the rest of that section in place.
      titleSection.append(nextCover.closest('p') || nextCover);
    }
  }

  // prefer the alt="cover" banner as the blended image; drop any extra
  // decorative image (e.g. a thin banner strip) so only one shows on the right.
  const pictures = [...titleSection.querySelectorAll('picture')];
  if (pictures.length > 1) {
    const cover = pictures.find(isCover) || pictures[pictures.length - 1];
    pictures.forEach((pic) => {
      if (pic !== cover) (pic.closest('p') || pic).remove();
    });
  }

  titleSection.classList.add('page-hero');
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildBookingWidget(main);
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
  decorateBlocks(main);
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
