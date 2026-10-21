(() => {
  const filters = [...document.querySelectorAll('[data-catalog-filter]')];
  const cards = [...document.querySelectorAll('[data-catalog-category]')];

  if (!filters.length || !cards.length) return;
  const input = document.querySelector('[data-catalog-search-input]');
  const sort = document.querySelector('[data-catalog-sort]');
  const count = document.querySelector('[data-catalog-result-count]');
  const empty = document.querySelector('[data-catalog-empty]');
  const grid = document.querySelector('.catalog-grid');
  let category = 'all';
  let searchTimer;
  const update = () => {
    const terms = (input?.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const ordered = [...cards];
    if (sort?.value === 'moq') {
      const minimum = card => Number(card.dataset.productMoq) > 0 ? Number(card.dataset.productMoq) : Infinity;
      ordered.sort((a,b) => minimum(a)-minimum(b));
    }
    if (sort?.value === 'name') ordered.sort((a,b) => a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent));
    let visible = 0;
    ordered.forEach(card => {
      const match = (category === 'all' || card.dataset.catalogCategory === category)
        && terms.every(term => (card.dataset.catalogSearch || card.textContent.toLowerCase()).includes(term));
      card.hidden = !match;
      if (match) visible++;
      grid?.appendChild(card);
    });
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.catalogFilter === category)));
    if (count) count.textContent = `${visible} product${visible === 1 ? '' : 's'}`;
    if (empty) empty.hidden = visible !== 0;
  };
  filters.forEach(filter => filter.addEventListener('click', () => {
    category = filter.dataset.catalogFilter;
    update();
    window.mxpackTrack?.('catalog_filter', {filter_name:category});
  }));
  input?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 120);
  });
  sort?.addEventListener('change', update);
  const requestedCategory = new URLSearchParams(location.search).get('category');
  if (filters.some(filter => filter.dataset.catalogFilter === requestedCategory)) category = requestedCategory;
  update();
})();
