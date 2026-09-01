# Security Policy

## Supported Versions

Security fixes are applied to the latest version on the `main` branch.

## Reporting a Vulnerability

Use GitHub private vulnerability reporting under **Security > Advisories** when
available. If private reporting is unavailable, contact a repository maintainer
privately before creating a public issue.

Do not include real Copilot exports, signed download URLs, usernames, IDs,
organization details, token totals, or cost records in a public report. Provide
the minimum reproduction necessary and use synthetic or redacted data.

## Data Handling

The application processes data locally. Files under `data/usage/` and
`data/cost/` are intentionally ignored by Git. Browser-imported data is stored
in local IndexedDB and is not uploaded by this application.
