// News fetching layer — GNews API with in-memory cache to respect free-tier rate limits
// Get your free API key at https://gnews.io (100 requests/day on free plan)
var FinPulse = window.FinPulse || {};

FinPulse.News = {
  API_KEY: 'YOUR_API_KEY', // Get your free key at https://gnews.io
  BASE_URL: 'https://gnews.io/api/v4',
  cache: {},
  CACHE_TTL: 15 * 60 * 1000, // 15min — balances freshness vs rate-limit conservation

  async fetchNews(category, country) {
    // Guard: prompt user to configure API key before making any requests
    if (this.API_KEY === 'YOUR_API_KEY') {
      return this._apiKeyMissing();
    }

    const cacheKey = `${country}:${category}`;
    const cached = this.cache[cacheKey];

    // Serve from cache if within TTL window
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.articles;
    }

    const keywords = FinPulse.Country.getKeywords(country, category);
    const params = new URLSearchParams({
      q: keywords,
      lang: 'en',
      max: '20',
      apikey: this.API_KEY
    });

    // GNews country param filters by publisher region — omit for global results
    if (country !== 'global') {
      params.set('country', country);
    }

    const url = `${this.BASE_URL}/search?${params.toString()}`;
    // 10s timeout to prevent infinite hang on slow/dead API
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`GNews API ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const articles = (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.image,
      source: a.source?.name || 'Unknown',
      publishedAt: a.publishedAt,
      category
    }));

    // Persist to in-memory cache with timestamp
    this.cache[cacheKey] = { articles, ts: Date.now() };
    return articles;
  },

  formatTime(dateString) {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },

  generateTLDR(description) {
    if (!description) return 'Click to read full article.';
    if (description.length <= 120) return description;
    // Truncate at word boundary to avoid mid-word cuts
    const trimmed = description.substring(0, 120);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 80 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
  },

  // Render a helpful setup message instead of articles when key is missing
  _apiKeyMissing() {
    const grid = document.getElementById('news-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted)">
          <h3>API Key Required</h3>
          <p>To fetch live news, add your free GNews API key:</p>
          <ol style="display:inline-block;text-align:left;margin-top:0.5rem">
            <li>Sign up at <a href="https://gnews.io" target="_blank" rel="noopener">gnews.io</a></li>
            <li>Copy your API key from the dashboard</li>
            <li>Open <code>js/news.js</code> and replace <code>YOUR_API_KEY</code></li>
          </ol>
        </div>`;
    }
    // Return empty array so callers don't break
    return [];
  }
};

window.FinPulse = FinPulse;
