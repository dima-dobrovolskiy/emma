# SlingoEmma - сайт-витрина

Статический сайт на Next.js: каталог переносок SlingoEmma, покупка - переходом на Kaspi.
ТЗ - `CLAUDE.md`, открытые вопросы - `OPEN-QUESTIONS.md`, решения - `docs/DECISIONS.md`, разведка Kaspi и Larko - `docs/RECON.md`.

## Запуск

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm build               # статическая сборка в out/
npx serve out -l 4173    # посмотреть сборку как на хостинге
```

## Данные

- `data/kaspi/` - слой Kaspi, пишет только синхронизация. Руками не править.
- `content/` - наш слой: маппинг SKU → модель → расцветка, тексты, FAQ, SEO, правила подбора. Синхронизация его не трогает.

```bash
pnpm sync           # полный срез: цены, карточки, фото, отзывы (раз в сутки)
pnpm sync:prices    # только цены и наличие (каждый час)
```

По расписанию синхронизация идёт на GitHub Actions (`.github/workflows/sync.yml`), а запускает её Cloudflare Worker `workers/sync-trigger` - расписание самого GitHub ненадёжно. Настройка - LAUNCH.md, раздел 6.

## Проверки

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm build
npx serve out -l 4173 &
pnpm tsx scripts/check-links.ts       # битые внутренние ссылки
pnpm tsx scripts/check-jsonld.ts      # микроразметка
pnpm tsx scripts/screenshots.ts       # 360/390/768/1280 → reports/screenshots
pnpm tsx scripts/lighthouse.ts        # Lighthouse mobile → reports/lighthouse
```

Локально без скачивания браузеров Playwright: `PW_CHANNEL=chrome pnpm tsx scripts/screenshots.ts`.
