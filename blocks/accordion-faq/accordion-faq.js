/*
 * Accordion FAQ Block
 * Collapsible question/answer list with optional category filter pills and
 * "LOAD MORE" pagination.
 *
 * Authored structure (one row per question):
 *   cell 0: question label
 *   cell 1: answer body
 *   cell 2: (optional) category name — when present on any row, a filter bar
 *           of "All" + each unique category is rendered above the list.
 */

const PAGE_SIZE = 4;

/**
 * Some imported pages carry the FAQ category filter as a run of loose <p>
 * paragraphs immediately before the accordion block (a leftover of the source's
 * scrollable filter widget), including stray "<"/">" scroll-arrow glyphs. When
 * present — and when the questions carry no per-row category data of their own —
 * collect those labels so they can render as the filter chip bar. Returns the
 * cleaned category label list (without "All"/arrows) and removes the stray
 * paragraphs from the DOM.
 * @param {Element} block
 * @returns {string[]}
 */
function absorbLeakedFilters(block) {
  // The leaked filter labels sit in the preceding default-content wrapper (the
  // same one that holds the "LOOKING FOR ANSWERS?" heading + intro), NOT inside
  // the accordion block's own wrapper. Find that wrapper.
  const blockWrapper = block.closest('.accordion-faq-wrapper') || block.parentElement;
  const introWrapper = blockWrapper?.previousElementSibling?.classList?.contains('default-content-wrapper')
    ? blockWrapper.previousElementSibling
    : [...(blockWrapper?.parentElement?.children || [])]
      .find((el) => el.classList?.contains('default-content-wrapper') && el.querySelector('h4, h3'));
  if (!introWrapper) return [];

  const labels = [];
  const toRemove = [];
  // The filter chip labels are the run of <p>s AFTER the intro sentence. The
  // intro is a full sentence (much longer than a chip label) — find the last
  // such long paragraph and treat everything after it as chip labels. This is
  // language-agnostic (works for English and Arabic). Drop the stray "<"/">"
  // scroll-arrow glyphs and the "All" chip (EN "All" / AR "الجميع"), which the
  // block re-adds itself.
  const paras = [...introWrapper.querySelectorAll(':scope > p')];
  // The intro is the first paragraph that reads as a full sentence: long AND
  // containing sentence punctuation (. ? Arabic ؟). Chip labels never do.
  const introIdx = paras.findIndex(
    (p) => p.textContent.trim().length > 60 && /[.?؟]/.test(p.textContent),
  );
  const chipParas = introIdx >= 0 ? paras.slice(introIdx + 1) : paras;
  const isAll = (t) => /^all$/i.test(t) || t === 'الجميع';
  // The section heading text ("Looking for answers?" / "تبحث عن إجابات؟") is
  // sometimes duplicated into the chip run — exclude it.
  const headingText = introWrapper.querySelector('h3, h4, h5')?.textContent.trim();
  chipParas.forEach((p) => {
    const text = p.textContent.trim();
    toRemove.push(p);
    if (text && text !== '<' && text !== '>' && !isAll(text) && text !== headingText) {
      labels.push(text);
    }
  });
  if (labels.length < 2) return [];
  toRemove.forEach((n) => n.remove());
  return labels;
}

/**
 * The source loads each FAQ answer from its own widget only when expanded, so
 * imported pages capture empty answer cells. A shared answers file
 * (faq-answers.json in this block folder, with { en: {...}, ar: {...} } maps of
 * question → answer text) backfills them at render time, keyed by the question
 * text. Shipping it as a code asset (not DA content) keeps it version
 * controlled and served on every environment.
 * @returns {Promise<Object>} map of question → answer text for the page locale
 */
let faqAnswersPromise;
async function loadFaqAnswers() {
  if (!faqAnswersPromise) {
    faqAnswersPromise = (async () => {
      const base = `${window.hlx?.codeBasePath || ''}/blocks/accordion-faq/faq-answers.json`;
      const resp = await fetch(base).catch(() => null);
      if (!resp || !resp.ok) return {};
      return resp.json().catch(() => ({}));
    })();
  }
  const data = await faqAnswersPromise;
  const isArabic = /\/ar(-[a-z]{2})?\//i.test(window.location.pathname);
  return (isArabic ? data.ar : data.en) || {};
}

const normalizeQ = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

export default async function decorate(block) {
  // Categories authored on the questions themselves take priority; otherwise
  // fall back to any leaked filter labels sitting before the block.
  const leakedCategories = absorbLeakedFilters(block);

  // Build the <details> items from the authored rows.
  const items = [...block.children].map((row) => {
    const label = row.children[0];
    const bodyCell = row.children[1];
    const categoryCell = row.children[2];
    const category = categoryCell ? categoryCell.textContent.trim() : '';

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    if (label) summary.append(...label.childNodes);

    const body = bodyCell || document.createElement('div');
    body.className = 'accordion-faq-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    if (category) details.dataset.category = category;
    // Remember the question text so we can backfill an empty answer body.
    details.dataset.question = summary.textContent.trim();
    details.append(summary, body);
    return details;
  });

  // Backfill empty answer bodies from the shared answers file.
  const answersEmpty = items.filter((it) => !it.querySelector('.accordion-faq-item-body').textContent.trim());
  if (answersEmpty.length) {
    const answers = await loadFaqAnswers();
    const byQ = {};
    Object.keys(answers).forEach((q) => { byQ[normalizeQ(q)] = answers[q]; });
    answersEmpty.forEach((it) => {
      const ans = byQ[normalizeQ(it.dataset.question)];
      if (ans) {
        const body = it.querySelector('.accordion-faq-item-body');
        const p = document.createElement('p');
        p.textContent = ans;
        body.append(p);
      }
    });
  }

  block.textContent = '';

  // Per-question categories (real, filterable) take priority. If none exist but
  // the source leaked a filter label run, use those as display chips — they
  // can't filter the (single-category) imported questions, so selecting one
  // simply shows all questions.
  const rowCategories = [...new Set(items.map((it) => it.dataset.category).filter(Boolean))];
  const categoriesAreFilterable = rowCategories.length > 0;
  const categories = categoriesAreFilterable ? rowCategories : leakedCategories;
  let activeCategory = 'all';
  let visibleCount = PAGE_SIZE;

  const list = document.createElement('div');
  list.className = 'accordion-faq-list';
  items.forEach((it) => list.append(it));

  const loadMore = document.createElement('button');
  loadMore.type = 'button';
  loadMore.className = 'accordion-faq-load-more';
  loadMore.textContent = 'LOAD MORE';

  const render = () => {
    const matches = items.filter(
      (it) => activeCategory === 'all' || it.dataset.category === activeCategory,
    );
    items.forEach((it) => { it.hidden = true; });
    matches.slice(0, visibleCount).forEach((it) => { it.hidden = false; });
    loadMore.hidden = matches.length <= visibleCount;
  };

  loadMore.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    render();
  });

  // Category filter pills (only when categories were authored).
  if (categories.length) {
    const filters = document.createElement('div');
    filters.className = 'accordion-faq-filters';

    const makePill = (labelText, value) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'accordion-faq-filter';
      pill.textContent = labelText;
      if (value === activeCategory) pill.classList.add('active');
      pill.addEventListener('click', () => {
        // Only re-filter when categories map to questions; otherwise the chip
        // is display-only (source loads that category's questions server-side).
        activeCategory = categoriesAreFilterable ? value : 'all';
        visibleCount = PAGE_SIZE;
        [...filters.children].forEach((c) => c.classList.remove('active'));
        pill.classList.add('active');
        render();
      });
      return pill;
    };

    filters.append(makePill('All', 'all'));
    categories.forEach((c) => filters.append(makePill(c, c)));
    block.append(filters);
  }

  block.append(list, loadMore);
  render();
}
