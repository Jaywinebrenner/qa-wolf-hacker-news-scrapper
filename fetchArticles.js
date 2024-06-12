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


          return { title, link, time };
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

      console.log('Current number of articles:', articles.length); // Log current count
    }

    // Ensure only the first 100 articles are returned
    articles = articles.slice(0, 100);

    console.log('Final number of articles:', articles.length); // Log final count

    return articles;
  } catch (error) {
    console.error('Error in fetchArticles:', error);
    return [];
  } finally {
    await browser.close();
  }
}
