/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-locations.js
  var import_locations_exports = {};
  __export(import_locations_exports, {
    default: () => import_locations_default
  });

  // tools/importer/parsers/hero-text.js
  function parse(element, { document }) {
    const scope = element.closest("div[class*='textOnlySpotLight_container']") || element;
    const heading = scope.querySelector("h1, h2, h3");
    const headingText = heading ? heading.textContent.trim() : "";
    const walker = document.createTreeWalker(
      scope,
      4
      /* SHOW_TEXT */
    );
    const texts = [];
    while (walker.nextNode()) {
      const t = walker.currentNode.textContent.trim();
      if (t && t !== headingText && !texts.includes(t)) texts.push(t);
    }
    const eyebrowText = texts[0] || "";
    const introText = texts.slice(1).sort((a, b) => b.length - a.length)[0] || "";
    const contentCell = [];
    if (eyebrowText) {
      const eyebrow = document.createElement("p");
      eyebrow.textContent = eyebrowText;
      contentCell.push(eyebrow);
    }
    if (heading) {
      const h = document.createElement("h1");
      h.textContent = headingText;
      contentCell.push(h);
    }
    if (introText) {
      const p = document.createElement("p");
      p.textContent = introText;
      contentCell.push(p);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-text", cells: [[contentCell]] });
    (scope.parentNode ? scope : element).replaceWith(block);
  }

  // tools/importer/parsers/cards-location.js
  var SKIP = /^(find a location|all services|\d+\s+locations?\s+found|more|filter|search)$/i;
  function parse2(element, { document }) {
    const lines = [...element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, button, span")].map((n) => n.textContent.trim()).filter(Boolean);
    const cleaned = [];
    lines.forEach((t) => {
      if (SKIP.test(t)) return;
      if (cleaned[cleaned.length - 1] === t) return;
      cleaned.push(t);
    });
    const rows = [];
    let current = [];
    cleaned.forEach((t) => {
      current.push(t);
      if (/^\+?\d[\d\s-]{4,}$/.test(t)) {
        const phone = current[current.length - 1];
        const name = current[0];
        const address = current.slice(1, -1).join(", ");
        const cell = document.createElement("div");
        const h = document.createElement("h3");
        h.textContent = name;
        cell.append(h);
        if (address) {
          const p = document.createElement("p");
          p.textContent = address;
          cell.append(p);
        }
        const pPhone = document.createElement("p");
        const a = document.createElement("a");
        a.href = `tel:${phone.replace(/\s+/g, "")}`;
        a.textContent = phone;
        pPhone.append(a);
        cell.append(pPhone);
        rows.push([cell]);
        current = [];
      }
    });
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-location", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-support.js
  function parse3(element, { document }) {
    let cards = Array.from(element.querySelectorAll('[class*="supportOption_supportDiv"]'));
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll('a[class*="support"], :scope > a[href]'));
    }
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector("img");
      const title = card.querySelector("h1, h2, h3, h4, h5, h6");
      const descContainer = card.querySelector('[class*="supportSubHeader"]');
      const description = descContainer ? descContainer.querySelector("p") || descContainer : card.querySelector('[class*="supportText"] p');
      const href = card.matches("a[href]") ? card.getAttribute("href") : card.querySelector("a[href]") && card.querySelector("a[href]").getAttribute("href");
      if (!image && !title && !description) return;
      const contentCell = [];
      if (title) {
        const cleanTitle = title.textContent.trim();
        if (href && href.trim()) {
          const a = document.createElement("a");
          a.setAttribute("href", href.trim());
          a.textContent = cleanTitle;
          const h = document.createElement(title.tagName.match(/^H[1-6]$/) ? title.tagName : "h3");
          h.append(a);
          contentCell.push(h);
        } else {
          contentCell.push(title);
        }
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = description.textContent.trim();
        contentCell.push(p);
      }
      cells.push([image || "", contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-support", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/taqa-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".onetrust-pc-dark-filter",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        // Empty SPA host nodes / overlays that carry no authorable content.
        ".dameg-shadow-root-host",
        "next-route-announcer",
        "#modalRoot",
        // Google Maps widget (locations pages) — needs a billed API key and its
        // interactive DOM (map tiles, markers, keyboard-shortcut text, "This page
        // can't load Google Maps" notice) leaks noise into the import. Remove it
        // before parsing; the branch/partner list beside it is kept.
        ".gm-style",
        '[aria-label="Map"]',
        '[aria-roledescription="map"]',
        "gmp-map",
        'div[style*="z-index: 1000000"]'
      ]);
      element.querySelectorAll("div, section, aside").forEach((el) => {
        const t = (el.textContent || "").trim();
        if (/This page can't load Google Maps correctly|Do you own this website\?/i.test(t) && t.length < 200) {
          el.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        'a[href="#main-content"]',
        "header",
        "[class*='header_header']",
        "[class*='header_navigationbar']",
        "[class*='primaryNavigation_container']",
        "[class*='primaryNavigationMobile_container']",
        "[class*='primaryNavigationMobile_mainContainer']",
        "[class*='dropdown_dropdown']",
        "[class*='footer_footer']",
        ".dameg-shadow-root-host",
        ".damegCursor",
        ".damegReadingLine",
        // Mobile-only duplicates of desktop content (the responsive layout
        // renders both a desktop and a mobile copy of the tips carousel and the
        // "We are here to help" panel). Drop the mobile copies so each block and
        // its content are imported once.
        "[class*='tipCarouselMobile']",
        "[class*='weAreHereToHelpMobile']"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "iframe",
        "link"
      ]);
      element.querySelectorAll(".aos-init, .aos-animate, [data-aos]").forEach((el) => {
        el.classList.remove("aos-init", "aos-animate");
        el.removeAttribute("data-aos");
        el.removeAttribute("data-aos-easing");
        el.removeAttribute("data-aos-duration");
        el.removeAttribute("data-aos-delay");
      });
    }
  }

  // tools/importer/transformers/taqa-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.selector) continue;
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-locations.js
  var PAGE_TEMPLATE = {
    name: "locations",
    description: "Locations page: text-only intro, location finder cards, dark customer-support section, app-download promo band.",
    urls: [
      "https://taqadistribution.com/addc/en-us/business/locations/branches",
      "https://taqadistribution.com/addc/en-us/business/locations/partners"
    ],
    blocks: [
      { name: "hero-text", instances: ["div[class*='textOnlySpotLight_detailsContainer']"] },
      { name: "cards-location", instances: ["div[class*='locator_container']"] },
      { name: "cards-support", instances: ["div[class*='customerSupport_subContainer']"] }
    ],
    sections: [
      { id: "rc2", name: "Hero", selector: ["div[class*='textOnlySpotLight_detailsContainer']"], style: null, blocks: ["hero-text"], defaultContent: [] },
      { id: "rc3", name: "Location Finder", selector: ["div[class*='locator_container']"], style: null, blocks: ["cards-location"], defaultContent: [] },
      { id: "rc4", name: "Customer Support", selector: ["div[class*='customerSupport_container']"], style: "dark", blocks: ["cards-support"], defaultContent: [] },
      { id: "rc5", name: "App Promo", selector: ["div[class*='downloadApp_appsectioncontainer']"], style: null, blocks: [], defaultContent: ["div[class*='downloadApp_appcontent']"] }
    ]
  };
  var parsers = {
    "hero-text": parse,
    "cards-location": parse2,
    "cards-support": parse3
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      if (blockDef.name.startsWith("section-")) return;
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (pageBlocks.some((b) => b.element === element)) return;
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_locations_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath || "/index");
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_locations_exports);
})();
