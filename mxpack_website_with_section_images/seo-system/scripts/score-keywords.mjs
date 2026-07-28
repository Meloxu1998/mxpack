import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(here, '..');
const inputPath = path.join(systemRoot, 'data', 'keyword-input.csv');
const outputPath = path.join(systemRoot, 'data', 'keyword-opportunities.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const [headers, ...rows] = parseCsv(fs.readFileSync(inputPath, 'utf8'));
const records = rows.map((row) => Object.fromEntries(headers.map((key, index) => [key, row[index] ?? ''])));

const scored = records.map((record) => {
  const businessFit = Number(record.business_fit || 0);
  const buyerIntent = Number(record.buyer_intent || 0);
  const pageGap = record.target_url ? 1 : 5;
  const msv = record.msv ? Math.min(5, Math.log10(Number(record.msv) + 1)) : 2.5;
  const kd = record.kd ? Math.max(0, 5 - (Number(record.kd) / 20)) : 2.5;
  const score = Math.round((businessFit * 6) + (buyerIntent * 6) + (pageGap * 4) + (msv * 2) + (kd * 2));
  const confidence = record.msv && record.kd && record.cpc_usd ? 'high' : 'needs_keyword_data';
  return { ...record, priority_score: score, data_confidence: confidence };
}).sort((a, b) => b.priority_score - a.priority_score || a.keyword.localeCompare(b.keyword));

const outputHeaders = [...headers, 'priority_score', 'data_confidence'];
const output = [
  outputHeaders.join(','),
  ...scored.map((record) => outputHeaders.map((header) => csvCell(record[header])).join(',')),
  '',
].join('\n');

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Scored ${scored.length} keywords -> ${path.relative(systemRoot, outputPath)}`);
console.log('Top opportunities:');
for (const record of scored.filter((item) => !item.target_url).slice(0, 10)) {
  console.log(`${record.priority_score}\t${record.keyword}\t${record.cluster}\t${record.data_confidence}`);
}
