const VERSION = '20261104-receipt1';
const MAX_BODY = 24576;
const RETENTION_SECONDS = 30 * 86400;
const RETRY_DELAYS = [60, 300, 900, 3600, 10800, 21600, 43200, 86400];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

class RequestError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function textField(form, key, max, required = false, multiline = false) {
  const values = form.getAll(key);
  if (values.length > 1 || values.some(value => typeof value !== 'string')) throw new RequestError(400, 'invalid_fields');
  const value = (values[0] || '').trim();
  if (value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (!multiline && /[\r\n]/.test(value))) throw new RequestError(400, 'invalid_fields');
  if (required && !value) throw new RequestError(400, 'required_fields');
  return value;
}

function localPage(value, origin) {
  if (!value) return '';
  try {
    const url = new URL(value, origin);
    return url.origin === origin && !url.username && !url.password ? origin + url.pathname : '';
  } catch { return ''; }
}

export function parseInquiry(form, origin) {
  if (textField(form, '_honey', 200)) throw new RequestError(400, 'invalid_fields');
  const payload = {
    name: textField(form, 'Name', 160, true),
    email: textField(form, 'email', 254, true).toLowerCase(),
    company: textField(form, 'Company Name', 200),
    country: textField(form, 'Country', 160),
    phone: textField(form, 'Phone', 80),
    message: textField(form, 'Message', 10000, true, true),
    product: textField(form, 'Product', 240),
    productPage: localPage(textField(form, 'Product page', 1000), origin),
    category: textField(form, 'Packaging category', 160),
    categoryPage: localPage(textField(form, 'Category page', 1000), origin),
    referenceView: textField(form, 'Packaging reference view', 240),
    businessType: textField(form, 'Business type', 160),
    seasonalProject: textField(form, 'Seasonal project', 240),
    sourcePage: localPage(textField(form, 'Inquiry source', 1000, true), origin),
    landingPage: localPage(textField(form, 'Landing page', 1000), origin)
  };
  if (!EMAIL.test(payload.email) || !payload.sourcePage) throw new RequestError(400, 'invalid_fields');
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) payload[key] = textField(form, key, 120);
  const countryCode = textField(form, 'Country Code', 8);
  if (countryCode && payload.phone && !payload.phone.startsWith('+')) payload.phone = `${countryCode} ${payload.phone}`;
  const requestKey = textField(form, 'Inquiry reference', 36) || crypto.randomUUID();
  if (!UUID.test(requestKey)) throw new RequestError(400, 'invalid_reference');
  return {payload, requestKey};
}

async function digest(value, salt = '') {
  const bytes = new TextEncoder().encode(salt + '\n' + value);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function limitedBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new RequestError(413, 'request_too_large');
  const chunks = [];
  let length = 0;
  if (!request.body) throw new RequestError(400, 'required_fields');
  const reader = request.body.getReader();
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY) { await reader.cancel(); throw new RequestError(413, 'request_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Response(bytes, {headers: {'Content-Type': request.headers.get('Content-Type')}}).formData();
}

function response(request, data, status = 200) {
  const headers = {
    'Cache-Control': 'no-store', 'Cloudflare-CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY'
  };
  if (request.headers.get('Accept')?.includes('application/json') || request.method !== 'POST') {
    return Response.json(data, {status, headers});
  }
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const title = data.saved ? 'Your inquiry has been saved.' : 'We could not confirm your inquiry.';
  const message = data.saved ? `Reference: ${escape(data.reference)}. Our team can review your saved brief. Email notification is handled separately.` : 'Please return to the form and try again, or email sales@mxpackpro.com.';
  headers['Content-Type'] = 'text/html; charset=utf-8';
  headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | MXPACKPRO</title><style>body{margin:0;padding:40px 24px;color:#0b382e;background:#fff;font:16px/1.7 Arial,sans-serif}main{max-width:700px;margin:5vh auto}img{width:56px;height:56px}h1{font-size:30px;line-height:1.3}a{color:#006b55}p{overflow-wrap:anywhere}</style><main><img src="/assets/img/brand/mxpack-logo.svg" alt="MXPACKPRO"><h1>${title}</h1><p>${message}</p><p><a href="/get-a-quote">Return to inquiries</a> &middot; <a href="mailto:sales@mxpackpro.com">Email us</a></p></main></html>`, {status, headers});
}

export async function receive(request, env, ctx) {
  if (new URL(request.url).pathname !== '/api/inquiry') return response(request, {error:'not_found'}, 404);
  if (!env.DB || !env.NOTIFICATIONS || !env.NOTIFICATION_TO || !env.RATE_LIMIT_SALT) return response(request, {error:'temporarily_unavailable'}, 503);
  if (request.method === 'GET' || request.method === 'HEAD') return response(request, {service:'mxpack-inquiries', version:VERSION, ready:true});
  if (request.method !== 'POST') return response(request, {error:'method_not_allowed'}, 405);
  try {
    const origin = env.ALLOWED_ORIGIN || 'https://mxpackpro.com';
    if (request.headers.get('Origin') !== origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new RequestError(403, 'origin_not_allowed');
    const contentType = request.headers.get('Content-Type') || '';
    if (!/^application\/x-www-form-urlencoded(?:;|$)|^multipart\/form-data;/i.test(contentType)) throw new RequestError(415, 'unsupported_content_type');
    const {payload, requestKey} = parseInquiry(await limitedBody(request), origin);
    const payloadJson = JSON.stringify(payload);
    const payloadHash = await digest(payloadJson);
    const previous = await env.DB.prepare('SELECT reference, payload_hash FROM inquiries WHERE request_key = ?').bind(requestKey).first();
    if (previous) {
      if (previous.payload_hash !== payloadHash) throw new RequestError(409, 'reference_conflict');
      return response(request, {saved:true, reference:previous.reference, notification:'separate', duplicate:true}, 200);
    }
    const now = Math.floor(Date.now() / 1000);
    const ipHash = await digest(request.headers.get('CF-Connecting-IP') || 'unknown', env.RATE_LIMIT_SALT);
    const contactHash = await digest(payload.email, env.RATE_LIMIT_SALT);
    const reference = `MXP-${new Date(now * 1000).toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().replaceAll('-','').slice(0,20).toUpperCase()}`;
    // The conditional insert makes rate limits and the durable receipt one atomic write.
    const inserted = await env.DB.prepare(`INSERT OR IGNORE INTO inquiries
      (request_key, reference, payload_hash, created_at, ip_hash, contact_hash, payload_json, next_attempt_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE
      (SELECT COUNT(*) FROM inquiries WHERE ip_hash = ? AND created_at >= ?) < 5 AND
      (SELECT COUNT(*) FROM inquiries WHERE contact_hash = ? AND created_at >= ?) < 5 AND
      (SELECT COUNT(*) FROM inquiries WHERE created_at >= ?) < 100`)
      .bind(requestKey, reference, payloadHash, now, ipHash, contactHash, payloadJson, now,
        ipHash, now - 3600, contactHash, now - 3600, now - 86400).run();
    if (!inserted.meta.changes) {
      const concurrent = await env.DB.prepare('SELECT reference, payload_hash FROM inquiries WHERE request_key = ?').bind(requestKey).first();
      if (concurrent?.payload_hash === payloadHash) return response(request, {saved:true, reference:concurrent.reference, notification:'separate', duplicate:true});
      throw new RequestError(concurrent ? 409 : 429, concurrent ? 'reference_conflict' : 'please_contact_directly');
    }
    // A failed notification cannot erase an already-saved customer request.
    ctx.waitUntil(deliverNotification(env, requestKey).catch(() => console.error('inquiry_notification_internal_error')));
    return response(request, {saved:true, reference, notification:'separate'}, 201);
  } catch (error) {
    if (!(error instanceof RequestError)) console.error('inquiry_receipt_internal_error');
    return response(request, {error:error instanceof RequestError ? error.code : 'temporarily_unavailable'}, error instanceof RequestError ? error.status : 503);
  }
}

export function notificationText(row) {
  const p = JSON.parse(row.payload_json);
  return [
    'MXPACKPRO website inquiry for sales@mxpackpro.com',
    `Inquiry reference: ${row.reference}`,
    `Received (UTC): ${new Date(row.created_at * 1000).toISOString()}`,
    'This is a notification of a saved inquiry, not proof of a qualified sales lead.',
    '', `Name: ${p.name}`, `Email: ${p.email}`, `Company: ${p.company}`,
    `Country: ${p.country}`, `Phone: ${p.phone}`, '',
    `Product: ${p.product}`, `Product page: ${p.productPage}`,
    `Category: ${p.category}`, `Category page: ${p.categoryPage}`,
    `Reference view: ${p.referenceView}`, `Business type: ${p.businessType}`,
    `Seasonal project: ${p.seasonalProject}`, `Inquiry source: ${p.sourcePage}`,
    `Landing page: ${p.landingPage}`, `Campaign: ${p.utm_source} / ${p.utm_medium} / ${p.utm_campaign}`,
    '', 'Packaging requirements:', p.message
  ].join('\n');
}

export async function deliverNotification(env, requestKey) {
  const now = Math.floor(Date.now() / 1000);
  const lease = crypto.randomUUID();
  const claimed = await env.DB.prepare(`UPDATE inquiries SET notification_status = 'sending',
    lease_token = ?, lease_until = ?, attempts = attempts + 1
    WHERE request_key = ? AND attempts < 8 AND next_attempt_at <= ? AND
    (notification_status = 'pending' OR (notification_status = 'sending' AND lease_until < ?))`)
    .bind(lease, now + 300, requestKey, now, now).run();
  if (!claimed.meta.changes) return;
  const row = await env.DB.prepare('SELECT * FROM inquiries WHERE request_key = ? AND lease_token = ?').bind(requestKey, lease).first();
  let result;
  try {
    result = await env.NOTIFICATIONS.send({
      from: {email:'sales@mxpackpro.com', name:'MXPACKPRO Website'},
      to: env.NOTIFICATION_TO,
      replyTo: JSON.parse(row.payload_json).email,
      subject: `[MXPACKPRO Inquiry ${row.reference}] Saved packaging request`,
      text: notificationText(row),
      headers: {'X-MXPACK-Inquiry-Reference':row.reference}
    });
  } catch (error) {
    const code = /^E_[A-Z_]+$/.test(error.code || '') ? error.code : 'notification_error';
    await env.DB.prepare(`UPDATE inquiries SET notification_status = ?, last_error_code = ?,
      next_attempt_at = ?, lease_until = 0, lease_token = NULL WHERE request_key = ? AND lease_token = ?`)
      .bind(row.attempts >= 8 ? 'failed' : 'pending', code, now + RETRY_DELAYS[row.attempts - 1], requestKey, lease).run();
    return;
  }
  // 'accepted' is a provider acknowledgement, never a mailbox-delivery assertion.
  await env.DB.prepare(`UPDATE inquiries SET notification_status = 'accepted', provider_message_id = ?,
    accepted_at = ?, last_error_code = NULL, lease_until = 0, lease_token = NULL WHERE request_key = ? AND lease_token = ?`)
    .bind(result?.messageId || null, now, requestKey, lease).run();
}

export async function scheduled(env) {
  const now = Math.floor(Date.now() / 1000);
  const pending = await env.DB.prepare(`SELECT request_key FROM inquiries WHERE next_attempt_at <= ? AND attempts < 8
    AND (notification_status = 'pending' OR (notification_status = 'sending' AND lease_until < ?)) LIMIT 10`).bind(now, now).all();
  for (const row of pending.results) await deliverNotification(env, row.request_key);
  await env.DB.prepare('DELETE FROM inquiries WHERE created_at < ?').bind(now - RETENTION_SECONDS).run();
}

export default {
  fetch: receive,
  scheduled(controller, env, ctx) { ctx.waitUntil(scheduled(env)); }
};
