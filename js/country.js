// Country detection + per-region news source config
// Timezone-based auto-detect avoids external geolocation APIs
var FinPulse = window.FinPulse || {};

FinPulse.Country = {
  countries: {
    global: {
      name: 'Global', flag: '\u{1F30D}',
      keywords: {
        top: 'stock OR market OR economy OR finance OR trading',
        markets: 'stock OR shares OR trading OR NYSE OR NASDAQ OR index',
        crypto: 'bitcoin OR ethereum OR crypto OR blockchain OR DeFi',
        'personal-finance': 'investing OR savings OR retirement OR budget OR tax',
        economy: 'GDP OR inflation OR interest rate OR recession OR central bank',
        startups: 'startup OR funding OR venture capital OR IPO OR unicorn'
      }
    },
    in: {
      name: 'India', flag: '\u{1F1EE}\u{1F1F3}',
      keywords: {
        top: 'stock OR market OR economy OR finance OR RBI',
        markets: 'Sensex OR Nifty OR BSE OR NSE OR share price',
        crypto: 'bitcoin OR crypto OR blockchain OR WazirX OR CoinDCX',
        'personal-finance': 'mutual fund OR SIP OR PPF OR tax saving OR FD',
        economy: 'RBI OR GDP OR inflation OR rupee OR fiscal',
        startups: 'startup OR funding OR Shark Tank OR unicorn OR IPO India'
      }
    },
    us: {
      name: 'United States', flag: '\u{1F1FA}\u{1F1F8}',
      keywords: {
        top: 'stock OR Wall Street OR Fed OR economy OR market',
        markets: 'S&P 500 OR NASDAQ OR NYSE OR Dow Jones OR earnings',
        crypto: 'bitcoin OR ethereum OR SEC crypto OR Coinbase OR stablecoin',
        'personal-finance': '401k OR investing OR savings OR mortgage OR credit',
        economy: 'Federal Reserve OR inflation OR jobs report OR GDP OR recession',
        startups: 'startup OR venture capital OR Silicon Valley OR IPO OR YC'
      }
    },
    gb: {
      name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}',
      keywords: {
        top: 'stock OR market OR economy OR finance OR Bank of England',
        markets: 'FTSE OR London Stock Exchange OR shares OR AIM',
        crypto: 'bitcoin OR crypto OR FCA OR blockchain UK',
        'personal-finance': 'ISA OR pension OR mortgage OR savings UK',
        economy: 'Bank of England OR inflation OR GDP UK OR sterling',
        startups: 'startup UK OR funding OR fintech OR London tech'
      }
    },
    eu: {
      name: 'Europe', flag: '\u{1F1EA}\u{1F1FA}',
      keywords: {
        top: 'stock OR market OR economy OR ECB OR eurozone',
        markets: 'DAX OR CAC OR Euro Stoxx OR European shares',
        crypto: 'bitcoin OR crypto OR MiCA OR blockchain Europe',
        'personal-finance': 'investing OR savings OR pension Europe',
        economy: 'ECB OR eurozone OR inflation OR GDP Europe',
        startups: 'startup Europe OR funding OR Berlin OR fintech'
      }
    },
    sg: {
      name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}',
      keywords: {
        top: 'stock OR market OR economy OR MAS OR finance Singapore',
        markets: 'SGX OR Straits Times Index OR shares Singapore',
        crypto: 'bitcoin OR crypto OR MAS OR blockchain Singapore',
        'personal-finance': 'CPF OR savings OR investing Singapore',
        economy: 'MAS OR GDP OR economy Singapore OR trade',
        startups: 'startup Singapore OR funding OR fintech Asia'
      }
    },
    ae: {
      name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}',
      keywords: {
        top: 'stock OR market OR economy OR finance OR Dubai',
        markets: 'DFM OR ADX OR Dubai shares OR Gulf market',
        crypto: 'bitcoin OR crypto OR VARA OR blockchain Dubai',
        'personal-finance': 'investing OR savings OR gold OR real estate UAE',
        economy: 'OPEC OR oil OR GDP UAE OR Dubai economy',
        startups: 'startup Dubai OR DIFC OR funding OR fintech UAE'
      }
    },
    jp: {
      name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}',
      keywords: {
        top: 'stock OR market OR economy OR BOJ OR finance Japan',
        markets: 'Nikkei OR Tokyo Stock Exchange OR yen OR shares Japan',
        crypto: 'bitcoin OR crypto OR blockchain Japan',
        'personal-finance': 'investing OR savings OR NISA OR pension Japan',
        economy: 'BOJ OR GDP OR inflation OR yen OR trade Japan',
        startups: 'startup Japan OR funding OR Tokyo tech'
      }
    },
    au: {
      name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}',
      keywords: {
        top: 'stock OR market OR economy OR RBA OR finance Australia',
        markets: 'ASX OR Australian shares OR mining stocks',
        crypto: 'bitcoin OR crypto OR blockchain Australia',
        'personal-finance': 'superannuation OR investing OR mortgage Australia',
        economy: 'RBA OR GDP OR inflation OR housing Australia',
        startups: 'startup Australia OR funding OR fintech'
      }
    },
    ca: {
      name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}',
      keywords: {
        top: 'stock OR market OR economy OR Bank of Canada OR finance',
        markets: 'TSX OR Canadian stocks OR shares OR mining',
        crypto: 'bitcoin OR crypto OR blockchain Canada',
        'personal-finance': 'TFSA OR RRSP OR investing OR mortgage Canada',
        economy: 'Bank of Canada OR GDP OR inflation OR oil Canada',
        startups: 'startup Canada OR funding OR Toronto tech'
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
