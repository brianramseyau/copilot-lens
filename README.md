# GitHub Copilot Usage Report

A local Svelte dashboard that combines GitHub Copilot usage and AI cost exports
into an interactive, printable management report. It runs without a backend or
database service: files are ingested by Vite at build time, and optional browser
imports are cached in IndexedDB.

## Highlights

- Filters every KPI and chart by a shared date range.
- Merges all usage NDJSON files and de-duplicates records by user and day.
- Restricts Enterprise cost exports to usernames present in the usage report.
- Covers adoption, activity, acceptance, model, feature, language, IDE, cost,
  token, and weekend-work metrics.
- Includes cost-to-usage comparisons such as cost per recorded acceptance and
  included versus extra-paid token estimates.
- Provides hover details for charts and fills missing calendar dates with zeroes.
- Supports light and dark viewing modes; exported reports always use light mode.
- Prints to PDF or exports the selected report as an interactive HTML snapshot.

## Requirements

- A recent Node.js release compatible with Vite 8 (Node.js 22 or 24 recommended).
- npm.
- A Chromium-based browser for direct folder access. Other browsers can still
  use ordinary uploads and downloads.

## Setup

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173/`.

Other commands:

```bash
npm run check     # Svelte and TypeScript checks
npm run build     # production bundle in dist/
npm run preview   # preview the production bundle
```

## Data

Place exports in these directories:

```text
data/
├── usage/   # GitHub Copilot organization-user NDJSON exports
└── cost/    # GitHub Enterprise AI usage cost CSV exports
```

All files inside these directories are ignored by Git except `.gitkeep`. This is
intentional: the exports contain usernames and attributable usage/cost data and
must not be committed.

### Usage NDJSON

Every `data/usage/*.ndjson` file is parsed and merged. Duplicate user/day rows
are removed, with the last occurrence winning. Cost filtering depends on the
set of usernames found here.

### Cost CSV

Every `data/cost/*.csv` file is parsed. Enterprise exports may contain several
organizations, so only rows whose `username` occurs in the usage dataset are
used. Other rows are excluded from all calculations.

### Browser imports

The **Import data** menu offers separate actions for:

- Uploading usage NDJSON files.
- Pulling NDJSON from a signed URL.
- Uploading cost CSV files.

Browser imports are stored in IndexedDB for subsequent reloads. Signed report
URLs may be blocked by the remote server's CORS policy; manual download and
upload remains the reliable fallback.

## Reporting Notes

- **Agent Adoption** counts active users with `used_agent` activity.
- **Non-Agent Chat Adoption** counts users of Ask, Plan, Custom, or Inline chat,
  avoiding overlap with agent mode.
- **Included vs Extra-Paid Tokens** is an estimate. Individual tokens are not
  tagged by payment status, so token totals are allocated using each cost row's
  discount-covered versus net-paid cost proportions.
- **Cost / Recorded Acceptance** is directional because chat and agent activity
  can incur cost without producing an acceptance event.
- Highest/lowest cost cards use positive net spend; zero-cost users and models
  are excluded from those rankings.

## Exporting

Use **Export** to:

- Open the browser print dialog and save a PDF.
- Download an interactive HTML snapshot of the current date range.

HTML snapshots always use the light theme. They are single HTML files, but need
internet access when opened so Chart.js and Lucide can load from their CDNs.

## Architecture

- `vite-plugin-copilot-data.ts`: build/dev-time usage and cost ingestion.
- `src/lib/data/`: parsing, de-duplication, filtering, naming, caching, and KPI
  aggregation.
- `src/lib/components/`: KPI, chart, import, and export UI.
- `src/lib/export/htmlExport.ts`: interactive standalone report generation.
- `src/App.svelte`: report composition and shared date filtering.

See [AGENTS.md](./AGENTS.md) for contributor and coding-agent guidance.

## Contributing and Security

Pull requests are checked with `npm run check` and `npm run build` in GitHub
Actions. See [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting changes.

Do not attach usage or cost exports to public issues. Report vulnerabilities as
described in [SECURITY.md](./SECURITY.md).
