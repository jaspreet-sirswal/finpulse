// News fetching layer — GNews API with in-memory cache to respect free-tier rate limits
var FinPulse = window.FinPulse || {};

FinPulse.News = {
  _apiKey: null, // Loaded from chrome.storage.local at runtime — never hardcoded
  BASE_URL: 'https://gnews.io/api/v4',
  cache: {},
  CACHE_TTL: 15 * 60 * 1000, // 15min — balances freshness vs rate-limit conservation

  // Load API key from storage — called once during app init
  async loadApiKey() {
    this._apiKey = await FinPulse.Storage.get('gnews_api_key', null);
    return this._apiKey;
  },

  async fetchNews(category, country) {
    // Load key from storage if not cached in memory
    if (!this._apiKey) {
      await this.loadApiKey();
    }

    // No key configured — show setup instructions
    if (!this._apiKey) {
      return this._apiKeyMissing();
    }

    var cacheKey = country + ':' + category;
    var cached = this.cache[cacheKey];

    // Serve from cache if within TTL window
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.articles;
    }

    var keywords = FinPulse.Country.getKeywords(country, category);

    // Top Stories: 24h for freshness. Others: 7 days for niche coverage.
    var hours = category === 'top' ? 24 : 168;
    var since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';

    var params = new URLSearchParams({
      q: keywords,
      lang: 'en',
      max: '20',
      sortby: 'publishedAt',
      from: since,
      apikey: this._apiKey
    });

    if (country !== 'global') {
      params.set('country', country);
    }

    var articles = await this._fetchFromAPI(params);

    // Persist to in-memory cache with timestamp
    this.cache[cacheKey] = { articles: articles, ts: Date.now() };
    return articles;
  },

  async _fetchFromAPI(params) {
    var url = this.BASE_URL + '/search?' + params.toString();
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, 10000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429 || res.status === 403) {
      // GNews returns 403 or 429 when rate limited — both mean quota exhausted
      var now = new Date();
      var resetAt = new Date(now);
      resetAt.setUTCDate(resetAt.getUTCDate() + 1);
      resetAt.setUTCHours(0, 0, 0, 0);
      var hoursLeft = Math.ceil((resetAt - now) / (1000 * 60 * 60));
      var resetTime = resetAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      var err = new Error('RATE_LIMIT');
      err.resetTime = resetTime;
      err.hoursLeft = hoursLeft;
      throw err;
    }

    if (!res.ok) {
      throw new Error('GNews API ' + res.status + ': ' + res.statusText);
    }

    var data = await res.json();
    return (data.articles || []).map(function(a) {
      return {
        title: a.title,
        description: a.description,
        url: a.url,
        image: a.image,
        source: a.source ? a.source.name : 'Unknown',
        publishedAt: a.publishedAt
      };
    });
  },

  formatTime(dateString) {
    if (!dateString) return '';
    var diff = Date.now() - new Date(dateString).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  },

  generateTLDR(description) {
    if (!description) return 'Click to read full article.';
    if (description.length <= 120) return description;
    // Truncate at word boundary to avoid mid-word cuts
    var trimmed = description.substring(0, 120);
    var lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 80 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
  },

  _apiKeyMissing() {
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Enter onboarding mode — hides non-functional UI via CSS
    document.body.classList.add('onboarding');

    var onboarding = document.getElementById('onboarding');
    if (onboarding) onboarding.style.display = 'flex';

    return [];
  }
};

window.FinPulse = FinPulse;
