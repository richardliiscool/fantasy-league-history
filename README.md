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

This project starts with sample data so the records engine can be proven before any real import work. The archived Excel workbooks are the authoritative source for historical league data.

Next data milestones:

1. Preview the workbook import without changing app data.
2. Map workbook columns into the normalized league model.
3. Validate imported totals against known league records.
4. Generate local seed data from the workbook.
5. Add Sleeper API ingestion after the historical model is stable.

Financial tracking is intentionally out of scope for this app.

## Historical Data

The real historical data is generated from the archived workbook into `src/lib/data/historicalLeagueData.ts`. That generated file is app-shaped data and should not be edited by hand.

The raw `.xlsx` archive files in `reference/workbooks` are ignored by Git so they stay local unless explicitly approved for sharing.

The homepage uses the generated historical data for the first real all-time leaderboard. The smaller sample data file remains useful for tiny unit tests.

## App Views

- `/` shows the league-wide records dashboard and all-time manager standings.
- `/managers/[managerId]` shows an individual manager profile with career totals, season splits, head-to-head records, and recent games.

Managers are treated as active when they appear in the latest imported season. Historical managers remain visible but are shown with a softer inactive treatment in tables.

Interactive table filters let the league standings switch between official, regular season, playoff, and consolation results, and let manager/profile tables focus on active or inactive managers.

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
- Historical workbook data is generated into app-shaped data.
- Initial stats engine and tests exist.
- The home page renders a real league records dashboard from the stats engine.
- Manager profile pages render from the shared stats engine.
- Active/inactive manager status and close-game margin display are handled in the app.
- League standings and manager profile tables include interactive filters.
