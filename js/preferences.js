// Preferences — learn from click behavior to personalize article ranking
var FinPulse = window.FinPulse || {};

FinPulse.Preferences = {
  STORAGE_KEY: 'preferences',
  clicks: {},

  async init() {
    this.clicks = await FinPulse.Storage.get(this.STORAGE_KEY, {});
    this.bindEvents();
  },

  // Increment click count for a category
  trackClick(category) {
    this.clicks[category] = (this.clicks[category] || 0) + 1;
    // Fire-and-forget — UI should never block on persistence
    FinPulse.Storage.set(this.STORAGE_KEY, this.clicks);
  },

  // Re-rank articles by user engagement weight per category
  rankArticles(articles) {
    if (!articles || Object.keys(this.clicks).length === 0) {
      return articles;
    }

    const total = Object.values(this.clicks).reduce((a, b) => a + b, 0);
    // Need minimum engagement data before personalizing
    if (total < 5) return articles;

    return [...articles].sort((a, b) => {
      const scoreA = (this.clicks[a.category] || 0) / total;
      const scoreB = (this.clicks[b.category] || 0) / total;
      return scoreB - scoreA;
    });
  },

  bindEvents() {
    // Track clicks on news cards via event delegation
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.news-card');
      if (!card) return;
      const badge = card.querySelector('.news-card-category');
      if (badge) {
        this.trackClick(badge.textContent.trim());
      }
    });
  },

  // Top 3 preferred categories for UI hints
  getTopCategories() {
    return Object.entries(this.clicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  }
};

window.FinPulse = FinPulse;
