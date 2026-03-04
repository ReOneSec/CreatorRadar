# 🎯 CreatorRadar

**High-performance YouTube micro-influencer scouting & campaign management platform.**

CreatorRadar automates the entire influencer discovery pipeline — from multi-language YouTube search to AI pitch generation — letting marketers find, score, and manage high-ROI creators without manual grunt work.

---

## ✨ Feature Overview

| Module | What it does |
|--------|-------------|
| **Discovery Engine** | Multi-language × multi-region parallel YouTube search with global de-duplication |
| **Priority Scoring** | Algorithmic ROI score (0–100) based on engagement, recency, and consistency |
| **Social Enrichment** | Regex-extracts Telegram, Twitter, Instagram, Email, WhatsApp, Website from channel descriptions |
| **AI Query Expansion** | GPT-4o-mini generates country-specific search term variations |
| **AI Pitch Generator** | GPT-4o-mini writes personalised outreach emails (with template fallback) |
| **Campaign Kanban** | Drag-free pipeline: New → Contacted → Negotiating → Partnered |
| **Quota Manager** | Real-time YouTube Data API v3 daily quota tracking (10,000 units) |
| **CSV Export** | One-click export of all creators or a specific campaign |
| **Outreach Templates** | Save reusable message templates per platform (Email / Telegram / Twitter) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router, RSC) |
| Language | **TypeScript** |
| Styling | **Vanilla CSS** with CSS variables (dark glass-morphism design) |
| Database | **Supabase** (PostgreSQL + real-time) |
| External APIs | YouTube Data API v3, OpenAI API (GPT-4o-mini) |
| Streaming | Server-Sent Events (SSE) via `ReadableStream` |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # All authenticated pages (shared layout)
│   │   ├── dashboard/page.tsx    # Mission control — stats, top creators, quick actions
│   │   ├── discover/page.tsx     # Multi-select scouting UI
│   │   ├── campaigns/page.tsx    # Campaign list + Kanban board + pitch generator
│   │   ├── creators/[id]/page.tsx# Full creator profile
│   │   └── settings/page.tsx     # API keys, quota status, outreach templates
│   ├── api/
│   │   ├── search/
│   │   │   ├── route.ts          # Simple POST search (legacy)
│   │   │   └── stream/route.ts   # SSE streaming search engine (primary)
│   │   ├── creators/
│   │   │   ├── route.ts          # GET list (sort/filter/paginate)
│   │   │   └── [id]/route.ts     # GET/PATCH single creator
│   │   ├── campaigns/
│   │   │   ├── route.ts          # GET list + POST create
│   │   │   └── [id]/route.ts     # GET detail / PATCH (add/remove/stage) / DELETE
│   │   ├── pitch/route.ts        # POST → AI outreach pitch generation
│   │   ├── export/route.ts       # GET → CSV download (all or campaign)
│   │   ├── quota/route.ts        # GET → today's quota status
│   │   └── templates/route.ts    # GET list / POST create / DELETE
│   ├── globals.css               # Design system (variables, components, utilities)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
└── lib/
    ├── youtube.ts                # YouTube Data API v3 wrapper
    ├── scoring.ts                # Priority score algorithm
    ├── enrichment.ts             # Social link extractor (regex)
    ├── openai.ts                 # GPT-4o-mini: pitch + query expansion
    ├── quota.ts                  # Quota tracking + budget checks
    ├── supabase.ts               # Supabase client + TypeScript interfaces
    └── utils.ts                  # Shared utilities
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
YOUTUBE_API_KEY=AIza...

# Optional — enables AI features (falls back to templates if absent)
OPENAI_API_KEY=sk-...
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.local.example .env.local   # then fill in your keys

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗄 Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `creators` | Enriched YouTube channel records |
| `campaigns` | Outreach campaign metadata |
| `campaign_creators` | Junction table (campaign ↔ creator, tracks pipeline stage) |
| `searches` | Search audit log (query, filters, result count, quota cost) |
| `quota_usage` | Per-operation API unit tracking |
| `templates` | Saved outreach message templates |

**Creator columns:** `youtube_id`, `name`, `description`, `profile_pic_url`, `subscribers`, `total_views`, `avg_views`, `video_count`, `engagement_rate`, `priority_score`, `upload_frequency`, `telegram`, `twitter`, `instagram`, `email`, `facebook`, `whatsapp`, `website`, `country`, `custom_url`, `last_fetched_at`

**Campaign stages:** `new` → `contacted` → `negotiating` → `partnered`

---

## 🔍 The Discovery Pipeline (Deep Dive)

The core engine lives in `src/app/api/search/stream/route.ts` and streams progress via SSE.

### Step-by-step flow

```
User submits query + languages[] + regions[]
        │
        ▼
① Build (language × region) combination matrix
  e.g. [en/IN, hi/IN, en/BD, hi/BD] = 4 combos
        │
        ▼
② Quota guard: if combos > 5 → error (protect 10k daily limit)
        │
        ▼
③ AI Query Expansion (GPT-4o-mini, optional)
  "Crypto" + "India" → ["Crypto India", "Bitcoin भारत", "DeFi Hindi"]
  Assembled as: "Crypto (Bitcoin भारत | DeFi Hindi)"
        │
        ▼
④ Promise.all() — parallel API calls
  For each combo × each search term:
    ├── searchChannels()       → YouTube search?type=channel  (100 units)
    └── searchChannelsByVideos() → YouTube search?type=video   (100 units)
        │
        ▼
⑤ Global de-duplication
  Merge all results → filter by channelId Set → unique pool (≤200)
        │
        ▼
⑥ Batch channel details
  youtube.channels.list (id=ch1,ch2,...ch50) → 1 unit per 50 channels
        │
        ▼
⑦ JavaScript-side filtering
  Apply minSubs / maxSubs / minViews
  Hidden subscriber counts default → 0
        │
        ▼
⑧ Enrichment + Scoring
  extractSocialLinks() → parse description with regex
  calculatePriorityScore() → engagement (60%) + recency (30%) + consistency (10%)
        │
        ▼
⑨ Persist to Supabase
  Upsert creators (skip if fetched < 24h ago)
  Log search to searches table
        │
        ▼
⑩ Sort by priority_score DESC → stream { step: 'done', creators: [...] }
```

---

## 📊 Priority Score Algorithm

**Score 0–100 = Engagement (60%) + Recency (30%) + Consistency (10%)**

| Component | Formula | Perfect Score |
|-----------|---------|---------------|
| Engagement | `avg_views / subscribers`, scaled to 10% ratio | ≥10% view/sub ratio |
| Recency | Days since last upload, linear 0–60 day decay | ≤3 days since upload |
| Consistency | Uploads per month, scaled to 4/month | ≥4 uploads/month |

Score badges: **70+** = High (green) · **40–69** = Medium (amber) · **<40** = Low (red)

---

## 🌐 Multi-Select Filter System

The Discover page supports selecting **multiple languages × multiple regions** simultaneously.

| Dimension | Type | Values |
|-----------|------|--------|
| Language | ISO 639-1 | `en` (English), `hi` (Hindi), `bn` (Bangla) |
| Region | ISO 3166-1 alpha-2 | `IN`, `BD`, `US`, `PK`, `ID`, and 14 more |

**Quota protection:** Selecting more than **5 total combinations** (language × region) is blocked in both the UI and the server to stay well within the 10,000-unit daily limit.

**Quota cost per search:**
```
combinations × 201 units = e.g. 4 combos × 201 = 804 units
```

---

## 🤖 AI Features

### Query Expansion
- **File:** `src/lib/openai.ts` → `expandSearchQuery()`
- **Model:** GPT-4o-mini
- Generates 3 region-specific search variations (including local language terms)
- Falls back to `"{query} {countryName}"` if OpenAI is not configured

### Outreach Pitch Generator
- **File:** `src/lib/openai.ts` → `generatePitch()`
- **Model:** GPT-4o-mini (`response_format: json_object`)
- Tones: Professional 💼, Casual 😎, Friendly 😊
- Returns `{ subject, pitch }` in <150 words
- Falls back to a built-in template if OpenAI key is absent

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search/stream` | SSE search stream (primary) |
| `POST` | `/api/search` | Simple search (legacy) |
| `GET` | `/api/creators` | List creators (sort / filter / paginate) |
| `GET` | `/api/creators/[id]` | Single creator detail |
| `GET` | `/api/campaigns` | List campaigns with stage counts |
| `POST` | `/api/campaigns` | Create campaign |
| `GET` | `/api/campaigns/[id]` | Campaign detail + creators |
| `PATCH` | `/api/campaigns/[id]` | Add/remove creators, update stage |
| `DELETE` | `/api/campaigns/[id]` | Delete campaign |
| `POST` | `/api/pitch` | Generate AI outreach pitch |
| `GET` | `/api/export` | Download CSV (all creators or by campaignId) |
| `GET` | `/api/quota` | Today's YouTube quota status |
| `GET/POST/DELETE` | `/api/templates` | Outreach template CRUD |

### Search Stream Query Params

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `query` | string | `Crypto` | Main search keyword |
| `languages` | comma CSV | `en,hi` | ISO 639-1 language codes |
| `regions` | comma CSV | `IN,BD` | ISO 3166-1 alpha-2 country codes |
| `minSubs` | number | `10000` | Minimum subscriber count |
| `maxSubs` | number | `500000` | Maximum subscriber count |
| `minViews` | number | `5000` | Minimum average views |

---

## 📦 Social Enrichment Patterns

`src/lib/enrichment.ts` extracts contact handles from YouTube channel descriptions using regex:

| Platform | Example matches |
|----------|----------------|
| Telegram | `t.me/handle`, `telegram: @handle` |
| Twitter/X | `twitter.com/handle`, `x.com/handle` |
| Instagram | `instagram.com/handle`, `ig: handle` |
| Facebook | `facebook.com/page`, `fb.com/page` |
| WhatsApp | `wa.me/+91...`, `whatsapp: +91...` |
| Email | Standard RFC-5322 email pattern |
| Website | Any HTTPS URL that isn't a known social domain |

---

## 💡 YouTube API Quota Reference

| Operation | Cost | Notes |
|-----------|------|-------|
| `search.list` (channel or video) | **100 units** | Per call (up to 50 results) |
| `channels.list` | **1 unit** | Per batch of up to 50 channels |
| `videos.list` | **1 unit** | Per batch of video IDs |

**Daily limit:** 10,000 units (resets midnight Pacific Time)

---

## 🧩 Campaign Pipeline

Campaigns use a 4-stage Kanban board:

```
🆕 New → 📨 Contacted → 🤝 Negotiating → ✅ Partnered
```

From the Campaigns page you can:
- Create / delete campaigns
- Move creators between stages with one click
- Generate an AI pitch directly from the Kanban card
- Export the full pipeline as a CSV file

---

## 🔑 Getting API Keys

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable **YouTube Data API v3**
3. Create an API Key → add to `.env.local` as `YOUTUBE_API_KEY`

### OpenAI (optional)
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create an API key → add to `.env.local` as `OPENAI_API_KEY`
3. Without this key, AI features fall back to built-in templates

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the database migrations to create all required tables

---

## 📜 License

MIT
