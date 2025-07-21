import puppeteer from 'puppeteer';

async function scrapeCSStats(steamId64: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  const url = `https://csstats.gg/player/${steamId64}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const ranks = await page.$$eval('#player-ranks .ranks', (nodes) => {
    return nodes.map((rankEl) => {
      const season = rankEl.querySelector('.over .icon:nth-child(2)')?.textContent?.trim() || '';
      const type = rankEl.querySelector('.over .icon img')?.getAttribute('alt') || '';
      const rating = rankEl.querySelector('.rank span')?.textContent?.trim() || '';
      const best = rankEl.querySelector('.best span')?.textContent?.trim() || '';
      const wins = rankEl.querySelector('.bottom .wins b')?.textContent?.trim() || '';
      const date = rankEl.querySelector('.bottom .date span')?.textContent?.trim() || '';

      return {
        type,
        season,
        rating,
        best,
        wins,
        date,
      };
    });
  });

  console.log('📊 Rangs CSStats:', ranks);
  
  await browser.close();
}

scrapeCSStats('76561198156819894');
