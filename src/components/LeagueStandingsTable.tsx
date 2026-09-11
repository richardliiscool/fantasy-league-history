"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type { ManagerActivity } from "@/lib/stats/managerActivity";
import type { ManagerStanding } from "@/lib/stats/leagueStats";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

export type LeagueStandingRow = ManagerStanding & {
  activity: ManagerActivity | null;
};

export type LeagueStandingsByScope = Record<GameScope, LeagueStandingRow[]>;

type ManagerStatusFilter = "all" | "active" | "inactive";
type StandingSortKey =
  | "managerName"
  | "wins"
  | "games"
  | "winPercentage"
  | "pointsFor"
  | "pointsAgainst"
  | "averagePointsFor"
  | "averagePointsAgainst"
  | "highestScore"
  | "lowestScore";

type LeagueStandingsTableProps = {
  standingsByScope: LeagueStandingsByScope;
};

const gameScopeOptions: SegmentOption<GameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

const managerStatusOptions: SegmentOption<ManagerStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function LeagueStandingsTable({
  standingsByScope,
}: LeagueStandingsTableProps) {
  const [gameScope, setGameScope] = useState<GameScope>("official");
  const [managerStatus, setManagerStatus] =
    useState<ManagerStatusFilter>("all");
  const [sortKey, setSortKey] =
    useState<StandingSortKey>("winPercentage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const rows = useMemo(
    () => {
      const filteredRows = standingsByScope[gameScope].filter((standing) => {
        if (standing.games === 0) {
          return false;
        }

        if (managerStatus === "active") {
          return standing.activity?.isActive ?? false;
        }

        if (managerStatus === "inactive") {
          return !(standing.activity?.isActive ?? false);
        }

        return true;
      });

      return [...filteredRows].sort((first, second) =>
        compareStandingRows(first, second, sortKey, sortDirection),
      );
    },
    [gameScope, managerStatus, sortDirection, sortKey, standingsByScope],
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
      <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            All-Time Standings
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Manager records
          </h2>
          <p className="mt-2 text-sm text-[#66707a]">
            Showing {rows.length} managers
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SegmentedControl
            label="Games"
            value={gameScope}
            options={gameScopeOptions}
            onChange={setGameScope}
          />
          <SegmentedControl
            label="Managers"
            value={managerStatus}
            options={managerStatusOptions}
            onChange={setManagerStatus}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
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
            {rows.map((standing) => {
              const isActive = standing.activity?.isActive ?? false;

              return (
                <tr
                  key={standing.managerId}
                  className={getStandingRowClass(isActive)}
                >
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/managers/${standing.managerId}`}
                        className={getManagerLinkClass(isActive)}
                      >
                        {standing.managerName}
                      </Link>
                      <span className={getActivityBadgeClass(isActive)}>
                        {formatActivityLabel(standing.activity)}
                      </span>
                    </div>
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {formatRecord(standing)}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.games}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.winPercentage.toFixed(3)}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.pointsFor.toFixed(1)}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.pointsAgainst.toFixed(1)}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.averagePointsFor.toFixed(1)}
                  </td>
                  <td className={getStandingCellClass(isActive)}>
                    {standing.averagePointsAgainst.toFixed(1)}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      isActive ? "text-[#2f6f50]" : "text-[#8a939e]"
                    }`}
                  >
                    {formatNullableScore(standing.highestScore)}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      isActive ? "text-[#b23b4a]" : "text-[#8a939e]"
                    }`}
                  >
                    {formatNullableScore(standing.lowestScore)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatRecord(record: Pick<ManagerStanding, "wins" | "losses" | "ties">) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function compareStandingRows(
  first: LeagueStandingRow,
  second: LeagueStandingRow,
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
  standing: LeagueStandingRow,
  sortKey: StandingSortKey,
) {
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
  return sortKey === "managerName" ? "asc" : "desc";
}

function formatNullableScore(score: number | null) {
  return score === null ? "N/A" : score.toFixed(1);
}

function formatActivityLabel(activity: ManagerActivity | null) {
  if (activity?.isActive) {
    return "Active";
  }

  return activity?.lastSeasonYear ? `Last ${activity.lastSeasonYear}` : "Inactive";
}

function getStandingRowClass(isActive: boolean) {
  return `border-t border-[#e8ebef] ${isActive ? "" : "bg-[#fafafa]"}`;
}

function getStandingCellClass(isActive: boolean) {
  return `px-4 py-3 ${isActive ? "text-[#424a53]" : "text-[#8a939e]"}`;
}

function getManagerLinkClass(isActive: boolean) {
  return `underline-offset-4 hover:text-[#2f6f50] hover:underline ${
    isActive ? "text-[#17191f]" : "text-[#7a828c]"
  }`;
}

function getActivityBadgeClass(isActive: boolean) {
  return `rounded-md px-2 py-1 text-xs font-semibold ${
    isActive ? "bg-[#eef5f1] text-[#2f6f50]" : "bg-[#eceff3] text-[#7a828c]"
  }`;
}
