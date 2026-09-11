#!/usr/bin/env python3
"""Generate normalized TypeScript seed data from the Fantasy History workbook."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from preview_workbook_import import DEFAULT_WORKBOOK, parse_workbook, summarize


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = PROJECT_ROOT / "src" / "lib" / "data" / "historicalLeagueData.ts"
SOURCE_SHEET = "Game Log"


def slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not cleaned:
        raise ValueError(f"Could not create id slug for {value!r}")
    return cleaned


def read_owner_order(workbook_path: Path, raw_manager_names: set[str]) -> list[str]:
    workbook = load_workbook(workbook_path, data_only=True, read_only=True)
    if "Owner ID" not in workbook.sheetnames:
        return sorted(raw_manager_names)

    sheet = workbook["Owner ID"]
    owner_order: list[str] = []
    seen: set[str] = set()

    for row in sheet.iter_rows(min_row=2, max_col=2, values_only=True):
        owner = row[1]
        if not isinstance(owner, str):
            continue

        normalized = owner.strip()
        if normalized and normalized in raw_manager_names and normalized not in seen:
            owner_order.append(normalized)
            seen.add(normalized)

    for manager in sorted(raw_manager_names - seen):
        owner_order.append(manager)

    return owner_order


def build_historical_data(workbook_path: Path) -> dict[str, Any]:
    records, issues = parse_workbook(workbook_path)
    if issues:
        issue_text = "\n".join(f"- {issue}" for issue in issues[:25])
        raise ValueError(f"Workbook has parse issues:\n{issue_text}")

    summary = summarize(records, issues)
    failed = [item for item in summary["validations"] if item["status"] != "OK"]
    if failed:
        detail = "\n".join(f"- {item['name']}: {item['detail']}" for item in failed)
        raise ValueError(f"Workbook failed validation:\n{detail}")

    raw_manager_names = {record.team1 for record in records} | {record.team2 for record in records}
    owner_order = read_owner_order(workbook_path, raw_manager_names)
    manager_ids = {name: f"manager-{slug(name)}" for name in owner_order}

    years = sorted({record.season for record in records})
    managers = [{"id": manager_ids[name], "displayName": name} for name in owner_order]
    seasons = [
        {"id": f"season-{year}", "year": year, "label": f"{year} Season"}
        for year in years
    ]

    season_team_names: dict[int, set[str]] = defaultdict(set)
    week_numbers: dict[int, set[int]] = defaultdict(set)
    for record in records:
        season_team_names[record.season].update([record.team1, record.team2])
        week_numbers[record.season].add(record.week)

    teams = []
    for year in years:
        for manager_name in owner_order:
            if manager_name not in season_team_names[year]:
                continue
            teams.append(
                {
                    "id": f"team-{year}-{slug(manager_name)}",
                    "seasonId": f"season-{year}",
                    "managerId": manager_ids[manager_name],
                    "name": manager_name,
                }
            )

    weeks = []
    for year in years:
        for week_number in sorted(week_numbers[year]):
            weeks.append(
                {
                    "id": f"week-{year}-{week_number}",
                    "seasonId": f"season-{year}",
                    "number": week_number,
                    "label": f"Week {week_number}",
                }
            )

    matchup_sequence: dict[tuple[int, int], int] = defaultdict(int)
    matchups = []
    for record in records:
        key = (record.season, record.week)
        matchup_sequence[key] += 1
        sequence = matchup_sequence[key]
        matchups.append(
            {
                "id": f"matchup-{record.season}-w{record.week:02d}-{sequence:02d}",
                "seasonId": f"season-{record.season}",
                "weekId": f"week-{record.season}-{record.week}",
                "gameType": record.game_type,
                "isFinalSeedingGame": record.final_seeding_game,
                "source": {
                    "workbook": workbook_path.name,
                    "sheet": SOURCE_SHEET,
                    "rowNumber": record.row_number,
                },
                "scores": [
                    {
                        "teamId": f"team-{record.season}-{slug(record.team1)}",
                        "points": record.team1_score,
                    },
                    {
                        "teamId": f"team-{record.season}-{slug(record.team2)}",
                        "points": record.team2_score,
                    },
                ],
            }
        )

    return {
        "managers": managers,
        "seasons": seasons,
        "teams": teams,
        "weeks": weeks,
        "matchups": matchups,
    }


def build_import_summary(data: dict[str, Any], workbook_path: Path) -> dict[str, Any]:
    game_type_counts = defaultdict(int)
    final_seeding_counts = defaultdict(int)
    season_matchup_counts = defaultdict(int)

    for matchup in data["matchups"]:
        year = int(matchup["seasonId"].split("-")[1])
        game_type_counts[matchup["gameType"]] += 1
        season_matchup_counts[year] += 1
        if matchup["isFinalSeedingGame"]:
            final_seeding_counts[year] += 1

    return {
        "sourceWorkbook": workbook_path.name,
        "sourceSheet": SOURCE_SHEET,
        "matchupRows": len(data["matchups"]),
        "managerCount": len(data["managers"]),
        "seasonCount": len(data["seasons"]),
        "teamEntries": len(data["teams"]),
        "weekEntries": len(data["weeks"]),
        "gameTypeCounts": dict(sorted(game_type_counts.items())),
        "seasonMatchupCounts": dict(sorted(season_matchup_counts.items())),
        "seasonFinalSeedingCounts": dict(sorted(final_seeding_counts.items())),
    }


def to_typescript(data: dict[str, Any], import_summary: dict[str, Any]) -> str:
    data_json = json.dumps(data, indent=2, ensure_ascii=False)
    summary_json = json.dumps(import_summary, indent=2, ensure_ascii=False)
    return (
        "import type { LeagueData } from \"../domain/types\";\n\n"
        "// Generated by scripts/generate_historical_data.py. Do not edit by hand.\n"
        "// Source of truth: reference/workbooks/Fantasy History.xlsx, Game Log columns I:R.\n"
        f"export const historicalImportSummary = {summary_json} as const;\n\n"
        f"export const historicalLeagueData = {data_json} satisfies LeagueData;\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate historical league seed data from the workbook.")
    parser.add_argument("workbook", nargs="?", default=DEFAULT_WORKBOOK, type=Path)
    parser.add_argument("--output", default=DEFAULT_OUTPUT, type=Path)
    args = parser.parse_args()

    workbook_path = args.workbook.expanduser().resolve()
    output_path = args.output.expanduser().resolve()

    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found: {workbook_path}")

    data = build_historical_data(workbook_path)
    import_summary = build_import_summary(data, workbook_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(to_typescript(data, import_summary))

    print(f"Generated {output_path}")
    print(f"Matchups: {import_summary['matchupRows']}")
    print(f"Managers: {import_summary['managerCount']}")
    print(f"Seasons: {import_summary['seasonCount']}")
    print(f"Teams: {import_summary['teamEntries']}")
    print(f"Weeks: {import_summary['weekEntries']}")
    print(f"Game types: {import_summary['gameTypeCounts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
