// Storage abstraction — chrome.storage.local for extensions, localStorage fallback for dev/testing
var FinPulse = window.FinPulse || {};

FinPulse.Storage = {
  // Detect runtime to pick correct storage backend once
  _isChromeExt: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,

  async get(key, defaultValue = null) {
    if (this._isChromeExt) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        });
      });
    }
    // Fallback: localStorage stores strings, so parse JSON
    try {
      const raw = localStorage.getItem(`finpulse_${key}`);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set(key, value) {
    if (this._isChromeExt) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    try {
      localStorage.setItem(`finpulse_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('FinPulse Storage: write failed —', err.message);
    }
  },

  async remove(key) {
    if (this._isChromeExt) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, resolve);
      });
    }
    localStorage.removeItem(`finpulse_${key}`);
  }
};

window.FinPulse = FinPulse;
