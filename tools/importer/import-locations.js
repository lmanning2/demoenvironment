/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroTextParser from './parsers/hero-text.js';
import cardsLocationParser from './parsers/cards-location.js';
import cardsSupportParser from './parsers/cards-support.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/taqa-cleanup.js';
import sectionsTransformer from './transformers/taqa-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'locations',
  description: 'Locations page: text-only intro, location finder cards, dark customer-support section, app-download promo band.',
  urls: [
    'https://taqadistribution.com/addc/en-us/business/locations/branches',
    'https://taqadistribution.com/addc/en-us/business/locations/partners',
  ],
  blocks: [
    { name: 'hero-text', instances: ["div[class*='textOnlySpotLight_detailsContainer']"] },
    { name: 'cards-location', instances: ["div[class*='locator_container']"] },
    { name: 'cards-support', instances: ["div[class*='customerSupport_subContainer']"] },
  ],
  sections: [
    { id: 'rc2', name: 'Hero', selector: ["div[class*='textOnlySpotLight_detailsContainer']"], style: null, blocks: ['hero-text'], defaultContent: [] },
    { id: 'rc3', name: 'Location Finder', selector: ["div[class*='locator_container']"], style: null, blocks: ['cards-location'], defaultContent: [] },
    { id: 'rc4', name: 'Customer Support', selector: ["div[class*='customerSupport_container']"], style: 'dark', blocks: ['cards-support'], defaultContent: [] },
    { id: 'rc5', name: 'App Promo', selector: ["div[class*='downloadApp_appsectioncontainer']"], style: null, blocks: [], defaultContent: ["div[class*='downloadApp_appcontent']"] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-text': heroTextParser,
  'cards-location': cardsLocationParser,
  'cards-support': cardsSupportParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
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
    if (blockDef.name.startsWith('section-')) return;
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

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

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath || '/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
