import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const state = require('../assets/js/url-state.js');
export const interactionVersion = '20261028-state1';

export function compactInteractionLink(reference, page, htmlAttribute = false) {
  const raw = htmlAttribute ? reference.replaceAll('&amp;', '&') : reference;
  const url = new URL(raw, 'https://mxpackpro.com' + page);
  if (url.origin !== 'https://mxpackpro.com') return reference;
  const params = state.read(url);
  if (!state.keysFor(url.pathname).some(key => params.has(key))) return reference;
  const changes = url.pathname === '/get-a-quote' && page !== '/get-a-quote' && !params.has('from') ? {from:page} : {};
  const next = state.write(url, changes);
  const result = raw.split(/[?#]/)[0] + next.search + next.hash;
  return htmlAttribute ? result.replaceAll('&', '&amp;') : result;
}

export function compactInteractionHtml(html, page) {
  // Only interaction links and their runtime scripts change; preserve page markup and copy.
  html = html.replace(/\bhref=(['"])(.*?)\1/g, (match, quote, href) => `href=${quote}${compactInteractionLink(href, page, true)}${quote}`);
  html = html.replace(/(<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>)([\s\S]*?)(<\/script>)/g, (match, start, source, end) => {
    const data = JSON.parse(source);
    let changed = false;
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && ['url', 'item', '@id'].includes(key)) {
          const next = compactInteractionLink(value, page);
          if (next !== value) { node[key] = next; changed = true; }
        } else if (typeof value === 'object') visit(value);
      }
    };
    visit(data);
    return changed ? start + JSON.stringify(data).replaceAll('<', '\\u003c') + end : match;
  });
  html = html.replace(/(<script\b[^>]*src=['"])([^'"]*assets\/js\/(?:inquiry-analytics|products-catalog-v2|product-reference-gallery|url-state)\.js)(?:\?[^'"]*)?(['"][^>]*><\/script>)/g,
    (match, start, src, end) => `${start}${src}?v=${interactionVersion}${end}`);
  if (!/src=['"][^'"]*assets\/js\/url-state\.js/.test(html)) {
    html = html.replace(/<script\b[^>]*src=['"][^'"]*assets\/js\/inquiry-analytics\.js[^>]*><\/script>/,
      match => `<script src="/assets/js/url-state.js?v=${interactionVersion}"></script>\n` + match);
  }
  return html;
}
