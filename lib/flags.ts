/*
 * Фичефлаги из env, читаются на этапе сборки. По умолчанию всё выключено.
 */
const on = (v: string | undefined) => v === '1' || v === 'true';

export const flags = {
  bonusPopup: on(process.env.FEATURE_BONUS_POPUP),
  cityPages: on(process.env.FEATURE_CITY_PAGES),
  kk: on(process.env.FEATURE_KK),
} as const;

export type Flags = typeof flags;
