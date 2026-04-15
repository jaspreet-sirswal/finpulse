# FinPulse — Finance News Dashboard

A lightweight browser extension that replaces your new tab with a curated, real-time finance news dashboard. Works on **Chrome**, **Edge**, and **Firefox**.

Built for retail investors and finance enthusiasts who want to stay informed without switching between multiple news sources.

## Why FinPulse?

Retail investors consume financial news from scattered sources with no signal-to-noise filtering. FinPulse aggregates the top finance stories into a single, clean dashboard — every time you open a new tab.

## Features

### Core
- **New tab replacement** — finance news loads automatically on every new tab
- **Category tabs** — Top Stories, Markets, Crypto, Personal Finance, Economy, Startups
- **Country filter** — auto-detects your region (India, US, UK, EU, Singapore, UAE, Japan, Australia, Canada) or set manually
- **Dark/light theme** — toggle with one click, preference saved across sessions

### Intelligence
- **Daily briefing** — "3 things that matter today" summary generated from top articles
- **Market mood gauge** — real-time sentiment indicator (Bearish to Bullish) based on aggregate news tone
- **Jargon tooltips** — hover over 50+ financial terms (IPO, P/E ratio, ETF, etc.) for plain-English definitions

### Personalization
- **Watchlist** — add stock/crypto symbols, relevant news gets highlighted
- **Smart ranking** — learns from your clicks and re-orders articles to match your interests
- **Bookmarks** — save articles for later, access them anytime from the header

### Polish
- **Search** — filter articles instantly (press `/` to focus, `Esc` to clear)
- **Fully responsive** — optimized for mobile, tablet, and desktop
- **Zero accounts** — no registration, no login, everything stored locally in your browser

## Install

### From Browser Extension Stores
- **Chrome Web Store** — *coming soon*
- **Edge Add-ons** — *coming soon*
- **Firefox Add-ons** — *coming soon*

### Manual Install (Developer Mode)
1. Clone this repo or download the ZIP
2. Open your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Enable **Developer mode**
4. Click **Load unpacked** (Chrome/Edge) or **Load Temporary Add-on** (Firefox)
5. Select the `finpulse` folder
6. Open a new tab — you'll see the FinPulse onboarding screen

## Setup

FinPulse uses [GNews](https://gnews.io) for news aggregation. You need a free API key:

1. Open FinPulse settings (right-click extension icon → Options)
2. Click **"Get Free API Key"** — creates a free account on gnews.io
3. Paste your API key and click **Save**
4. The key is validated automatically and stored locally in your browser

Free plan: 100 requests/day. FinPulse caches results for 15 minutes, so normal browsing won't hit the limit.

## Tech Stack

- Vanilla JavaScript — no frameworks, no build step, no dependencies
- Manifest V3 — latest extension standard
- GNews API — news aggregation
- CSS — responsive dark/light theme with 4 breakpoints
- Chrome Storage API — local persistence (no server, no accounts)
- Cross-browser — works on Chrome, Edge, and Firefox

## Project Structure

```
finpulse/
├── manifest.json              # Extension config (MV3, cross-browser)
├── newtab.html                # Main dashboard page
├── options.html               # Settings page (API key management)
├── css/
│   ├── styles.css             # Core layout, themes, responsive grid
│   ├── intelligence.css       # Briefing, mood gauge, jargon tooltips
│   ├── personalization.css    # Watchlist, bookmarks
│   └── polish.css             # Search bar, highlights
├── js/
│   ├── storage.js             # Chrome/Firefox storage abstraction
│   ├── country.js             # Country detection and source mapping
│   ├── theme.js               # Dark/light toggle
│   ├── news.js                # GNews API integration with caching
│   ├── briefing.js            # Daily briefing generator
│   ├── sentiment.js           # Market mood analysis
│   ├── jargon.js              # Financial term dictionary (50+ terms)
│   ├── search.js              # Client-side article search
│   ├── watchlist.js           # Stock/crypto watchlist
│   ├── preferences.js         # Click-based personalization
│   ├── bookmarks.js           # Save articles for later
│   ├── options.js             # Settings page logic
│   └── app.js                 # Main controller
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Privacy

- **No data collection** — all preferences stored locally in your browser
- **No analytics** — no tracking scripts, no telemetry
- **No accounts** — no registration required
- **API key stays local** — stored in browser storage, never transmitted to any server other than gnews.io

## License

MIT
