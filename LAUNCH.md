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

Что есть на 2026-10-28 (dig, whois): домен зарегистрирован на hoster.kz (владелец - Эмма), DNS обслуживает Тильда (ns1/ns2.tildadns.com). Записи: `slingoemma.kz A 213.130.74.107` (Тильда), `www` → `slingoemma.kz`. Почты на домене нет (MX пусто), TXT нет. NS вне Казахстана регистратор уже принимает - риск с правилами зоны .kz не подтвердился.

- [ ] Домен оплачен до 21.12.2026, в hoster.kz включено автопродление. Проверить, что на аккаунте hoster.kz есть деньги или привязана оплата до декабря: если продление не пройдёт, домен отключится вместе с сайтом.

Переключение в два шага - первый без видимых изменений для покупателей.

Шаг А. DNS переезжает в Cloudflare, сайт пока остаётся на Тильде:
- [x] Cloudflare → Add a domain (Onboard a domain) → `slingoemma.kz` → быстрый поиск DNS-записей → тариф Free.
- [x] Проверить импорт: `A slingoemma.kz 213.130.74.107` и `www` (CNAME на `slingoemma.kz` или A на тот же IP). Если чего-то нет - добавить вручную.
- [x] У обеих записей прокси выключить - серое облако, «DNS only»: трафик идёт напрямую на Тильду, её SSL-сертификат продолжает обновляться.
- [x] Зона добавлена в Cloudflare (2026-10-29), NS: `coco.ns.cloudflare.com`, `terry.ns.cloudflare.com`, сохранены в панели hoster.kz. DNS-записи в панели hoster.kz не трогать - они не используются.
- [x] NS дошли до реестра .kz (2026-10-29). Пока NS расходятся по интернету, и DNS Тильды, и Cloudflare указывают на Тильду - простоя нет.
- [x] Проверено снаружи (2026-10-29): реестр .kz, Google, Cloudflare, Quad9 и Яндекс DNS отдают NS Cloudflare; `A` - 213.130.74.107; slingoemma.kz и www открываются на Тильде (200). Шаг А пройден.

Шаг Б. Переключение на новый сайт - только по команде «запускаем»:
- [x] Pages → проект emma → Custom domains: `slingoemma.kz` - Active (2026-10-29). `www` в Pages не добавляется: запись `www` проксирована и уходит правилом на основной адрес. Если Pages просит «Complete DNS setup», запись для домена: CNAME `@` → `emma-98q.pages.dev`, Proxied.
- [x] www → основной: Rules → Redirect Rules, шаблон «Redirect from WWW to root», 301, с сохранением параметров. SSL/TLS → Edge Certificates → «Always Use HTTPS» включён - без него http://www отдавал 522.
- [x] SSL Cloudflare для slingoemma.kz выпущен (до 26.01.2027, продлевается сам). Проверено через Cloudflare напрямую (2026-10-29): новый сайт, http → https, www → основной с параметрами, robots.txt без добавок Cloudflare, без X-Robots-Tag, 36 из 36 старых адресов - 301.
- [ ] Откат, если что-то не так: в Cloudflare вернуть `A slingoemma.kz 213.130.74.107` и `www` → `slingoemma.kz` (серое облако) - сайт снова на Тильде.
- [ ] Тильду не удалять минимум месяц: снять с публикации домен, оставить проект.

## 3. Проверка редиректов на проде

Проверено 2026-10-29 через Cloudflare напрямую (у части провайдеров DNS ещё держал Тильду в кэше): 36 из 36 - 301, со слешем и через http://www - тоже доходят до нужной страницы; несуществующий адрес - 404.

- [ ] `pnpm tsx scripts/check-redirects.ts --base=https://slingoemma.kz` - 36 из 36, коды 301.
- [ ] Вручную 3-4 старых адреса со слешем на конце (`/classic-black/`) - тоже 301.
- [ ] Несуществующий адрес отдаёт 404 со страницей «Такой страницы нет».

## 4. Search Console и Вебмастер

- [x] Google Search Console: доменный ресурс `slingoemma.kz`, подтверждён TXT-записью в Cloudflare (2026-10-29).
- [x] Яндекс Вебмастер: `https://slingoemma.kz`, подтверждён TXT-записью в Cloudflare (2026-10-29). Обе TXT-записи видны в DNS Cloudflare, Google и Яндекса. Регион: .kz привязывается к Казахстану автоматически.
- [ ] Отправить `https://slingoemma.kz/sitemap.xml` в обе панели (33 адреса). Google - отправлен 2026-10-29. Яндекс 2026-10-29: инструмент «Файлы Sitemap» был в режиме только для чтения (сбой Яндекса) - добавить, когда починят; до этого Яндекс берёт sitemap из robots.txt.
- [x] В Search Console: «Проверка URL» для главной, категории, карточки Classic и гайда → «Запросить индексирование» (2026-10-29). В Яндексе - «Переобход страниц» с теми же адресами, если инструмент работает.
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
