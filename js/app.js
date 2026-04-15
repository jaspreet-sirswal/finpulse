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

    this.bindOnboarding();

    await this.loadNews();
  },

  setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = greeting;
  },

  // Render aggregate stats into greeting bar
  updateStats(articleCount, moodLabel, filteredCount) {
    const el = document.getElementById('greeting-stats');
    if (!el) return;
    const parts = [];
    if (filteredCount !== undefined && filteredCount !== articleCount) {
      parts.push(`<span class="stat">${filteredCount} of ${articleCount} articles</span>`);
    } else if (articleCount > 0) {
      parts.push(`<span class="stat">${articleCount} articles</span>`);
    }
    if (moodLabel) parts.push(`<span class="stat">${moodLabel}</span>`);
    // Show active country flag
    const countrySelect = document.getElementById('country-filter');
    if (countrySelect) {
      const selectedOption = countrySelect.options[countrySelect.selectedIndex];
      if (selectedOption) {
        const flag = selectedOption.textContent.split(' ')[0]; // Extract emoji flag
        parts.push(`<span class="stat">${flag}</span>`);
      }
    }
    // Count watchlist matches
    if (FinPulse.Watchlist && FinPulse.Watchlist.items.length > 0) {
      parts.push(`<span class="stat">${FinPulse.Watchlist.items.length} watching</span>`);
    }
    el.innerHTML = parts.join('<span style="opacity:0.3">·</span>');
  },

  setDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('date-text');
    if (el) el.textContent = new Date().toLocaleDateString('en-US', opts);
  },

  bindOnboarding() {
    // Save button — validate key, store, reload
    var saveBtn = document.getElementById('onboarding-save-btn');
    var keyInput = document.getElementById('onboarding-key-input');
    var statusEl = document.getElementById('onboarding-status');

    var self = this;

    function showStatus(msg, type) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'onboarding-status ' + type;
    }

    async function saveKey() {
      if (!keyInput) return;
      var key = keyInput.value.trim();
      if (!key) {
        showStatus('Please paste your API key', 'error');
        return;
      }
      if (key.length < 20) {
        showStatus('That key looks too short — check your GNews dashboard', 'error');
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Validating...';
      }

      try {
        var res = await fetch('https://gnews.io/api/v4/search?q=finance&max=1&apikey=' + key);
        if (res.ok) {
          // Key works — persist and transition to full dashboard
          await FinPulse.Storage.set('gnews_api_key', key);
          FinPulse.News._apiKey = key;

          // Exit onboarding mode
          document.body.classList.remove('onboarding');
          var onboarding = document.getElementById('onboarding');
          if (onboarding) onboarding.style.display = 'none';

          // Reveal sidebars
          var dashboard = document.getElementById('dashboard');
          if (dashboard) dashboard.classList.remove('no-sidebars');
          var sidebarLeft = document.getElementById('sidebar-left');
              if (sidebarLeft) sidebarLeft.style.display = '';
    
          // Load news with the new key
          await self.loadNews();
        } else if (res.status === 403 || res.status === 429) {
          // 403/429 during onboarding = rate limited, not invalid key
          // Save the key anyway — it'll work when the limit resets
          await FinPulse.Storage.set('gnews_api_key', key);
          FinPulse.News._apiKey = key;

          var resetAt = new Date();
          resetAt.setUTCDate(resetAt.getUTCDate() + 1);
          resetAt.setUTCHours(0, 0, 0, 0);
          var resetLocal = resetAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          showStatus('Key saved! GNews daily limit reached — news will load after ' + resetLocal + '.', 'success');
        } else {
          showStatus('GNews returned error ' + res.status + ' — try again', 'error');
        }
      } catch (e) {
        showStatus('Could not reach GNews — check your connection', 'error');
      }

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', saveKey);
    }
    if (keyInput) {
      keyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveKey();
      });
    }
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

    // Refresh button — clear cache and reload
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        FinPulse.News.cache = {};
        await this.loadNews();
      });
    }
  },

  async loadNews() {
    const grid = document.getElementById('news-grid');
    const loading = document.getElementById('loading');
    const errorState = document.getElementById('error-state');

    if (grid) grid.style.opacity = '0';
    if (grid) grid.innerHTML = '';
    if (loading) loading.style.display = 'block';
    if (errorState) errorState.style.display = 'none';

    try {
      const articles = await FinPulse.News.fetchNews(
        this.currentCategory,
        this.currentCountry
      );
      if (loading) loading.style.display = 'none';

      if (!articles || articles.length === 0) {
        // In onboarding mode, the onboarding card handles the UI
        if (document.body.classList.contains('onboarding')) {
          if (grid) grid.style.opacity = '1';
          return;
        }
        if (grid && !grid.innerHTML.trim()) {
          grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--muted)">No articles found for this category. Try another one.</p>';
        }
        if (grid) grid.style.opacity = '1';
        return;
      }

      // API key is valid and articles loaded — reveal full dashboard layout
      var dashboard = document.getElementById('dashboard');
      if (dashboard) dashboard.classList.remove('no-sidebars');
      var sidebarLeft = document.getElementById('sidebar-left');
      var briefing = document.getElementById('daily-briefing');
      if (sidebarLeft) sidebarLeft.style.display = '';
      if (briefing) briefing.style.display = '';

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
        requestAnimationFrame(() => { if (grid) grid.style.opacity = '1'; });
        // Replace broken images with SVG placeholder (inline onerror forbidden by MV3 CSP)
        grid.querySelectorAll('.news-card-image').forEach(img => {
          img.addEventListener('error', () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'news-card-img-placeholder';
            placeholder.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M3 17L7 13L11 15L15 9L21 7"/><rect x="2" y="2" width="20" height="20" rx="2"/></svg>';
            img.replaceWith(placeholder);
          });
        });
      }

      // Phase 3: sync bookmark icons after cards are in DOM
      if (FinPulse.Bookmarks) FinPulse.Bookmarks.updateIcons();

      // Phase 4: cache articles for client-side search filtering
      if (FinPulse.Search) FinPulse.Search.setArticles(ranked);

      // Update article count in greeting stats before intelligence layer
      this.updateStats(articles.length, null);

      // Phase 2: intelligence layer — runs after cards are in DOM
      this._runIntelligence(articles);

      // Update footer with relative timestamp that auto-refreshes
      this._lastUpdated = Date.now();
      this._updateFooterTimestamp();
      if (!this._footerInterval) {
        this._footerInterval = setInterval(() => this._updateFooterTimestamp(), 60000);
      }
    } catch (err) {
      if (loading) loading.style.display = 'none';

      if (err.message === 'RATE_LIMIT') {
        if (grid) {
          grid.style.opacity = '1';
          grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem 2rem">
              <div style="font-size:48px;margin-bottom:16px">⏳</div>
              <h3 style="font-size:18px;margin-bottom:8px">GNews API rate limit reached</h3>
              <p style="font-size:14px;margin-bottom:16px;opacity:0.7">
                The free GNews plan allows 100 requests per day. FinPulse caches results, but switching categories frequently can use up the quota.
              </p>
              <div style="display:inline-block;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;background:linear-gradient(135deg,rgba(0,102,204,0.1),rgba(124,58,237,0.1))">
                Resets at <strong>${err.resetTime}</strong> (in ~${err.hoursLeft}h)
              </div>
              <p style="font-size:12px;margin-top:16px;opacity:0.5">
                This is a GNews limit, not a FinPulse limit. Cached articles will still load.
              </p>
            </div>`;
        }
        // Warn instead of error — keeps Chrome errors panel clean
        console.warn('FinPulse: GNews rate limit reached, resets at', err.resetTime);
      } else {
        if (errorState) errorState.style.display = 'block';
        console.warn('FinPulse: Failed to fetch news', err.message);
      }
    }
  },

  // Phase 2: briefing + sentiment + jargon — fire-and-forget after cards render
  async _runIntelligence(articles) {
    try {
      let moodLabel = null;
      // Sentiment is synchronous — render immediately
      if (FinPulse.Sentiment) {
        const mood = FinPulse.Sentiment.analyze(articles);
        FinPulse.Sentiment.render(mood, articles.length);
        moodLabel = `${mood.emoji} ${mood.label}`;
      }
      // Push mood into greeting stats bar
      this.updateStats(articles.length, moodLabel);
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

  _updateFooterTimestamp() {
    const el = document.getElementById('last-updated');
    if (!el || !this._lastUpdated) return;
    const diff = Math.floor((Date.now() - this._lastUpdated) / 60000);
    if (diff < 1) {
      el.textContent = 'Updated just now';
    } else {
      el.textContent = `Updated ${diff}m ago`;
    }
  },

  createCard(article) {
    const timeAgo = FinPulse.News.formatTime(article.publishedAt);
    const tldr = FinPulse.News.generateTLDR(article.description);
    // Lazy-load images; broken ones replaced with SVG placeholder via delegated listener
    const imageHTML = article.image
      ? `<img class="news-card-image" src="${article.image}" alt="" loading="lazy">`
      : `<div class="news-card-img-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
        <path d="M3 17L7 13L11 15L15 9L21 7"/><rect x="2" y="2" width="20" height="20" rx="2"/>
      </svg>
    </div>`;

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
      <a href="${safeUrl}" target="_blank" rel="noopener" class="news-card${relevantClass}" data-color="${this.currentCategory}">
        ${bookmarkBtn}
        ${imageHTML}
        <div class="news-card-body">
          <span class="news-card-source">${safeSource}</span>
          <h3 class="news-card-title">${safeTitle}</h3>
          <p class="news-card-tldr">${safeTldr}</p>
          <div class="news-card-meta">
            <span>${timeAgo}</span>
            <span class="news-card-category" data-color="${this.currentCategory}">${this.currentCategory}</span>
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
