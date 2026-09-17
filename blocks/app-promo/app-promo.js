/**
 * App-promo band. The content is authored as loose default content
 * (POWERING / COMMUNITIES eyebrow, headings, "Upgrade to a new experience",
 * and the two app-store badges). scripts.js auto-blocks it; this decorator
 * only groups the badge links into a dedicated row so CSS can lay them out.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div') || block;

  // Collect the two app-store badge links (each wrapped in a <p>) into one row.
  const badgeLinks = [...inner.querySelectorAll('a')].filter((a) => a.querySelector('img'));
  if (badgeLinks.length) {
    const badges = document.createElement('p');
    badges.className = 'app-promo-badges';
    badgeLinks.forEach((a) => {
      const p = a.closest('p');
      badges.append(a);
      if (p && p !== badges && !p.textContent.trim() && !p.querySelector('img')) p.remove();
    });
    inner.append(badges);
  }
}
