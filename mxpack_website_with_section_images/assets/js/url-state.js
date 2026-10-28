(function (root) {
  const keysFor = pathname => {
    const page = pathname.replace(/\.html$|\/$/g, '');
    if (['/products', '/christmas-packaging'].includes(page)) return ['category'];
    if (page === '/get-a-quote') return ['product', 'category', 'solution', 'occasion', 'source', 'view', 'from'];
    return [];
  };
  const read = value => {
    const url = new URL(value, 'https://mxpackpro.com');
    const params = new URLSearchParams(url.search);
    const state = new URLSearchParams(url.hash.slice(1));
    for (const key of keysFor(url.pathname)) if (state.has(key)) params.set(key, state.get(key));
    return params;
  };
  const write = (value, changes = {}) => {
    const url = new URL(value, 'https://mxpackpro.com');
    const allowed = keysFor(url.pathname);
    const params = read(url);
    const state = new URLSearchParams();
    for (const key of allowed) {
      const next = Object.hasOwn(changes, key) ? changes[key] : params.get(key);
      url.searchParams.delete(key);
      if (next !== null && next !== undefined && next !== '') state.set(key, next);
    }
    if (allowed.length) url.hash = state.toString();
    return url;
  };
  const api = {read, write, keysFor};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.mxpackUrlState = api;
})(typeof window === 'object' ? window : globalThis);
