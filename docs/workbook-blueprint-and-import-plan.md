# Workbook Blueprint and Import Plan

This note captures what the Excel workbooks mean for the app. It is a planning document only. The historical data is authoritative and should be preserved exactly.

## Source files

Local archival copies:

- `reference/workbooks/Fantasy History.xlsx`
- `reference/workbooks/Fantasy History Original Format (2015-2022).xlsx`

The workbooks are reference sources for the app. Their formulas are a blueprint for expected behavior, but the app should not copy cell formulas directly.

## Data preservation rules

- Treat the manually collected historical scores, teams, managers, weeks, and game types as the source of truth.
- Do not hand-enter historical matchup rows into code.
- Import raw matchup rows mechanically from the workbook and keep the import repeatable.
- Keep an untouched workbook archive in the repo folder or another approved archive location.
- Validate imports with row counts, season counts, manager counts, and known record/stat spot checks.
- Do not commit or push the workbook archives to GitHub until Richard explicitly approves it.

## Workbook architecture

The workbook is organized around one core input table and many derived views.

Core input:

- `Game Log`
- Manual/raw columns: `Year`, `Week`, `Team 1`, `Team 2`, `Team 1 Score`, `Team 2 Score`, `Reg. Season`, `Playoffs`, `Consolation`, `Final Seeding Game`, `Team 1 Finish`, `Team 2 Finish`
- These columns are the data backbone for the app.

Derived/helper areas:

- `Game Log` helper columns calculate outcome, matchup IDs, week IDs, ranking helpers, margins, totals, and weekly vs-league results.
- `Quick Matchup Reference` normalizes head-to-head pairings.
- `Owner ID` lists managers and supports matchup lookup logic.
- `Team Calcs.` supports the selected team profile view.

User-facing workbook views:

- `All-Time Stats`
- `End of Year Standings`
- `Team Inquiry`
- `H2H Inquiry`
- `H2H Matrix`
- `Regular Season Records`
- `Playoff Records`

Old workbook-only views, kept only for archival context:

- `Financial Calcs.`
- `Financial Tracker`
- `Current Season Financial Tracke`
- `Current Season Payouts`

Financial tracking should not be implemented in this app.

## Important data facts found so far

- The two workbooks contain the same raw matchup rows in `Game Log`.
- There are 779 historical matchup rows from 2015 through 2022.
- There are 16 historical managers/owners in the data.
- Each season has 12 teams.
- Season formats vary:
  - 2015 uses weeks 1-17.
  - 2016-2020 use weeks 1-16.
  - 2021-2022 use weeks 1-17.
- The app should not assume every season has the same number of weeks.

## Proposed app data model

Keep the app centered on these entities:

- `Manager`: a real person/owner, with stable identity across seasons.
- `Season`: a year, with its own week structure and rules.
- `SeasonTeam`: a manager's team entry for a specific season.
- `Week`: a season/week plus type information.
- `Matchup`: the raw head-to-head game record.
- `MatchupSide`: one manager/team's score and result inside a matchup.

Later additions:

- `Player`
- `RosterSlot`
- `PlayerScore`
- `SleeperLeague`
- `SleeperRoster`

Those later tables can attach to the same season/week/matchup structure without changing the historical score backbone.

## Proposed stats engine modules

The stats engine should live outside the UI and calculate views from raw data.

Suggested modules:

- `importWorkbook`: reads Excel rows into normalized app records.
- `normalizeMatchups`: turns each workbook row into a safe internal matchup shape.
- `deriveMatchupSides`: creates one row per team per matchup.
- `calculateStandings`: regular season, playoff, and season summary standings.
- `calculateAllTimeStats`: wins, losses, ties, win percentage, points for, points against, games, seasons.
- `calculateTeamProfile`: best/worst seasons, playoff appearances, titles, Sacko appearances, high/low weeks, streaks.
- `calculateHeadToHead`: selected team-vs-team records and matrix data.
- `calculateRecords`: highest/lowest scores, largest/smallest margins, game totals, fewest points in wins, most points in losses.

## Import milestone plan

### Milestone 1: Read-only import preview

Build a script that reads the archived workbook and prints a preview:

- number of matchup rows imported
- seasons found
- managers found
- per-season row counts
- per-season regular/playoff/consolation/final-seeding counts
- a few sample rows

This script should not modify app data yet.

### Milestone 2: Generate normalized seed data

Convert the raw workbook rows into a generated local data file, likely JSON or TypeScript.

The generated data should include:

- managers
- seasons
- season teams
- matchups
- matchup type flags

This should be generated from the workbook, not manually typed.

### Milestone 3: Validate the import

Add automated checks that compare imported data against known workbook facts:

- 779 matchup rows
- 2015-2022 seasons
- 16 managers
- 12 teams per season
- season-specific row counts
- known sample games

### Milestone 4: Rebuild stats in TypeScript

Implement workbook-inspired calculations in code:

- all-time stats
- standings by season
- team profile summaries
- head-to-head records
- records pages
- streaks
- weekly vs-league stats

Start with a few workbook-known examples as tests.

### Milestone 5: Connect the UI to imported data

Replace the current tiny fake sample data with the imported historical data.

Initial screens:

- league overview
- all-time leaderboard
- season selector
- manager profile
- records page

### Milestone 6: Future Sleeper integration

After the historical app works from the Excel data, add Sleeper API import as a separate layer.

Sleeper can later provide:

- automated future matchup imports
- team names and roster IDs
- player-level weekly scoring
- lineups and player stats

## Current import checkpoint

The first generated historical data file now exists at `src/lib/data/historicalLeagueData.ts`. It was generated from `Fantasy History.xlsx` and includes managers, seasons, season-team entries, weeks, matchups, scores, game types, final-seeding markers, and workbook source-row references.

Validation currently confirms:

- 779 matchup rows
- 16 managers
- 8 seasons
- 96 season-team entries
- 131 week entries
- 636 regular season matchups
- 41 playoff matchups
- 102 consolation matchups
- 1 final-seeding marker per season

## Approval checkpoint

Before implementation, Richard should approve:

- using `Fantasy History.xlsx` as the primary import source
- keeping `Fantasy History Original Format (2015-2022).xlsx` as backup/archive reference
- generating normalized local seed data from the workbook
- leaving player-level data out of the first import
- leaving financial tracking out permanently
- keeping workbook files local unless explicitly approved for GitHub
