const path = require('path');
const express = require('express');
const { chromium } = require('playwright-core');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set the correct MIME type for CSS files
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// API endpoint to fetch articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await fetchArticles();
    res.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

async function fetchArticles() {
  let browser;
  try {
    console.log("Launching Chromium browser...");
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to Hacker News...");
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

      loadMore = await page.$('.morelink');
      if (loadMore) {
        await Promise.all([
          page.click('a.morelink'),
          page.waitForNavigation({ waitUntil: 'networkidle' }),
        ]);
      }
    }

    console.log("Fetched articles successfully.");
    return articles.slice(0, 100);
  } catch (error) {
    console.error('Error in fetchArticles:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
