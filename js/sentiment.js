// Market mood indicator — keyword-based sentiment scoring (no external API needed)
var FinPulse = window.FinPulse || {};

FinPulse.Sentiment = {
  POSITIVE_WORDS: [
    'surge', 'rally', 'gain', 'rise', 'growth', 'profit', 'bull',
    'record', 'boom', 'soar', 'beat', 'strong', 'recover', 'upgrade',
    'optimism', 'rebound', 'outperform', 'breakout', 'high', 'boost',
    'bullish', 'upturn', 'advance', 'peak', 'thrive', 'expand',
    'positive', 'confidence', 'momentum', 'upbeat'
  ],

  NEGATIVE_WORDS: [
    'crash', 'fall', 'drop', 'loss', 'decline', 'bear', 'recession',
    'crisis', 'plunge', 'fear', 'sell', 'weak', 'slump', 'cut',
    'downgrade', 'pessimism', 'default', 'bankruptcy', 'layoff',
    'inflation', 'debt', 'bearish', 'downturn', 'plummet', 'tank',
    'negative', 'warning', 'risk', 'turmoil', 'volatility'
  ],

  // Score a single article: returns -1 to +1
  scoreArticle(title, description) {
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    let pos = 0;
    let neg = 0;

    // Count keyword hits with word-boundary awareness
    this.POSITIVE_WORDS.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) pos += matches.length;
    });

    this.NEGATIVE_WORDS.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) neg += matches.length;
    });

    const total = pos + neg;
    // Normalize to -1..+1 range; 0 when no keywords found
    return total === 0 ? 0 : (pos - neg) / total;
  },

  // Aggregate mood from all articles
  analyze(articles) {
    if (!articles || articles.length === 0) {
      return { score: 0, label: 'Neutral', emoji: '\uD83D\uDE10' };
    }

    const scores = articles.map(a => this.scoreArticle(a.title, a.description));
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;

    return this._mapScoreToMood(avg);
  },

  // Thresholds: very bullish > 0.3, bullish > 0.1, neutral > -0.1, bearish > -0.3
  _mapScoreToMood(score) {
    if (score > 0.3) return { score, label: 'Very Bullish', emoji: '\uD83D\uDFE2\uD83D\uDD25' };
    if (score > 0.1) return { score, label: 'Bullish', emoji: '\uD83D\uDFE2' };
    if (score > -0.1) return { score, label: 'Neutral', emoji: '\uD83D\uDE10' };
    if (score > -0.3) return { score, label: 'Bearish', emoji: '\uD83D\uDD34' };
    return { score, label: 'Very Bearish', emoji: '\uD83D\uDD34\uD83D\uDD25' };
  },

  render(mood) {
    const container = document.getElementById('market-mood');
    if (!container) return;

    // Convert score (-1..+1) to percentage (0..100) for gauge positioning
    const pct = Math.round((mood.score + 1) * 50);

    // Count how many articles contributed to the score
    var articleCount = arguments[1] || 0;

    container.innerHTML = `
      <div class="mood-header">
        <span class="mood-title">News Pulse ${mood.emoji}</span>
        <span class="mood-info-wrap">
          <span class="mood-info-icon" tabindex="0">i</span>
          <span class="mood-info-tooltip">Based on tone of today's ${articleCount || ''} headlines. This reflects news language, not live market data.</span>
        </span>
      </div>
      <div class="mood-bar">
        <div class="mood-indicator" style="left: ${pct}%"></div>
      </div>
      <div class="mood-scale">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
    `;
  }
};

window.FinPulse = FinPulse;
