import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(here, '..');
const config = JSON.parse(fs.readFileSync(path.join(systemRoot, 'config.json'), 'utf8'));
const shouldWrite = process.argv.includes('--write');
const reportDate = new Date().toISOString().slice(0, 10);
const placeholderPattern = /PRODUCT PAGE FRAMEWORK|This framework is ready|Real content will replace|View framework/i;

function stripHtml(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchContent(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? '';
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'MXPACK-SEO-Audit/1.0' },
    });
    return { response, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

const sitemapUrl = `${config.site_url}/sitemap.xml`;
const sitemapResult = await fetchText(sitemapUrl);
if (!sitemapResult.response.ok) {
  throw new Error(`Sitemap returned ${sitemapResult.response.status}: ${sitemapUrl}`);
}

const urls = [...sitemapResult.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const results = [];

for (const url of urls) {
  try {
    const { response, text } = await fetchText(url);
    const title = matchContent(text, /<title>([\s\S]*?)<\/title>/i);
    const description = matchContent(
      text,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    );
    const canonical = matchContent(
      text,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    );
    const robots = matchContent(
      text,
      /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
    );
    const h1Count = (text.match(/<h1\b/gi) || []).length;
    const wordCount = stripHtml(text).split(/\s+/).filter(Boolean).length;
    const jsonLdBlocks = [...text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let schemaValid = jsonLdBlocks.length > 0;
    for (const block of jsonLdBlocks) {
      try {
        JSON.parse(block[1]);
      } catch {
        schemaValid = false;
      }
    }
    const issues = [];
    if (!response.ok) issues.push(`HTTP ${response.status}`);
    if (h1Count !== 1) issues.push(`${h1Count} H1 elements`);
    if (!title || title.length < 20 || title.length > 65) issues.push(`title length ${title.length}`);
    if (!description || description.length < 80 || description.length > 170) {
      issues.push(`description length ${description.length}`);
    }
    if (canonical !== url) issues.push('canonical mismatch');
    if (!/index/i.test(robots) || /noindex/i.test(robots)) issues.push(`robots: ${robots || 'missing'}`);
    if (!schemaValid) issues.push('missing or invalid JSON-LD');
    if (placeholderPattern.test(text)) issues.push('placeholder copy');
    if (!text.includes(config.analytics.ga4_measurement_id) && !text.includes('assets/js/site.js')) {
      issues.push('GA4 loader missing');
    }
    if (wordCount < 250 && !url.endsWith('/get-a-quote')) issues.push(`thin content: ${wordCount} words`);
    results.push({ url, status: response.status, title, wordCount, issues });
  } catch (error) {
    results.push({ url, status: 0, title: '', wordCount: 0, issues: [error.message] });
  }
}

const robotsResult = await fetchText(`${config.site_url}/robots.txt`);
const wildcardBlocks = robotsResult.text
  .split(/(?=User-agent:)/i)
  .filter((block) => /^User-agent:\s*\*/i.test(block.trim()))
  .map((block) => block.split(/(?=User-agent:)/i)[0]);
const blocksAllCrawling = wildcardBlocks.every(
  (block) => !/^Disallow:\s*\/\s*$/im.test(block),
);
const robotsHealthy = robotsResult.response.ok
  && robotsResult.text.includes(`Sitemap: ${sitemapUrl}`)
  && blocksAllCrawling;
const failing = results.filter((result) => result.issues.length);
const lines = [
  `# MX PACK Weekly SEO Audit - ${reportDate}`,
  '',
  `- Sitemap URLs: ${urls.length}`,
  `- Healthy pages: ${results.length - failing.length}`,
  `- Pages needing attention: ${failing.length}`,
  `- robots.txt: ${robotsHealthy ? 'healthy' : 'needs attention'}`,
  `- GA4 expected: ${config.analytics.ga4_measurement_id}`,
  '',
  '## Page Results',
  '',
  '| URL | HTTP | Words | Issues |',
  '| --- | ---: | ---: | --- |',
  ...results.map((result) => `| ${result.url} | ${result.status} | ${result.wordCount} | ${result.issues.join('; ') || 'None'} |`),
  '',
  '## Required Follow-up',
  '',
  ...(failing.length
    ? failing.map((result) => `- Fix ${result.url}: ${result.issues.join('; ')}.`)
    : ['- No technical page failures detected. Review GSC queries, GA4 lead events and the content queue.']),
  '- Do not publish claims that are still listed as requiring evidence in config.json.',
  '',
].join('\n');

console.log(lines);
if (shouldWrite) {
  const reportDir = path.join(systemRoot, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${reportDate}-weekly-audit.md`);
  fs.writeFileSync(reportPath, lines, 'utf8');
  console.log(`Saved ${path.relative(systemRoot, reportPath)}`);
}

if (failing.length || !robotsHealthy) process.exitCode = 1;
