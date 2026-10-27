import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/* Редиректы со старого сайта на Тильде: data/redirects-tilda.csv + наш выбор целей из content/redirects-overrides.json. */

export type Redirect = { from: string; to: string; confidence: string; note: string };

const ROOT = process.cwd();

export function parseCsv(text: string): Redirect[] {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  if (header?.trim() !== 'from,to,confidence,note') throw new Error(`Неожиданный заголовок CSV редиректов: ${header}`);
  return rows.map((line) => {
    const [from, to, confidence, ...note] = line.split(',');
    if (!from || !to || !confidence) throw new Error(`Битая строка CSV: ${line}`);
    return { from: from.trim(), to: to.trim(), confidence: confidence.trim(), note: note.join(',').trim() };
  });
}

const overridesSchema = z.object({ overrides: z.record(z.string(), z.object({ to: z.string(), title: z.string() })) });

export function loadRedirects(): Redirect[] {
  const csv = parseCsv(readFileSync(path.join(ROOT, 'data/redirects-tilda.csv'), 'utf8'));
  const { overrides } = overridesSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'content/redirects-overrides.json'), 'utf8')));
  return csv.map((r) => (overrides[r.from] ? { ...r, to: overrides[r.from]!.to, note: `${r.note}; выбрано по title «${overrides[r.from]!.title}»` } : r));
}

/** Редиректы, которые реально нужны (без «/ → /»). */
export function activeRedirects(): Redirect[] {
  return loadRedirects().filter((r) => r.from !== r.to);
}
