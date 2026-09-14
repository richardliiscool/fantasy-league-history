# ESPN Import Plan

This is the first ESPN checkpoint. It is intentionally read-only: fetch ESPN data, inspect the shape, and archive the raw JSON locally before changing the app data.

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

## Next Mapping Step

After the preview works, the next task is to map ESPN's data into the same app shape as the workbook import:

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

## Safety Notes

ESPN cookies expire. If the script starts returning an authorization error, sign into ESPN again and refresh the cookie values locally.

The script uses repeated `view=` query parameters because ESPN treats those differently from comma-joined view lists.
