# Запуск slingoemma.kz - чек-лист

Готовит репозиторий, выполняет Дима. Фаза 3 начинается только по команде «запускаем».
Перед стартом закрыть в OPEN-QUESTIONS.md: Д2 (обязательно; Д1, Д3, Р1-Р3 уже закрыты); Э1-Э3 (желательно).

## 0. За день до запуска

- [ ] Свежий срез данных: `pnpm sync`, проверить `git diff data/kaspi` - цены и отзывы похожи на правду.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` - всё зелёное.
- [ ] Сверить с Kaspi 5 случайных расцветок: цена, платёж в месяц, наличие, число отзывов (открыть карточку на сайте и на kaspi.kz рядом).
- [ ] `data/kaspi/unmapped.json` пуст или каждый SKU разобран в `content/catalog.json`.
- [ ] Записать текущие ID пикселей с Тильды (если стоят) - Д5. Тогда история и аудитории не потеряются.

## 1. Репозиторий и хостинг

- [x] Репозиторий на GitHub: https://github.com/dima-dobrovolskiy/emma (приватный), `main` запушен.
- [x] Синхронизация с раннеров GitHub проверена 2026-10-27: проба и полный срез с коммитом данных прошли.
Cloudflare Pages (решено, Р1), аккаунт Cloudflare на Эмме (Д2):
- [x] Workers & Pages → Create → Pages → Connect to Git → репозиторий Димы. Проект создан 2026-10-28, превью: https://emma-98q.pages.dev. Внимание: экран Create по умолчанию предлагает Workers (поля «Deploy command: npx wrangler deploy») - нужен именно Pages.
- [x] Framework preset: None. Build command: `pnpm build`. Output directory: `out`. Root: пусто.
- [x] Переменная окружения `NODE_VERSION=22`. Сборка на Cloudflare прошла, pnpm подхватился.
- [x] `out/_redirects` и `out/_headers` подхватились: 301 со старых адресов, кэш фото 30 дней, `X-Robots-Tag: noindex` на *.pages.dev (проверено 2026-10-28).

Переменные окружения (Production и Preview):
- [ ] `NEXT_PUBLIC_SITE_URL=https://slingoemma.kz`
- [ ] `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_YM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (Д5)
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_YANDEX_VERIFICATION` (шаг 4)
- [x] Зеркало главных фото (Р2) работает на Cloudflare: фото отдаются с /media/. Выключить - `MIRROR_MEDIA=0`.
- [ ] Флаги `FEATURE_*` не включать.

- [ ] Открыть превью `https://<проект>.pages.dev`: главная, категория, карточка, подбор, гайд - на телефоне и десктопе. Эту ссылку можно отдать Эмме.
- [x] `pnpm tsx scripts/check-redirects.ts --base=https://emma-98q.pages.dev` - 36 из 36 (2026-10-28).
- [x] Lighthouse mobile на превью (2026-10-28): производительность 99-100, LCP 1,1-1,9 с, доступность и практики 100. SEO 69 только из-за noindex превью-домена - на slingoemma.kz его не будет; перепроверить после переключения DNS.

## 2. DNS и переключение домена

Домен slingoemma.kz - на hoster.kz, доступ к панели у Димы (Д3). Для корневого домена Cloudflare Pages требует, чтобы DNS домена обслуживал Cloudflare: NS-серверы переносятся с hoster.kz на Cloudflare, сам домен остаётся зарегистрирован на hoster.kz.

- [ ] До переноса: уточнить у поддержки hoster.kz, что для .kz можно указать NS-серверы Cloudflare. В правилах зоны .kz было требование размещать сайты на серверах в Казахстане [непроверено: действует ли сейчас и как применяется к Cloudflare].
- [ ] В панели hoster.kz выписать все текущие DNS-записи slingoemma.kz (A, CNAME, MX, TXT) - чтобы не потерять почту на домене и подтверждения сервисов, если они есть.
- [ ] За сутки снизить TTL записей до 300 с.
- [ ] Cloudflare → Add a site → slingoemma.kz → тариф Free. Cloudflare сам импортирует записи - сверить с выписанными, недостающие добавить.
- [ ] Cloudflare покажет два NS-сервера. В панели hoster.kz для slingoemma.kz заменить NS на них. Ждать статуса зоны Active (от минут до суток).
- [ ] Pages → Custom domains: добавить `slingoemma.kz` и `www.slingoemma.kz`. Основной - без www; для www - правило редиректа 301 на основной (Rules → Redirect Rules).
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
- [ ] Rich Results Test (search.google.com/test/rich-results) на карточке Classic: Product (цены и наличие), хлебные крошки, FAQ без ошибок. Звёзд отзывов в разметке нет - так решено (Р7), это не ошибка.
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
