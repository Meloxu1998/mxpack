import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inquiryVersion} from './url-state-html.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [...fs.readdirSync(root).filter(file => file.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'products')).filter(file => file.endsWith('.html')).map(file => 'products/' + file)];
let changed = 0;
for (const file of files) {
  const target = path.join(root, file);
  const previous = fs.readFileSync(target, 'utf8');
  let html = previous.replace(/inquiry-analytics\.js\?v=[^"']+/g, `inquiry-analytics.js?v=${inquiryVersion}`)
    .replaceAll('action="https://formsubmit.co/sales@mxpackpro.com"', 'action="/api/inquiry"')
    .replace(/<input type="hidden" name="_(?:autoresponse|next|template|captcha)"[^>]*>/g, '');
  if (file === 'privacy-policy.html') {
    html = html.replace('Last updated August 25, 2026', 'Last updated November 4, 2026')
      .replace('Inquiry forms are processed through FormSubmit and website analytics are provided by Google Analytics. These providers may process data under their own policies.',
        'Inquiry forms are received and temporarily stored using Cloudflare services. Email notifications are sent to our existing sales mailbox. Website analytics are provided by Google Analytics. These providers may process data under their own policies.')
      .replace('We keep inquiry information only as needed for business communication and project records. We do not sell personal information.',
        'The website receipt store retains inquiry details for up to 30 days so our team can recover a request if an email notification fails. Short-lived pseudonymous request identifiers help limit abuse; raw IP addresses are not kept in this receipt store. Email correspondence and project records are kept only as needed for business communication. We do not sell personal information.');
  }
  if (file === 'thank-you.html') {
    html = html.replaceAll('Packaging Inquiry Received', 'Packaging Inquiry Confirmation')
      .replaceAll('Your MXPACKPRO custom food packaging inquiry has been received. Continue exploring products or send another packaging inquiry.', 'MXPACKPRO packaging inquiry confirmation and contact options.')
      .replace('<p class="eyebrow">Inquiry received</p><h1 class="display-title">Thank you. Your packaging brief is on its way.</h1><p>We will review the information and normally respond within one business day. If you have another project, send us a separate brief.</p>',
        '<p class="eyebrow">Packaging inquiries</p><h1 class="display-title" data-inquiry-result-title>Thank you for contacting MXPACKPRO.</h1><p data-inquiry-receipt hidden></p><p>Keep your inquiry reference for follow-up. If you need help or have not received a reply, email <a href="mailto:sales@mxpackpro.com">sales@mxpackpro.com</a> or contact us on WhatsApp.</p>');
  }
  if (html !== previous) { fs.writeFileSync(target, html); changed++; }
}
const routePath = path.join(root, '_routes.json');
const routes = JSON.parse(fs.readFileSync(routePath, 'utf8'));
if (!routes.include.includes('/api/inquiry')) {
  routes.include.push('/api/inquiry');
  fs.writeFileSync(routePath, JSON.stringify(routes, null, 2) + '\n');
}
console.log(`Updated inquiry endpoint/cache version in ${changed} pages; existing exact withdrawn routes preserved.`);
