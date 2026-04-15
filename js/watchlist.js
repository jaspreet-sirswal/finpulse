// Watchlist — track stocks/crypto and surface relevant news
var FinPulse = window.FinPulse || {};

FinPulse.Watchlist = {
  STORAGE_KEY: 'watchlist',
  items: [],

  async init() {
    this.items = await FinPulse.Storage.get(this.STORAGE_KEY, []);
    this.render();
    this.bindEvents();
  },

  async add(symbol, name) {
    // Prevent duplicate symbols in the list
    if (this.items.find(i => i.symbol === symbol)) return;
    this.items.push({ symbol, name });
    await FinPulse.Storage.set(this.STORAGE_KEY, this.items);
    this.render();
    // Flash highlight on newly added item for visual feedback
    const items = document.querySelectorAll('.watchlist-item');
    const lastItem = items[items.length - 1];
    if (lastItem) {
      lastItem.style.transition = 'background-color 0.3s ease';
      lastItem.style.backgroundColor = 'rgba(0, 102, 204, 0.1)';
      lastItem.style.borderRadius = '6px';
      setTimeout(() => { lastItem.style.backgroundColor = 'transparent'; }, 1200);
    }
  },

  async remove(symbol) {
    this.items = this.items.filter(i => i.symbol !== symbol);
    await FinPulse.Storage.set(this.STORAGE_KEY, this.items);
    this.render();
  },

  // Check if article mentions any watchlist symbol or name
  isRelevant(article) {
    if (this.items.length === 0) return false;
    const text = `${article.title} ${article.description}`.toLowerCase();
    return this.items.some(item =>
      text.includes(item.symbol.toLowerCase()) ||
      text.includes(item.name.toLowerCase())
    );
  },

  render() {
    const container = document.getElementById('watchlist-panel');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="watchlist-header">
          <span style="font-size:16px">📊</span>
          <h3>Watchlist</h3>
        </div>
        <div class="watchlist-empty">
          <p>Track stocks &amp; crypto symbols to highlight relevant news</p>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="watchlist-header">
          <span style="font-size:16px">📊</span>
          <h3>Watchlist</h3>
        </div>
        <div class="watchlist-items">
          ${this.items.map(item => `
            <div class="watchlist-item">
              <span class="watchlist-symbol">${item.symbol}</span>
              <span class="watchlist-name">${item.name}</span>
              <button class="watchlist-remove" data-symbol="${item.symbol}" title="Remove">&times;</button>
            </div>
          `).join('')}
        </div>`;
    }

    // Append add-form only if not already present
    if (container.querySelector('#watchlist-add-form')) return;

    const addForm = document.createElement('div');
    addForm.id = 'watchlist-add-form';
    addForm.innerHTML = `
      <div class="watchlist-add">
        <input type="text" id="watchlist-input"
               placeholder="Add symbol (e.g. AAPL, BTC)"
               maxlength="20">
        <button id="watchlist-add-btn" title="Add to watchlist">+</button>
      </div>`;
    container.appendChild(addForm);
  },

  bindEvents() {
    // Delegation: remove buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('watchlist-remove')) {
        this.remove(e.target.dataset.symbol);
      }
    });

    // Delegation: add button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'watchlist-add-btn') {
        this._addFromInput();
      }
    });

    // Enter key in input triggers add
    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'watchlist-input' && e.key === 'Enter') {
        this._addFromInput();
      }
    });
  },

  _addFromInput() {
    const input = document.getElementById('watchlist-input');
    if (!input) return;
    const val = input.value.trim().toUpperCase();
    if (!val) return;
    // Default name to symbol — can be enriched later via API
    this.add(val, val);
    input.value = '';
  }
};

window.FinPulse = FinPulse;
