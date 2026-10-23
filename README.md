# FactInfoLive – World-Class Global News, Sports & Science Intelligence Platform

FactInfoLive is an editorial-grade, full-stack international intelligence platform engineered to deliver verified world news, real-time sports fixtures and scores, astrophysics discoveries, and dialectical research synthesis with complete source transparency.

Built on a strict **€0 operating budget**, FactInfoLive uses authenticated open-access APIs, authorized wire RSS syndication, public research repositories, and Google Gemini 3.8 Flash.

---

## 🌟 Key Features

1. **Authentic Multi-Provider News Integration Layer**:
   - **The Guardian Open Platform**: Authenticated API adapter with automatic fallback to official Guardian Open RSS feeds.
   - **BBC World & Science Wire**: Real-time broadcast and wire dispatches across World, Science, Business, and Technology.
   - **NASA Space & Earth Sciences**: Direct press release telemetry from NASA Goddard & Space Telescope Science Institute.
   - **World Health Organization (WHO)**: Official disease surveillance, outbreak reports, and global health declarations.
   - **GDELT Project 2.0**: Global news monitoring across broadcast, print, and web wire services in over 100 languages.

2. **Live Sports Engine**:
   - Dedicated scoreboard for confirmed live matches with real game clock, period indicators, and official match center links.
   - Upcoming fixtures across Football (Premier League, Champions League), Cricket (ICC, IPL), Basketball (NBA, EuroLeague), Tennis (ATP/WTA), Formula 1, and more.
   - Standings tables with points, wins, losses, and goal differentials.
   - Multi-sport filtering across 10+ athletic disciplines.

3. **"Ask FactInfoLive AI" Research Intelligence Assistant**:
   - Powered by Google Gemini 3.8 Flash running in a secure server-side runtime (`@google/genai`).
   - Retrieves live wire context and sports databases before synthesizing answers.
   - Dialectical perspective breakdown (presents competing political, scientific, or economic viewpoints).
   - Explicit primary source citations with working external URLs.
   - Confidence scoring, limitations disclosure, and medical/legal disclaimers.

4. **Multilingual & RTL Support**:
   - Full native interface localization in **English**, **Italian**, **French**, **Spanish**, **German**, **Urdu**, and **Arabic**.
   - Automatic Right-to-Left (RTL) layout switching for Urdu and Arabic.

5. **Editorial Independence & Fact Checking**:
   - Zero-pill metadata design complying with modern editorial standards.
   - Anti-fabrication guarantee: never fabricates unconfirmed scores or synthetic articles.
   - Dedicated Fact Checks department debunking viral claims with satellite and institutional telemetry.
   - Transparent Provider Health & Status panel (`/api/sources/status`).

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express, `fast-xml-parser`, `@google/genai`.
- **Typographic System**: Playfair Display (editorial serif headlines), Plus Jakarta Sans (clean reading prose), JetBrains Mono (tabular numerals for scores and timestamps).
- **SEO & Structured Data**: OpenGraph, Twitter Cards, Schema.org `NewsMediaOrganization` JSON-LD, `robots.txt`, and dynamic `sitemap.xml`.

```
├── server.ts                       # Express server mounting APIs and Vite middlewares
├── server/
│   └── services/
│       ├── types.ts                # Normalized schemas (NewsItem, SportsFixture, etc.)
│       ├── cache.ts                # In-memory cache with TTL & request deduplication
│       ├── newsService.ts          # Multi-provider news integration & RSS parser
│       ├── sportsService.ts        # Modular live sports engine & standings
│       ├── aiService.ts            # Server-side Gemini 3.8 Flash research assistant
│       └── statusService.ts        # Provider health monitoring & transparency
├── src/
│   ├── App.tsx                     # Core application layout & view state
│   ├── index.css                   # Tailwind v4 styles, fonts & RTL adjustments
│   ├── data/
│   │   └── categories.ts           # Complete index of all 42 categories
│   ├── i18n/
│   │   └── translations.ts         # Multilingual translations (en, it, fr, es, de, ur, ar)
│   └── components/
│       ├── Header.tsx              # Top Bar Contract, Breaking Ticker, Nav
│       ├── LeadStory.tsx           # 2-column editorial hero lead story
│       ├── LiveSportsCenter.tsx    # Live matches, upcoming fixtures, standings
│       ├── NewsGrid.tsx            # 3-tier news dispatches with zero-broken-image fallback
│       ├── AskAiPanel.tsx          # Interactive Gemini 3.8 research assistant
│       ├── ArticleModal.tsx        # Reading modal with full attribution
│       ├── SearchModal.tsx         # Global search modal across news & sports
│       ├── ProviderStatusModal.tsx # Live source health & €0 budget transparency
│       ├── EditorialPolicyView.tsx # Journalistic charter & corrections policy
│       ├── CategoryView.tsx        # Reusable category template for all 42 topics
│       ├── AllTopicsModal.tsx      # Directory modal of all 42 topics
│       └── Footer.tsx              # Broadsheet footer & legal attribution
```

---

## ⚙️ Configuration & Secrets

FactInfoLive operates fully on free open data out-of-the-box. Optional provider keys can be added to unlock additional features:

| Variable | Required | Description | Free Registration Link |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recommended | Powers Gemini 3.8 Flash research assistant | [Google AI Studio](https://aistudio.google.com) |
| `GUARDIAN_API_KEY` | Optional | Guardian Open Platform API key (RSS fallback is active by default) | [Guardian Open Platform](https://open-platform.theguardian.com/access/) |
| `APP_URL` | Optional | Public application base URL for sitemap & canonical links | Injected automatically in Cloud Run |
| `PORT` | Optional | Server port (default: 3000) | N/A |

> **Security Note**: Never expose API keys to the browser. Keys must only be configured in **Google AI Studio Settings → Secrets** or server `.env`.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment example:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the platform.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📜 Free-Tier Operating Strategy

FactInfoLive costs **€0** to run:
- **Hosting**: Google AI Studio / Google Cloud Run free tier.
- **Intelligence**: Gemini 3.8 Flash free tier with rate-limit dampening and response caching.
- **Wire Feeds**: Public wire RSS and GDELT 2.0 Doc API (no fee).
- **Sports Data**: TheSportsDB free platform API and open sports federations.
- **Zero Paid Subscriptions**: No paid plans required.
