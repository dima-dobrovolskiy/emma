/*
 * Cloudflare Worker: по расписанию запускает синхронизацию с Kaspi на GitHub (workflow .github/workflows/sync.yml).
 *
 * Зачем: расписание GitHub Actions не гарантирует запуск - в часы нагрузки GitHub задерживает и пропускает
 * такие задания (2026-10-28 почасовая синхронизация не запускалась почти сутки, и на сайте висела ошибочная цена).
 * Cron Triggers в Cloudflare срабатывают вовремя и бесплатны.
 *
 * Расписание (UTC) - в настройках Worker → Triggers:
 *   7 * * * *     цены и наличие, каждый час
 *   23 21 * * *   полный срез (карточки, фото, отзывы), 02:23 по Алматы
 * Секрет GITHUB_TOKEN - fine-grained токен GitHub с правом Actions: Read and write только на репозиторий emma.
 * Настройка по шагам - LAUNCH.md, раздел 6.
 */

const REPO = 'dima-dobrovolskiy/emma';
const WORKFLOW = 'sync.yml';
const FULL_CRON = '23 21 * * *';

const worker = {
  async scheduled(event, env) {
    const mode = event.cron === FULL_CRON ? 'full' : 'prices';
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'slingoemma-sync-trigger',
      },
      body: JSON.stringify({ ref: 'main', inputs: { mode } }),
    });
    // 204 - GitHub принял запуск. Иначе ошибка видна в логах Worker (Cloudflare → Workers → slingoemma-sync-trigger → Logs).
    if (res.status !== 204) throw new Error(`GitHub ответил ${res.status}: ${await res.text()}`);
    console.log(`Синхронизация запущена: ${mode}`);
  },

  // Открывать Worker в браузере незачем - у него нет страниц.
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};

export default worker;
