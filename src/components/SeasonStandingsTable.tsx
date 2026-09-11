"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import type { SeasonFinalStandingRow } from "@/lib/stats/seasonProfile";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type SeasonStandingsTableProps = {
  finalStandings: SeasonFinalStandingRow[];
};

type StandingSortKey =
  | "finish"
  | "managerName"
  | "teamName"
  | "regularRecord"
  | "playoffRecord"
  | "officialRecord"
  | "winPercentage"
  | "pointsFor"
  | "pointsAgainst"
  | "averagePointsFor"
  | "averagePointsAgainst";

export function SeasonStandingsTable({
  finalStandings,
}: SeasonStandingsTableProps) {
  const [sortKey, setSortKey] = useState<StandingSortKey>("finish");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const finishCounts = getFinishCounts(finalStandings);
  const originalPositionByManagerId = useMemo(
    () =>
      new Map(
        finalStandings.map((standing, index) => [standing.managerId, index]),
      ),
    [finalStandings],
  );
  const sortedStandings = useMemo(
    () =>
      [...finalStandings].sort((first, second) =>
        compareStandingRows(
          first,
          second,
          sortKey,
          sortDirection,
          originalPositionByManagerId,
        ),
      ),
    [finalStandings, originalPositionByManagerId, sortDirection, sortKey],
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
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Final Standings
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Playoff finish order
        </h2>
        <p className="mt-2 text-sm text-[#66707a]">
          Ordered by the final placement data from the historical workbook.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Finish"
                  sortKey="finish"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Manager"
                  sortKey="managerName"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Team"
                  sortKey="teamName"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Regular"
                  sortKey="regularRecord"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Playoffs"
                  sortKey="playoffRecord"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Official"
                  sortKey="officialRecord"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Win %"
                  sortKey="winPercentage"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="PF"
                  sortKey="pointsFor"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="PA"
                  sortKey="pointsAgainst"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Avg PF"
                  sortKey="averagePointsFor"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader<StandingSortKey>
                  label="Avg PA"
                  sortKey="averagePointsAgainst"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((standing) => (
              <tr
                key={standing.managerId}
                className={`border-t border-[#e8ebef] ${
                  standing.finish === 1 ? "bg-[#eef5f1]" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex min-w-12 justify-center rounded-md bg-[#f8f9fb] px-2 py-1 text-sm font-semibold text-[#17191f]">
                    {formatFinish(
                      standing.finish,
                      finishCounts.get(standing.finish) ?? 0,
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/managers/${standing.managerId}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {standing.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {standing.teamName}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.regular)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.playoffs)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.official)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatPercentage(standing.official.winPercentage)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.pointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.pointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.averagePointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.averagePointsAgainst)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getFinishCounts(finalStandings: SeasonFinalStandingRow[]) {
  return finalStandings.reduce<Map<number, number>>((counts, standing) => {
    counts.set(standing.finish, (counts.get(standing.finish) ?? 0) + 1);
    return counts;
  }, new Map());
}

function formatFinish(finish: number, count: number) {
  return count > 1 ? `T-${finish}` : String(finish);
}

function compareStandingRows(
  first: SeasonFinalStandingRow,
  second: SeasonFinalStandingRow,
  sortKey: StandingSortKey,
  direction: SortDirection,
  originalPositionByManagerId: Map<string, number>,
) {
  const primaryComparison =
    compareSortValues(
      getStandingSortValue(first, sortKey),
      getStandingSortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  const secondaryComparison =
    compareSortValues(
      getStandingSecondarySortValue(first, sortKey),
      getStandingSecondarySortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (secondaryComparison !== 0) {
    return secondaryComparison;
  }

  return (
    (originalPositionByManagerId.get(first.managerId) ?? 0) -
    (originalPositionByManagerId.get(second.managerId) ?? 0)
  );
}

function getStandingSortValue(
  standing: SeasonFinalStandingRow,
  sortKey: StandingSortKey,
) {
  if (sortKey === "teamName") {
    return standing.teamName;
  }

  if (sortKey === "regularRecord") {
    return standing.regular.winPercentage;
  }

  if (sortKey === "playoffRecord") {
    return standing.playoffs.winPercentage;
  }

  if (sortKey === "officialRecord") {
    return standing.official.winPercentage;
  }

  if (sortKey === "winPercentage") {
    return standing.official.winPercentage;
  }

  if (
    sortKey === "pointsFor" ||
    sortKey === "pointsAgainst" ||
    sortKey === "averagePointsFor" ||
    sortKey === "averagePointsAgainst"
  ) {
    return standing.official[sortKey];
  }

  return standing[sortKey];
}

function getStandingSecondarySortValue(
  standing: SeasonFinalStandingRow,
  sortKey: StandingSortKey,
) {
  if (sortKey === "regularRecord") {
    return standing.regular.pointsFor;
  }

  if (sortKey === "playoffRecord") {
    return standing.playoffs.pointsFor;
  }

  if (sortKey === "officialRecord" || sortKey === "winPercentage") {
    return standing.official.pointsFor;
  }

  return standing.managerName;
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
  return sortKey === "finish" || sortKey === "managerName" || sortKey === "teamName"
    ? "asc"
    : "desc";
}

function formatRecord(
  record: Pick<SeasonFinalStandingRow["official"], "wins" | "losses" | "ties">,
) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number) {
  return score.toFixed(1);
}
