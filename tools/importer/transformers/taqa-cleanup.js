/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: taqadistribution.com site-wide cleanup.
 *
 * taqadistribution.com is a Next.js SPA. The authorable page content lives
 * inside <main>. Everything else is site shell / chrome an author would never
 * create when authoring a page (top header nav, primary navigation bar, the
 * help/locations mega-menu dropdown panels, the global footer, the OneTrust
 * cookie-consent widget) plus purely structural / non-content nodes
 * (skip link, empty shadow-root host, route announcer, modal root, scripts,
 * iframes, links, noscript, base64 stylesheets). Header/nav and footer are
 * handled by their own orchestrators.
 *
 * All selectors are verified against migration-work/cleaned.html of the page
 * being migrated:
 *   - a[href="#main-content"] skip link ............... line 10
 *   - header.header_header__9OzUC (top nav) ........... line 11
 *   - .primaryNavigation_container__NM_X7 ............. line 48
 *   - .dropdown_dropdown__4_Gn0 (mega-menu panels) .... lines 98, 209, 225, 290, 340
 *   - .footer_footer__Im9Y3 ........................... line 758
 *   - #onetrust-consent-sdk (cookie banner) ........... line 871
 *   - .dameg-shadow-root-host (empty) ................. line 2
 *   - next-route-announcer ............................ line 4
 *   - #modalRoot ...................................... line 7
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie-consent widget and blocking overlays — removed before block
    // parsing so they can't interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      // Empty SPA host nodes / overlays that carry no authorable content.
      '.dameg-shadow-root-host',
      'next-route-announcer',
      '#modalRoot',
      // Google Maps widget (locations pages) — needs a billed API key and its
      // interactive DOM (map tiles, markers, keyboard-shortcut text, "This page
      // can't load Google Maps" notice) leaks noise into the import. Remove it
      // before parsing; the branch/partner list beside it is kept.
      '.gm-style',
      '[aria-label="Map"]',
      '[aria-roledescription="map"]',
      'gmp-map',
      'div[style*="z-index: 1000000"]',
    ]);
    // Remove any element whose text is purely Google-Maps chrome.
    element.querySelectorAll('div, section, aside').forEach((el) => {
      const t = (el.textContent || '').trim();
      if (/This page can't load Google Maps correctly|Do you own this website\?/i.test(t)
        && t.length < 200) {
        el.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome: skip link, header + primary nav (desktop
    // AND mobile), the help/locations mega-menu dropdown panels, the global
    // footer, and the DAMEG accessibility offline-widget overlay. Header/nav
    // and footer are migrated by their own orchestrators.
    // Substring/attribute selectors are used because the live-rendered DOM
    // carries hashed CSS-module class suffixes that differ from cleaned.html,
    // and because the responsive layout may render the mobile header instead
    // of the desktop one during import.
    WebImporter.DOMUtils.remove(element, [
      'a[href="#main-content"]',
      'header',
      "[class*='header_header']",
      "[class*='header_navigationbar']",
      "[class*='primaryNavigation_container']",
      "[class*='primaryNavigationMobile_container']",
      "[class*='primaryNavigationMobile_mainContainer']",
      "[class*='dropdown_dropdown']",
      "[class*='footer_footer']",
      '.dameg-shadow-root-host',
      '.damegCursor',
      '.damegReadingLine',
      // Mobile-only duplicates of desktop content (the responsive layout
      // renders both a desktop and a mobile copy of the tips carousel and the
      // "We are here to help" panel). Drop the mobile copies so each block and
      // its content are imported once.
      "[class*='tipCarouselMobile']",
      "[class*='weAreHereToHelpMobile']",
    ]);

    // Purely structural / non-content elements.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
    ]);

    // Strip AOS scroll-animation artifacts left on authorable content
    // (classes + data attributes) so they don't leak into the import.
    element.querySelectorAll('.aos-init, .aos-animate, [data-aos]').forEach((el) => {
      el.classList.remove('aos-init', 'aos-animate');
      el.removeAttribute('data-aos');
      el.removeAttribute('data-aos-easing');
      el.removeAttribute('data-aos-duration');
      el.removeAttribute('data-aos-delay');
    });

    // Some source anchors carry a stray leading/trailing space in the href
    // (e.g. `href=" https://www.addc.ae/..."`). Left as-is, the space is
    // percent-encoded to `%20` and the DA publish step then rewrites the whole
    // value into a broken internal path (`/https/www-addc-ae/...`). Trim
    // surrounding whitespace so the href stays a clean absolute URL.
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const trimmed = href.trim();
      if (trimmed !== href) a.setAttribute('href', trimmed);
    });
  }
}
