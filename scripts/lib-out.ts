import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const OUT_DIR = path.resolve(import.meta.dirname, '../out');

export function htmlFiles(dir = OUT_DIR): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) {
      if (f === '_next') continue;
      out.push(...htmlFiles(p));
    } else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

export function urlPathOf(file: string): string {
  const rel = path.relative(OUT_DIR, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/(\/index)?\.html$/, '')}`;
}

/** Есть ли в out/ файл, который отдаст статический хостинг по этому пути. */
export function existsInOut(urlPath: string): boolean {
  const clean = decodeURIComponent(urlPath.split('#')[0]!.split('?')[0]!).replace(/\/$/, '') || '/';
  if (clean === '/') return existsSync(path.join(OUT_DIR, 'index.html'));
  const base = path.join(OUT_DIR, clean);
  return existsSync(`${base}.html`) || existsSync(path.join(base, 'index.html')) || (existsSync(base) && statSync(base).isFile());
}

export function read(file: string): string {
  return readFileSync(file, 'utf8');
}
