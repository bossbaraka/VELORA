# VELORA — verification report

Date: 30 September 2026. Local optimized production build, Chromium. This is a portfolio frontend, not a live brokerage service.

## Build and automated logic

- `npm run build`: passed; locale routes statically generated where appropriate.
- `npm run typecheck`: passed with strict TypeScript.
- `npm test`: **24 / 24 passed**.
- `npm audit --omit=dev`: **zero known production dependency vulnerabilities** at verification time. PostCSS and Sharp use patched overrides. Development-only audit findings are disclosed in README and retained in `qa/audit-full.json`.

Unit coverage: Arabic normalization, Indic digits, Arabic/English number words, three acceptance search phrases, partial understanding, exact-result filtering, nearest alternatives, weighted scores, top contributing criteria, evidence labels, availability overrides, both-direction comparison, real travel deltas, currency, square-foot conversion, dictionary parity, inventory completeness, night-data availability and zero-bedroom filtering.

## Browser journeys

`qa/check-core.cjs` passed:
- EN and AR search, dynamic results and removable parsed criteria.
- No-results state and closest alternatives.
- Save three, reload, preserve shortlist; exactly-three comparison prompt.
- Compare 2–3, prevent a fourth with a visible message; all comparison fields and two-way differences.
- Material tabs; form errors focus the invalid control; valid demo submission shows the explicit no-submission notice.
- All requested home widths **320, 375, 390, 430, 768, 1024, 1280, 1440, 1920**, in both EN and AR: no horizontal document overflow.
- Full-screen mobile navigation and Escape dismissal.
- No captured uncaught page errors.

`qa/check-enhanced.cjs` passed:
- Day/evening toggle exists only with night images; generated imagery disclaimer shown.
- Architecture mode hides secondary information and restores it on exit.
- Private inventory does not expose the ordinary detail hero.
- Language switch preserves route and query intent.
- Keyboard Enter opens an overlay with reduced motion; Escape restores the originating card's focus.
- Native dialog, collection kept underneath, standalone direct detail URL tested.
- Return-visit suggestions and dismissal tested separately.
- No captured uncaught page errors.

## Accessibility

Axe WCAG 2 A/AA and 2.1 AA automated checks across **eight page types in both languages** (Home, Collection, Residence, Contact, Journal, Services, Story, Advisors): **zero violations**. Final Home Lighthouse accessibility: **100 / 100** for both locales.

This does not certify full WCAG compliance. Screen-reader testing, real-device testing, browser zoom, and Safari/Firefox validation should precede a commercial launch. Keyboard and reduced-motion workflows were exercised in Chromium.

## Lighthouse — final build

Mobile simulated profile; production server; audits run sequentially. Raw reports are in `qa/lighthouse-final-en.json` and `qa/lighthouse-final-ar.json`.

| Locale | Performance | Accessibility | Best Practices | LCP |
|---|---:|---:|---:|---:|
| English | 95 | 100 | 96 | 2.45 s |
| Arabic | 95 | 100 | 96 | 2.78 s |

The ≥90 category targets are met. **The strict <2.5s LCP target is met in the final English run, but not the final Arabic run.** Earlier isolated runs reached 2.1s for both languages; that is not reported as consistent final compliance. Server CPU, font/render timing and lab variance affect results. Further Arabic critical-render optimization remains open. No field-performance guarantee is made.

## Deliberate limits / design decisions

- Custom cursor omitted; native pointer is clearer and accessible.
- First-paint content is not hidden behind a lengthy animation. Hero motion is a restrained transform reveal rather than a full opaque-to-visible sequence.
- Scroll effects use transform only and are reduced/disabled for reduced motion and modal contexts.
- SVG floor plans are generic concept diagrams, not exact property-specific construction drawings.
- Property photography and material detail crops are placeholders. Evening images are openly labelled generated atmosphere studies.
- Private collection is a presentation state, not authenticated authorization. Dataset is public, by design.
- Local enquiry mock never sends/stores personal information. Success explicitly explains that no real advisor will contact the visitor.
- The code/data/visual result is suitable as a deployable portfolio prototype; confidential data, real inventory and real enquiries require appropriate backend, consent, authorization and operational work.
