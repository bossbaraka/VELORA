# VELORA ESTATES / فيلورا العقارية

A fictional, bilingual architectural real-estate portfolio experience. Built with **Next.js App Router, strict TypeScript, Tailwind CSS 4 and Framer Motion**.

## Run

```sh
npm install
npm run dev       # 0.0.0.0:3000; / redirects to /en
npm test
npm run typecheck
npm run build
npm start
```

Node.js 20.20+ recommended. The build limits Tailwind source discovery and worker concurrency to remain suitable for a small-memory development container. Fonts are bundled locally through `next/font/local`, so builds do not fetch fonts from a third party. The running experience does not require a third-party API.

## Routes

Both `/en` and `/ar` support:
- Home
- `/collection` with shareable query, intent, location, type and bedroom criteria
- `/collection/[slug]` for eight illustrative residences
- `/shortlist`, `/compare`
- `/services`, `/story`, `/advisors`, `/advisor` for the bilingual, catalogue-led consultation
- `/journal`, `/journal/[slug]` for four original bilingual articles
- `/contact` with purpose and property context

## Architecture

| Folder | Responsibility |
|---|---|
| `app/` | Locale-aware layouts, metadata, routes and static params |
| `components/` | Brand chrome, reusable UI, discovery, detail, comparison, forms, intelligence |
| `data/` | Typed-through-access-layer local property/advisor/journal JSON and central image mapping |
| `lib/` | Data-access interface, types, deterministic search, scoring, differences, formatting, simulated enquiries |
| `constants/` | Intent weights, search vocabulary, configuration and editorial selection |
| `i18n/` | EN/AR UI dictionaries with matching keys |
| `motion/` | Duration, easing and reveal definitions |
| `styles/` | Tokens, editorial compositions, responsive and Arabic typography |
| `tests/` | Vitest logic and content-integrity tests |
| `qa/` | Browser verification scripts, audit reports and build output |
| `public/` | Locally served imagery, conceptual plans and brand SVGs |

### Intent, search and comparison

No LLM, remote search, predictions or AI recommendations. Search uses Arabic normalization, number-word recognition and explicit dictionaries. Legacy collection scores are deterministic weighted sums of fictional inventory scores and the selected intent. The advisor below uses a separate, evidence-aware ranking and never reads those illustrative legacy score fields. Comparison differences state the point or minute deltas in the local demo data.

### Catalogue-led advisor

`/advisor` supports primary-home, investment exploration, retreat, family, privacy and open-ended discovery. A deterministic parser updates a typed brief with stated preferences, inferred goal signals and unresolved information, then asks at most one contextual follow-up. Required constraints filter before ranking and are not softened without explicit consent; only public records marked available can be recommended. Each result cites catalogue facts, shows trade-offs or unknowns, and links to the existing detail, shortlist and comparison flows. Reset clears the in-memory conversation.

This is not a live AI service. No LLM, API call or credentials are configured. Prices are illustrative AED asking prices; other currencies are never converted. The fictional catalogue contains no verified rent, yield, operating costs, occupancy, resale or financial-performance data, so the advisor does not make investment or return assessments. English and Arabic/RTL copy are included.

### State and transitions

Shortlist, comparison, recent views, intent and suggestion dismissal are stored under `velora:v3` only after mount. Advisor turns stay in provider memory only and are not written to browser storage; reset clears them. No personal enquiry information is saved. Query state lives in the URL. Language links retain route/query state; persistent preferences survive the language change.

A shared client `LayoutGroup` holds the source collection while a native modal dialog shows the residence. The image has the same `layoutId` in both. Native history updates the address to the real detail route without unmounting the collection. Back/Escape closes the panel and restores the source focus; reloading the detail URL renders a normal standalone page. Modified clicks preserve standard browser navigation. Reduced motion removes the shared transform and uses a fade. Modal content is imported on demand before opening.

### Accessibility

Semantic headings, labelled fields, live feedback, native dialog focus containment, restored focus, keyboard material tabs, tap-accessible details, visible focus, localized content and document direction. Critical operations never depend on hover. The page provides a standard pointer rather than a custom cursor.

## Implemented tiers

**Tier 1:** full IA, intent discovery, bilingual smart search, editorial inventory, contextual cards, detailed residence journey, comparison, shortlist, progressive enquiry/viewing forms, meaningful empty states, responsive RTL and reduced motion.

**Tier 2:** transparent, intent-weighted matches; evidence panels; continuing-exploration suggestions; signature lines; overlay-to-route shared-image transitions; restrained transform-only detail scroll motion.

**Selected Tier 3:** two day/evening studies, architecture-only mode, private collection disclosure, accessible orientation details and animated gallery counters. A custom cursor was intentionally omitted. The home inventory index remains an editorial label rather than an autoplay carousel.

## Honesty and production boundaries

- Fictional brand, advisors, inventory, prices, scores, travel times and locations. Not real property offers.
- Advisors use initials only. No fabricated awards, testimonials or trading history.
- Base imagery uses illustrative Unsplash architecture photography; it does **not** depict the named Dubai/Abu Dhabi listings. See `ASSETS.md`.
- Evening images are generated edits of the daytime placeholders and are labelled in the UI. They are atmosphere studies, not verified photographs.
- Plans are intentionally generic SVG concept diagrams, not to scale or usable for construction. Material images are illustrative detail crops.
- `sendEnquiry()` is an API-shaped mock. It sends nothing. Its success screen prominently says there will be no actual advisor response.
- “Private” is a UX state, not security: local demo JSON is public. A real deployment needs authenticated server-side authorization for confidential inventory.
- The repository includes Chromium-based browser-check scripts. Safari/Firefox and real assistive-technology testing remain recommended before a commercial release; rerun browser checks after UI changes.
- Production dependency audit is clean at build time; development-only Lighthouse/Vitest dependency advisories remain in `qa/audit-full.json`. Review toolchain updates before deploying in a CI environment that accepts untrusted input.

## QA

```sh
npm test
npm run typecheck
npm run build
npm start
# separately, with Playwright Chromium and OS prerequisites installed:
node qa/check-core.cjs
node qa/check-enhanced.cjs
```

Measured Lighthouse results and scope are summarized in `QA.md`. Lab performance varies between runs and is not a field-performance guarantee. All data access functions can later be replaced with a real API without changing the domain utilities.
