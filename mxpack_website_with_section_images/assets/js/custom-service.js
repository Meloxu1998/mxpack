document.querySelectorAll('.nav-links > a.nav-trigger').forEach(link => {
  const closeMenus = () => {
    document.querySelectorAll('.nav-group.is-open').forEach(group => {
      group.classList.remove('is-open');
      group.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  };
  link.addEventListener('pointerenter', closeMenus);
  link.addEventListener('focus', closeMenus);
});
