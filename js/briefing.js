// AI-powered daily briefing — "3 things that matter today"
// Local fallback works without API key; Claude API is a premium upgrade path
var FinPulse = window.FinPulse || {};

FinPulse.Briefing = {
  API_KEY: 'YOUR_CLAUDE_API_KEY',
  CACHE_KEY: 'daily_briefing',
  API_URL: 'https://api.anthropic.com/v1/messages',
  MAX_BULLETS: 3,

  async generate(articles) {
    if (!articles || articles.length === 0) return [];

    // Serve cached briefing if generated today — avoids redundant API calls
    const cached = await FinPulse.Storage.get(this.CACHE_KEY, null);
    if (cached && cached.date === new Date().toDateString()) {
      return cached.briefing;
    }

    const hasApiKey = this.API_KEY !== 'YOUR_CLAUDE_API_KEY' && this.API_KEY.length > 0;
    const bullets = hasApiKey
      ? await this._aiGenerate(articles)
      : this._localGenerate(articles);

    // Persist to cache with today's date stamp
    await FinPulse.Storage.set(this.CACHE_KEY, {
      date: new Date().toDateString(),
      briefing: bullets
    });

    return bullets;
  },

  // Premium path: Claude API summarization
  async _aiGenerate(articles) {
    const top10 = articles.slice(0, 10).map(a => ({
      title: a.title,
      description: a.description || ''
    }));

    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
          'anthropic-version': '2023-06-01',
          // Required for browser-based calls
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 256,
          system: 'You are a concise financial analyst. Given these news articles, produce exactly 3 bullet points summarizing the most important financial developments today. Each bullet should be 1 sentence, max 20 words. Format: one bullet per line, no bullet character prefix.',
          messages: [{
            role: 'user',
            content: JSON.stringify(top10)
          }]
        })
      });

      if (!res.ok) {
        console.warn('FinPulse Briefing: API error, falling back to local', res.status);
        return this._localGenerate(articles);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      return lines.slice(0, this.MAX_BULLETS);
    } catch (err) {
      console.warn('FinPulse Briefing: API failed, using local fallback', err.message);
      return this._localGenerate(articles);
    }
  },

  // Free path: intelligent extraction from article titles
  _localGenerate(articles) {
    // Deduplicate by checking title similarity — avoid near-duplicate headlines
    const unique = this._deduplicateArticles(articles);
    const top = unique.slice(0, this.MAX_BULLETS);
    return top.map(a => this._extractBullet(a));
  },

  // Remove near-duplicate articles (same story from multiple outlets)
  _deduplicateArticles(articles) {
    const seen = [];
    return articles.filter(article => {
      const words = this._extractKeyWords(article.title);
      // Skip if 60%+ keyword overlap with any already-seen article
      const isDupe = seen.some(prev => {
        const overlap = words.filter(w => prev.includes(w)).length;
        return overlap / Math.max(words.length, 1) > 0.6;
      });
      if (!isDupe) seen.push(words);
      return !isDupe;
    });
  },

  // Pull meaningful words from a title (drop stopwords + short tokens)
  _extractKeyWords(text) {
    const stopwords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'and', 'but',
      'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
      'neither', 'each', 'every', 'all', 'any', 'few',
      'more', 'most', 'other', 'some', 'such', 'no',
      'than', 'too', 'very', 'just', 'about', 'up',
      'out', 'its', 'it', 'this', 'that', 'these', 'those',
      'says', 'said', 'new', 'also', 'how', 'what', 'why',
      'who', 'which', 'when', 'where'
    ]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));
  },

  // Build a concise bullet from an article's title + description
  _extractBullet(article) {
    const title = (article.title || '').replace(/\s*[-–|]\s*[^-–|]+$/, '');
    // If title alone is under 80 chars, use it directly
    if (title.length <= 80) return title;
    // Truncate at word boundary for readability
    const trimmed = title.substring(0, 80);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 50 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
  },

  render(bullets) {
    const container = document.getElementById('daily-briefing');
    if (!container) return;

    if (!bullets || bullets.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = `
      <div class="briefing-header">
        <span class="briefing-icon">\u26A1</span>
        <h2>Today's Briefing</h2>
      </div>
      <ul class="briefing-list">
        ${bullets.map(b => `<li>${b}</li>`).join('')}
      </ul>
    `;
    container.style.display = 'block';
  }
};

window.FinPulse = FinPulse;
