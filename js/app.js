// Main controller — wires modules together and manages UI lifecycle
var FinPulse = window.FinPulse || {};

// Sanitize API-sourced strings before innerHTML injection
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

FinPulse.App = {
  currentCategory: 'top',
  currentCountry: 'global',

  async init() {
    // Core init — these are critical, run first
    await FinPulse.Country.init();
    await FinPulse.Theme.init();

    this.setGreeting();
    this.setDate();

    const countrySelect = document.getElementById('country-filter');
    if (countrySelect) {
      this.currentCountry = countrySelect.value;
    }

    // Bind UI events early so theme toggle/tabs work even if modules fail
    this.bindEvents();

    // Non-critical modules — wrap each in try/catch so one failure doesn't block the rest
    try { if (FinPulse.Jargon) FinPulse.Jargon.init(); } catch (e) { console.warn('Jargon init failed', e); }
    try { if (FinPulse.Watchlist) await FinPulse.Watchlist.init(); } catch (e) { console.warn('Watchlist init failed', e); }
    try { if (FinPulse.Preferences) await FinPulse.Preferences.init(); } catch (e) { console.warn('Preferences init failed', e); }
    try { if (FinPulse.Bookmarks) await FinPulse.Bookmarks.init(); } catch (e) { console.warn('Bookmarks init failed', e); }
    try { if (FinPulse.Search) FinPulse.Search.init(); } catch (e) { console.warn('Search init failed', e); }

    await this.loadNews();
  },

  setGreeting() {
    const hour = new Date().getHours();
    // Time-based greeting for a personal touch on new-tab
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = `${greeting} \u{1F44B}`;
  },

  setDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('date-text');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', opts);
  },

  bindEvents() {
    // Category tabs — delegate to each .tab element
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', async (e) => {
        document.querySelector('.tab.active')?.classList.remove('active');
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        await this.loadNews();
      });
    });

    // Country switcher — persist choice so it survives new-tab reopens
    const countryFilter = document.getElementById('country-filter');
    if (countryFilter) {
      countryFilter.addEventListener('change', async (e) => {
        this.currentCountry = e.target.value;
        await FinPulse.Storage.set('country', this.currentCountry);
        await this.loadNews();
      });
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => FinPulse.Theme.toggle());
    }

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        const errEl = document.getElementById('error-state');
        if (errEl) errEl.style.display = 'none';
        await this.loadNews();
      });
    }
  },

  async loadNews() {
    const grid = document.getElementById('news-grid');
    const loading = document.getElementById('loading');
    const errorState = document.getElementById('error-state');

    if (grid) grid.innerHTML = '';
    if (loading) loading.style.display = 'flex';
    if (errorState) errorState.style.display = 'none';

    try {
      const articles = await FinPulse.News.fetchNews(
        this.currentCategory,
        this.currentCountry
      );
      if (loading) loading.style.display = 'none';

      // API key missing handler already rendered guidance into grid
      if (!articles || articles.length === 0) {
        if (grid && !grid.innerHTML.trim()) {
          grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--muted)">No articles found for this category. Try another one.</p>';
        }
        return;
      }

      // Phase 3: personalize article order based on engagement history
      const ranked = FinPulse.Preferences
        ? FinPulse.Preferences.rankArticles(articles)
        : articles;

      // Build cards via concatenation — simple, no framework needed for this scale
      let html = '';
      ranked.forEach((article) => {
        html += this.createCard(article);
      });
      if (grid) {
        grid.innerHTML = html;
        // Hide broken images via delegated listener (inline onerror forbidden by MV3 CSP)
        grid.querySelectorAll('.news-card-image').forEach(img => {
          img.addEventListener('error', () => { img.style.display = 'none'; });
        });
      }

      // Phase 3: sync bookmark icons after cards are in DOM
      if (FinPulse.Bookmarks) FinPulse.Bookmarks.updateIcons();

      // Phase 4: cache articles for client-side search filtering
      if (FinPulse.Search) FinPulse.Search.setArticles(ranked);

      // Phase 2: intelligence layer — runs after cards are in DOM
      this._runIntelligence(articles);
    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (errorState) errorState.style.display = 'block';
      console.error('FinPulse: Failed to fetch news', err);
    }
  },

  // Phase 2: briefing + sentiment + jargon — fire-and-forget after cards render
  async _runIntelligence(articles) {
    try {
      // Sentiment is synchronous — render immediately
      if (FinPulse.Sentiment) {
        const mood = FinPulse.Sentiment.analyze(articles);
        FinPulse.Sentiment.render(mood);
      }
      // Briefing may hit cache/API — async
      if (FinPulse.Briefing) {
        const bullets = await FinPulse.Briefing.generate(articles);
        FinPulse.Briefing.render(bullets);
      }
      // Jargon scan runs after all DOM is settled
      if (FinPulse.Jargon) FinPulse.Jargon.enhance();
    } catch (err) {
      console.warn('FinPulse: Intelligence layer error', err.message);
    }
  },

  createCard(article) {
    const timeAgo = FinPulse.News.formatTime(article.publishedAt);
    const tldr = FinPulse.News.generateTLDR(article.description);
    // Lazy-load images; hide broken ones gracefully via onerror
    // No inline onerror — MV3 CSP forbids it. Broken images handled via delegated listener.
    const imageHTML = article.image
      ? `<img class="news-card-image" src="${article.image}" alt="" loading="lazy">`
      : '';

    // Phase 3: highlight cards matching watchlist symbols
    const relevantClass = FinPulse.Watchlist && FinPulse.Watchlist.isRelevant(article)
      ? ' watchlist-relevant' : '';

    // Phase 3: bookmark button — data attrs carry article info for toggle
    const escaped = (s) => (s || '').replace(/"/g, '&quot;');
    const bookmarkBtn = `<button class="bookmark-btn"
      data-url="${escaped(article.url)}"
      data-title="${escaped(article.title)}"
      data-source="${escaped(article.source)}"
      data-description="${escaped(article.description)}"
      title="Save article">&#9734;</button>`;

    // Sanitize all API-sourced strings before injection
    const safeUrl = encodeURI(article.url || '#');
    const safeTitle = escapeHTML(article.title);
    const safeSource = escapeHTML(article.source || 'Unknown');
    const safeTldr = escapeHTML(tldr);

    return `
      <a href="${safeUrl}" target="_blank" rel="noopener" class="news-card${relevantClass}" style="text-decoration:none;color:inherit">
        ${bookmarkBtn}
        ${imageHTML}
        <div class="news-card-body">
          <span class="news-card-source">${safeSource}</span>
          <h3 class="news-card-title">${safeTitle}</h3>
          <p class="news-card-tldr">${safeTldr}</p>
          <div class="news-card-meta">
            <span>${timeAgo}</span>
            <span class="news-card-category">${this.currentCategory}</span>
          </div>
        </div>
      </a>`;
  }
};

// Boot when DOM is ready — DOMContentLoaded fires before images/stylesheets finish
document.addEventListener('DOMContentLoaded', () => {
  FinPulse.App.init();
});

window.FinPulse = FinPulse;
