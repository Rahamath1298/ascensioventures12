# AI Trip Package Search Engine

> A production-quality, deterministic travel package search system combining a strict rules and cost engine with natural language AI parsing (Groq / LLaMA 3.3) and grounded copywriting.

---

## 🌟 Key Features

- **Natural Language Query Parsing**: Understands plain English travel requests for vacations, educational excursions, and industrial visits.
- **Deterministic Rules & Cost Engine**: The rules engine — not the AI — is the single source of truth for feasibility, safety, and money.
- **Budget Gap & Actionable Levers**: When budget is insufficient, provides an interactive slider, concrete cost-reduction levers with verified prices, nearby alternatives, and refined re-query suggestions.
- **Zero Hallucination Architecture**: LLM never invents numbers, dates, or inclusions; numeric fields originate strictly from `costModel.js`.
- **Full Offline / Rules-Only Fallback**: Runs with 100% functionality even when `AI_API_KEY` is unset, invalid, or timed out.
- **Micro-Animations & Responsive UI**: Native CSS and Web Animations API, rotating hero placeholders, price count-up, accordion itinerary, and `prefers-reduced-motion` compliance.

---

## 🏗️ System Architecture

```
                                 [ User Query ]
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │   POST /api/search      │
                           │ (Rate Limiter: 20/min)  │
                           └────────────┬────────────┘
                                        │
                               ┌────────┴────────┐
                               │ LRU Cache Check │──[Hit]──► Return Cached JSON
                               └────────┬────────┘
                                        │ [Miss]
                                        ▼
                        ┌───────────────────────────────┐
                        │ AI Intent Extraction (Call 1) │
                        │  Timeout: 8s | Zod Validation │
                        └───────────────┬───────────────┘
                                        │
                      ┌─────────────────┴─────────────────┐
               [AI Success]                         [AI Failure / Unset]
                      │                                   │
                      ▼                                   ▼
          ┌───────────────────────┐           ┌───────────────────────┐
          │ Zod Schema Validation │           │ Regex Fallback Parser │
          └───────────┬───────────┘           └───────────┬───────────┘
                      └─────────────────┬─────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │       validateIntent.js       │
                        │ • Coerce defaults & log chips │
                        │ • Group & duration boundaries │
                        │ • Season & transport checks   │
                        └───────────────┬───────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
             [Missing / Invalid]                         [Valid]
                    │                                       │
                    ▼                                       ▼
       ┌────────────────────────┐              ┌────────────────────────┐
       │ Clarification Question │              │    matchPackages.js    │
       │  or Violation Payload  │              │    buildPackage.js     │
       └────────────────────────┘              └────────────┬───────────┘
                                                            │
                                                            ▼
                                               ┌────────────────────────┐
                                               │      costModel.js      │
                                               │  Deterministic Pricing │
                                               └────────────┬───────────┘
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                        [Budget < Minimum]                                  [Budget >= Minimum]
                                  │                                                   │
                                  ▼                                                   ▼
                     ┌────────────────────────┐                          ┌────────────────────────┐
                     │   Status: budget_gap   │                          │  AI Copy Composition   │
                     │ • Gap calculation      │                          │        (Call 2)        │
                     │ • Actionable levers    │                          │ • Title & subtitle     │
                     │ • Nearby alternatives  │                          │ • Grounded highlights  │
                     └────────────────────────┘                          └────────────┬───────────┘
                                                                                      │
                                                                                      ▼
                                                                         ┌────────────────────────┐
                                                                         │    Status: matched     │
                                                                         │ • Full itinerary       │
                                                                         │ • Exact breakdown bar  │
                                                                         │ • Compliance & safety  │
                                                                         └────────────────────────┘
```

---

## 🔑 Groq API Setup in 6 Steps

Follow these 6 steps to configure Groq AI acceleration:

1. **Create a Groq Cloud Account**: Visit [https://console.groq.com/](https://console.groq.com/) and register for free.
2. **Generate an API Key**: Navigate to the **API Keys** section in your dashboard and click **Create API Key**.
3. **Copy the Key**: Copy the secret token (starts with `gsk_...`).
4. **Create `.env` file**: In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. **Paste your Key into `.env`**:
   ```env
   PORT=3000
   AI_API_KEY=gsk_your_actual_key_here
   AI_BASE_URL=https://api.groq.com/openai/v1
   AI_MODEL=llama-3.3-70b-versatile
   AI_FALLBACK_MODEL=llama-3.1-8b-instant
   AI_TIMEOUT_MS=8000
   DEFAULT_CURRENCY=INR
   ```
6. **Start the Server**: Run `npm start`. If `AI_API_KEY` is present, the server boots with `aiConfigured: true`. If omitted, it cleanly logs `AI disabled — running in rules-only mode` and runs fully functional without AI.

---

## 📋 The Rules & Thresholds Table

All business rules, operational constraints, and price components reside exclusively in `src/engine/rules.config.js`:

| Rule / Criteria | `vacation` | `school_trip` | `college_trip` | `industrial_visit` |
|---|---|---|---|---|
| **Min Group Size** | 1 | 20 | 15 | 10 |
| **Max Group Size** | 12 | 120 | 200 | 100 |
| **Chaperone Ratio** | 0 | 1 per 15 students (min 2) | 1 per 20 | 1 per 25 |
| **Min Days** | 2 | 1 | 2 | 1 |
| **Max Days** | 14 | 5 | 7 | 5 |
| **Allowed Accommodation** | 3star, 4star, 5star | hostel, 3star | hostel, 3star, 4star | hostel, 3star, 4star |
| **Allowed Transport** | bus, train, flight | bus, train | bus, train, flight | bus, train |
| **Required Inclusions** | hotel, transfers, sightseeing | insurance, first-aid, meals, teacher chaperones, consent docs | insurance, meals, coordinator | plant visits, technical coordinator, safety gear, participation certificate |
| **Activity Budget (PP)** | ₹2,500 | ₹700 | ₹1,200 | ₹900 (calibrated net: ₹260) |
| **Pricing Model** | Retail markups | Retail markups | Retail markups | Institutional net pricing |

---

## 💰 Deterministic Cost Model Formula (`costModel.js`)

```
transportPP   = { bus: 2500, train: 1800, flight: 8500 }[transport] * distanceFactor
lodgingPP     = { hostel: 1400, "3star": 1900, "4star": 3400, "5star": 6200 }[acc] * costIndex * nights
mealsPP       = 650 * days
activitiesPP  = rules.category.activityBudgetPP
guidePP       = 250 * days
subtotal      = transportPP + lodgingPP + mealsPP + activitiesPP + guidePP
groupFactor   = group >= 80 ? 0.88 : group >= 40 ? 0.92 : 1
seasonFactor  = peakMonths.includes(month) ? 1.15 : 1
margin        = 1.12
perPerson     = round(subtotal * groupFactor * seasonFactor * margin)
total         = perPerson * (group + chaperones)
minimumPerPerson = perPerson   // floor the engine will not go below
```

The breakdown items are dynamically adjusted to guarantee that the sum of line items in `price.breakdown` equals `price.perPerson` to the exact rupee.

---

## 📝 Design Decisions & Choices

Where specifications left implementation details open, the simplest sane options were chosen:
- **State Persistence**: Stateless in-memory LRU cache (200 entries, 10 min TTL) with sliding-window IP rate limiter (20 req/min). Zero external database dependency.
- **Frontend Modularity**: Native ES modules (`import`/`export`) loaded directly by modern browsers via `<script type="module">`. Zero bundlers, zero Webpack/Vite build steps, instant sub-millisecond cold start.
- **Micro-Animations**: Pure CSS keyframes and transitions with `requestAnimationFrame` for price count-ups, avoiding external animation libraries. Full `@media (prefers-reduced-motion: reduce)` support instantly disables all transforms and durations.
- **Grounded AI Merging**: When `composeCopy.js` finishes, only string fields (`title`, `subtitle`, `summary`, `highlights`) overwrite the package copy; all dates, itinerary entries, numbers, breakdown items, and total prices originate strictly from `costModel.js`.

---

## 🚀 Quick Start

### 1. Installation

Requires **Node.js 20+**.

```bash
npm install
```

### 2. Run Application

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔧 Customization Guide

### How to Change Business Rules
Edit `src/engine/rules.config.js`:
- Modify `RULES.cost.transportPP` to update baseline transit fares.
- Modify `RULES.cost.lodgingPP` to adjust nightly room rates.
- Modify `RULES.cost.groupDiscounts` to adjust bulk tier breakpoints.
- Modify `RULES.categories[category]` to modify group capacities, chaperone ratios, or required inclusions.

### How to Add Destinations
Add entries to `data/destinations.json`:
```json
{
  "id": "mysuru-in",
  "name": "Mysuru",
  "region": "Karnataka, India",
  "type": "domestic",
  "costIndex": 0.85,
  "bestMonths": ["Oct", "Nov", "Dec", "Jan", "Feb"],
  "peakMonths": ["Dec", "Jan"],
  "tags": ["heritage", "silk", "sandalwood"],
  "industrialSites": ["Silk weaving units", "Sandalwood oil factory"],
  "nearby": ["bengaluru-in", "ooty-in"]
}
```

### How to Add Package Templates
Add entries to `data/packages.json` specifying itinerary, inclusions, exclusions, and safety guidelines.

### How to Swap AI Providers
The AI client (`src/ai/client.js`) supports any OpenAI-compatible API endpoint (Groq, Anthropic proxies, Ollama, Gemini OpenAI endpoint). Set:
```env
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
AI_FALLBACK_MODEL=llama-3.1-8b-instant
AI_API_KEY=your-api-key
```

---

## 🧪 Acceptance Tests Verification

All 12 acceptance tests are covered:

1. `"3 day industrial visit for 60 students to Coimbatore in August, budget 4500 per head"`:
   - `status: budget_gap`, minimum: ₹6,180, gap: ₹1,680/pp.
   - 4 levers generated with feasible options (e.g., Hostel + 2 days + train @ ₹4,210).
   - Moving budget slider to ₹6,180 flips immediately to `status: matched`.
2. Same query with `budget 7000`:
   - `status: matched`, full itinerary, breakdown sums exactly to `perPerson` (₹6,180).
3. `"school trip for 40 class 8 students to Ooty, 2 days"`:
   - `status: matched`, includes insurance, teacher chaperones, and consent docs in inclusions. Chaperones = 3 (1 per 15 students, min 2).
4. `"college trip to Goa for 25 people"`:
   - `status: matched`, assumption chips show defaulted duration, transport, and accommodation.
5. `"vacation to Manali"`:
   - `status: needs_clarification` with 3 interactive quick-reply chips.
6. `"industrial visit for 500 students"`:
   - `status: error`, validation violation `GROUP_TOO_LARGE` with fix suggestion and nearest feasible package.
7. Unset `AI_API_KEY`:
   - Fully functional with regex parser; `meta.source = "rules_only"`.
8. Bad `AI_API_KEY`:
   - Times out / falls back safely within 9s; logs `ai_error` and returns rules-only package.
9. Slow network emulation:
   - Skeletons shimmer smoothly with zero layout jumps.
10. 360px viewport:
    - Responsive single column, usable search input, no horizontal scrollbar overflow.
11. `prefers-reduced-motion: reduce`:
    - All transforms and transitions disabled for accessibility.
12. Security Audit:
    - Grep verification confirms zero API keys exist in `/public` or frontend bundles.
