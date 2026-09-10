# Fantasy League History

A Next.js + TypeScript app for tracking historical fantasy football league records.

## MVP Architecture

The first version is intentionally simple:

- `src/lib/domain` defines the normalized league model.
- `src/lib/data` holds fake/manual sample data and, later, import adapters.
- `src/lib/stats` calculates league records separately from the UI.
- `src/app` renders the dashboard.

Core entities:

- Managers
- Seasons
- Teams
- Weeks
- Matchups
- Scores

## Data Plan

This project starts with sample data so the records engine can be proven before any real import work.

Next data milestones:

1. Inspect the old Excel workbook.
2. Map workbook columns into the normalized league model.
3. Validate imported totals against known league records.
4. Add manual correction tools for messy historical data.
5. Add Sleeper API ingestion after the historical model is stable.

## Local Commands

```bash
npm run dev
```

```bash
npm run lint
```

```bash
npm run test
```

```bash
npm run build
```

## Current Status

- Next.js app scaffold is created.
- Project-specific `AGENTS.md` is in place.
- Sample league data exists.
- Initial stats engine and tests exist.
- The home page renders a league records dashboard from the stats engine.
