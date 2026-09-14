# Sleeper Import Plan

Sleeper is the source for the post-ESPN era seasons. The API is public, read-only, and does not require an auth token.

## What Sleeper Needs

The preview script needs a Sleeper league ID:

```bash
SLEEPER_LEAGUE_ID=123456789
```

You can usually find it in a Sleeper league URL. Put it in `.env.local` or pass it directly with `--league-id`.

## Current Checkpoint

The 2025 Sleeper season is imported into `src/lib/data/historicalLeagueData.ts` from a local raw snapshot. The 2026 Sleeper league has also been previewed and archived locally, but the generator skips it because Sleeper reports the league as in season.

The current manager mapping lives in `scripts/sleeper_manager_map.json`. The only mapping that should be double-checked by a human is `pattergoat -> Billy Kim`, because that one was inferred from the Sleeper username/team context rather than an obvious full name.

## Preview Command

Preview the current league and prior seasons linked through Sleeper's `previous_league_id` chain:

```bash
python3 scripts/preview_sleeper_import.py
```

Preview specific seasons:

```bash
python3 scripts/preview_sleeper_import.py --season 2025 --season 2026
```

Save local raw responses for later mapping:

```bash
python3 scripts/preview_sleeper_import.py --season 2025 --season 2026 --save-raw
```

Raw Sleeper JSON archives are written to `reference/sleeper/raw` and ignored by Git.

Regenerate the committed app-shaped data after saving raw snapshots or updating the manager map:

```bash
python3 scripts/generate_historical_data.py
```

## What The Preview Checks

The preview reports:

- league name, season, status, and previous league ID
- roster count and user count
- playoff week and playoff team count when Sleeper returns them
- roster positions
- completed weekly matchup counts
- playoff bracket row counts
- sample roster/owner/team-name rows

## Mapping Plan

Sleeper data should map into the same normalized app shape:

```text
Sleeper league + users + rosters + weekly matchups + brackets
  -> managers
  -> season teams
  -> weeks
  -> matchups
  -> scores
  -> final standings
  -> generated LeagueData
```

The first review step is mapping Sleeper `owner_id` / `roster_id` values back to the app's existing manager IDs.

The second review step is playoff placement. Sleeper provides winners and losers bracket rows, but we should validate final standings against the league page before merging them into the app.

The generator only imports completed Sleeper leagues. This keeps current-season partial data out of the official historical dashboards until we deliberately add a current-season view.

## Safety Notes

Sleeper needs no cookie and no token for this read-only API. The league ID is not a secret, but raw archives still stay local by default.
