(() => {
  const filters = [...document.querySelectorAll('[data-catalog-filter]')];
  const cards = [...document.querySelectorAll('[data-catalog-category]')];

  if (!filters.length || !cards.length) return;
  const input = document.querySelector('[data-catalog-search-input]');
  const sort = document.querySelector('[data-catalog-sort]');
  const count = document.querySelector('[data-catalog-result-count]');
  const empty = document.querySelector('[data-catalog-empty]');
  const grid = document.querySelector('.catalog-grid');
  const select = document.querySelector('[data-catalog-select]');
  const context = document.querySelector('[data-catalog-context]');
  const config = JSON.parse(document.querySelector('[data-catalog-taxonomy]')?.textContent || '{}');
  const resolve = value => {
    const normalized = config.aliases?.[value] || value;
    return filters.some(filter => filter.dataset.catalogFilter === normalized) ? normalized : 'all';
  };
  let category = 'all';
  const readCategory = () => (window.mxpackUrlState?.read(location.href) || new URLSearchParams(location.search)).get('category');
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
      const categories = (card.dataset.catalogCategories || card.dataset.catalogCategory || '').split(' ');
      const match = (category === 'all' || categories.includes(category))
        && terms.every(term => (card.dataset.catalogSearch || card.textContent.toLowerCase()).includes(term));
      card.hidden = !match;
      if (match) visible++;
      grid?.appendChild(card);
    });
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.catalogFilter === category)));
    if (select) select.value = category;
    if (context) {
      const description = config.categories?.find(c => c.id === category)?.description;
      const fitNote = ['cosmetic-boxes','apparel-boxes'].includes(category)
        ? ' These are adaptable structures, not fixed-size stock packs. Product dimensions, inserts and sample fit require review.' : '';
      context.textContent = category === 'hot-selling'
        ? 'A curated selection of packaging formats, not a sales ranking. Confirm the construction and quantity for your project.'
        : (description || 'Choose a category or search all packaging formats.') + fitNote;
    }
    if (count) count.textContent = `${visible} product${visible === 1 ? '' : 's'}`;
    if (empty) empty.hidden = visible !== 0;
  };
  const choose = value => {
    category = resolve(value);
    update();
    const url = window.mxpackUrlState
      ? window.mxpackUrlState.write(location.href, {category:category === 'all' ? null : category})
      : new URL(location.href);
    if (!window.mxpackUrlState) {
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
    }
    if (url.href !== location.href) history.pushState(null, '', url);
    window.mxpackTrack?.('catalog_filter', {filter_name:category});
  };
  filters.forEach(filter => filter.addEventListener('click', () => choose(filter.dataset.catalogFilter)));
  select?.addEventListener('change', () => choose(select.value));
  const restore = () => {
    category = resolve(readCategory());
    update();
  };
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', restore);
  input?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 120);
  });
  sort?.addEventListener('change', update);
  const requestedCategory = readCategory();
  category = resolve(requestedCategory);
  update();
})();
