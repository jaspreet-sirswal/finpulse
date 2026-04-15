// Search module — filters currently loaded articles by query
var FinPulse = window.FinPulse || {};

FinPulse.Search = {
  allArticles: [],

  init() {
    this.bindEvents();
  },

  // Cache articles for client-side filtering (called by App after fetch)
  setArticles(articles) {
    this.allArticles = articles || [];
  },

  // AND-match all whitespace-separated terms against title+description+source
  filter(query) {
    if (!query || query.trim() === '') return this.allArticles;

    const terms = query.toLowerCase().trim().split(/\s+/);
    return this.allArticles.filter(article => {
      const text = `${article.title} ${article.description} ${article.source}`.toLowerCase();
      return terms.every(term => text.includes(term));
    });
  },

  // Wrap matched terms in <mark> for visual emphasis
  highlight(text, query) {
    if (!query || !text) return text;

    const terms = query.trim().split(/\s+/).filter(t => t.length > 1);
    let result = text;
    terms.forEach(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    return result;
  },

  bindEvents() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const hint = document.getElementById('search-hint');

    if (input) {
      // Debounced input — 250ms prevents excessive DOM thrash
      let timeout;
      input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const query = e.target.value;

        if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

        timeout = setTimeout(() => {
          const filtered = this.filter(query);
          this._renderResults(filtered, query);
        }, 250);
      });

      // Escape clears search and restores full feed
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          input.value = '';
          input.blur();
          if (clearBtn) clearBtn.style.display = 'none';
          this._renderResults(this.allArticles, '');
        }
      });

      // Hide keyboard hint on focus, restore on blur if empty
      if (hint) {
        input.addEventListener('focus', () => { hint.style.opacity = '0'; });
        input.addEventListener('blur', () => {
          if (!input.value) hint.style.opacity = '1';
        });
      }
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const inp = document.getElementById('search-input');
        if (inp) { inp.value = ''; inp.focus(); }
        clearBtn.style.display = 'none';
        this._renderResults(this.allArticles, '');
      });
    }

    // Global "/" shortcut (GitHub-style) — only when not already in an input
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const inp = document.getElementById('search-input');
        if (inp) inp.focus();
      }
    });
  },

  _renderResults(articles, query) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    if (!articles || articles.length === 0) {
      // Sanitize query before injecting into DOM
      const safe = (query || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      grid.innerHTML = `
        <div class="search-empty" style="grid-column:1/-1">
          <p>No articles match "${safe}"</p>
          <p style="font-size:12px;margin-top:8px">Try different keywords or clear the search</p>
        </div>`;
      return;
    }

    let html = '';
    articles.forEach(article => {
      if (query) {
        const highlighted = {
          ...article,
          title: this.highlight(article.title, query),
          description: this.highlight(article.description || '', query)
        };
        html += FinPulse.App.createCard(highlighted);
      } else {
        html += FinPulse.App.createCard(article);
      }
    });
    grid.innerHTML = html;

    // Re-run post-render hooks if those modules exist
    if (FinPulse.Jargon && FinPulse.Jargon.enhance) {
      FinPulse.Jargon.enhance();
    }
    if (FinPulse.Bookmarks && FinPulse.Bookmarks.updateIcons) {
      FinPulse.Bookmarks.updateIcons();
    }
  }
};

window.FinPulse = FinPulse;
