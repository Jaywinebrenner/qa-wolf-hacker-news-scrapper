const path = require('path');
const express = require('express');
const { connectOverCDP } = require('playwright-core');

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
  const browserURL = 'wss://chrome.browserless.io?token=YOUR_BROWSERLESS_TOKEN';
  const browser = await connectOverCDP({ wsEndpoint: browserURL });
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
    console.error('Error in fetchArticles:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
