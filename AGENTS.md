# Repository Guidance

## Purpose

This is a local Svelte 5 and TypeScript reporting application for GitHub Copilot
usage NDJSON and Enterprise AI cost CSV exports. It intentionally has no backend
or separate ingestion process.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Before completing code changes, run `npm run check` and `npm run build`. For UI
changes, also inspect the affected desktop and mobile surfaces in a browser.

## Data Safety

- Never commit files from `data/usage/` or `data/cost/`; only `.gitkeep` belongs
  in version control.
- Treat usernames, IDs, token totals, activity, and cost records as sensitive.
- Do not print raw records or signed report URLs in logs or documentation.
- Cost data must remain filtered to usernames present in the usage dataset.
- Keep all processing local unless the user explicitly changes that requirement.

## Architecture

- `vite-plugin-copilot-data.ts` reads `data/usage/*.ndjson` and
  `data/cost/*.csv`, then exposes a typed `virtual:copilot-data` module.
- `src/lib/data/parse.ts` parses and de-duplicates usage rows by `user_id + day`.
- `src/lib/data/csv.ts` parses cost CSV, including UTF-8 BOM handling.
- `src/lib/data/aggregate.ts` owns filtering and metric calculations.
- `src/lib/data/displayNames.ts` owns human-readable model, feature, and language
  labels. Preserve branded punctuation such as `GPT-5.3-Codex`.
- `src/lib/data/uploadStore.ts` and `cache.ts` manage browser-imported files in
  IndexedDB.
- `src/lib/components/` contains report controls, KPI cards, and Chart.js views.
- `src/lib/export/htmlExport.ts` reproduces the report as downloadable HTML.

## Behavioral Invariants

- The selected date range applies to all KPIs and charts.
- Time-series charts include every calendar date, using zeroes for missing days.
- Usage files are de-duplicated before aggregation.
- Enterprise cost rows for unknown usage usernames are excluded.
- Zero-activity categories are not rendered; small positive values are retained.
- Language/model charts do not synthesize an `Other` bucket.
- Adoption metrics use distinct definitions: agent activity versus non-agent
  Ask, Plan, Custom, or Inline chat modes.
- Included/paid token splits are estimates based on discount/net-cost ratios and
  must remain labelled as estimates.
- Highest/lowest cost rankings exclude zero net spend.
- HTML exports always use light mode and should maintain parity with the live
  report's metrics, ordering, icons, and charts.

## Code Style

- Use TypeScript and Svelte 5 runes in components.
- Reuse existing aggregators, display-name helpers, KPI cards, and Chart.js
  wrappers rather than duplicating behavior.
- Use Lucide icons for KPI cards. Custom glyphs should render through Lucide's
  `Icon` component and match its stroke style.
- Keep changes focused and avoid unrelated reformatting.
- Add comments only where behavior or methodology cannot be inferred from code.

## Adding Metrics

1. Calculate the metric in `src/lib/data/aggregate.ts`.
2. Render it in `src/App.svelte` using the existing components.
3. Add equivalent data and rendering to `src/lib/export/htmlExport.ts`.
4. Confirm date filtering, cost-user filtering, dark mode, light export mode,
   print layout, and hover details remain correct.
