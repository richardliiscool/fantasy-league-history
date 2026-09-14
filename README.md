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

The archived Excel workbooks are the authoritative source for 2015-2022 historical league data. ESPN is the source for the imported 2023 and 2024 seasons. Sleeper is the source for the imported 2025 season and future post-ESPN seasons.

Next data milestones:

1. Keep validating imported totals against known league records.
2. Use the local ESPN and Sleeper snapshots to refine imported season details as needed.
3. Keep 2026 Sleeper data in preview mode while the season is still in progress.
4. Add a repeatable current-season refresh flow after the historical model is stable.

Financial tracking is intentionally out of scope for this app.

## Historical Data

The real historical data is generated into `src/lib/data/historicalLeagueData.ts`. That generated file is app-shaped data and should not be edited by hand.

The raw `.xlsx` archive files in `reference/workbooks` are ignored by Git so they stay local unless explicitly approved for sharing.

The raw ESPN JSON archives in `reference/espn/raw` are also ignored by Git. They are local reference files only; the committed app uses the generated TypeScript data file.

Historical ESPN team names are saved in `scripts/espn_team_manager_map.json` and applied during generation. The workbook remains the source for 2015-2022 scores, while ESPN supplies the display team names for those seasons.

Raw Sleeper JSON archives in `reference/sleeper/raw` are ignored by Git. The committed app uses the generated TypeScript data file, while `scripts/sleeper_manager_map.json` maps Sleeper owners back to the app's manager IDs. Completed Sleeper seasons can be merged into the generated data; in-progress seasons are intentionally skipped.

The homepage uses the generated historical data for the first real all-time leaderboard. The smaller sample data file remains useful for tiny unit tests.

## ESPN Import

ESPN data is handled in two steps: preview/fetch the private league data locally, then regenerate the committed app-shaped data.

```bash
python3 scripts/preview_espn_import.py --season 2023 --season 2024
```

```bash
python3 scripts/generate_historical_data.py
```

Private ESPN league credentials belong only in `.env.local`, based on `.env.example`. The preview script can save raw ESPN JSON under `reference/espn/raw`, which is ignored by Git. The generator reads those local snapshots and maps ESPN team IDs and historical team names through `scripts/espn_team_manager_map.json`. See `docs/espn-import-plan.md` for the workflow.

## Sleeper Import

Sleeper's API is public and read-only. Add `SLEEPER_LEAGUE_ID` to `.env.local`, then preview linked league seasons:

```bash
python3 scripts/preview_sleeper_import.py
```

Use `--save-raw` to archive local responses under `reference/sleeper/raw`. See `docs/sleeper-import-plan.md` for the workflow.

## App Views

- `/` shows the league-wide records dashboard and all-time manager standings.
- `/managers` shows a sortable manager directory with active/inactive status, career stats, podium counts, and profile/compare links.
- `/records` shows the record book with trophy tallies, single-game records, matchup margins, filters, and sortable manager-season stat lines.
- `/head-to-head` compares any two managers with rivalry records, scoring splits, margin records, and a sortable game log. It can accept `?manager=` and `?opponent=` query values for direct comparison links.
- `/head-to-head/matrix` shows a league-wide head-to-head grid where each manager-vs-manager cell links into the detailed rivalry page.
- `/managers/[managerId]` shows an individual manager profile with career totals, season splits, head-to-head records, and recent games.
- `/seasons/[seasonYear]` shows one season at a time with champions/co-champions, final standings, season records, and weekly matchups.

Managers are treated as active when they appear in the latest imported season. Historical managers remain visible but are shown with a softer inactive treatment in tables.

The app uses a shared top navigation bar so the main views stay reachable from every page.

Interactive table filters let the league standings switch between official, regular season, playoff, and consolation results, and let manager/profile tables focus on active or inactive managers. Table headers are clickable for sorting, percentages display in normal percent format, and manager game logs can be filtered by a specific opponent.

Season archive pages are linked from the homepage. They calculate year-specific final standings from the workbook's final placement rows, so special cases like the tied 2022 championship stay represented as real historical data.

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
- League standings and manager profile tables include interactive filters and sortable columns.
- Manager game logs show the first 10 rows and can expand 10 more at a time.
- Manager game logs can filter down to one opponent.
- Season archive pages exist for each imported season from 2015 through 2025.
- Seasons index page exists with a year-by-year podium and last-place table from newest to oldest.
- Season archive pages use workbook finish-order data, including tied finishers when the historical result calls for it, and the final standings table can be sorted by finish, manager, team, records, PF, PA, Avg PF, and Avg PA.
- Season archive pages consolidate biggest win/loss into a single biggest-margin game card.
- Closest-game cards and tables ignore tied games, so closest margin means the smallest non-zero margin.
- Records page exists with podium trophy tallies, global filters, top-10 score and margin tables, and sortable manager-season records.
- Head-to-head comparison pages exist for manager rivalries, including score splits, highest-score/closest-game cards, and sortable rivalry game logs.
- Manager directory page exists with sortable career stats, podium counts, active/inactive treatment, and links into manager profiles or head-to-head comparisons.
- Head-to-head matrix page exists with active/all/inactive manager filters, game-scope switching, display modes, color-threshold legend, and clickable rivalry cells.
- ESPN 2023 and 2024 are imported into the generated local app data from ignored raw JSON snapshots.
- Historical ESPN team names are backfilled for 2015 through 2022 without replacing the workbook score data.
- Sleeper 2025 is imported into the generated local app data from ignored raw JSON snapshots.
- Sleeper 2026 raw data can be previewed locally, but it is skipped by the generator while the league is still in season.
