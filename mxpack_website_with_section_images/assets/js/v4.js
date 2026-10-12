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

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-track]');
  if (!link || !window.gtag) return;
  window.gtag('event', link.dataset.track, { link_url: link.href });
});

const contactConfig = {
  quote: '/get-a-quote',
  email: 'mailto:meloxu98@gmail.com?subject=Custom%20food%20packaging%20inquiry'
};

const floatingContact = document.querySelector('.floating-contact');
if (floatingContact) {
  const primaryContact = floatingContact.querySelector('.wa');
  const email = floatingContact.querySelector('.mail');
  if (primaryContact && !primaryContact.querySelector('span')) primaryContact.insertAdjacentHTML('beforeend', '<span>Get a quote</span>');
  if (email && !email.querySelector('span')) email.insertAdjacentHTML('beforeend', '<span>Email</span>');
}

const excludedContactPromptPaths = ['/get-a-quote', '/get-a-quote.html', '/thank-you', '/thank-you.html'];
const contactPromptAllowed = !excludedContactPromptPaths.some((path) => location.pathname.endsWith(path));

if (contactPromptAllowed) {
  document.body.classList.add('has-mobile-contact-bar');
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="contact-prompt" data-contact-prompt hidden aria-labelledby="contact-prompt-title">
      <button class="contact-prompt-close" type="button" data-contact-prompt-close aria-label="Close contact prompt">
        <i class="icon" data-lucide="x" aria-hidden="true"></i>
      </button>
      <div class="contact-prompt-icon"><i class="icon" data-lucide="messages-square" aria-hidden="true"></i></div>
      <p class="contact-prompt-kicker">Packaging support</p>
      <h2 id="contact-prompt-title">Not sure which packaging fits?</h2>
      <p>Send your product, quantity and delivery country. We will help narrow down the right format.</p>
      <div class="contact-prompt-actions">
        <a class="button contact-prompt-whatsapp" href="${contactConfig.quote}" data-track="quote_prompt_click">
          <i class="icon" data-lucide="file-text" aria-hidden="true"></i> Send inquiry
        </a>
        <a class="text-link" href="${contactConfig.email}" data-track="email_prompt_click">Email us</a>
      </div>
    </aside>
    <nav class="mobile-contact-bar" aria-label="Quick contact">
      <a class="mobile-contact-whatsapp" href="${contactConfig.quote}" data-track="quote_mobile_click"><i class="icon" data-lucide="file-text" aria-hidden="true"></i> Get a quote</a>
      <a class="mobile-contact-quote" href="${contactConfig.email}" data-track="email_mobile_click"><i class="icon" data-lucide="mail" aria-hidden="true"></i> Email us</a>
    </nav>
  `);

  const prompt = document.querySelector('[data-contact-prompt]');
  const closeButton = prompt?.querySelector('[data-contact-prompt-close]');
  const dismissedAt = Number(localStorage.getItem('mxpackContactPromptDismissedAt') || 0);
  const dismissalExpired = Date.now() - dismissedAt > 7 * 24 * 60 * 60 * 1000;
  let promptShown = false;

  const showContactPrompt = (source) => {
    if (!prompt || promptShown || !dismissalExpired || window.innerWidth < 760) return;
    promptShown = true;
    prompt.hidden = false;
    requestAnimationFrame(() => prompt.classList.add('is-visible'));
    window.gtag?.('event', 'contact_prompt_view', { prompt_source: source });
  };

  const dismissContactPrompt = () => {
    if (!prompt) return;
    prompt.classList.remove('is-visible');
    localStorage.setItem('mxpackContactPromptDismissedAt', String(Date.now()));
    window.setTimeout(() => { prompt.hidden = true; }, 220);
    window.gtag?.('event', 'contact_prompt_dismiss');
  };

  closeButton?.addEventListener('click', dismissContactPrompt);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && prompt?.classList.contains('is-visible')) dismissContactPrompt();
  });

  window.setTimeout(() => showContactPrompt('time_on_page'), 25000);
  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0 && window.scrollY / scrollable >= .45) showContactPrompt('scroll_depth');
  }, { passive: true });
}

if (window.lucide) window.lucide.createIcons();
else window.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
