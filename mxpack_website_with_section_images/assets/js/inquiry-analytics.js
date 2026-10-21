(() => {
  const storage = {
    get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} },
    remove(key) { try { sessionStorage.removeItem(key); } catch {} }
  };
  const cleanPath = value => {
    try { const url = new URL(value, location.origin); return url.origin === location.origin ? url.pathname : ''; } catch { return ''; }
  };
  const products = window.mxpackProducts || {};
  const query = new URLSearchParams(location.search);
  const productId = products[query.get('product')] ? query.get('product') : '';
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

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href], [data-track]');
    if (!link) return;
    const destination = cleanPath(link.href);
    const eventName = link.dataset.track || (destination === '/get-a-quote' ? 'quote_click' : '');
    if (!eventName) return;
    const id = products[link.dataset.productId] ? link.dataset.productId : pageProduct;
    const params = { product_id: id || 'general', entry_point: eventName, destination_path: destination };
    if (eventName.startsWith('quote_')) {
      storage.set('mxpackQuoteEntry', { ...params, source_page: location.pathname, at: Date.now() });
      if (id && destination === '/get-a-quote') {
        const target = new URL(link.href);
        target.searchParams.set('product', id);
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
    const product = products[productId];
    const entry = storage.get('mxpackQuoteEntry');
    const freshEntry = entry && Date.now() - entry.at < 30 * 60 * 1000 ? entry : null;
    const sourcePage = freshEntry?.source_page || cleanPath(document.referrer) || '/get-a-quote';
    const entryPoint = freshEntry?.entry_point || (['catalog','product-detail'].includes(query.get('source')) ? query.get('source') : 'direct_quote');
    if (product) {
      setHidden('Product', product.name);
      setHidden('Product page', `https://mxpackpro.com/products/${productId}`);
      setHidden('_subject', `Packaging RFQ - ${product.name} - MXPACKPRO`);
      const message = form.querySelector('[name="Message"]');
      if (message && !message.value) message.value = `I am interested in ${product.name}.\nQuantity: \nSize / packed product: \nDelivery country: \nTarget date: `;
    }
    setHidden('Inquiry source', sourcePage);
    setHidden('Landing page', landing.path);
    for (const [key,value] of Object.entries(landing.campaign || {})) setHidden(key, value);
    let started = false;
    let submitting = false;
    const eventContext = { product_id: productId || 'general', source_page: sourcePage, entry_point: entryPoint, form_name: 'quote_request' };
    form.addEventListener('focusin', () => {
      if (started) return;
      started = true;
      window.mxpackTrack('form_start', eventContext);
    });
    form.addEventListener('formdata', event => {
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
