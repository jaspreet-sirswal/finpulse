// Bookmarks — save/unsave articles for later reading
var FinPulse = window.FinPulse || {};

FinPulse.Bookmarks = {
  STORAGE_KEY: 'bookmarks',
  MAX_ITEMS: 50,
  items: [],

  async init() {
    this.items = await FinPulse.Storage.get(this.STORAGE_KEY, []);
    this.bindEvents();
  },

  isBookmarked(url) {
    return this.items.some(i => i.url === url);
  },

  async toggle(article) {
    if (this.isBookmarked(article.url)) {
      this.items = this.items.filter(i => i.url !== article.url);
    } else {
      // Prepend with timestamp for chronological sorting
      this.items.unshift({ ...article, savedAt: Date.now() });
      // Cap storage to prevent unbounded growth
      if (this.items.length > this.MAX_ITEMS) {
        this.items = this.items.slice(0, this.MAX_ITEMS);
      }
    }
    await FinPulse.Storage.set(this.STORAGE_KEY, this.items);
    this.updateIcons();
  },

  // Sync all visible bookmark icons with current state
  updateIcons() {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      const saved = this.isBookmarked(btn.dataset.url);
      btn.textContent = saved ? '\u2605' : '\u2606';
      btn.classList.toggle('bookmarked', saved);
    });
  },

  renderPanel() {
    const panel = document.getElementById('bookmarks-panel');
    if (!panel) return;

    if (this.items.length === 0) {
      panel.innerHTML = `
        <p class="bookmarks-empty">
          No saved articles yet. Click \u2606 on any article to save it.
        </p>`;
      return;
    }

    panel.innerHTML = `
      <div class="bookmarks-header">
        <h3>Saved Articles (${this.items.length})</h3>
        <button id="bookmarks-close" title="Close">&times;</button>
      </div>
      <div class="bookmarks-list">
        ${this.items.map(item => `
          <a href="${item.url}" target="_blank" rel="noopener"
             class="bookmark-item">
            <span class="bookmark-source">${item.source || 'Unknown'}</span>
            <span class="bookmark-title">${item.title}</span>
            <span class="bookmark-time">${this._timeAgo(item.savedAt)}</span>
          </a>
        `).join('')}
      </div>`;
  },

  _timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      // Bookmark toggle on card
      if (e.target.classList.contains('bookmark-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const article = {
          url: e.target.dataset.url,
          title: e.target.dataset.title || '',
          source: e.target.dataset.source || '',
          description: e.target.dataset.description || ''
        };
        this.toggle(article);
        return;
      }

      // Close bookmarks panel
      if (e.target.id === 'bookmarks-close') {
        const panel = document.getElementById('bookmarks-panel');
        if (panel) panel.style.display = 'none';
        return;
      }

      // Toggle bookmarks panel visibility
      if (e.target.id === 'bookmarks-toggle') {
        const panel = document.getElementById('bookmarks-panel');
        if (!panel) return;
        const visible = panel.style.display === 'block';
        panel.style.display = visible ? 'none' : 'block';
        if (!visible) this.renderPanel();
      }
    });
  }
};

window.FinPulse = FinPulse;
