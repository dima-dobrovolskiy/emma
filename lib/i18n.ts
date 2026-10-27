import ru from '@/messages/ru.json';

/*
 * Словарь интерфейса. Все строки разметки - в messages/{locale}.json.
 * Поддерживается подстановка {name} и ICU-плюралы {count, plural, one {...} few {...} many {...} other {...}}.
 * Казахский словарь (messages/kk.json) добавится вместе с FEATURE_KK.
 */

export type Locale = 'ru';
export const DEFAULT_LOCALE: Locale = 'ru';

type Dict = typeof ru;
const dictionaries: Record<Locale, Dict> = { ru };

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = T extends string ? never : { [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T];
export type MessageKey = Paths<Dict>;
export type Params = Record<string, string | number>;

const pluralRules = new Map<Locale, Intl.PluralRules>();

function lookup(dict: Dict, key: string): string {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof node !== 'string') throw new Error(`Нет строки в словаре: ${key}`);
  return node;
}

function formatPlural(body: string, n: number, locale: Locale): string {
  const options = new Map<string, string>();
  const re = /(\w+)\s*\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) options.set(m[1] ?? '', m[2] ?? '');
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  const form = options.get(rules.select(n)) ?? options.get('other') ?? '';
  return form.replace(/#/g, formatNumber(n, locale));
}

/** Разряды через неразрывный пробел: «10 000» не разрывается при переносе строки. */
export function formatNumber(n: number, locale: Locale = DEFAULT_LOCALE): string {
  return n.toLocaleString(locale === 'ru' ? 'ru-RU' : locale).replace(/[\u202f\u00a0 ]/g, '\u00a0');
}

export function format(template: string, params: Params = {}, locale: Locale = DEFAULT_LOCALE): string {
  return template
    .replace(/\{(\w+),\s*plural,\s*((?:[^{}]|\{[^{}]*\})*)\}/g, (_, name: string, body: string) =>
      formatPlural(body, Number(params[name] ?? 0), locale),
    )
    .replace(/\{(\w+)\}/g, (_, name: string) => (name in params ? String(params[name]) : `{${name}}`));
}

export function t(key: MessageKey, params?: Params, locale: Locale = DEFAULT_LOCALE): string {
  return format(lookup(dictionaries[locale], key), params, locale);
}

/** Для клиентских компонентов: передаём только нужный раздел словаря, а не весь. */
export function messagesFor<S extends keyof Dict>(section: S, locale: Locale = DEFAULT_LOCALE): Dict[S] {
  return dictionaries[locale][section];
}

export function formatPrice(n: number, locale: Locale = DEFAULT_LOCALE): string {
  return `${formatNumber(Math.round(n), locale)}\u00a0${lookup(dictionaries[locale], 'common.kzt')}`;
}

/** yyyy-mm-dd → «27 октября 2026» */
export function formatDate(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = lookup(dictionaries[locale], 'dates.monthsGen').split(',');
  return `${d} ${months[m - 1]} ${y}`;
}
