#!/usr/bin/env python3
"""Read-only preview of ESPN fantasy football data.

This script fetches ESPN league seasons and prints a compact summary of the
teams, members, settings, and matchup rows ESPN returns. It does not change app
data. Use --save-raw to archive the full ESPN JSON locally for later mapping.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Iterable
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILES = [PROJECT_ROOT / ".env.local", PROJECT_ROOT / ".env"]
DEFAULT_RAW_OUTPUT_DIR = PROJECT_ROOT / "reference" / "espn" / "raw"
DEFAULT_BASE_URL = "https://lm-api-reads.fantasy.espn.com"
DEFAULT_VIEWS = [
    "mTeam",
    "mMatchup",
    "mMatchupScore",
    "mSettings",
    "mStandings",
]


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


def load_local_env() -> None:
    for env_file in DEFAULT_ENV_FILES:
        load_env_file(env_file)


def require_config(args: argparse.Namespace) -> tuple[str, str, str]:
    league_id = args.league_id or os.getenv("ESPN_LEAGUE_ID", "")
    swid = os.getenv("ESPN_SWID", "")
    espn_s2 = os.getenv("ESPN_S2", "")

    missing = [
        label
        for label, value in (
            ("ESPN_LEAGUE_ID", league_id),
            ("ESPN_SWID", swid),
            ("ESPN_S2", espn_s2),
        )
        if not value
    ]
    if missing:
        raise ValueError(
            "Missing ESPN config: "
            + ", ".join(missing)
            + ". Copy .env.example to .env.local and fill in your local values."
        )

    return league_id, swid, espn_s2


def build_url(base_url: str, season: int, league_id: str, views: Iterable[str]) -> str:
    path = f"/apis/v3/games/ffl/seasons/{season}/segments/0/leagues/{league_id}"
    query = urlencode([("view", view) for view in views])

    return f"{base_url.rstrip('/')}{path}?{query}"


def fetch_espn_json(
    url: str,
    swid: str,
    espn_s2: str,
    timeout: int,
) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "Cookie": f"SWID={swid}; espn_s2={espn_s2}",
            "User-Agent": "fantasy-league-history-local-import/0.1",
        },
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")[:500]
        if error.code in (401, 403):
            raise RuntimeError(
                "ESPN rejected the request. The league may be private, the cookies "
                "may be expired, or the league ID may not match this ESPN account."
            ) from error

        raise RuntimeError(f"ESPN returned HTTP {error.code}: {body}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach ESPN: {error.reason}") from error


def team_display_name(team: dict[str, Any]) -> str:
    name = team.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()

    location = team.get("location")
    nickname = team.get("nickname")
    combined = " ".join(
        part.strip()
        for part in (location, nickname)
        if isinstance(part, str) and part.strip()
    )

    return combined or f"Team {team.get('id', 'unknown')}"


def score_for(side: dict[str, Any] | None) -> float | None:
    if not side:
        return None

    value = side.get("totalPoints")
    if isinstance(value, (int, float)):
        return round(float(value), 2)

    return None


def summarize_schedule_row(
    row: dict[str, Any],
    team_names_by_id: dict[int, str],
) -> dict[str, Any]:
    home = row.get("home") if isinstance(row.get("home"), dict) else None
    away = row.get("away") if isinstance(row.get("away"), dict) else None
    home_team_id = home.get("teamId") if home else None
    away_team_id = away.get("teamId") if away else None

    return {
        "matchupPeriodId": row.get("matchupPeriodId"),
        "scoringPeriodId": row.get("scoringPeriodId"),
        "winner": row.get("winner"),
        "playoffTierType": row.get("playoffTierType"),
        "homeTeam": team_names_by_id.get(home_team_id, f"Team {home_team_id}"),
        "awayTeam": team_names_by_id.get(away_team_id, f"Team {away_team_id}"),
        "homeScore": score_for(home),
        "awayScore": score_for(away),
    }


def summarize_payload(season: int, payload: dict[str, Any]) -> dict[str, Any]:
    teams = payload.get("teams") if isinstance(payload.get("teams"), list) else []
    members = payload.get("members") if isinstance(payload.get("members"), list) else []
    schedule = payload.get("schedule") if isinstance(payload.get("schedule"), list) else []
    settings = payload.get("settings") if isinstance(payload.get("settings"), dict) else {}
    scoring_settings = (
        settings.get("scoringSettings")
        if isinstance(settings.get("scoringSettings"), dict)
        else {}
    )
    roster_settings = (
        settings.get("rosterSettings")
        if isinstance(settings.get("rosterSettings"), dict)
        else {}
    )
    team_names_by_id = {
        team["id"]: team_display_name(team)
        for team in teams
        if isinstance(team, dict) and isinstance(team.get("id"), int)
    }
    matchup_periods = sorted(
        {
            row.get("matchupPeriodId")
            for row in schedule
            if isinstance(row, dict) and isinstance(row.get("matchupPeriodId"), int)
        }
    )
    completed_matchups = [
        row
        for row in schedule
        if isinstance(row, dict) and row.get("winner") not in (None, "UNDECIDED")
    ]

    return {
        "season": season,
        "leagueName": settings.get("name"),
        "teamCount": len(teams),
        "memberCount": len(members),
        "scheduleRows": len(schedule),
        "completedScheduleRows": len(completed_matchups),
        "matchupPeriods": {
            "count": len(matchup_periods),
            "first": matchup_periods[0] if matchup_periods else None,
            "last": matchup_periods[-1] if matchup_periods else None,
        },
        "playoffTeamCount": settings.get("scheduleSettings", {}).get(
            "playoffTeamCount"
        )
        if isinstance(settings.get("scheduleSettings"), dict)
        else None,
        "scoringType": scoring_settings.get("scoringType"),
        "rosterPositionCount": len(roster_settings.get("lineupSlotCounts", {}))
        if isinstance(roster_settings.get("lineupSlotCounts"), dict)
        else None,
        "sampleTeams": [
            {"id": team.get("id"), "name": team_display_name(team)}
            for team in teams[:5]
            if isinstance(team, dict)
        ],
        "sampleMatchups": [
            summarize_schedule_row(row, team_names_by_id)
            for row in schedule[:5]
            if isinstance(row, dict)
        ],
    }


def save_raw_payload(season: int, payload: dict[str, Any], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"espn-ffl-{season}.json"
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True))

    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview ESPN fantasy football season data without changing app data."
    )
    parser.add_argument(
        "--season",
        action="append",
        type=int,
        default=None,
        help="Season year to fetch. Repeat for multiple seasons. Defaults to 2023 and 2024.",
    )
    parser.add_argument(
        "--league-id",
        default=None,
        help="ESPN league ID. Defaults to ESPN_LEAGUE_ID in .env.local.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="ESPN fantasy API base URL.",
    )
    parser.add_argument(
        "--view",
        action="append",
        default=None,
        help="ESPN view to request. Repeat for multiple views.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Request timeout in seconds.",
    )
    parser.add_argument(
        "--save-raw",
        action="store_true",
        help="Save full ESPN JSON responses under reference/espn/raw.",
    )
    parser.add_argument(
        "--raw-output-dir",
        type=Path,
        default=DEFAULT_RAW_OUTPUT_DIR,
        help="Directory for raw ESPN JSON archives when --save-raw is used.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_local_env()

    try:
        league_id, swid, espn_s2 = require_config(args)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    seasons = args.season or [2023, 2024]
    views = args.view or DEFAULT_VIEWS
    summaries = []
    raw_outputs = []

    for season in seasons:
        url = build_url(args.base_url, season, league_id, views)
        print(f"Fetching ESPN season {season}...", file=sys.stderr)
        payload = fetch_espn_json(url, swid, espn_s2, args.timeout)
        summaries.append(summarize_payload(season, payload))

        if args.save_raw:
            raw_outputs.append(str(save_raw_payload(season, payload, args.raw_output_dir)))

    print(
        json.dumps(
            {
                "leagueId": league_id,
                "views": views,
                "summaries": summaries,
                "rawOutputs": raw_outputs,
            },
            indent=2,
        )
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
