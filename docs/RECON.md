# Разведка: Kaspi и larko.kz (2026-10-27)

Все запросы - обычный HTTP (curl / Node fetch) с локальной машины в Казахстане, без браузера. С раннера GitHub не проверялось.

## Kaspi

Общие заголовки, без которых часть запросов не работает:
- `User-Agent` - обычный десктопный Chrome;
- `Referer` - страница товара (без него API отзывов с `filter=PICTURE` один раз вернул 403);
- `X-KS-City: 750000000`;
- `Accept: application/json, text/*`.

### Страница товара `https://kaspi.kz/shop/p/{slug}-{code}/?c=750000000`
- 200, ~78 КБ, `BACKEND.components.item = {...}` есть в HTML. Парсится `JSON.parse` от первой `{` (raw decode).
- `card`: id, title, price, discount, unitPriceBeforeDiscount, rating, reviewsQuantity, promoConditions.baseProductCodes, createdTime.
- Нет `creditMonthlyPrice` - расхождение с ТЗ (см. листинг).
- `galleryImages[]`: small / medium / large + location. У Tiddly чёрный 19 фото.
- `videoId` (YouTube), `specifications[].features[].featureValues[].value`, `description` (HTML с `<br />`), `certificate` (у проверенных - null), `breadcrumbs`.
- Старые адреса из seed могут отдавать 301 на новый slug (пример: комплект 179623125). Скрипт идёт по редиректу и сохраняет итоговый URL.

### Листинг магазина (JSON)
`GET https://kaspi.kz/yml/product-view/pl/results?page={0..3}&q=%3AallMerchants%3A8851015&text&sort=price-asc&qs&c=750000000&ui=d&i=-1`
- 12 товаров на страницу, 4 страницы = 48.
- С `sort=relevance` страницы пересекаются (48 строк, 41 уникальная). С `sort=price-asc` - 48 уникальных. Используем `price-asc`.
- Поля: id, configSku, hasVariants, title, shopLink, unitPrice, unitSalePrice, priceMinusBonus, creditMonthlyPrice (число), monthlyInstallment {id: число месяцев, formattedPerMonth: «2 333 ₸»}, rating, reviewsQuantity (отсутствует при 0), stock, previewImages.
- Отсюда берём цену, платёж в месяц, срок рассрочки, бонусы (price - priceMinusBonus), наличие. Это источник для почасовой синхронизации: 4 запроса.
- Рассрочка по SKU разная: 2 333 × 12 (28 шт.), 4 330 × 3 (7 шт.), 2 834 × 6 и др. Хардкодить «0-0-12» нельзя - подтверждено.
- Комплект бежевый в листинге имеет `id: 24363431b` (группа вариантов, `hasVariants: true`), настоящий SKU - в `configSku: 179623125`. Сопоставляем по `configSku`.

### Данные магазина
На странице `https://kaspi.kz/shop/m/8851015/products` есть `BACKEND.components.merchant`:
- `created: 2022-02-06` → лет на Kaspi считаем от этой даты;
- `merchantMetrics.orderStatistics.ordersTotalSegment: "10000"` → «больше 10 000 заказов» (это сегмент, а не точное число);
- рейтинг и прочие метрики магазина.

### Отзывы
`GET https://kaspi.kz/yml/review-view/api/v1/reviews/product/{code}?baseProductCode&orderCode&filter=COMMENT&sort=POPULARITY&limit=100&merchantCodes&withAgg=true&page={n}`
- `limit` до 100 работает → ~2 200 отзывов с текстом укладываются в ~40 запросов.
- `data[]`: id, author, date (dd.mm.yyyy), orderNumber (НЕ сохраняем), rating, comment {text, plus, minus}, feedback.positive, product.name, galleryImages[].
- Фото отзывов: `data[].galleryImages[]` {id, small, medium, large}, формат `?format=review_small|medium|large`. В пути URL фото зашит номер заказа (`/img/p/r/{orderNumber}-{sku}/...`) - см. OPEN-QUESTIONS.
- `summary.statistic` - распределение звёзд; `groupSummary` ALL / COMMENT / PICTURE / POSITIVE / NEGATIVE; `imagesSummaryCount`.
- Tiddly чёрный: 182 оценки, 139 с текстом, 77 с фото - совпадает с ТЗ.
- Важно: `reviewsQuantity` в карточке и листинге = число отзывов с текстом (COMMENT), а не всех оценок (ALL). Для AggregateRating: ratingCount = ALL, reviewCount = COMMENT.
- `product.name` содержит реальное имя модели («Эргорюкзак SlingoEmma Слинг 2+ Tiddly Черный до 18 кг, черный») - используется для проверки маппинга.

### Предложения продавца
`POST https://kaspi.kz/yml/offer-view/offers/{code}`, `Content-Type: application/json`, тело:
```json
{"cityId":"750000000","id":"{code}","merchantUID":[],"limit":5,"page":0,"sortOption":"PRICE","highRating":null,"searchText":null,"isExcellentMerchant":false,"zoneId":["Magnum_ZONE1"],"installationId":"-1"}
```
- 200, `offers[]`: merchantId, price, delivery, deliveryOptions (PICKUP / TO_DOOR / EXPRESS / POSTOMAT), kaspiDelivery, merchantSku.
- Наличие надёжнее брать из листинга (`stock`) - он покрывает все 48 SKU за 4 запроса. Offers - запасной источник: если SKU пропал из листинга, проверяем offers, прежде чем ставить «нет в наличии».

### Расхождения с ТЗ (учтены в коде)
1. `creditMonthlyPrice` нет в `BACKEND.components.item.card`; он есть в JSON листинга, вместе со сроком рассрочки.
2. Offers - POST с JSON-телом, работает без браузера.
3. Отзывы с фото: URL в `galleryImages[]`; в пути зашит номер заказа.
4. Листинг: пагинация стабильна только с `sort=price-asc`.
5. Комплект 179623125: в листинге id `24363431b`; категория Kaspi «Swaddling blankets», тип «комплект», сезон «зима», утеплитель «термофин», «на выписку», размер NB-3M. Это не набор переносок.
6. В описаниях Kaspi есть утверждения «одобрен ведущими ортопедами и педиатрами», «сертификат Oeko-Tex 100», «7 лет на рынке», «более 900 мам», а поле `certificate` пустое. На сайте эти утверждения не используются до подтверждения Эммы.
7. Tiddly чёрный: в описании «с 2 месяцев, 5 кг ... до 18 кг, 1.5 лет»; в ТЗ для Tiddly - «с 4-5 месяцев, 7 кг». Описания различаются между расцветками - сводная таблица по всем SKU в `data/kaspi/` после синхронизации.
8. Цены живые: бортики сейчас 9 990 ₸ (в seed 8 990 ₸).

## larko.kz - механика, которую берём

- Главная: H1 + цифры доверия, категории, «Покупают чаще всего», гайды «какой выбрать». JSON-LD OnlineStore + WebSite.
- Категория: H1, «N моделей, M товаров в наличии», карточки, «Доставка по городам», гайды, SEO-текст, FAQ. JSON-LD BreadcrumbList + ItemList + FAQPage.
- Карточка: «в месяц · рассрочка» под ценой, «Бонусы Kaspi до 5%», кнопки расцветок, «Купить на Kaspi» на конкретный SKU, «Оформление, оплата и доставка - на kaspi.kz», абзац «Коротко» (цена, рассрочка, оценка, отзывы, ключевые характеристики, наличие), «Цены и наличие на {дата}», описание, характеристики, все варианты, отзывы, «Что важно знать по отзывам», FAQ, «Сравнить с другими моделями» → гайд, похожие товары. JSON-LD BreadcrumbList + Product + FAQPage.
- Окно бонуса после клика «Купить» (телефон → бонусы) - у нас заготовка за `FEATURE_BONUS_POPUP`.
- Помощник для встроенных браузеров (Instagram и др.): «Откройте заказ в приложении Kaspi», инструкция «Открыть в браузере». Полезно для трафика из соцсетей - заготовка, см. OPEN-QUESTIONS.
- Гайд: «N моделей · цены от ... до ... · отзывов · оценка», «Чаще всего покупают ...», критерии (h3), ошибки, «Какую модель купить», «Что брать», таблица сравнения, все модели, отзывы, FAQ.
- Городская страница: «За последние три месяца в {город} из этого раздела уехало N заказов» (данные Merchant API), что заказывают чаще всего, модели, FAQ, «Этот раздел в других городах».
- Контакты: режим ответа, «вопросы по заказу - в чате Kaspi», блок «Мы никогда не просим перевести деньги на карту...».
- robots: `Disallow: /*?page=`, `/*?stars=`, `/*&page=`, `Clean-param: page&stars /` (Яндекс), ссылка на sitemap и llms.txt.
- sitemap с namespace `image:image`, lastmod по датам.
- llms.txt: описание бренда, ссылки на Kaspi, категории, гайды; плюс llms-full.txt.
- hreflang ru-KZ / kk-KZ / x-default, `/kk/...`.

Ошибки Larko, которых избегаем (видно на этих страницах):
- «Что важно знать по отзывам»: «рюкзак подходит для детей весом до 10 кг» при заявленных 20 кг; «представлен в сером цвете» при трёх расцветках.
- «Что брать» в гайде повторяет одну и ту же модель дважды.
