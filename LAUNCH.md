# Запуск slingoemma.kz - чек-лист

Готовит репозиторий, выполняет Дима. Фаза 3 начинается только по команде «запускаем».
Перед стартом закрыть в OPEN-QUESTIONS.md: Д1, Д2, Р1, Р3 (обязательно); Э1-Э3, Э6, Р2 (желательно).

## 0. За день до запуска

- [ ] Свежий срез данных: `pnpm sync`, проверить `git diff data/kaspi` - цены и отзывы похожи на правду.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` - всё зелёное.
- [ ] Сверить с Kaspi 5 случайных расцветок: цена, платёж в месяц, наличие, число отзывов (открыть карточку на сайте и на kaspi.kz рядом).
- [ ] `data/kaspi/unmapped.json` пуст или каждый SKU разобран в `content/catalog.json`.
- [ ] Записать текущие ID пикселей с Тильды (если стоят) - Д5. Тогда история и аудитории не потеряются.

## 1. Репозиторий и хостинг

- [ ] Создать репозиторий на GitHub (Д1), запушить `main`.
- [ ] Settings → Actions → General → Workflow permissions: Read and write (синхронизация коммитит данные).
- [ ] Запустить вручную workflow «Проба доступа к Kaspi с раннера». Если в логе 403/таймауты - синхронизация не с GitHub (см. Р3), workflow `sync.yml` отключить.
- [ ] Подключить хостинг (Р1).

Vercel Pro (аккаунт Эммы):
- [ ] Import Project из GitHub, Framework: Next.js. Build command `pnpm build`, Output: `out` (static export).
- [ ] `vercel.json` подхватится сам: редиректы, cleanUrls, кэш `/_next/static`.

Cloudflare Pages:
- [ ] Create project из GitHub. Build command `pnpm build`, Output directory `out`, переменная `NODE_VERSION=22`.
- [ ] `out/_redirects` (из `public/_redirects`) подхватится сам.

Переменные окружения (оба хостинга, Production):
- [ ] `NEXT_PUBLIC_SITE_URL=https://slingoemma.kz`
- [ ] `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_YM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (Д5)
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_YANDEX_VERIFICATION` (шаг 4)
- [ ] Если решили зеркалить фото (Р2): `MIRROR_MEDIA=1` и в build command `pnpm tsx scripts/mirror-media.ts --scope=first && pnpm build`.
- [ ] Флаги `FEATURE_*` не включать.

- [ ] Проверить превью-адрес хостинга: главная, категория, карточка, подбор, гайд, мобильный и десктоп.
- [ ] `pnpm tsx scripts/check-redirects.ts --base=https://<превью-адрес>` - 36 из 36.

## 2. DNS и переключение домена

- [ ] Снизить TTL записей slingoemma.kz до 300 с за сутки до переключения (Д3).
- [ ] В хостинге добавить домены `slingoemma.kz` и `www.slingoemma.kz`, основной - без www, www → 301 на основной.
- [ ] У регистратора поменять записи по инструкции хостинга (Vercel: A `76.76.21.21` и CNAME `cname.vercel-dns.com`; Cloudflare Pages: CNAME на `<project>.pages.dev` или перенос NS - [непроверено], сверить с актуальной инструкцией в панели хостинга).
- [ ] Дождаться выпуска SSL, открыть https://slingoemma.kz и https://www.slingoemma.kz.
- [ ] Тильду не удалять минимум месяц: снять с публикации домен, оставить проект.

## 3. Проверка редиректов на проде

- [ ] `pnpm tsx scripts/check-redirects.ts --base=https://slingoemma.kz` - 36 из 36, коды 301.
- [ ] Вручную 3-4 старых адреса со слешем на конце (`/classic-black/`) - тоже 301.
- [ ] Несуществующий адрес отдаёт 404 со страницей «Такой страницы нет».

## 4. Search Console и Вебмастер

- [ ] Google Search Console: ресурс «Домен» (через DNS TXT) или «Префикс URL» (через `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + пересборка).
- [ ] Яндекс Вебмастер: добавить сайт, подтвердить мета-тегом `NEXT_PUBLIC_YANDEX_VERIFICATION`.
- [ ] Отправить `https://slingoemma.kz/sitemap.xml` в обе панели.
- [ ] В Search Console: «Проверка URL» для главной, категории, карточки Classic и гайда → «Запросить индексирование».
- [ ] Rich Results Test (search.google.com/test/rich-results) на карточке Classic: Product, отзывы, хлебные крошки, FAQ без ошибок.
- [ ] Яндекс Вебмастер → «Переезд сайта» не нужен (домен тот же), но проверить «Страницы в поиске» через неделю.

## 5. Пиксели и события

- [ ] Открыть сайт с расширением Tag Assistant / Яндекс Метрика debug (`?_ym_debug=1`), Meta Pixel Helper, TikTok Pixel Helper.
- [ ] Просмотр страницы фиксируется во всех счётчиках.
- [ ] Клик «Купить на Kaspi» на карточке → событие `kaspi_click` (model, variant, kaspiCode, price, placement) в dataLayer, GA4 DebugView, Метрике (цель), Meta/TikTok (InitiateCheckout).
- [ ] Выбор расцветки → `variant_select`; подбор → `quiz_start`, `quiz_complete`; переход из гайда → `guide_to_product`; фильтр → `filter_use`.
- [ ] В Метрике создать цели по JavaScript-событиям с этими именами.

## 6. Синхронизация на проде

- [ ] Actions → «Синхронизация с Kaspi» → Run workflow (mode: full). Зелёный, коммит с данными появился (или «Изменений нет»).
- [ ] Хостинг пересобрал сайт по коммиту, на карточке обновилась дата «Цены и наличие на ...».
- [ ] Через 2-3 часа: почасовые запуски проходят, лишних коммитов нет (только при изменениях данных).
- [ ] Включить уведомления о падении workflow (GitHub → Settings → Notifications → Actions).

## 7. После запуска (первая неделя)

- [ ] Lighthouse mobile на проде (PageSpeed Insights): главная, категория, карточка.
- [ ] Search Console → «Страницы»: нет ошибок 404/5xx, редиректы старых адресов учтены.
- [ ] Следующие флаги - по решению: `FEATURE_CITY_PAGES` (нужны данные заказов по городам - Д4), `FEATURE_BONUS_POPUP` (нужен адрес отправки номера), `FEATURE_KK` (нужен перевод).
