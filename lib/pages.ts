import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { splitFrontmatter } from './guides';

/* Страницы для покупателя - MDX в content/ru/pages/. */

const schema = z.object({ title: z.string(), h1: z.string(), description: z.string(), locale: z.string(), order: z.number() });
export type StaticPageMeta = z.infer<typeof schema> & { slug: string };

const dir = path.join(process.cwd(), 'content/ru/pages');

export function getPages(): StaticPageMeta[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ ...schema.parse(splitFrontmatter(readFileSync(path.join(dir, f), 'utf8')).data), slug: f.replace(/\.mdx$/, '') }))
    .sort((a, b) => a.order - b.order);
}

export function getPage(slug: string): { meta: StaticPageMeta; body: string } | undefined {
  const meta = getPages().find((p) => p.slug === slug);
  if (!meta) return undefined;
  return { meta, body: splitFrontmatter(readFileSync(path.join(dir, `${slug}.mdx`), 'utf8')).body };
}
