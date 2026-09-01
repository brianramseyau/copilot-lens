# Contributing

## Before You Start

- Use Node.js 22 or newer.
- Run `npm install` after cloning.
- Read [AGENTS.md](./AGENTS.md) for architecture and behavioral invariants.
- Never commit real files from `data/usage/` or `data/cost/`.

## Development

```bash
npm run dev
```

Keep changes focused and follow existing Svelte 5, TypeScript, Chart.js, and
Lucide patterns. When changing a metric or chart, update both the live report
and `src/lib/export/htmlExport.ts` so exported reports remain equivalent.

## Validation

Before opening a pull request, run:

```bash
npm run check
npm run build
```

For visual changes, test both desktop and mobile widths, light and dark viewing
modes, print output, and the light-mode HTML export where applicable.

## Pull Requests

Describe the behavior changed, the validation performed, and any methodology or
data assumptions. Screenshots must use synthetic or redacted data. Do not paste
signed report URLs, usernames, IDs, token totals, or cost exports into issues,
pull requests, CI logs, or screenshots.
