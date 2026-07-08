import navContent from './nav-content.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Returns the top-level <ul> within a container — the outermost list that is
 * not nested inside an <li>. Resilient to how the content source wraps lists
 * (e.g. da.live may or may not preserve a .default-content-wrapper).
 * @param {Element} container
 * @returns {HTMLUListElement|null}
 */
function getTopLevelList(container) {
  if (!container) return null;
  const lists = [...container.querySelectorAll('ul')];
  return lists.find((ul) => !ul.parentElement?.closest('li')) || lists[0] || null;
}

/**
 * Returns the direct <li> children of a container's top-level list.
 * @param {Element} container
 * @returns {HTMLLIElement[]}
 */
function getTopLevelItems(container) {
  const list = getTopLevelList(container);
  return list ? [...list.children].filter((el) => el.tagName === 'LI') : [];
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  getTopLevelItems(sections).forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Nav content is bundled in code (nav-content.js) rather than loaded from a
  // content document, so the header renders on any environment (including
  // previews where a da.live nav document is not published).
  const fragment = document.createElement('div');
  fragment.innerHTML = navContent;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Classify the three top-level sections by CONTENT rather than by position.
  // da.live can drop/reorder wrapper divs, so positional [0,1,2] assignment is
  // fragile. Brand = the block whose only meaningful content is a linked image;
  // tools = the utility block (short items: flag/currency/language/AirRewards);
  // sections = the main nav list. Fall back to positional order if ambiguous.
  const blocks = [...nav.children];
  const isBrandBlock = (el) => {
    const links = el.querySelectorAll('a');
    return el.querySelector('img') && links.length <= 1 && !el.querySelector('h1, h2, h3, h4, h5, h6');
  };
  const listItemCount = (el) => getTopLevelItems(el).length;

  let navBrand = blocks.find(isBrandBlock);
  const remaining = blocks.filter((el) => el !== navBrand);
  // main nav = block with the most top-level list items; tools = the other list block
  remaining.sort((a, b) => listItemCount(b) - listItemCount(a));
  let navSections = remaining[0];
  let navTools = remaining.find((el) => el !== navSections && getTopLevelList(el));

  // Fallbacks preserve original behavior when classification is inconclusive.
  if (!navBrand) [navBrand] = blocks;
  if (!navSections) [, navSections] = blocks;
  if (!navTools) [, , navTools] = blocks;

  if (navBrand) navBrand.classList.add('nav-brand');
  if (navSections) navSections.classList.add('nav-sections');
  if (navTools && navTools !== navSections) navTools.classList.add('nav-tools');

  // Tag the top-level lists with stable classes so CSS does not depend on
  // wrapper structure (.default-content-wrapper), which da.live may not emit.
  const sectionsList = getTopLevelList(navSections);
  if (sectionsList) sectionsList.classList.add('nav-sections-list');
  const toolsList = navTools && navTools !== navSections ? getTopLevelList(navTools) : null;
  if (toolsList) toolsList.classList.add('nav-tools-list');

  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  if (navSections) {
    getTopLevelItems(navSections).forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // tools dropdowns (country, currency, language) — toggle open on click
  if (navTools && navTools !== navSections) {
    const toolItems = getTopLevelItems(navTools);
    toolItems.forEach((item) => {
      if (!item.querySelector('ul')) return;
      item.classList.add('nav-tools-drop');
      item.setAttribute('aria-expanded', 'false');
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const expanded = item.getAttribute('aria-expanded') === 'true';
        toolItems.forEach((i) => i.setAttribute('aria-expanded', 'false'));
        item.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    });
    // close tools dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!navTools.contains(e.target)) {
        toolItems.forEach((i) => i.setAttribute('aria-expanded', 'false'));
      }
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
