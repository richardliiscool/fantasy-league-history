"use client";

import { useMemo, useState } from "react";
import type {
  ManagerRecordSummary,
  ManagerSeasonSplit,
} from "@/lib/stats/managerProfile";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type SeasonSortKey =
  | "seasonYear"
  | "regularRecord"
  | "regularWinPercentage"
  | "regularAveragePointsFor"
  | "regularAveragePointsAgainst"
  | "playoffRecord"
  | "playoffAveragePointsFor"
  | "highestScore";

type ManagerSeasonBreakdownTableProps = {
  seasons: ManagerSeasonSplit[];
};

export function ManagerSeasonBreakdownTable({
  seasons,
}: ManagerSeasonBreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SeasonSortKey>("seasonYear");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const rows = useMemo(
    () =>
      [...seasons].sort((first, second) =>
        compareSeasonRows(first, second, sortKey, sortDirection),
      ),
    [seasons, sortDirection, sortKey],
  );

  const handleSort = (nextSortKey: SeasonSortKey) => {
    setSortDirection((currentDirection) =>
      sortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setSortKey(nextSortKey);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8ebef] px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            Season Breakdown
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Regular season and playoffs
          </h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Season"
                  sortKey="seasonYear"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Regular"
                  sortKey="regularRecord"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Reg Win %"
                  sortKey="regularWinPercentage"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Reg Avg PF"
                  sortKey="regularAveragePointsFor"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Reg Avg PA"
                  sortKey="regularAveragePointsAgainst"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Playoffs"
                  sortKey="playoffRecord"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Playoff Avg PF"
                  sortKey="playoffAveragePointsFor"
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
            </tr>
          </thead>
          <tbody>
            {rows.map((season) => (
              <tr key={season.seasonId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {season.seasonYear}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(season.regular)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.regular.games
                    ? season.regular.winPercentage.toFixed(3)
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScoreOrEmpty(season.regular.averagePointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScoreOrEmpty(season.regular.averagePointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecordOrEmpty(season.playoff)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScoreOrEmpty(season.playoff.averagePointsFor)}
                </td>
                <td className="px-4 py-3 text-[#2f6f50]">
                  {formatOptionalScore(season.official.highestScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function compareSeasonRows(
  first: ManagerSeasonSplit,
  second: ManagerSeasonSplit,
  sortKey: SeasonSortKey,
  direction: SortDirection,
) {
  const primaryComparison =
    compareSortValues(
      getSeasonSortValue(first, sortKey),
      getSeasonSortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return (
    compareSortValues(second.regular.winPercentage, first.regular.winPercentage) ||
    compareSortValues(second.regular.pointsFor, first.regular.pointsFor) ||
    compareSortValues(second.seasonYear, first.seasonYear)
  );
}

function getSeasonSortValue(season: ManagerSeasonSplit, sortKey: SeasonSortKey) {
  if (sortKey === "seasonYear") {
    return season.seasonYear;
  }

  if (sortKey === "regularRecord") {
    return season.regular.wins;
  }

  if (sortKey === "regularWinPercentage") {
    return season.regular.winPercentage;
  }

  if (sortKey === "regularAveragePointsFor") {
    return season.regular.averagePointsFor;
  }

  if (sortKey === "regularAveragePointsAgainst") {
    return season.regular.averagePointsAgainst;
  }

  if (sortKey === "playoffRecord") {
    return season.playoff.wins;
  }

  if (sortKey === "playoffAveragePointsFor") {
    return season.playoff.averagePointsFor;
  }

  return season.official.highestScore ?? Number.NEGATIVE_INFINITY;
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

function getDefaultSortDirection(sortKey: SeasonSortKey): SortDirection {
  return sortKey === "seasonYear" ? "asc" : "desc";
}

function formatRecord(record: ManagerRecordSummary) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatRecordOrEmpty(record: ManagerRecordSummary) {
  return record.games === 0 ? "N/A" : formatRecord(record);
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatOptionalScore(score: number | null | undefined) {
  return score === null || score === undefined ? "N/A" : formatScore(score);
}

function formatScoreOrEmpty(score: number) {
  return score === 0 ? "N/A" : formatScore(score);
}
