import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { DEFAULT_LOCALE, type Locale } from './i18n';

/*
 * Гайды - MDX с frontmatter в content/{locale}/guides/.
 * Здесь только чтение frontmatter (для списков и ссылок); сам MDX компилирует страница гайда.
 */

const faqSchema = z.object({ q: z.string(), a: z.string() });

export const guideFrontmatterSchema = z.object({
  title: z.string(),
  h1: z.string(),
  description: z.string(),
  /** «Коротко» - ответ на вопрос гайда. Без цен: они меняются каждый час, а текст гайда - нет. */
  short: z.string().optional(),
  locale: z.string(),
  order: z.number(),
  models: z.array(z.string()).min(1),
  category: z.string().optional(),
  updated: z.string(),
  faq: z.array(faqSchema).default([]),
});
export type GuideMeta = z.infer<typeof guideFrontmatterSchema> & { slug: string };

const ROOT = process.cwd();

function guidesDir(locale: Locale) {
  return path.join(ROOT, 'content', locale, 'guides');
}

/** Простой разбор YAML-frontmatter: ключ: значение, списки [a, b] и списки объектов faq. */
export function splitFrontmatter(src: string): { data: Record<string, unknown>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  if (!m) throw new Error('В гайде нет frontmatter');
  const data: Record<string, unknown> = {};
  let currentList: Array<Record<string, string>> | null = null;
  for (const raw of m[1]!.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = /^\s+-\s+(\w+):\s*(.*)$/.exec(raw);
    const cont = /^\s{4,}(\w+):\s*(.*)$/.exec(raw);
    if (item && currentList) {
      currentList.push({ [item[1]!]: unquote(item[2]!) });
      continue;
    }
    if (cont && currentList?.length) {
      currentList[currentList.length - 1]![cont[1]!] = unquote(cont[2]!);
      continue;
    }
    const kv = /^(\w+):\s*(.*)$/.exec(raw);
    if (!kv) throw new Error(`Не разобрать строку frontmatter: ${raw}`);
    const [, key, value] = kv;
    if (value === '') {
      currentList = [];
      data[key!] = currentList;
    } else {
      currentList = null;
      data[key!] = parseScalar(value!);
    }
  }
  return { data, body: m[2]! };
}

function unquote(s: string): string {
  const v = s.trim();
  return /^["'].*["']$/.test(v) ? v.slice(1, -1) : v;
}

function parseScalar(v: string): unknown {
  const s = v.trim();
  if (/^\[.*\]$/.test(s)) return s.slice(1, -1).split(',').map((x) => unquote(x)).filter(Boolean);
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return unquote(s);
}

let cache: GuideMeta[] | null = null;

export function getGuides(locale: Locale = DEFAULT_LOCALE): GuideMeta[] {
  if (cache) return cache;
  const dir = guidesDir(locale);
  cache = readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const { data } = splitFrontmatter(readFileSync(path.join(dir, f), 'utf8'));
      const meta = guideFrontmatterSchema.parse(data);
      return { ...meta, slug: f.replace(/\.mdx$/, '') };
    })
    .sort((a, b) => a.order - b.order);
  return cache;
}

export function getGuideMeta(slug: string): GuideMeta | undefined {
  return getGuides().find((g) => g.slug === slug);
}

export function getGuideSource(slug: string, locale: Locale = DEFAULT_LOCALE): { meta: GuideMeta; body: string } | undefined {
  const meta = getGuideMeta(slug);
  if (!meta) return undefined;
  const { body } = splitFrontmatter(readFileSync(path.join(guidesDir(locale), `${slug}.mdx`), 'utf8'));
  return { meta, body };
}
