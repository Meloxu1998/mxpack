const withdrawnPath = '/products/custom-christmas-cracker-favor-box';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (![withdrawnPath, `${withdrawnPath}/`, `${withdrawnPath}.html`].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // A deleted Pages asset can outlive a deployment in asset-retention caches.
    const page = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    return new Response(request.method === 'HEAD' ? null : page.body, {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  },
};
