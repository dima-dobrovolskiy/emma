import { expect, test } from '@playwright/test';

test('главная: цифры доверия из Kaspi и вход в подбор', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText('средняя оценка').first()).toBeVisible();
  await page.getByRole('link', { name: 'Подобрать переноску за минуту' }).first().click();
  await expect(page).toHaveURL(/\/podbor$/);
});

test('карточка: выбор расцветки меняет адрес и ссылку на Kaspi', async ({ page }) => {
  await page.goto('/p/ergoryukzak-tiddly');
  const buy = page.locator('a[data-kaspi-code]').first();
  await expect(buy).toHaveAttribute('target', '_blank');
  await page.getByRole('radio', { name: 'Зайчата' }).click();
  await expect(page).toHaveURL(/color=bunny-beige/);
  await expect(buy).toHaveAttribute('data-kaspi-code', '113973706');
  await expect(buy).toHaveAttribute('href', /113973706/);
  await expect(page.locator('h1')).toContainText('Зайчата');
});

test('карточка: ?color= из адреса выбирает расцветку, canonical на модель', async ({ page }) => {
  await page.goto('/p/ergoryukzak-classic?color=black');
  await expect(page.locator('a[data-kaspi-code]').first()).toHaveAttribute('data-kaspi-code', '106916693');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/p\/ergoryukzak-classic$/);
});

test('клик «Купить на Kaspi» пишет kaspi_click в dataLayer', async ({ page, context }) => {
  await page.goto('/p/sling-nesty');
  const popup = context.waitForEvent('page');
  await page.locator('a[data-kaspi-code]').first().click();
  await (await popup).close();
  const events = await page.evaluate(() => (window as unknown as { dataLayer: Array<{ event: string; placement?: string }> }).dataLayer);
  expect(events.some((e) => e.event === 'kaspi_click' && e.placement === 'main')).toBe(true);
});

test('подбор: 18-22 кг - только Classic; зимой добавляется накидка', async ({ page }) => {
  await page.goto('/podbor');
  await page.getByRole('button', { name: '1-2 года' }).click();
  await page.getByRole('button', { name: '18-22 кг' }).click();
  await page.getByRole('button', { name: 'Зимой на улице' }).click();
  const names = await page.locator('li.card p.text-lg').allInnerTexts();
  expect(names[0]).toBe('Эргорюкзак Classic');
  expect(names.filter((n) => n.startsWith('Эргорюкзак'))).toHaveLength(1);
  expect(names.some((n) => /накидка/i.test(n))).toBe(true);
});

test('категория: фильтр по весу и сортировка', async ({ page }) => {
  await page.goto('/c/ergoryukzaki');
  await page.getByText('Фильтры и сортировка').click();
  await page.getByRole('button', { name: '18-22 кг' }).click();
  await expect(page).toHaveURL(/weight=18-22/);
  await expect(page.locator('main h2 a')).toHaveText(['Эргорюкзак Classic']);
  await page.getByRole('button', { name: 'Сбросить' }).click();
  await expect(page.locator('main h2 a')).toHaveCount(3);
});

test('отзывы: «Показать ещё» и фильтр «С фото»', async ({ page }) => {
  await page.goto('/p/ergoryukzak-classic');
  const list = page.locator('#reviews ul.mt-5 > li');
  await expect(list).toHaveCount(6);
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(list).toHaveCount(18);
  await page.getByRole('button', { name: 'С фото' }).click();
  await expect(list.first()).toBeVisible();
  const withoutPhotos = await list.evaluateAll((els) => els.filter((el) => !el.querySelector('img')).length);
  expect(withoutPhotos).toBe(0);
});

test('старый адрес Тильды редиректит на расцветку', async ({ page }) => {
  const res = await page.goto('/classic-black');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveURL(/\/p\/ergoryukzak-classic\?color=black$/);
});

test('неизвестный адрес - 404 со ссылками', async ({ page }) => {
  const res = await page.goto('/net-takoy-stranicy');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'На главную' })).toBeVisible();
});

test('мобильный: липкая панель, пока основная кнопка покупки не на экране', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'только мобильный');
  await page.goto('/p/ergoryukzak-beborn');
  const bar = page.locator('div.fixed.bottom-0');
  await page.locator('#specs').scrollIntoViewIfNeeded();
  await expect(bar).toHaveAttribute('aria-hidden', 'false');
  await expect(bar.getByRole('link', { name: 'Купить на Kaspi' })).toBeVisible();
  await page.locator('a[data-kaspi-code]').first().scrollIntoViewIfNeeded();
  await expect(bar).toHaveAttribute('aria-hidden', 'true');
});
