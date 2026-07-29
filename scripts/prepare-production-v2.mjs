import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const production = path.join(root, "mxpack_website_with_section_images");
const analyticsId = "G-9VZK4M6KDS";
const indexablePages = new Set(["index.html", "products.html"]);

const analytics = [
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>`,
  "<script>",
  "window.dataLayer = window.dataLayer || [];",
  "function gtag(){dataLayer.push(arguments);}",
  "gtag('js', new Date());",
  `gtag('config', '${analyticsId}');`,
  "</script>",
].join("");

for (const file of fs.readdirSync(production).filter((name) => name.endsWith(".html"))) {
  const fullPath = path.join(production, file);
  let html = fs.readFileSync(fullPath, "utf8");

  html = html.replaceAll(
    "../mxpack_website_with_section_images/assets/",
    "assets/",
  );
  html = html.replaceAll(" | MX PACK V2 Preview", " | MX PACK");

  if (indexablePages.has(file)) {
    html = html.replace(
      /<meta name=["']robots["'] content=["'][^"']*["']>/i,
      '<meta name="robots" content="index, follow, max-image-preview:large">',
    );

    const canonicalPath = file === "index.html" ? "/" : "/products";
    const canonical = `<link rel="canonical" href="https://mxpackpro.com${canonicalPath}">`;
    if (!html.includes('rel="canonical"')) {
      html = html.replace("</head>", `${canonical}</head>`);
    }
  } else {
    html = html.replace(
      /<meta name=["']robots["'] content=["'][^"']*["']>/i,
      "<meta name='robots' content='noindex,nofollow'>",
    );
  }

  if (!html.includes(analyticsId)) {
    html = html.replace("</head>", `${analytics}</head>`);
  }

  fs.writeFileSync(fullPath, html, "utf8");
}

const quotePath = path.join(production, "get-a-quote.html");
let quote = fs.readFileSync(quotePath, "utf8");
quote = quote
  .replace("<form class='quote-form'>", "<form class='quote-form' id='quote-form'>")
  .replace(
    "<strong>+44 7704 644465</strong>",
    "<strong><a href='https://wa.me/447704644465' target='_blank' rel='noopener'>+44 7704 644465</a></strong>",
  )
  .replace(
    "<strong>+86 155 2116 3050</strong>",
    "<strong><a href='tel:+8615521163050'>+86 155 2116 3050</a></strong>",
  )
  .replace(
    "<strong>meloxu98@gmail.com</strong>",
    "<strong><a href='mailto:meloxu98@gmail.com'>meloxu98@gmail.com</a></strong>",
  )
  .replace(
    "<button class='btn' type='button'>Submit Enquiry</button>",
    "<button class='btn' type='submit'>Send Enquiry on WhatsApp</button>",
  );

const quoteScript = `<script>
document.getElementById('quote-form')?.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = new FormData(this);
  const lines = [
    'Hello MX PACK, I would like a packaging quote.',
    'Name: ' + (data.get('name') || ''),
    'Email: ' + (data.get('email') || ''),
    'Company: ' + (data.get('company') || ''),
    'Country / region: ' + (data.get('country') || ''),
    'Packaging type: ' + (data.get('product') || ''),
    'Estimated quantity: ' + (data.get('quantity') || ''),
    'Project details: ' + (data.get('details') || '')
  ];
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', { method: 'whatsapp_quote_form' });
  }
  window.open('https://wa.me/447704644465?text=' + encodeURIComponent(lines.join('\\n')), '_blank', 'noopener');
});
</script>`;

if (!quote.includes("whatsapp_quote_form")) {
  quote = quote.replace("</body>", `${quoteScript}</body>`);
}
fs.writeFileSync(quotePath, quote, "utf8");
