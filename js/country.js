// Country detection + per-region news source config
// Timezone-based auto-detect avoids external geolocation APIs
var FinPulse = window.FinPulse || {};

FinPulse.Country = {
  countries: {
    global: {
      name: 'Global', flag: '\u{1F30D}',
      keywords: {
        top: 'finance',
        markets: 'stock market',
        crypto: 'cryptocurrency',
        'personal-finance': 'personal finance',
        economy: 'global economy',
        startups: 'startup funding'
      }
    },
    in: {
      name: 'India', flag: '\u{1F1EE}\u{1F1F3}',
      keywords: {
        top: 'India finance',
        markets: 'BSE NSE Sensex Nifty',
        crypto: 'crypto India',
        'personal-finance': 'mutual fund SIP India',
        economy: 'Indian economy RBI',
        startups: 'Indian startup'
      }
    },
    us: {
      name: 'United States', flag: '\u{1F1FA}\u{1F1F8}',
      keywords: {
        top: 'US finance Wall Street',
        markets: 'S&P 500 NASDAQ NYSE',
        crypto: 'crypto SEC',
        'personal-finance': '401k investing savings',
        economy: 'US economy Federal Reserve',
        startups: 'Silicon Valley startup VC'
      }
    },
    gb: {
      name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}',
      keywords: {
        top: 'UK finance',
        markets: 'FTSE London Stock Exchange',
        crypto: 'crypto UK FCA',
        'personal-finance': 'ISA pension UK savings',
        economy: 'UK economy Bank of England',
        startups: 'UK startup fintech'
      }
    },
    eu: {
      name: 'Europe', flag: '\u{1F1EA}\u{1F1FA}',
      keywords: {
        top: 'Europe finance',
        markets: 'DAX CAC Euro Stoxx',
        crypto: 'crypto EU MiCA',
        'personal-finance': 'European savings investing',
        economy: 'ECB eurozone economy',
        startups: 'European startup'
      }
    },
    sg: {
      name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}',
      keywords: {
        top: 'Singapore finance',
        markets: 'SGX Straits Times Index',
        crypto: 'crypto MAS Singapore',
        'personal-finance': 'CPF Singapore savings',
        economy: 'Singapore economy MAS',
        startups: 'Singapore startup fintech'
      }
    },
    ae: {
      name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}',
      keywords: {
        top: 'UAE finance Dubai',
        markets: 'Dubai DFM Abu Dhabi ADX',
        crypto: 'crypto Dubai VARA',
        'personal-finance': 'UAE savings investing',
        economy: 'UAE economy OPEC',
        startups: 'UAE startup DIFC'
      }
    },
    jp: {
      name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}',
      keywords: {
        top: 'Japan finance',
        markets: 'Nikkei Tokyo Stock Exchange',
        crypto: 'crypto Japan',
        'personal-finance': 'Japan savings investing',
        economy: 'Japan economy BOJ',
        startups: 'Japan startup'
      }
    },
    au: {
      name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}',
      keywords: {
        top: 'Australia finance',
        markets: 'ASX Australian stocks',
        crypto: 'crypto Australia',
        'personal-finance': 'superannuation Australia',
        economy: 'Australian economy RBA',
        startups: 'Australian startup'
      }
    },
    ca: {
      name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}',
      keywords: {
        top: 'Canada finance',
        markets: 'TSX Canadian stocks',
        crypto: 'crypto Canada',
        'personal-finance': 'TFSA RRSP Canada',
        economy: 'Canadian economy Bank of Canada',
        startups: 'Canadian startup'
      }
    }
  },

  // Timezone -> country code mapping for auto-detection
  _tzMap: {
    'Asia/Kolkata': 'in', 'Asia/Calcutta': 'in',
    'America/New_York': 'us', 'America/Chicago': 'us',
    'America/Denver': 'us', 'America/Los_Angeles': 'us',
    'Europe/London': 'gb',
    'Europe/Berlin': 'eu', 'Europe/Paris': 'eu', 'Europe/Rome': 'eu',
    'Asia/Singapore': 'sg',
    'Asia/Dubai': 'ae',
    'Asia/Tokyo': 'jp',
    'Australia/Sydney': 'au',
    'America/Toronto': 'ca'
  },

  detect() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this._tzMap[tz] || 'global';
    } catch {
      // Intl not supported — safe default
      return 'global';
    }
  },

  getKeywords(countryCode, category) {
    const country = this.countries[countryCode] || this.countries.global;
    return country.keywords[category] || country.keywords.top;
  },

  async init() {
    let saved = await FinPulse.Storage.get('country', null);
    if (!saved || !this.countries[saved]) {
      saved = this.detect();
      await FinPulse.Storage.set('country', saved);
    }
    // Sync select dropdown with stored preference
    const select = document.getElementById('country-filter');
    if (select) {
      select.value = saved;
    }
  }
};

window.FinPulse = FinPulse;
