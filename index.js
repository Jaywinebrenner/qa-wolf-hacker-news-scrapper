const { chromium } = require('playwright');

async function fetchArticles() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://news.ycombinator.com/newest');
    
    let articles = [];
    let loadMore = true;

    while (articles.length < 100 && loadMore) {
      const newArticles = await page.$$eval('.athing', (articles) =>
        articles.map((article) => {
          const titleElement = article.querySelector('.titleline > a');

          const title = titleElement ? titleElement.innerText : 'No title';
          const link = titleElement ? titleElement.href : '#';

          return { title, link };
        })
      );

      articles = [...articles, ...newArticles];

      // Check if there is a "More" button
      loadMore = await page.$('.morelink');
      if (loadMore) {
        await Promise.all([
          page.click('a.morelink'),
          page.waitForNavigation({ waitUntil: 'networkidle' }),
        ]);
      }
    }

    return articles.slice(0, 100); // Return only the first 100 articles
  } catch (error) {
    console.error('Error in fetchArticles:', error.message);
    console.error('Error stack trace:', error.stack);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = fetchArticles;
