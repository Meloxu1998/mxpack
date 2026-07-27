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
  const productSelect = quoteForm.querySelector('#product');
  const requestedProduct = new URLSearchParams(window.location.search).get('product');

  if (productSelect && requestedProduct) {
    const matchingOption = [...productSelect.options].find(
      (option) => option.textContent.trim().toLowerCase() === requestedProduct.trim().toLowerCase(),
    );
    if (matchingOption) productSelect.value = matchingOption.value;
  }

  const buildEnquiry = () => {
    const data = new FormData(quoteForm);
    return [
      'Hello MX PACK, I would like a custom packaging quote.',
      '',
      `Name: ${data.get('name')}`,
      `Business email: ${data.get('email')}`,
      `Company: ${data.get('company') || 'Not provided'}`,
      `Country / region: ${data.get('country')}`,
      `Packaging type: ${data.get('product')}`,
      `Estimated quantity: ${data.get('quantity')}`,
      `Project details: ${data.get('details')}`,
      `Source page: ${window.location.href}`,
    ];
  };

  const trackLead = (method) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'generate_lead', lead_method: method });
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', { method });
    }
  };

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!quoteForm.reportValidity()) return;

    const lines = buildEnquiry();
    const whatsappUrl = `https://wa.me/447704644465?text=${encodeURIComponent(lines.join('\n'))}`;
    const status = quoteForm.querySelector('[data-form-status]');

    if (status) status.textContent = 'Opening WhatsApp with your enquiry details...';
    trackLead('WhatsApp quote form');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  const emailButton = quoteForm.querySelector('[data-email-quote]');
  if (emailButton) {
    emailButton.addEventListener('click', () => {
      if (!quoteForm.reportValidity()) return;

      const body = buildEnquiry().join('\n');
      const emailUrl = `mailto:meloxu98@gmail.com?subject=${encodeURIComponent('Custom Packaging Quote Request')}&body=${encodeURIComponent(body)}`;
      const status = quoteForm.querySelector('[data-form-status]');

      if (status) status.textContent = 'Opening your email application...';
      trackLead('Email quote form');
      window.location.href = emailUrl;
    });
  }
}

document.querySelectorAll('a[href^="/get-a-quote"]').forEach((link) => {
  link.addEventListener('click', () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'quote_cta_click',
      source_page: window.location.pathname,
      destination: link.getAttribute('href'),
    });
  });
});
