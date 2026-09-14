#!/usr/bin/env python3
"""Read-only preview of Sleeper fantasy football data.

Sleeper's API is public and read-only. This script inspects league seasons,
users, rosters, weekly matchup scores, and playoff brackets without changing
app data. Use --save-raw to archive responses locally for later mapping.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILES = [PROJECT_ROOT / ".env.local", PROJECT_ROOT / ".env"]
DEFAULT_RAW_OUTPUT_DIR = PROJECT_ROOT / "reference" / "sleeper" / "raw"
DEFAULT_BASE_URL = "https://api.sleeper.app/v1"
DEFAULT_WEEK_RANGE = range(1, 19)


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


def require_league_id(args: argparse.Namespace) -> str:
    league_id = args.league_id or os.getenv("SLEEPER_LEAGUE_ID", "")

    if not league_id:
        raise ValueError(
            "Missing Sleeper league ID. Add SLEEPER_LEAGUE_ID to .env.local "
            "or pass --league-id."
        )

    return league_id


def fetch_sleeper_json(base_url: str, path: str, timeout: int) -> Any:
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "fantasy-league-history-local-import/0.1",
        },
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Sleeper returned HTTP {error.code}: {body}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach Sleeper: {error.reason}") from error


def fetch_league(base_url: str, league_id: str, timeout: int) -> dict[str, Any]:
    payload = fetch_sleeper_json(base_url, f"league/{league_id}", timeout)

    if not isinstance(payload, dict) or not payload.get("league_id"):
        raise RuntimeError(f"Sleeper did not return a league for id {league_id}.")

    return payload


def collect_league_chain(
    base_url: str,
    starting_league_id: str,
    max_depth: int,
    timeout: int,
) -> list[dict[str, Any]]:
    leagues: list[dict[str, Any]] = []
    seen_league_ids: set[str] = set()
    next_league_id: str | None = starting_league_id

    while next_league_id and len(leagues) < max_depth:
        if next_league_id in seen_league_ids:
            break

        seen_league_ids.add(next_league_id)
        league = fetch_league(base_url, next_league_id, timeout)
        leagues.append(league)
        previous_league_id = league.get("previous_league_id")
        next_league_id = (
            previous_league_id
            if isinstance(previous_league_id, str) and previous_league_id
            else None
        )

    return leagues


def user_name(user: dict[str, Any] | None) -> str:
    if not isinstance(user, dict):
        return "Unknown User"

    display_name = user.get("display_name")
    username = user.get("username")

    if isinstance(display_name, str) and display_name.strip():
        return display_name.strip()

    if isinstance(username, str) and username.strip():
        return username.strip()

    return "Unknown User"


def user_team_name(user: dict[str, Any] | None) -> str | None:
    if not isinstance(user, dict):
        return None

    metadata = user.get("metadata")
    if not isinstance(metadata, dict):
        return None

    team_name = metadata.get("team_name")

    return team_name.strip() if isinstance(team_name, str) and team_name.strip() else None


def roster_team_name(
    roster: dict[str, Any],
    user_by_id: dict[str, dict[str, Any]],
) -> str:
    owner_id = roster.get("owner_id")
    user = user_by_id.get(owner_id) if isinstance(owner_id, str) else None
    metadata = roster.get("metadata")

    if isinstance(metadata, dict):
        for key in ("team_name", "nickname"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return user_team_name(user) or user_name(user)


def is_completed_matchup_entry(entry: dict[str, Any]) -> bool:
    matchup_id = entry.get("matchup_id")
    points = score_for_matchup_entry(entry)

    return isinstance(matchup_id, int) and isinstance(points, (int, float))


def score_for_matchup_entry(entry: dict[str, Any]) -> float | int | None:
    custom_points = entry.get("custom_points")

    if isinstance(custom_points, (int, float)):
        return custom_points

    points = entry.get("points")

    return points if isinstance(points, (int, float)) else None


def completed_week_cutoff(league: dict[str, Any]) -> int | None:
    settings = league.get("settings")
    leg = settings.get("leg") if isinstance(settings, dict) else None
    status = league.get("status")

    if not isinstance(leg, int):
        return None if status == "complete" else 0

    if status == "complete":
        return leg

    if status == "in_season":
        return max(0, leg - 1)

    return 0


def summarize_matchups(
    league: dict[str, Any],
    matchups_by_week: dict[int, list[dict[str, Any]]],
) -> dict[str, Any]:
    completed_matchup_count = 0
    completed_weeks: list[int] = []
    cutoff_week = completed_week_cutoff(league)
    team_entries = 0
    sample_matchups: list[dict[str, Any]] = []

    for week, entries in sorted(matchups_by_week.items()):
        if not entries:
            continue

        if cutoff_week is not None and week > cutoff_week:
            team_entries += len(entries)
            continue

        grouped_entries: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for entry in entries:
            if not isinstance(entry, dict):
                continue

            team_entries += 1

            if is_completed_matchup_entry(entry):
                grouped_entries[int(entry["matchup_id"])].append(entry)

        week_completed_count = 0
        for matchup_id, matchup_entries in sorted(grouped_entries.items()):
            if len(matchup_entries) != 2:
                continue

            week_completed_count += 1
            if len(sample_matchups) < 5:
                first, second = matchup_entries
                sample_matchups.append(
                    {
                        "week": week,
                        "matchupId": matchup_id,
                        "firstRosterId": first.get("roster_id"),
                        "firstPoints": score_for_matchup_entry(first),
                        "secondRosterId": second.get("roster_id"),
                        "secondPoints": score_for_matchup_entry(second),
                    }
                )

        if week_completed_count > 0:
            completed_weeks.append(week)
            completed_matchup_count += week_completed_count

    return {
        "teamEntries": team_entries,
        "completedMatchups": completed_matchup_count,
        "completedWeeks": completed_weeks,
        "completedWeekCutoff": cutoff_week,
        "sampleMatchups": sample_matchups,
    }


def fetch_league_payload(
    base_url: str,
    league: dict[str, Any],
    weeks: list[int],
    timeout: int,
) -> dict[str, Any]:
    league_id = str(league["league_id"])
    users = fetch_sleeper_json(base_url, f"league/{league_id}/users", timeout)
    rosters = fetch_sleeper_json(base_url, f"league/{league_id}/rosters", timeout)
    winners_bracket = fetch_sleeper_json(
        base_url,
        f"league/{league_id}/winners_bracket",
        timeout,
    )
    losers_bracket = fetch_sleeper_json(
        base_url,
        f"league/{league_id}/losers_bracket",
        timeout,
    )
    matchups_by_week = {
        str(week): fetch_sleeper_json(
            base_url,
            f"league/{league_id}/matchups/{week}",
            timeout,
        )
        for week in weeks
    }

    return {
        "league": league,
        "users": users if isinstance(users, list) else [],
        "rosters": rosters if isinstance(rosters, list) else [],
        "winnersBracket": winners_bracket if isinstance(winners_bracket, list) else [],
        "losersBracket": losers_bracket if isinstance(losers_bracket, list) else [],
        "matchupsByWeek": matchups_by_week,
    }


def summarize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    league = payload["league"]
    users = payload["users"]
    rosters = payload["rosters"]
    user_by_id = {
        user["user_id"]: user
        for user in users
        if isinstance(user, dict) and isinstance(user.get("user_id"), str)
    }
    matchups_by_week = {
        int(week): entries
        for week, entries in payload["matchupsByWeek"].items()
        if isinstance(entries, list)
    }
    matchup_summary = summarize_matchups(league, matchups_by_week)

    return {
        "season": league.get("season"),
        "leagueId": league.get("league_id"),
        "leagueName": league.get("name"),
        "status": league.get("status"),
        "previousLeagueId": league.get("previous_league_id"),
        "totalRosters": league.get("total_rosters"),
        "rosterCount": len(rosters),
        "userCount": len(users),
        "playoffWeekStart": league.get("settings", {}).get("playoff_week_start")
        if isinstance(league.get("settings"), dict)
        else None,
        "playoffTeams": league.get("settings", {}).get("playoff_teams")
        if isinstance(league.get("settings"), dict)
        else None,
        "rosterPositions": league.get("roster_positions"),
        "matchups": matchup_summary,
        "winnersBracketRows": len(payload["winnersBracket"]),
        "losersBracketRows": len(payload["losersBracket"]),
        "sampleTeams": [
            {
                "rosterId": roster.get("roster_id"),
                "ownerId": roster.get("owner_id"),
                "ownerName": user_name(
                    user_by_id.get(roster.get("owner_id"))
                    if isinstance(roster.get("owner_id"), str)
                    else None
                ),
                "teamName": roster_team_name(roster, user_by_id),
            }
            for roster in rosters[:5]
            if isinstance(roster, dict)
        ],
    }


def save_raw_payload(payload: dict[str, Any], output_dir: Path) -> Path:
    league = payload["league"]
    season = league.get("season", "unknown-season")
    league_id = league.get("league_id", "unknown-league")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"sleeper-ffl-{season}-{league_id}.json"
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True))

    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview Sleeper fantasy football season data without changing app data."
    )
    parser.add_argument(
        "--league-id",
        default=None,
        help="Sleeper league ID. Defaults to SLEEPER_LEAGUE_ID in .env.local.",
    )
    parser.add_argument(
        "--season",
        action="append",
        default=None,
        help="Season year to include from the league chain. Repeat for multiple seasons.",
    )
    parser.add_argument(
        "--week",
        action="append",
        type=int,
        default=None,
        help="Week to fetch. Repeat for multiple weeks. Defaults to weeks 1-18.",
    )
    parser.add_argument(
        "--chain-depth",
        type=int,
        default=4,
        help="How many previous_league_id links to follow from the starting league.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Sleeper API base URL.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="HTTP timeout in seconds.",
    )
    parser.add_argument(
        "--save-raw",
        action="store_true",
        help="Save raw Sleeper JSON under reference/sleeper/raw.",
    )
    parser.add_argument(
        "--raw-output-dir",
        default=DEFAULT_RAW_OUTPUT_DIR,
        type=Path,
        help="Directory for saved raw JSON when --save-raw is used.",
    )

    return parser.parse_args()


def main() -> int:
    load_local_env()
    args = parse_args()

    try:
        league_id = require_league_id(args)
        requested_seasons = set(args.season or [])
        weeks = args.week or list(DEFAULT_WEEK_RANGE)
        leagues = collect_league_chain(
            args.base_url,
            league_id,
            max(1, args.chain_depth),
            args.timeout,
        )
        filtered_leagues = [
            league
            for league in leagues
            if not requested_seasons or str(league.get("season")) in requested_seasons
        ]

        if not filtered_leagues:
            available = ", ".join(str(league.get("season")) for league in leagues)
            raise ValueError(
                f"No requested seasons found in Sleeper league chain. Available: {available}"
            )

        summaries: list[dict[str, Any]] = []
        saved_paths: list[str] = []

        for league in filtered_leagues:
            payload = fetch_league_payload(args.base_url, league, weeks, args.timeout)
            summaries.append(summarize_payload(payload))

            if args.save_raw:
                saved_paths.append(str(save_raw_payload(payload, args.raw_output_dir)))

        print(json.dumps({"summaries": summaries, "savedRawFiles": saved_paths}, indent=2))
        return 0
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
