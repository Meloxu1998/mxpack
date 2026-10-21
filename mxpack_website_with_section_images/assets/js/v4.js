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

document.querySelectorAll('.nav-group').forEach((group) => {
  const trigger = group.querySelector('[data-nav-toggle]');
  const menu = group.querySelector('.mega-menu');
  if (!trigger || !menu) return;
  const setOpen = (open) => {
    if (open) document.querySelectorAll('.nav-group.is-open').forEach(other => {
      if (other === group) return;
      other.classList.remove('is-open');
      other.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', 'false');
    });
    group.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  };
  trigger.addEventListener('click', () => setOpen(!group.classList.contains('is-open')));
  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    setOpen(true);
    menu.querySelector('a')?.focus();
  });
  group.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) setOpen(true); });
  group.addEventListener('mouseleave', () => { if (!group.contains(document.activeElement)) setOpen(false); });
  group.addEventListener('focusin', event => { if (event.target.matches('a.nav-trigger')) setOpen(true); });
  group.addEventListener('focusout', (event) => {
    if (!group.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener('click', event => { if (!group.contains(event.target)) setOpen(false); });
  group.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    setOpen(false);
    trigger.focus();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.nav-group').forEach(group => group.classList.remove('is-open'));
  document.querySelectorAll('[data-nav-toggle]').forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  if (mobileMenu?.classList.contains('open')) menuButton?.click();
});

document.querySelectorAll('[data-faq-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.faqFilter;
    document.querySelectorAll('[data-faq-filter]').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-faq-category]').forEach(item => {
      item.hidden = category !== 'all' && item.dataset.faqCategory !== category;
    });
  });
});

document.querySelectorAll('.mobile-menu details').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('.mobile-menu details').forEach(other => { if (other !== details) other.open = false; });
  });
});
mobileMenu?.addEventListener('click', event => {
  if (event.target.closest('a') && mobileMenu.classList.contains('open')) menuButton?.click();
});

const contactConfig = {
  quote: '/get-a-quote',
  whatsapp: 'https://wa.me/8615918968149?text=' + encodeURIComponent(`Hi MXPACKPRO, I am interested in custom packaging.\nPage: https://mxpackpro.com${location.pathname}`),
  email: 'mailto:sales@mxpackpro.com?subject=Custom%20food%20packaging%20inquiry'
};

const floatingContact = document.querySelector('.floating-contact');
if (floatingContact) {
  const primaryContact = floatingContact.querySelector('.wa');
  const email = floatingContact.querySelector('.mail');
  if (primaryContact && !primaryContact.querySelector('span')) primaryContact.insertAdjacentHTML('beforeend', '<span>WhatsApp</span>');
  if (email && !email.querySelector('span')) email.insertAdjacentHTML('beforeend', '<span>Email</span>');
}

const excludedContactPromptPaths = ['/get-a-quote', '/get-a-quote.html', '/thank-you', '/thank-you.html'];
const contactPromptAllowed = !document.querySelector('[data-quote-form]') && !excludedContactPromptPaths.some((path) => location.pathname.endsWith(path));

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
      <a class="mobile-contact-whatsapp" href="${contactConfig.whatsapp}" target="_blank" rel="noopener noreferrer" data-whatsapp data-track="whatsapp_click"><img class="icon" src="/assets/img/brand/whatsapp.svg" alt="" width="20" height="20"> WhatsApp</a>
      <a class="mobile-contact-quote" href="${contactConfig.quote}" data-track="quote_mobile_click"><i class="icon" data-lucide="file-text" aria-hidden="true"></i> Get a quote</a>
      <a class="mobile-contact-email" href="${contactConfig.email}" data-track="email_mobile_click"><i class="icon" data-lucide="mail" aria-hidden="true"></i> Email</a>
    </nav>
  `);

  const prompt = document.querySelector('[data-contact-prompt]');
  const closeButton = prompt?.querySelector('[data-contact-prompt-close]');
  let dismissedAt = 0;
  try { dismissedAt = Number(localStorage.getItem('mxpackContactPromptDismissedAt') || 0); } catch {}
  const dismissalExpired = Date.now() - dismissedAt > 7 * 24 * 60 * 60 * 1000;
  let promptShown = false;

  const showContactPrompt = (source) => {
    if (!prompt || promptShown || !dismissalExpired || window.innerWidth < 760 || document.body.dataset.contactPromptMode === 'off') return;
    promptShown = true;
    prompt.hidden = false;
    requestAnimationFrame(() => prompt.classList.add('is-visible'));
    window.gtag?.('event', 'contact_prompt_view', { prompt_source: source });
  };

  const dismissContactPrompt = () => {
    if (!prompt) return;
    prompt.classList.remove('is-visible');
    try { localStorage.setItem('mxpackContactPromptDismissedAt', String(Date.now())); } catch {}
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

const mobileWhatsAppDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let whatsAppHelp;
if (mobileWhatsAppDevice) {
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="whatsapp-help" data-whatsapp-help hidden aria-label="Other contact options" aria-live="polite">
      <button type="button" class="whatsapp-help-close" data-whatsapp-help-close aria-label="Close contact options"><i class="icon" data-lucide="x" aria-hidden="true"></i></button>
      <strong>Other ways to contact us</strong>
      <a data-whatsapp-fallback data-track="whatsapp_fallback_click">Continue with WhatsApp</a>
      <div class="whatsapp-help-alternatives"><a href="${contactConfig.quote}" data-track="quote_whatsapp_fallback_click">Get a quote</a><a href="${contactConfig.email}" data-track="email_whatsapp_fallback_click">Email us</a></div>
    </aside>`);
  whatsAppHelp = document.querySelector('[data-whatsapp-help]');
  const hideWhatsAppHelp = () => { whatsAppHelp.hidden = true; };
  document.querySelector('[data-whatsapp-help-close]').addEventListener('click', hideWhatsAppHelp);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hideWhatsAppHelp(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideWhatsAppHelp(); });
}

document.querySelectorAll('[data-whatsapp]').forEach(link => {
  const productName = document.body.dataset.productId ? document.querySelector('h1')?.textContent.trim() : '';
  const message = productName ? `Hi MXPACKPRO, I am interested in ${productName}.` : 'Hi MXPACKPRO, I am interested in custom packaging.';
  const chatEntry = mobileWhatsAppDevice ? 'whatsapp://send?phone=8615918968149&text=' : 'https://web.whatsapp.com/send/?phone=8615918968149&text=';
  link.href = chatEntry + encodeURIComponent(`${message}\nPage: https://mxpackpro.com${location.pathname}`);
  if (mobileWhatsAppDevice) {
    link.removeAttribute('target');
    link.setAttribute('aria-label', 'Chat on WhatsApp');
    link.addEventListener('click', () => {
      // App launches have no reliable browser success callback. Keep recovery user-driven.
      whatsAppHelp.querySelector('[data-whatsapp-fallback]').href = 'https://wa.me/8615918968149?text=' + encodeURIComponent(new URL(link.href).searchParams.get('text'));
      whatsAppHelp.hidden = false;
    });
  }
});

if (window.lucide) window.lucide.createIcons();
else window.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
