# ESPN Import Plan

This doc tracks the ESPN import path. The first checkpoint was read-only: fetch ESPN data, inspect the shape, and archive the raw JSON locally before changing the app data. The current checkpoint imports the saved 2023 and 2024 ESPN snapshots into the generated app data.

## What ESPN Needs

For a private ESPN league, the local script needs:

- `ESPN_LEAGUE_ID`: the number in the ESPN fantasy URL.
- `ESPN_SWID`: ESPN session cookie.
- `ESPN_S2`: ESPN session cookie.

Do not paste `ESPN_SWID` or `ESPN_S2` into chat or commit them to GitHub. They belong in `.env.local`, which is ignored by Git.

## Local Setup

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
ESPN_LEAGUE_ID=123456789
ESPN_SWID="{your-swid-cookie}"
ESPN_S2="your-espn-s2-cookie"
```

## Preview Command

Fetch and summarize 2023 and 2024:

```bash
python3 scripts/preview_espn_import.py --season 2023 --season 2024
```

Fetch, summarize, and archive the raw ESPN responses locally:

```bash
python3 scripts/preview_espn_import.py --season 2023 --season 2024 --save-raw
```

Raw ESPN JSON archives are written to `reference/espn/raw` and ignored by Git.

## Generate App Data

After raw snapshots exist locally, regenerate the app-shaped data:

```bash
python3 scripts/generate_historical_data.py
```

The generator reads:

- Excel workbook history from `reference/workbooks`
- ESPN raw snapshots from `reference/espn/raw`
- ESPN team-to-manager mappings and historical team names from `scripts/espn_team_manager_map.json`

The output is committed to `src/lib/data/historicalLeagueData.ts`. The private raw ESPN responses stay local and ignored.

## What The Preview Checks

The preview reports:

- league name
- team count
- member count
- schedule row count
- completed matchup count
- matchup period range
- playoff team count
- a few sample teams
- a few sample matchup rows

## Current Mapping

ESPN's data is mapped into the same app shape as the workbook import:

```text
ESPN teams + schedule rows
  -> managers
  -> season teams
  -> weeks
  -> matchups
  -> scores
  -> generated LeagueData
```

The key review step will be matching ESPN team IDs and owner/member IDs back to the existing manager IDs in `src/lib/data/historicalLeagueData.ts`.

For the current local snapshots:

- 2023 champion: Albert Feeny
- 2024 champion: Tony Zheng
- 2024 runner-up: Richard Li
- Nolan Feeny appears as a new manager in 2024.

The raw ESPN schedule includes two bye/placeholder rows per season. The generator skips those rows and imports the 101 completed matchup rows for each season.

The same mapping file also backfills ESPN team names for 2015-2022 while preserving the workbook as the score/stat source for those seasons.

## Safety Notes

ESPN cookies expire. If the script starts returning an authorization error, sign into ESPN again and refresh the cookie values locally.

The script uses repeated `view=` query parameters because ESPN treats those differently from comma-joined view lists.
