const menuButton = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuButton.innerHTML = open
      ? '<i data-lucide="x" aria-hidden="true"></i>'
      : '<i data-lucide="menu" aria-hidden="true"></i>';
    if (window.lucide) window.lucide.createIcons();
  });
}

document.querySelectorAll('[data-quote-form]').forEach((form) => {
  let started = false;
  form.addEventListener('focusin', () => {
    if (started) return;
    started = true;
    window.gtag?.('event', 'form_start', { form_name: 'quote_request' });
  });
  form.addEventListener('submit', () => {
    window.gtag?.('event', 'form_submit', { form_name: 'quote_request' });
  });
});

document.querySelectorAll('.nav-group').forEach((group) => {
  const trigger = group.querySelector('.nav-trigger');
  const menu = group.querySelector('.mega-menu');
  if (!trigger || !menu) return;
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  group.addEventListener('mouseenter', () => trigger.setAttribute('aria-expanded', 'true'));
  group.addEventListener('mouseleave', () => trigger.setAttribute('aria-expanded', 'false'));
  group.addEventListener('focusin', () => trigger.setAttribute('aria-expanded', 'true'));
  group.addEventListener('focusout', (event) => {
    if (!group.contains(event.relatedTarget)) trigger.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.nav-trigger').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  if (mobileMenu?.classList.contains('open')) menuButton?.click();
});

if (location.pathname.endsWith('/thank-you') || location.pathname.endsWith('/thank-you.html')) {
  window.gtag?.('event', 'generate_lead', { form_name: 'quote_request' });
}

document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.gtag) window.gtag('event', link.dataset.track, { link_url: link.href });
  });
});

if (window.lucide) window.lucide.createIcons();
else window.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
