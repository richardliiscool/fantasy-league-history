"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type {
  SeasonProfile,
  SeasonStandingRow,
} from "@/lib/stats/seasonProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type SeasonStandingsByScope = SeasonProfile["standingsByScope"];
type StandingSortKey =
  | "managerName"
  | "teamName"
  | "wins"
  | "games"
  | "winPercentage"
  | "pointsFor"
  | "pointsAgainst"
  | "averagePointsFor"
  | "averagePointsAgainst"
  | "highestScore"
  | "lowestScore";

type SeasonStandingsTableProps = {
  standingsByScope: SeasonStandingsByScope;
};

const gameScopeOptions: SegmentOption<GameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

export function SeasonStandingsTable({
  standingsByScope,
}: SeasonStandingsTableProps) {
  const [gameScope, setGameScope] = useState<GameScope>("regular");
  const [sortKey, setSortKey] =
    useState<StandingSortKey>("winPercentage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const rows = useMemo(
    () =>
      standingsByScope[gameScope]
        .filter((standing) => standing.games > 0)
        .sort((first, second) =>
          compareStandingRows(first, second, sortKey, sortDirection),
        ),
    [gameScope, sortDirection, sortKey, standingsByScope],
  );

  const handleSort = (nextSortKey: StandingSortKey) => {
    setSortDirection((currentDirection) =>
      sortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setSortKey(nextSortKey);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            Season Standings
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Manager records
          </h2>
          <p className="mt-2 text-sm text-[#66707a]">
            Showing {rows.length} teams
          </p>
        </div>
        <SegmentedControl
          label="Games"
          value={gameScope}
          options={gameScopeOptions}
          onChange={setGameScope}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Manager"
                  sortKey="managerName"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Team"
                  sortKey="teamName"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Record"
                  sortKey="wins"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Games"
                  sortKey="games"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Win %"
                  sortKey="winPercentage"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="PF"
                  sortKey="pointsFor"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="PA"
                  sortKey="pointsAgainst"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Avg PF"
                  sortKey="averagePointsFor"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Avg PA"
                  sortKey="averagePointsAgainst"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="High"
                  sortKey="highestScore"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Low"
                  sortKey="lowestScore"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((standing) => (
              <tr key={standing.managerId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/managers/${standing.managerId}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {standing.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {standing.teamName ?? "N/A"}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">{standing.games}</td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatPercentage(standing.winPercentage)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.pointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.pointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.averagePointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.averagePointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#2f6f50]">
                  {formatNullableScore(standing.highestScore)}
                </td>
                <td className="px-4 py-3 text-[#b23b4a]">
                  {formatNullableScore(standing.lowestScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function compareStandingRows(
  first: SeasonStandingRow,
  second: SeasonStandingRow,
  sortKey: StandingSortKey,
  direction: SortDirection,
) {
  const primaryComparison =
    compareSortValues(
      getStandingSortValue(first, sortKey),
      getStandingSortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return (
    compareSortValues(second.winPercentage, first.winPercentage) ||
    compareSortValues(second.pointsFor, first.pointsFor) ||
    compareSortValues(first.managerName, second.managerName)
  );
}

function getStandingSortValue(
  standing: SeasonStandingRow,
  sortKey: StandingSortKey,
) {
  if (sortKey === "teamName") {
    return standing.teamName ?? "";
  }

  if (sortKey === "highestScore" || sortKey === "lowestScore") {
    return standing[sortKey] ?? Number.NEGATIVE_INFINITY;
  }

  return standing[sortKey];
}

function compareSortValues(first: number | string, second: number | string) {
  if (typeof first === "string" && typeof second === "string") {
    return first.localeCompare(second);
  }

  return Number(first) - Number(second);
}

function getSortDirectionMultiplier(direction: SortDirection) {
  return direction === "asc" ? 1 : -1;
}

function flipSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

function getDefaultSortDirection(sortKey: StandingSortKey): SortDirection {
  return sortKey === "managerName" || sortKey === "teamName" ? "asc" : "desc";
}

function formatRecord(record: Pick<SeasonStandingRow, "wins" | "losses" | "ties">) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatNullableScore(score: number | null) {
  return score === null ? "N/A" : formatScore(score);
}
