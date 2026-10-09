(() => {
  const filters = [...document.querySelectorAll('[data-catalog-filter]')];
  const cards = [...document.querySelectorAll('[data-catalog-category]')];

  if (!filters.length || !cards.length) return;

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const value = filter.dataset.catalogFilter;

      filters.forEach((item) => item.setAttribute('aria-pressed', String(item === filter)));
      cards.forEach((card) => {
        card.hidden = value !== 'all' && card.dataset.catalogCategory !== value;
      });

      window.gtag?.('event', 'catalog_filter', { filter_name: value });
    });
  });
})();
