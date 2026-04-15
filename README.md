# FinPulse — Finance News Dashboard

A lightweight Chrome extension that replaces your new tab with a curated, real-time finance news dashboard. Built for retail investors and finance enthusiasts who want to stay informed without switching between multiple news sources.

## Why FinPulse?

Retail investors consume financial news from scattered sources with no signal-to-noise filtering. FinPulse aggregates the top finance stories into a single, clean dashboard — every time you open a new tab.

## Features

### Core
- **New tab replacement** — finance news loads automatically on every new tab
- **Category tabs** — Top Stories, Markets, Crypto, Personal Finance, Economy, Startups
- **Country filter** — auto-detects your region (India, US, UK, EU, Singapore, UAE, Japan, Australia, Canada) or set manually
- **Dark/light theme** — toggle with one click, preference saved across sessions

### Intelligence
- **Daily briefing** — AI-generated "3 things that matter today" summary (works locally without API key)
- **Market mood gauge** — real-time sentiment indicator (Bearish to Bullish) based on aggregate news tone
- **Jargon tooltips** — hover over 50+ financial terms (IPO, P/E ratio, ETF, etc.) for plain-English definitions

### Personalization
- **Watchlist** — add stock/crypto symbols, relevant news gets highlighted
- **Smart ranking** — learns from your clicks and re-orders articles to match your interests
- **Bookmarks** — save articles for later, access them anytime from the header

### Polish
- **Search** — filter articles instantly (press `/` to focus, `Esc` to clear)
- **Responsive** — works on any screen size
- **Zero accounts** — no registration, no login, everything stored locally in your browser

## Setup

1. Get a free API key from [gnews.io](https://gnews.io) (100 requests/day)
2. Open `js/news.js` and replace `YOUR_API_KEY` with your key
3. Open `chrome://extensions/` in Chrome
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked** and select the `finpulse` folder
6. Open a new tab

## Tech Stack

- Vanilla JavaScript (no frameworks, no build step)
- Chrome Manifest V3
- GNews API for news aggregation
- CSS with dark/light theme support
- Chrome Storage API for persistence

## Project Structure

```
finpulse/
├── manifest.json              # Chrome extension config
├── newtab.html                # Main page
├── css/
│   ├── styles.css             # Core layout and themes
│   ├── intelligence.css       # Briefing, mood gauge, jargon tooltips
│   ├── personalization.css    # Watchlist, bookmarks
│   └── polish.css             # Search, highlights
├── js/
│   ├── storage.js             # Chrome storage abstraction
│   ├── country.js             # Country detection and source mapping
│   ├── theme.js               # Dark/light toggle
│   ├── news.js                # GNews API integration with caching
│   ├── briefing.js            # Daily briefing generator
│   ├── sentiment.js           # Market mood analysis
│   ├── jargon.js              # Financial term dictionary
│   ├── search.js              # Client-side article search
│   ├── watchlist.js           # Stock/crypto watchlist
│   ├── preferences.js         # Click-based personalization
│   ├── bookmarks.js           # Save articles for later
│   └── app.js                 # Main controller
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT
