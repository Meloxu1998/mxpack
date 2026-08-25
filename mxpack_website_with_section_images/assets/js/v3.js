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
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent(`MXPACKPRO inquiry from ${data.get('company') || data.get('name') || 'website visitor'}`);
    const body = encodeURIComponent([
      `Name: ${data.get('name') || ''}`,
      `Business email: ${data.get('email') || ''}`,
      `Company: ${data.get('company') || ''}`,
      `Phone / WhatsApp: ${data.get('phone') || ''}`,
      `Packaging: ${data.get('packaging') || ''}`,
      `Estimated quantity: ${data.get('quantity') || ''}`,
      `Target date: ${data.get('date') || ''}`,
      '',
      `${data.get('message') || ''}`
    ].join('\n'));
    window.location.href = `mailto:meloxu98@gmail.com?subject=${subject}&body=${body}`;
    if (window.gtag) window.gtag('event', 'generate_lead', { form_name: 'quote_request' });
  });
});

document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.gtag) window.gtag('event', link.dataset.track, { link_url: link.href });
  });
});

if (window.lucide) window.lucide.createIcons();
else window.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
