// Financial jargon hover definitions — scans news cards and adds tooltips
var FinPulse = window.FinPulse || {};

FinPulse.Jargon = {
  terms: {
    'bull market': 'A market where prices are rising or expected to rise',
    'bear market': 'A market where prices are falling 20%+ from recent highs',
    'IPO': 'Initial Public Offering \u2014 when a company first sells shares to the public',
    'ETF': 'Exchange-Traded Fund \u2014 a basket of stocks/bonds traded like a single stock',
    'P/E ratio': 'Price-to-Earnings \u2014 stock price divided by earnings per share',
    'market cap': 'Total value of a company\u2019s shares (price \u00D7 total shares)',
    'dividend': 'A portion of company profits paid to shareholders',
    'bond': 'A loan you give to a government or company in exchange for interest',
    'yield': 'The income return on an investment, usually expressed as a percentage',
    'inflation': 'The rate at which prices for goods and services increase over time',
    'GDP': 'Gross Domestic Product \u2014 total value of goods and services produced by a country',
    'recession': 'Two consecutive quarters of declining GDP',
    'Fed': 'The Federal Reserve \u2014 the US central bank that sets interest rates',
    'RBI': 'Reserve Bank of India \u2014 India\u2019s central bank',
    'ECB': 'European Central Bank \u2014 manages the euro and EU monetary policy',
    'QE': 'Quantitative Easing \u2014 central bank buys bonds to inject money into the economy',
    'hedge fund': 'A private investment fund using advanced strategies for high returns',
    'mutual fund': 'A pool of money from many investors, managed by a professional',
    'SIP': 'Systematic Investment Plan \u2014 investing a fixed amount regularly in mutual funds',
    'Sensex': 'BSE Sensex \u2014 index of 30 largest companies on Bombay Stock Exchange',
    'Nifty': 'Nifty 50 \u2014 index of 50 largest companies on National Stock Exchange of India',
    'S&P 500': 'Index of 500 largest US companies, a key benchmark for the US market',
    'NASDAQ': 'US stock exchange focused on technology companies',
    'blue chip': 'Large, well-established, financially sound company',
    'volatility': 'How much and how quickly prices change \u2014 high volatility means big swings',
    'liquidity': 'How easily an asset can be bought or sold without affecting its price',
    'short selling': 'Borrowing shares to sell now, hoping to buy back cheaper later',
    'margin': 'Borrowing money from a broker to buy investments',
    'futures': 'A contract to buy/sell an asset at a predetermined price on a future date',
    'options': 'A contract giving the right (not obligation) to buy/sell at a set price',
    'cryptocurrency': 'Digital currency using cryptography, operating without a central bank',
    'blockchain': 'A distributed ledger technology \u2014 the backbone of cryptocurrencies',
    'DeFi': 'Decentralized Finance \u2014 financial services built on blockchain without banks',
    'stablecoin': 'A cryptocurrency pegged to a stable asset like the US dollar',
    'forex': 'Foreign Exchange \u2014 the global market for trading currencies',
    'EBITDA': 'Earnings Before Interest, Taxes, Depreciation, and Amortization \u2014 a profit measure',
    'ROI': 'Return on Investment \u2014 profit relative to the cost of the investment',
    'portfolio': 'A collection of investments held by a person or organization',
    'asset allocation': 'Dividing investments among different categories like stocks, bonds, cash',
    'diversification': 'Spreading investments across different assets to reduce risk',
    'index fund': 'A fund that tracks a market index like S&P 500 \u2014 low cost, passive investing',
    'venture capital': 'Funding given to startups in exchange for equity',
    'private equity': 'Investments in companies that are not publicly traded',
    'fintech': 'Financial Technology \u2014 tech-driven innovation in financial services',
    'SPAC': 'Special Purpose Acquisition Company \u2014 a shell company that takes startups public',
    'ESG': 'Environmental, Social, Governance \u2014 criteria for socially responsible investing',
    'NPA': 'Non-Performing Asset \u2014 a loan where the borrower has stopped paying',
    'basis points': 'One hundredth of a percentage point (50 bps = 0.50%)',
    'quantitative tightening': 'Central bank reducing money supply by selling bonds',
    'yield curve': 'Graph showing interest rates across different bond maturities',
    'market correction': 'A decline of 10%+ from recent highs, less severe than a crash',
    'dead cat bounce': 'A brief recovery in a declining market before it continues falling',
    'dovish': 'Favoring lower interest rates and looser monetary policy',
    'hawkish': 'Favoring higher interest rates and tighter monetary policy',
    'stagflation': 'Stagnant economic growth combined with high inflation'
  },

  // Scan rendered news cards and wrap matching terms with tooltip spans
  enhance() {
    const cards = document.querySelectorAll('.news-card-title, .news-card-tldr');
    // Sort terms longest-first to prevent partial matches (e.g. "bull market" before "bull")
    const sorted = Object.keys(this.terms).sort((a, b) => b.length - a.length);

    cards.forEach(el => {
      let html = el.innerHTML;
      // Skip elements already processed to avoid double-wrapping
      if (html.includes('jargon-term')) return;

      sorted.forEach(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        // Encode tooltip text to prevent HTML injection from definitions
        const tooltip = this.terms[term].replace(/"/g, '&quot;');
        html = html.replace(regex, `<span class="jargon-term" data-tooltip="${tooltip}">$1</span>`);
      });
      el.innerHTML = html;
    });
  },

  // Create floating tooltip element + attach event delegation
  init() {
    // Guard against double-init
    if (document.getElementById('jargon-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'jargon-tooltip';
    tooltip.className = 'jargon-tooltip';
    document.body.appendChild(tooltip);

    // Event delegation — single listener pair covers all current + future jargon terms
    document.body.addEventListener('mouseover', (e) => {
      if (!e.target.classList.contains('jargon-term')) return;
      tooltip.textContent = e.target.dataset.tooltip;
      tooltip.style.display = 'block';

      const rect = e.target.getBoundingClientRect();
      const tooltipWidth = tooltip.offsetWidth;

      // Keep tooltip within viewport horizontally
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${rect.bottom + 6}px`;
    });

    document.body.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('jargon-term')) {
        tooltip.style.display = 'none';
      }
    });
  }
};

window.FinPulse = FinPulse;
