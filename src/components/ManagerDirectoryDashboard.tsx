"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import type { ManagerDirectoryProfile, ManagerDirectoryRow } from "@/lib/stats/managerDirectoryProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type ManagerDirectoryDashboardProps = {
  profile: ManagerDirectoryProfile;
};

type ManagerStatusFilter = "all" | "active" | "inactive";
type DirectorySortKey =
  | "managerName"
  | "lastSeasonYear"
  | "seasonsPlayed"
  | "record"
  | "games"
  | "winPercentage"
  | "pointsFor"
  | "pointsAgainst"
  | "averagePointsFor"
  | "averagePointsAgainst"
  | "gold"
  | "silver"
  | "bronze"
  | "totalPodiums";

const managerStatusOptions: SegmentOption<ManagerStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function ManagerDirectoryDashboard({
  profile,
}: ManagerDirectoryDashboardProps) {
  const [managerStatus, setManagerStatus] =
    useState<ManagerStatusFilter>("all");
  const [sortKey, setSortKey] = useState<DirectorySortKey>("winPercentage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const rows = useMemo(
    () =>
      profile.rows
        .filter((row) => matchesManagerStatus(row, managerStatus))
        .sort((first, second) =>
          compareDirectoryRows(first, second, sortKey, sortDirection),
        ),
    [managerStatus, profile.rows, sortDirection, sortKey],
  );

  const handleSort = (nextSortKey: DirectorySortKey) => {
    setSortDirection((currentDirection) =>
      sortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setSortKey(nextSortKey);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            Manager Directory
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Career index
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#66707a]">
            Showing {rows.length} of {profile.managerCount} managers
          </p>
        </div>
        <SegmentedControl
          label="Managers"
          value={managerStatus}
          options={managerStatusOptions}
          onChange={setManagerStatus}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
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
                  label="Last"
                  sortKey="lastSeasonYear"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Seasons"
                  sortKey="seasonsPlayed"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Record"
                  sortKey="record"
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
                  label="Gold"
                  sortKey="gold"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Silver"
                  sortKey="silver"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Bronze"
                  sortKey="bronze"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Podiums"
                  sortKey="totalPodiums"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold">Links</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.managerId} className={getDirectoryRowClass(row)}>
                <td className="px-4 py-3 font-semibold">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/managers/${row.managerId}`}
                      className={getManagerLinkClass(row)}
                    >
                      {row.managerName}
                    </Link>
                    <span className={getActivityBadgeClass(row)}>
                      {formatActivityLabel(row)}
                    </span>
                  </div>
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {row.lastSeasonYear ?? "N/A"}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {row.seasonsPlayed}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatRecord(row.career)}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {row.career.games}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatPercentage(row.career.winPercentage)}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatScore(row.career.pointsFor)}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatScore(row.career.pointsAgainst)}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatScore(row.career.averagePointsFor)}
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {formatScore(row.career.averagePointsAgainst)}
                </td>
                <td className="px-4 py-3">
                  <PodiumCount value={row.trophyTally.gold} tone="gold" />
                </td>
                <td className="px-4 py-3">
                  <PodiumCount value={row.trophyTally.silver} tone="silver" />
                </td>
                <td className="px-4 py-3">
                  <PodiumCount value={row.trophyTally.bronze} tone="bronze" />
                </td>
                <td className={getDirectoryCellClass(row)}>
                  {row.trophyTally.totalPodiums}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/managers/${row.managerId}`}
                      className={getActionLinkClass(row)}
                    >
                      Profile
                    </Link>
                    <Link
                      href={{
                        pathname: "/head-to-head",
                        query: { manager: row.managerId },
                      }}
                      className={getActionLinkClass(row)}
                    >
                      Compare
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function matchesManagerStatus(
  row: ManagerDirectoryRow,
  status: ManagerStatusFilter,
) {
  if (status === "active") {
    return row.isActive;
  }

  if (status === "inactive") {
    return !row.isActive;
  }

  return true;
}

function compareDirectoryRows(
  first: ManagerDirectoryRow,
  second: ManagerDirectoryRow,
  sortKey: DirectorySortKey,
  direction: SortDirection,
) {
  if (first.isActive !== second.isActive) {
    return first.isActive ? -1 : 1;
  }

  const primaryComparison =
    compareSortValues(
      getDirectorySortValue(first, sortKey),
      getDirectorySortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return (
    compareSortValues(second.career.winPercentage, first.career.winPercentage) ||
    compareSortValues(second.career.wins, first.career.wins) ||
    compareSortValues(second.trophyTally.gold, first.trophyTally.gold) ||
    compareSortValues(first.managerName, second.managerName)
  );
}

function getDirectorySortValue(
  row: ManagerDirectoryRow,
  sortKey: DirectorySortKey,
) {
  if (sortKey === "managerName") {
    return row.managerName;
  }

  if (sortKey === "lastSeasonYear") {
    return row.lastSeasonYear ?? 0;
  }

  if (sortKey === "seasonsPlayed") {
    return row.seasonsPlayed;
  }

  if (sortKey === "record") {
    return row.career.wins;
  }

  if (
    sortKey === "gold" ||
    sortKey === "silver" ||
    sortKey === "bronze" ||
    sortKey === "totalPodiums"
  ) {
    return row.trophyTally[sortKey];
  }

  return row.career[sortKey];
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

function getDefaultSortDirection(sortKey: DirectorySortKey): SortDirection {
  return sortKey === "managerName" ? "asc" : "desc";
}

function formatRecord(record: {
  wins: number;
  losses: number;
  ties: number;
}) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatActivityLabel(row: ManagerDirectoryRow) {
  if (row.isActive) {
    return "Active";
  }

  return row.lastSeasonYear ? `Last ${row.lastSeasonYear}` : "Inactive";
}

function PodiumCount({
  value,
  tone,
}: {
  value: number;
  tone: "gold" | "silver" | "bronze";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-[#fff4d6] text-[#7c5200]"
      : tone === "silver"
        ? "bg-[#eef2f6] text-[#4b5563]"
        : "bg-[#f7eadf] text-[#7a3f1d]";

  return (
    <span
      className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-sm font-semibold ${toneClass}`}
    >
      {value}
    </span>
  );
}

function getDirectoryRowClass(row: ManagerDirectoryRow) {
  return `border-t border-[#e8ebef] ${row.isActive ? "" : "bg-[#fafafa]"}`;
}

function getDirectoryCellClass(row: ManagerDirectoryRow) {
  return `px-4 py-3 ${row.isActive ? "text-[#424a53]" : "text-[#8a939e]"}`;
}

function getManagerLinkClass(row: ManagerDirectoryRow) {
  return `underline-offset-4 hover:text-[#2f6f50] hover:underline ${
    row.isActive ? "text-[#17191f]" : "text-[#7a828c]"
  }`;
}

function getActionLinkClass(row: ManagerDirectoryRow) {
  return `rounded-md border px-2 py-1 text-xs font-semibold underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline ${
    row.isActive
      ? "border-[#b8c0c9] text-[#17191f]"
      : "border-[#d9dee4] text-[#7a828c]"
  }`;
}

function getActivityBadgeClass(row: ManagerDirectoryRow) {
  return `rounded-md px-2 py-1 text-xs font-semibold ${
    row.isActive ? "bg-[#eef5f1] text-[#2f6f50]" : "bg-[#eceff3] text-[#7a828c]"
  }`;
}
