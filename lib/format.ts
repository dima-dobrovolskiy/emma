/* Форматирование без зависимостей от node - можно использовать в клиентских компонентах. */
export function fmtRatingClient(r: number): string {
  return r.toFixed(1).replace('.', ',');
}
