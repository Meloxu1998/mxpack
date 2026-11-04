import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {receive, scheduled} from '../src/index.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const emails = [], tasks = [];
  const env = {
    ALLOWED_ORIGIN:'https://mxpackpro.com', NOTIFICATION_TO:'owner@example.test', RATE_LIMIT_SALT:'local-test-only',
    NOTIFICATIONS:{async send(message) { emails.push(message); return {messageId:'mock-email-' + emails.length}; }},
    DB:{prepare(sql) {
      const stmt = sqlite.prepare(sql);
      const build = args => ({
        bind(...values) { return build(values); },
        async first() { return stmt.get(...args) || null; },
        async all() { return {results:stmt.all(...args)}; },
        async run() { return {meta:{changes:stmt.run(...args).changes}}; }
      });
      return build([]);
    }}
  };
  return {sqlite, env, emails, tasks, ctx:{waitUntil(task) { tasks.push(task); }}, async flush() { await Promise.all(tasks.splice(0)); }};
}

function request(overrides = {}, options = {}) {
  const fields = new URLSearchParams({Name:'Local QA', email:'qa@example.test', Message:'Local mock only. Never a live inquiry.',
    'Inquiry source':'/products/bbq-meal-tray-carry-box', 'Product':'BBQ meal tray',
    'Product page':'https://mxpackpro.com/products/bbq-meal-tray-carry-box',
    'Inquiry reference':crypto.randomUUID(), ...overrides});
  return new Request('https://mxpackpro.com/api/inquiry', {method:'POST',
    headers:{Origin:'https://mxpackpro.com', Accept:'application/json', 'CF-Connecting-IP':'192.0.2.1', ...options.headers},
    body:options.body || fields});
}

const f = fixture();
const key = crypto.randomUUID();
const first = await receive(request({'Inquiry reference':key}), f.env, f.ctx);
assert.equal(first.status, 201);
const receipt = await first.json();
assert.equal(receipt.saved, true);
assert.match(receipt.reference, /^MXP-\d{8}-[A-F0-9]{20}$/);
assert(!JSON.stringify(receipt).includes('qa@example'));
assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n, 1);
await f.flush();
assert.equal(f.emails.length, 1);
assert.equal(f.emails[0].to, 'owner@example.test');
assert.equal(f.emails[0].from.email, 'sales@mxpackpro.com');
assert.equal(f.emails[0].replyTo, 'qa@example.test');
assert(f.emails[0].text.includes('BBQ meal tray'));
assert(f.emails[0].text.includes('Inquiry source: https://mxpackpro.com/products/bbq-meal-tray-carry-box'));
assert.equal(f.sqlite.prepare('SELECT notification_status FROM inquiries').get().notification_status, 'accepted');
const replay = await receive(request({'Inquiry reference':key}), f.env, f.ctx);
assert.equal(replay.status, 200);
assert.equal((await replay.json()).reference, receipt.reference);
await f.flush(); assert.equal(f.emails.length, 1);
assert.equal((await receive(request({'Inquiry reference':key, Message:'A changed brief'}), f.env, f.ctx)).status, 409);

for (const [req, status] of [
  [request({}, {headers:{Origin:'https://evil.example'}}), 403],
  [request({}, {headers:{'Sec-Fetch-Site':'cross-site'}}), 403],
  [request({email:'bad@example.test\r\nBcc:other@example.test'}), 400],
  [request({_honey:'filled'}), 400],
  [request({Message:''}), 400],
  [request({'Inquiry source':'https://evil.example/'}), 400],
  [request({'Inquiry reference':'not-a-uuid'}), 400],
  [request({}, {body:'x'.repeat(24577), headers:{'Content-Type':'application/x-www-form-urlencoded'}}), 413],
  [request({}, {body:'{}', headers:{'Content-Type':'application/json'}}), 415]
]) assert.equal((await receive(req, f.env, f.ctx)).status, status);
assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n, 1);

const limited = fixture();
for (let i = 0; i < 5; i++) assert.equal((await receive(request(), limited.env, limited.ctx)).status, 201);
assert.equal((await receive(request(), limited.env, limited.ctx)).status, 429);
await limited.flush();
assert.equal(limited.emails.length, 5);
assert.equal(limited.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n, 5);

const failing = fixture();
failing.env.NOTIFICATIONS.send = async () => { throw Object.assign(new Error('do not log customer details'), {code:'E_INTERNAL_SERVER_ERROR'}); };
const pending = await receive(request(), failing.env, failing.ctx);
assert.equal(pending.status, 201, 'A stored brief must survive a mail failure');
await failing.flush();
assert.equal(failing.sqlite.prepare('SELECT notification_status FROM inquiries').get().notification_status, 'pending');
assert.equal(failing.sqlite.prepare('SELECT last_error_code FROM inquiries').get().last_error_code, 'E_INTERNAL_SERVER_ERROR');
failing.sqlite.exec('UPDATE inquiries SET next_attempt_at = 0');
failing.env.NOTIFICATIONS.send = async message => { failing.emails.push(message); return {messageId:'mock-retry'}; };
await scheduled(failing.env);
assert.equal(failing.emails.length, 1);
assert.equal(failing.sqlite.prepare('SELECT notification_status FROM inquiries').get().notification_status, 'accepted');
await scheduled(failing.env); assert.equal(failing.emails.length, 1);

const unavailable = fixture(); delete unavailable.env.DB;
assert.equal((await receive(request(), unavailable.env, unavailable.ctx)).status, 503);
const native = fixture();
const html = await receive(request({}, {headers:{Accept:'text/html'}}), native.env, native.ctx);
assert.equal(html.status, 201); assert((await html.text()).includes('Your inquiry has been saved'));
assert.equal(html.headers.get('Cache-Control'), 'no-store');
await native.flush();
native.sqlite.exec('UPDATE inquiries SET created_at = 0');
await scheduled(native.env);
assert.equal(native.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n, 0);

console.log('PASS: durable receipts, attribution, one-notification replays, validation, origin and size checks, rate limits, mail failure/retry, retention and native fallback. All mail mocked; zero real messages.');
