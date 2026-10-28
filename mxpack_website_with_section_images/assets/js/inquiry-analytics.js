(() => {
  const storage = {
    get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} },
    remove(key) { try { sessionStorage.removeItem(key); } catch {} }
  };
  const cleanPath = value => {
    if (typeof value !== 'string' || !value) return '';
    try { const url = new URL(value, location.origin); return url.origin === location.origin ? url.pathname : ''; } catch { return ''; }
  };
  const products = window.mxpackProducts || {};
  const query = window.mxpackUrlState?.read(location.href) || new URLSearchParams(location.search);
  if (window.mxpackUrlState && /^\/get-a-quote(?:\.html)?\/?$/.test(location.pathname)) {
    const formState = value => window.mxpackUrlState.keysFor(location.pathname).map(key => [key, window.mxpackUrlState.read(value).get(key)]);
    const initialState = JSON.stringify(formState(location.href));
    // A different quote brief is a navigation, as it was with legacy query links.
    window.addEventListener('hashchange', () => {
      if (JSON.stringify(formState(location.href)) !== initialState) location.reload();
    });
  }
  const productId = Object.hasOwn(products, query.get('product')) ? query.get('product') : '';
  const categoryNames = {
    'bakery-cake-boxes':'Bakery & cake packaging', 'burger-boxes':'Burger boxes',
    'custom-paper-bags':'Custom paper bags', 'paper-cups':'Paper cups',
    'pizza-boxes':'Custom pizza boxes', 'takeaway-food-boxes':'Takeaway food boxes'
  };
  const requestedCategory = query.get('category') || query.get('product');
  const categoryId = Object.hasOwn(categoryNames, requestedCategory) ? requestedCategory : '';
  const solutionNames = {
    restaurants: 'Restaurants & takeaway', catering: 'Catering & events',
    'food-brands': 'Food brands & retail', startups: 'Startups & new brands', enterprise: 'Enterprise projects'
  };
  const solution = Object.hasOwn(solutionNames, query.get('solution')) ? solutionNames[query.get('solution')] : '';
  const pageProduct = document.body.dataset.productId || '';
  const context = { product_id: pageProduct || productId || 'general', source_page: location.pathname };
  const landing = storage.get('mxpackLanding') || { path: location.pathname, campaign: Object.fromEntries(['utm_source','utm_medium','utm_campaign'].filter(key => query.has(key)).map(key => [key, query.get(key).slice(0,120)])) };
  storage.set('mxpackLanding', landing);
  window.mxpackTrack = (name, params = {}) => {
    if (!['view_item', 'view_item_list', 'catalog_filter'].includes(name)) window.mxpackLoadAnalytics?.();
    window.gtag?.('event', name, { ...context, ...params, transport_type: 'beacon' });
  };
  if (pageProduct && products[pageProduct]) {
    window.mxpackTrack('view_item', { items: [{ item_id: pageProduct, item_name: products[pageProduct].name, item_category: products[pageProduct].category }] });
  }
  if (document.querySelector('.catalog-grid')) window.mxpackTrack('view_item_list', { item_list_id: 'packaging_catalog' });

  const modalStyle = document.createElement('link');
  modalStyle.rel = 'stylesheet';
  modalStyle.href = '/assets/css/email-inquiry.css?v=20261023-1';
  document.head.append(modalStyle);
  const dialog = document.createElement('dialog');
  dialog.className = 'email-inquiry-dialog';
  dialog.setAttribute('aria-labelledby', 'email-inquiry-title');
  dialog.innerHTML = `
    <div class="email-inquiry-heading"><div><p class="email-inquiry-eyebrow">MXPACKPRO</p><h2 id="email-inquiry-title">Tell us about your packaging.</h2></div><button type="button" data-email-inquiry-close aria-label="Close inquiry form" title="Close inquiry form"><i class="icon" data-lucide="x" aria-hidden="true"></i></button></div>
    <form action="https://formsubmit.co/sales@mxpackpro.com" method="POST" data-quote-form data-email-inquiry>
      <input type="hidden" name="_subject" value="New MXPACKPRO website inquiry">
      <input type="hidden" name="_template" value="basic"><input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_next" value="https://mxpackpro.com/thank-you">
      <input type="text" name="_honey" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="email-inquiry-fields"><div><label for="email-inquiry-name">Full name <span aria-hidden="true">*</span></label><input id="email-inquiry-name" name="Name" required autocomplete="name" maxlength="160"></div><div><label for="email-inquiry-email">Email <span aria-hidden="true">*</span></label><input id="email-inquiry-email" name="email" type="email" required autocomplete="email" maxlength="254"></div></div>
      <div class="email-inquiry-field"><label for="email-inquiry-company">Company</label><input id="email-inquiry-company" name="Company Name" autocomplete="organization" maxlength="200"></div>
      <div class="email-inquiry-field"><label for="email-inquiry-message">Packaging requirements <span aria-hidden="true">*</span></label><textarea id="email-inquiry-message" name="Message" rows="5" required maxlength="10000" placeholder="Packaging type, size, quantity and delivery country"></textarea></div>
      <button class="button email-inquiry-submit" type="submit">Send inquiry <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></button>
      <p class="email-inquiry-privacy">Your details are used to respond to this inquiry. <a href="/privacy-policy">Privacy policy</a></p>
    </form>
    <div class="email-inquiry-alternatives"><a data-direct-inquiry-email data-track="email_direct_modal_click">Email directly <i class="icon" data-lucide="mail" aria-hidden="true"></i></a><a href="https://wa.me/8615918968149" data-whatsapp data-track="whatsapp_modal_click"><img src="/assets/img/brand/whatsapp.svg" alt="" width="18" height="18"> WhatsApp</a></div>`;
  document.body.append(dialog);
  document.querySelectorAll('.floating-contact .mail').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', 'Open email inquiry form');
    link.setAttribute('title', 'Send an inquiry');
  });
  let opener;
  const modalProduct = products[pageProduct || productId];
  const directEmail = dialog.querySelector('[data-direct-inquiry-email]');
  directEmail.href = `mailto:sales@mxpackpro.com?subject=${encodeURIComponent(modalProduct ? `Packaging RFQ - ${modalProduct.name}` : 'Custom packaging inquiry')}&body=${encodeURIComponent(`Page: https://mxpackpro.com${location.pathname}`)}`;
  document.addEventListener('click', event => {
    const trigger = event.target.closest('.floating-contact .mail, .mobile-contact-email, [data-email-inquiry-open]');
    if (!trigger) return;
    trigger.dataset.track = 'email_modal_open';
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    if (dialog.open) return;
    opener = trigger;
    if (!dialog.isConnected) document.body.append(dialog);
    document.querySelector('[data-contact-prompt]')?.setAttribute('hidden', '');
    document.querySelector('[data-whatsapp-help]')?.setAttribute('hidden', '');
    dialog.showModal();
    document.body.classList.add('email-inquiry-open');
    dialog.querySelector('#email-inquiry-name').focus({preventScroll:true});
  }, true);
  dialog.querySelector('[data-email-inquiry-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const fields = Array.from(dialog.querySelectorAll('button, input, textarea, select, a[href]')).filter(item => !item.disabled && item.tabIndex >= 0 && item.getClientRects().length);
    const first = fields[0], last = fields[fields.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.querySelector('[data-whatsapp]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('email-inquiry-open');
    dialog.remove();
    opener?.focus({preventScroll:true});
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href], [data-track]');
    if (!link) return;
    const destination = cleanPath(link.href);
    const eventName = link.dataset.track || (destination === '/get-a-quote' ? 'quote_click' : '');
    if (!eventName) return;
    const id = products[link.dataset.productId] ? link.dataset.productId : pageProduct;
    const params = { product_id: id || 'general', entry_point: eventName, destination_path: destination };
    if (eventName === 'home_category_click' && ['hot-selling','grazing-boxes','bbq','takeaway-food-boxes','cake-boxes','mailer-boxes','macaron-chocolate','cosmetic-boxes','pizza-boxes','wine-boxes','gift-boxes','apparel-boxes','burger-boxes','paper-bags','paper-cups','christmas-boxes'].includes(link.dataset.homeFamily)) {
      params.entry_point = `home_${link.dataset.homeFamily}`;
      params.item_category = link.dataset.homeFamily;
    }
    if (eventName.startsWith('quote_')) {
      storage.set('mxpackQuoteEntry', { ...params, source_page: location.pathname, at: Date.now() });
      if (destination === '/get-a-quote') {
        const target = window.mxpackUrlState
          ? window.mxpackUrlState.write(link.href, { ...(id ? {product:id} : {}), from:location.pathname })
          : new URL(link.href);
        if (!window.mxpackUrlState && id) target.searchParams.set('product', id);
        link.href = target.href;
      }
    }
    window.mxpackTrack(eventName, params);
  });

  document.querySelectorAll('[data-quote-form]').forEach(form => {
    const setHidden = (name, value) => {
      let input = Array.from(form.elements).find(item => item.name === name);
      if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.append(input); }
      input.value = value;
    };
    const isEmailInquiry = form.hasAttribute('data-email-inquiry');
    const formProductId = isEmailInquiry ? pageProduct || productId : productId;
    const pageCategory = location.pathname.replace(/^\/|\.html$|\/$/g, '');
    const formCategoryId = isEmailInquiry && Object.hasOwn(categoryNames, pageCategory) ? pageCategory : categoryId;
    const product = products[formProductId];
    const entry = storage.get('mxpackQuoteEntry');
    const freshEntry = entry && Date.now() - entry.at < 30 * 60 * 1000 ? entry : null;
    const sourcePage = isEmailInquiry ? location.pathname : cleanPath(query.get('from')) || freshEntry?.source_page || cleanPath(document.referrer) || location.pathname;
    const entryPoint = isEmailInquiry ? 'email_modal' : freshEntry?.entry_point || (['catalog','product-detail'].includes(query.get('source')) ? query.get('source') : 'direct_quote');
    if (isEmailInquiry) setHidden('_url', `https://mxpackpro.com${location.pathname}`);
    if (product) {
      const referenceView=Object.hasOwn(product.views||{},query.get('view'))?product.views[query.get('view')]:'';
      if(referenceView)setHidden('Packaging reference view',referenceView);
      setHidden('Product', product.name);
      setHidden('Product page', `https://mxpackpro.com/products/${formProductId}`);
      setHidden('_subject', `Packaging RFQ - ${product.name} - MXPACKPRO`);
      const message = form.querySelector('[name="Message"]');
      if (message && !message.value) message.value = `I am interested in ${product.name}.${referenceView?`\nReference view: ${referenceView}`:''}\nQuantity: \nSize / packed product: \nDelivery country: \nTarget date: `;
    } else if (formCategoryId) {
      setHidden('Packaging category', categoryNames[formCategoryId]);
      setHidden('Category page', `https://mxpackpro.com/${formCategoryId}`);
      setHidden('_subject', `Packaging RFQ - ${categoryNames[formCategoryId]} - MXPACKPRO`);
      const message = form.querySelector('[name="Message"]');
      if (message && !message.value) message.value = `I am interested in ${categoryNames[formCategoryId]}.\nQuantity per size / design: \nInternal dimensions / packed product: \nDelivery country: \nTarget arrival date: `;
    } else if (solution) {
      setHidden('Business type', solution);
      setHidden('_subject', `Packaging RFQ - ${solution} - MXPACKPRO`);
      const message = form.querySelector('[name="Message"]');
      if (message && !message.value) message.value = `Packaging for ${solution}.\nFood / products to pack: \nQuantity: \nDelivery country: `;
    }
    if(query.get('occasion')==='christmas'){
      setHidden('Seasonal project','Christmas packaging; arrival date and availability require project review');
      const message=form.querySelector('[name="Message"]');
      if(message&&!message.value.startsWith('Christmas packaging project.')){
        message.value=`Christmas packaging project.\n${message.value||'Product / contents: \nQuantity: \nSize: \n'}\nRequired arrival date: \nDelivery country / postal code: `;
      }
    }
    setHidden('Inquiry source', sourcePage);
    setHidden('Landing page', landing.path);
    for (const [key,value] of Object.entries(landing.campaign || {})) setHidden(key, value);
    let started = false;
    let submitting = false;
    const eventContext = { product_id: formProductId || 'general', category_id: formCategoryId || '', source_page: sourcePage, entry_point: entryPoint, form_name: isEmailInquiry ? 'email_inquiry' : 'quote_request' };
    form.addEventListener('focusin', () => {
      if (started) return;
      started = true;
      window.mxpackTrack('form_start', eventContext);
    });
    form.addEventListener('formdata', event => {
      if (!form.querySelector('#phone')) return;
      const phone = form.querySelector('#phone')?.value.trim() || '';
      const code = form.querySelector('#country-code')?.value || '';
      event.formData.set('Phone', phone.startsWith('+') ? phone : `${code} ${phone}`.trim());
      event.formData.delete('Country Code');
    });
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) return;
      event.preventDefault();
      if (submitting) return;
      submitting = true;
      const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setHidden('Inquiry reference', token);
      setHidden('_next', `https://mxpackpro.com/thank-you?request=${encodeURIComponent(token)}`);
      storage.set('mxpackPendingInquiry', { token, at: Date.now(), context: eventContext });
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      let sent = false;
      const send = () => {
        if (sent) return;
        sent = true;
        HTMLFormElement.prototype.submit.call(form);
      };
      window.mxpackTrack('form_submit', { ...eventContext, event_callback: send, event_timeout: 700 });
      setTimeout(send, 800);
    });
    window.addEventListener('pageshow', () => {
      submitting = false;
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = false;
    });
  });

  // Keep the initialized dialog out of page form integrations until it is opened.
  document.addEventListener('DOMContentLoaded', () => { if (!dialog.open) dialog.remove(); }, {once:true});

  if (/\/thank-you(?:\.html)?\/?$/.test(location.pathname)) {
    const pending = storage.get('mxpackPendingInquiry');
    const token = query.get('request');
    // A provider return with the matching pending submission is not proof of mailbox delivery.
    if (pending && token === pending.token && Date.now() - pending.at < 2 * 60 * 60 * 1000) {
      storage.remove('mxpackPendingInquiry');
      window.mxpackTrack('generate_lead', { ...pending.context, lead_confirmation: 'provider_return' });
    }
    if (token) history.replaceState(null, '', location.pathname);
  }
})();
