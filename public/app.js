document.getElementById('fetch-articles').addEventListener('click', async () => {
  // Show loading message
  const loadingText = document.getElementById('loading-text');
  loadingText.style.display = 'block';

  try {
    const response = await fetch('/api/articles');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Response data:', data); // Log the response data for debugging

    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid data format');
    }

    const articlesList = document.getElementById('articles-list');
    articlesList.innerHTML = '';

    // Counter for numbering articles
    let articleCount = 0;

    data.articles.forEach(article => {
      articleCount++; // Increment counter
      const listItem = document.createElement('li');
      
      // Numbering element
      const articleNumber = document.createElement('span');
      articleNumber.textContent = `${articleCount}. `;
      articleNumber.style.fontWeight = 'bold';
      articleNumber.style.marginRight = '5px';
      
      const articleLink = document.createElement('a');
      articleLink.href = article.link;
      articleLink.target = '_blank';
      articleLink.rel = 'noopener noreferrer';
      articleLink.textContent = article.title;

      listItem.appendChild(articleNumber);
      listItem.appendChild(articleLink);
      

      articlesList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Failed to fetch articles:', error);
  } finally {
    loadingText.style.display = 'none';
  }
});
