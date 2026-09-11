<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fantasy League History App

## Product Direction

Build a web app for exploring the historical records of a fantasy football league. Keep the early product focused on manual or imported historical data before adding live platform integrations.

The core domain model is:

- Managers
- Seasons
- Teams
- Weeks
- Matchups
- Scores

## Architecture

- Use Next.js App Router with TypeScript.
- Keep route files in `src/app`.
- Keep reusable domain types in `src/lib/domain`.
- Keep source data adapters and fixtures in `src/lib/data`.
- Keep statistics logic in `src/lib/stats`.
- UI components may display calculated values, but should not own the calculations.

## Data Rules

- Start with fake/manual sample data until the stats engine is trustworthy.
- Treat the historical Excel workbooks as authoritative league history. Preserve manually collected teams, scores, managers, weeks, and game types exactly.
- Parse workbook data defensively, then map it into the normalized `LeagueData` shape before running stats.
- Use workbook formulas as a behavior blueprint, not as app implementation.
- Do not add financial tracking features. Financial workbook tabs are archival context only and are out of scope for this app.
- Do not add the Sleeper API until the manual/imported data path and stats calculations are validated.
- Prefer explicit IDs for managers, seasons, teams, weeks, and matchups so historical team-name changes do not break records.

## Testing Rules

- Add focused tests for statistics calculations.
- Prioritize tests around wins, losses, ties, points, highest score, lowest score, biggest win, biggest loss, and close games.
- When fixing a stats bug, add or update a test that would have caught it.

## UX Notes

- The app should feel like a league record book and dashboard, not a landing page.
- Prefer dense, scannable tables and record panels over decorative marketing sections.
- Keep copy grounded in league data and app state.
