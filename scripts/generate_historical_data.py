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
DEFAULT_ESPN_RAW_DIR = PROJECT_ROOT / "reference" / "espn" / "raw"
DEFAULT_ESPN_TEAM_MANAGER_MAP = PROJECT_ROOT / "scripts" / "espn_team_manager_map.json"
SOURCE_SHEET = "Game Log"
ESPN_SOURCE_SHEET = "schedule"


def slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not cleaned:
        raise ValueError(f"Could not create id slug for {value!r}")
    return cleaned


def slug_from_manager_id(manager_id: str) -> str:
    if not manager_id.startswith("manager-"):
        raise ValueError(f"Unexpected manager id: {manager_id!r}")

    return manager_id.removeprefix("manager-")


def fallback_display_name(manager_id: str) -> str:
    return " ".join(part.capitalize() for part in slug_from_manager_id(manager_id).split("-"))


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


def read_espn_team_manager_map(
    mapping_path: Path,
) -> tuple[dict[int, dict[int, str]], dict[str, str]]:
    if not mapping_path.exists():
        return {}, {}

    raw_mapping = json.loads(mapping_path.read_text())
    season_team_managers = {
        int(season): {
            int(team_id): manager_id
            for team_id, manager_id in team_map.items()
        }
        for season, team_map in raw_mapping.get("teamManagers", {}).items()
    }

    return season_team_managers, raw_mapping.get("displayNames", {})


def espn_team_display_name(team: dict[str, Any]) -> str:
    name = team.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()

    location = team.get("location")
    nickname = team.get("nickname")
    combined = " ".join(
        value.strip()
        for value in (location, nickname)
        if isinstance(value, str) and value.strip()
    )

    return combined or f"Team {team.get('id', 'unknown')}"


def espn_team_id(side: dict[str, Any] | None) -> int | None:
    if not isinstance(side, dict):
        return None

    value = side.get("teamId")

    return value if isinstance(value, int) else None


def espn_score(side: dict[str, Any] | None) -> float | None:
    if not isinstance(side, dict):
        return None

    value = side.get("totalPoints")
    if not isinstance(value, (int, float)):
        return None

    return round(float(value), 2)


def is_real_espn_matchup(row: dict[str, Any]) -> bool:
    home = row.get("home")
    away = row.get("away")

    return (
        espn_team_id(home) is not None
        and espn_team_id(away) is not None
        and espn_score(home) is not None
        and espn_score(away) is not None
        and row.get("winner") != "UNDECIDED"
    )


def espn_game_type(row: dict[str, Any]) -> str:
    playoff_tier = row.get("playoffTierType")

    if playoff_tier == "NONE":
        return "regular"

    if playoff_tier == "WINNERS_BRACKET":
        return "playoff"

    return "consolation"


def final_standing_for(
    first_points: float,
    second_points: float,
    final_seeding_rank: int,
) -> dict[str, int]:
    if first_points > second_points:
        return {
            "firstTeamFinish": final_seeding_rank,
            "secondTeamFinish": final_seeding_rank + 1,
        }

    if second_points > first_points:
        return {
            "firstTeamFinish": final_seeding_rank + 1,
            "secondTeamFinish": final_seeding_rank,
        }

    return {
        "firstTeamFinish": final_seeding_rank,
        "secondTeamFinish": final_seeding_rank,
    }


def append_missing_managers(
    data: dict[str, Any],
    season_team_manager_ids: dict[int, dict[int, str]],
    display_names: dict[str, str],
) -> None:
    existing_manager_ids = {manager["id"] for manager in data["managers"]}
    mapped_manager_ids: list[str] = []

    for team_map in season_team_manager_ids.values():
        for manager_id in team_map.values():
            if manager_id not in mapped_manager_ids:
                mapped_manager_ids.append(manager_id)

    for manager_id in mapped_manager_ids:
        if manager_id in existing_manager_ids:
            continue

        data["managers"].append(
            {
                "id": manager_id,
                "displayName": display_names.get(
                    manager_id,
                    fallback_display_name(manager_id),
                ),
            }
        )
        existing_manager_ids.add(manager_id)


def append_espn_data(
    data: dict[str, Any],
    raw_dir: Path,
    mapping_path: Path,
) -> list[dict[str, Any]]:
    if not raw_dir.exists():
        return []

    season_team_manager_ids, display_names = read_espn_team_manager_map(mapping_path)
    if not season_team_manager_ids:
        return []

    append_missing_managers(data, season_team_manager_ids, display_names)
    import_summaries: list[dict[str, Any]] = []

    for raw_path in sorted(raw_dir.glob("espn-ffl-*.json")):
        payload = json.loads(raw_path.read_text())
        season_year = int(payload["seasonId"])
        team_manager_ids = season_team_manager_ids.get(season_year)

        if not team_manager_ids:
            continue

        season_id = f"season-{season_year}"
        data["seasons"].append(
            {
                "id": season_id,
                "year": season_year,
                "label": f"{season_year} Season",
            }
        )

        teams = [
            team
            for team in payload.get("teams", [])
            if isinstance(team, dict) and isinstance(team.get("id"), int)
        ]
        teams_by_espn_id = {team["id"]: team for team in teams}
        team_id_by_espn_id: dict[int, str] = {}

        missing_team_ids = set(team_manager_ids) - set(teams_by_espn_id)
        if missing_team_ids:
            raise ValueError(
                f"ESPN {season_year} mapping has unknown team ids: {sorted(missing_team_ids)}"
            )

        for espn_id in sorted(team_manager_ids):
            manager_id = team_manager_ids[espn_id]
            team = teams_by_espn_id[espn_id]
            team_id = f"team-{season_year}-{slug_from_manager_id(manager_id)}"
            team_id_by_espn_id[espn_id] = team_id
            data["teams"].append(
                {
                    "id": team_id,
                    "seasonId": season_id,
                    "managerId": manager_id,
                    "name": espn_team_display_name(team),
                }
            )

        real_rows = [
            row
            for row in payload.get("schedule", [])
            if isinstance(row, dict) and is_real_espn_matchup(row)
        ]
        week_numbers = sorted(
            {
                row["matchupPeriodId"]
                for row in real_rows
                if isinstance(row.get("matchupPeriodId"), int)
            }
        )

        for week_number in week_numbers:
            data["weeks"].append(
                {
                    "id": f"week-{season_year}-{week_number}",
                    "seasonId": season_id,
                    "number": week_number,
                    "label": f"Week {week_number}",
                }
            )

        final_week = week_numbers[-1] if week_numbers else None
        final_rows = [
            row
            for row in sorted(real_rows, key=lambda item: item["id"])
            if row.get("matchupPeriodId") == final_week
        ]
        final_seeding_rank_by_row_id = {
            row["id"]: index * 2 + 1 for index, row in enumerate(final_rows)
        }
        matchup_sequence: dict[tuple[int, int], int] = defaultdict(int)

        for row in sorted(
            real_rows,
            key=lambda item: (item["matchupPeriodId"], item["id"]),
        ):
            week_number = int(row["matchupPeriodId"])
            key = (season_year, week_number)
            matchup_sequence[key] += 1
            sequence = matchup_sequence[key]
            home = row["home"]
            away = row["away"]
            first_team_id = team_id_by_espn_id[espn_team_id(home)]
            second_team_id = team_id_by_espn_id[espn_team_id(away)]
            first_points = espn_score(home)
            second_points = espn_score(away)

            if first_points is None or second_points is None:
                raise ValueError(f"Missing ESPN score in {raw_path.name} row {row['id']}")

            matchup = {
                "id": f"matchup-{season_year}-w{week_number:02d}-{sequence:02d}",
                "seasonId": season_id,
                "weekId": f"week-{season_year}-{week_number}",
                "gameType": espn_game_type(row),
                "isFinalSeedingGame": row["id"] in final_seeding_rank_by_row_id,
                "source": {
                    "workbook": raw_path.name,
                    "sheet": ESPN_SOURCE_SHEET,
                    "rowNumber": row["id"],
                },
                "scores": [
                    {"teamId": first_team_id, "points": first_points},
                    {"teamId": second_team_id, "points": second_points},
                ],
            }

            final_seeding_rank = final_seeding_rank_by_row_id.get(row["id"])
            if final_seeding_rank is not None:
                matchup["finalSeedingRank"] = final_seeding_rank
                matchup["finalStanding"] = final_standing_for(
                    first_points,
                    second_points,
                    final_seeding_rank,
                )

            data["matchups"].append(matchup)

        import_summaries.append(
            {
                "source": "espn",
                "season": season_year,
                "rawFile": raw_path.name,
                "matchups": len(real_rows),
                "skippedRows": len(payload.get("schedule", [])) - len(real_rows),
            }
        )

    return import_summaries


def build_historical_data(
    workbook_path: Path,
    espn_raw_dir: Path = DEFAULT_ESPN_RAW_DIR,
    espn_mapping_path: Path = DEFAULT_ESPN_TEAM_MANAGER_MAP,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
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
        matchup = {
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

        if record.final_seeding_rank is not None:
            matchup["finalSeedingRank"] = record.final_seeding_rank

        if record.team1_finish is not None and record.team2_finish is not None:
            matchup["finalStanding"] = {
                "firstTeamFinish": record.team1_finish,
                "secondTeamFinish": record.team2_finish,
            }

        matchups.append(matchup)

    data = {
        "managers": managers,
        "seasons": seasons,
        "teams": teams,
        "weeks": weeks,
        "matchups": matchups,
    }
    espn_imports = append_espn_data(data, espn_raw_dir, espn_mapping_path)

    return data, espn_imports


def build_import_summary(
    data: dict[str, Any],
    workbook_path: Path,
    espn_imports: list[dict[str, Any]],
) -> dict[str, Any]:
    game_type_counts = defaultdict(int)
    final_seeding_counts = defaultdict(int)
    season_matchup_counts = defaultdict(int)
    source_file_counts = defaultdict(int)

    for matchup in data["matchups"]:
        year = int(matchup["seasonId"].split("-")[1])
        game_type_counts[matchup["gameType"]] += 1
        season_matchup_counts[year] += 1
        source_file_counts[matchup.get("source", {}).get("workbook", "unknown")] += 1
        if matchup["isFinalSeedingGame"]:
            final_seeding_counts[year] += 1

    return {
        "sourceWorkbook": workbook_path.name,
        "sourceSheet": SOURCE_SHEET,
        "sourceFiles": dict(sorted(source_file_counts.items())),
        "espnImports": espn_imports,
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
        "// Source of truth: reference/workbooks/Fantasy History.xlsx, Game Log columns I:U.\n"
        f"export const historicalImportSummary = {summary_json} as const;\n\n"
        f"export const historicalLeagueData = {data_json} satisfies LeagueData;\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate historical league seed data from the workbook.")
    parser.add_argument("workbook", nargs="?", default=DEFAULT_WORKBOOK, type=Path)
    parser.add_argument("--output", default=DEFAULT_OUTPUT, type=Path)
    parser.add_argument("--espn-raw-dir", default=DEFAULT_ESPN_RAW_DIR, type=Path)
    parser.add_argument(
        "--espn-team-manager-map",
        default=DEFAULT_ESPN_TEAM_MANAGER_MAP,
        type=Path,
    )
    parser.add_argument("--skip-espn", action="store_true")
    args = parser.parse_args()

    workbook_path = args.workbook.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    espn_raw_dir = args.espn_raw_dir.expanduser().resolve()
    espn_mapping_path = args.espn_team_manager_map.expanduser().resolve()

    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found: {workbook_path}")

    data, espn_imports = build_historical_data(
        workbook_path,
        espn_raw_dir=Path("__missing_espn_raw__") if args.skip_espn else espn_raw_dir,
        espn_mapping_path=espn_mapping_path,
    )
    import_summary = build_import_summary(data, workbook_path, espn_imports)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(to_typescript(data, import_summary))

    print(f"Generated {output_path}")
    print(f"Matchups: {import_summary['matchupRows']}")
    print(f"Managers: {import_summary['managerCount']}")
    print(f"Seasons: {import_summary['seasonCount']}")
    print(f"Teams: {import_summary['teamEntries']}")
    print(f"Weeks: {import_summary['weekEntries']}")
    print(f"Game types: {import_summary['gameTypeCounts']}")
    if espn_imports:
        print(f"ESPN imports: {espn_imports}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
