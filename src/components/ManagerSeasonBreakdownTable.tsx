"use client";

import { useMemo, useState } from "react";
import type {
  ManagerRecordSummary,
  ManagerSeasonSplit,
} from "@/lib/stats/managerProfile";
import { formatPercentage } from "@/lib/formatters";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type SeasonSortKey =
  | "seasonYear"
  | "finalFinish"
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
        <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
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
                  label="Finish"
                  sortKey="finalFinish"
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
              <tr
                key={season.seasonId}
                className={getSeasonRowClass(season.madePlayoffs)}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#17191f]">
                      {season.seasonYear}
                    </span>
                    {season.madePlayoffs ? (
                      <span className="rounded-md bg-[#dceee5] px-2 py-1 text-xs font-semibold text-[#2f6f50]">
                        Playoffs
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {formatFinalFinish(season.finalFinish)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(season.regular)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.regular.games
                    ? formatPercentage(season.regular.winPercentage)
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

  if (sortKey === "finalFinish") {
    return season.finalFinish ?? Number.POSITIVE_INFINITY;
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
  return sortKey === "seasonYear" || sortKey === "finalFinish"
    ? "asc"
    : "desc";
}

function getSeasonRowClass(madePlayoffs: boolean) {
  return `border-t border-[#e8ebef] ${
    madePlayoffs ? "bg-[#f2faf5] shadow-[inset_4px_0_0_#3d8b62]" : ""
  }`;
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

function formatFinalFinish(finish: number | null) {
  if (finish === null) {
    return "N/A";
  }

  const remainderTen = finish % 10;
  const remainderHundred = finish % 100;

  if (remainderTen === 1 && remainderHundred !== 11) {
    return `${finish}st`;
  }

  if (remainderTen === 2 && remainderHundred !== 12) {
    return `${finish}nd`;
  }

  if (remainderTen === 3 && remainderHundred !== 13) {
    return `${finish}rd`;
  }

  return `${finish}th`;
}
