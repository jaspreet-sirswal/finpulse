// Theme toggle — persists preference across sessions via Storage module
var FinPulse = window.FinPulse || {};

FinPulse.Theme = {
  current: 'light',

  _apply(theme) {
    this.current = theme;
    // Single class on body controls all CSS vars
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      // Show opposite icon — sun means "switch to light", moon means "switch to dark"
      btn.textContent = theme === 'dark' ? '\u{2600}\u{FE0F}' : '\u{1F319}';
    }
  },

  toggle() {
    const next = this.current === 'light' ? 'dark' : 'light';
    this._apply(next);
    // Fire-and-forget — no need to await persistence for UI responsiveness
    FinPulse.Storage.set('theme', next);
  },

  async init() {
    const saved = await FinPulse.Storage.get('theme', 'light');
    this._apply(saved);
  }
};

window.FinPulse = FinPulse;
