const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.textContent = isOpen ? 'Close' : 'Menu';
  });
}

const quoteForm = document.querySelector('[data-quote-form]');

if (quoteForm) {
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!quoteForm.reportValidity()) return;

    const data = new FormData(quoteForm);
    const lines = [
      'Hello MX PACK, I would like a custom packaging quote.',
      '',
      `Name: ${data.get('name')}`,
      `Business email: ${data.get('email')}`,
      `Company: ${data.get('company') || 'Not provided'}`,
      `Country / region: ${data.get('country')}`,
      `Packaging type: ${data.get('product')}`,
      `Estimated quantity: ${data.get('quantity')}`,
      `Project details: ${data.get('details')}`,
      `Page: ${window.location.href}`,
    ];
    const whatsappUrl = `https://wa.me/447704644465?text=${encodeURIComponent(lines.join('\n'))}`;
    const status = quoteForm.querySelector('[data-form-status]');

    if (status) status.textContent = 'Opening WhatsApp with your enquiry details...';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', { method: 'WhatsApp quote form' });
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}
