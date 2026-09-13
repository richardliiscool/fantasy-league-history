"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type {
  HeadToHeadMatrixCell,
  HeadToHeadMatrixProfile,
  HeadToHeadMatrixRow,
} from "@/lib/stats/headToHeadMatrixProfile";
import type { HeadToHeadManagerOption } from "@/lib/stats/headToHeadProfile";
import type { ManagerRecordSummary } from "@/lib/stats/managerProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";

type HeadToHeadMatrixDashboardProps = {
  profile: HeadToHeadMatrixProfile;
};

type ManagerStatusFilter = "active" | "all" | "inactive";
type CellDisplayMode = "record" | "winPercentage" | "games";

const gameScopeOptions: SegmentOption<GameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

const managerStatusOptions: SegmentOption<ManagerStatusFilter>[] = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
  { value: "inactive", label: "Inactive" },
];

const cellDisplayOptions: SegmentOption<CellDisplayMode>[] = [
  { value: "record", label: "Record" },
  { value: "winPercentage", label: "Win %" },
  { value: "games", label: "Games" },
];

export function HeadToHeadMatrixDashboard({
  profile,
}: HeadToHeadMatrixDashboardProps) {
  const [gameScope, setGameScope] = useState<GameScope>("official");
  const [managerStatus, setManagerStatus] =
    useState<ManagerStatusFilter>("active");
  const [cellDisplayMode, setCellDisplayMode] =
    useState<CellDisplayMode>("record");
  const visibleManagers = useMemo(
    () =>
      profile.managers.filter((manager) =>
        matchesManagerStatus(manager, managerStatus),
      ),
    [managerStatus, profile.managers],
  );
  const visibleManagerIds = useMemo(
    () => new Set(visibleManagers.map((manager) => manager.managerId)),
    [visibleManagers],
  );
  const visibleRows = useMemo(
    () =>
      profile.rows
        .filter((row) => visibleManagerIds.has(row.manager.managerId))
        .map((row) => ({
          ...row,
          cells: row.cells.filter((cell, index) => {
            const columnManager = profile.managers[index];

            return visibleManagerIds.has(columnManager.managerId);
          }),
        })),
    [profile.managers, profile.rows, visibleManagerIds],
  );
  const leader = useMemo(
    () => getMatrixLeader(visibleRows, gameScope),
    [gameScope, visibleRows],
  );
  const mostPlayed = useMemo(
    () => getMostPlayedCell(visibleRows, gameScope),
    [gameScope, visibleRows],
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#58606a]">
              Matrix Controls
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              League-wide rivalry grid
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#66707a]">
              Showing {visibleManagers.length} managers and{" "}
              {getVisibleMatchupCellCount(visibleManagers.length)} clickable
              matchup cells.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
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
            <SegmentedControl
              label="Cells"
              value={cellDisplayMode}
              options={cellDisplayOptions}
              onChange={setCellDisplayMode}
            />
          </div>
        </div>
        <div className="grid gap-2 border-t border-[#e8ebef] px-4 py-3 sm:grid-cols-4">
          <LegendItem
            label="Under 40%"
            className="border-[#c75a68] bg-[#f8dadd] text-[#5d1f2b]"
          />
          <LegendItem
            label="40-59.9%"
            className="border-[#d59a2d] bg-[#fff1bf] text-[#4f3700]"
          />
          <LegendItem
            label="60%+"
            className="border-[#6aa982] bg-[#dff3e8] text-[#123b2a]"
          />
          <LegendItem
            label="No games"
            className="border-[#d9dee4] bg-[#f1f3f5] text-[#8a939e]"
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Visible Managers"
          value={String(visibleManagers.length)}
          detail={`${profile.activeManagerCount} active / ${profile.managerCount} total`}
        />
        <SummaryCard
          label="Scope"
          value={GAME_SCOPE_LABELS[gameScope]}
          detail="change the game set above"
        />
        <SummaryCard
          label="Best Cell"
          value={formatLeaderValue(leader?.record)}
          detail={formatLeaderDetail(leader)}
        />
        <SummaryCard
          label="Most Played"
          value={formatMostPlayedValue(mostPlayed?.record)}
          detail={formatLeaderDetail(mostPlayed)}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="border-b border-[#e8ebef] px-4 py-4">
          <p className="text-sm font-semibold text-[#58606a]">
            Head-to-Head Matrix
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Row records against each column
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#66707a]">
            Click any matchup cell to open the full rivalry page.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
            <thead className="bg-[#f8f9fb] text-[#58606a]">
              <tr>
                <th className="sticky left-0 z-20 min-w-40 border-r border-[#e8ebef] bg-[#f8f9fb] px-3 py-3 font-semibold">
                  Manager
                </th>
                {visibleManagers.map((manager) => (
                  <th
                    key={manager.managerId}
                    className={getColumnHeaderClass(manager)}
                  >
                    <Link
                      href={`/managers/${manager.managerId}`}
                      className={getHeaderLinkClass(manager)}
                    >
                      {formatShortManagerName(manager.managerName)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.manager.managerId} className="border-t border-[#e8ebef]">
                  <th className={getRowHeaderClass(row.manager)}>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/managers/${row.manager.managerId}`}
                        className={getHeaderLinkClass(row.manager)}
                      >
                        {row.manager.managerName}
                      </Link>
                      {!row.manager.isActive && (
                        <span className="text-[11px] font-semibold text-[#8a939e]">
                          Inactive
                        </span>
                      )}
                    </div>
                  </th>
                  {row.cells.map((cell, index) => {
                    const columnManager = visibleManagers[index];

                    return (
                      <td
                        key={`${row.manager.managerId}:${columnManager.managerId}`}
                        className={getCellWrapperClass(row.manager, columnManager)}
                      >
                        {cell ? (
                          <MatrixCellLink
                            cell={cell}
                            columnManager={columnManager}
                            displayMode={cellDisplayMode}
                            scope={gameScope}
                          />
                        ) : (
                          <span className="flex min-h-16 items-center justify-center rounded-md bg-[#f1f3f5] text-xs font-semibold text-[#8a939e]">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#58606a]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#17191f]">{value}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[#66707a]">
        {detail}
      </p>
    </article>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-center text-xs font-semibold ${className}`}
    >
      {label}
    </div>
  );
}

function MatrixCellLink({
  cell,
  columnManager,
  displayMode,
  scope,
}: {
  cell: HeadToHeadMatrixCell;
  columnManager: HeadToHeadManagerOption;
  displayMode: CellDisplayMode;
  scope: GameScope;
}) {
  const record = cell.summariesByScope[scope];

  return (
    <Link
      href={{
        pathname: "/head-to-head",
        query: {
          manager: cell.rowManagerId,
          opponent: cell.columnManagerId,
        },
      }}
      aria-label={`Open head-to-head against ${columnManager.managerName}`}
      className={getCellLinkClass(record, columnManager)}
    >
      <span className="text-sm font-semibold leading-5">
        {formatCellPrimaryValue(record, displayMode)}
      </span>
      <span className="mt-1 text-[11px] leading-4 opacity-80">
        {formatCellSecondaryValue(record, displayMode)}
      </span>
    </Link>
  );
}

function matchesManagerStatus(
  manager: HeadToHeadManagerOption,
  status: ManagerStatusFilter,
) {
  if (status === "active") {
    return manager.isActive;
  }

  if (status === "inactive") {
    return !manager.isActive;
  }

  return true;
}

function getVisibleMatchupCellCount(managerCount: number) {
  return managerCount * Math.max(managerCount - 1, 0);
}

function getMatrixLeader(rows: HeadToHeadMatrixRow[], scope: GameScope) {
  return rows
    .flatMap((row) =>
      row.cells.flatMap((cell) => {
        if (!cell) {
          return [];
        }

        return [
          {
            manager: row.manager,
            opponent: rows.find(
              (matrixRow) => matrixRow.manager.managerId === cell.columnManagerId,
            )?.manager,
            record: cell.summariesByScope[scope],
          },
        ];
      }),
    )
    .filter((item) => item.record.games > 0)
    .sort(
      (first, second) =>
        second.record.winPercentage - first.record.winPercentage ||
        second.record.games - first.record.games ||
        second.record.wins - first.record.wins ||
        first.manager.managerName.localeCompare(second.manager.managerName),
    )[0] ?? null;
}

function getMostPlayedCell(rows: HeadToHeadMatrixRow[], scope: GameScope) {
  return rows
    .flatMap((row) =>
      row.cells.flatMap((cell) => {
        if (!cell) {
          return [];
        }

        return [
          {
            manager: row.manager,
            opponent: rows.find(
              (matrixRow) => matrixRow.manager.managerId === cell.columnManagerId,
            )?.manager,
            record: cell.summariesByScope[scope],
          },
        ];
      }),
    )
    .filter((item) => item.record.games > 0)
    .sort(
      (first, second) =>
        second.record.games - first.record.games ||
        second.record.winPercentage - first.record.winPercentage ||
        first.manager.managerName.localeCompare(second.manager.managerName),
    )[0] ?? null;
}

function formatLeaderValue(record: ManagerRecordSummary | undefined) {
  if (!record || record.games === 0) {
    return "-";
  }

  return formatPercentage(record.winPercentage);
}

function formatMostPlayedValue(record: ManagerRecordSummary | undefined) {
  if (!record || record.games === 0) {
    return "-";
  }

  return String(record.games);
}

function formatLeaderDetail(
  leader: {
    manager: HeadToHeadManagerOption;
    opponent?: HeadToHeadManagerOption;
    record: ManagerRecordSummary;
  } | null,
) {
  if (!leader || !leader.opponent) {
    return "No games in this view";
  }

  return `${leader.manager.managerName} vs ${leader.opponent.managerName}: ${formatRecord(
    leader.record,
  )}`;
}

function formatCellPrimaryValue(
  record: ManagerRecordSummary,
  displayMode: CellDisplayMode,
) {
  if (record.games === 0) {
    return "0 games";
  }

  if (displayMode === "winPercentage") {
    return formatPercentage(record.winPercentage);
  }

  if (displayMode === "games") {
    return String(record.games);
  }

  return formatRecord(record);
}

function formatCellSecondaryValue(
  record: ManagerRecordSummary,
  displayMode: CellDisplayMode,
) {
  if (record.games === 0) {
    return "No games";
  }

  if (displayMode === "record") {
    return `${formatPercentage(record.winPercentage)} / ${record.games} games`;
  }

  return formatRecord(record);
}

function formatRecord(record: Pick<ManagerRecordSummary, "wins" | "losses" | "ties">) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatShortManagerName(managerName: string) {
  const [firstName, ...rest] = managerName.split(" ");
  const lastInitial = rest.at(-1)?.[0];

  return lastInitial ? `${firstName} ${lastInitial}.` : managerName;
}

function getCellLinkClass(
  record: ManagerRecordSummary,
  columnManager: HeadToHeadManagerOption,
) {
  const baseClass =
    "flex min-h-16 flex-col items-center justify-center rounded-md border px-2 py-2 text-center underline-offset-4 transition hover:border-[#2f6f50] hover:shadow-sm hover:brightness-[0.98] hover:underline";
  const inactiveClass = columnManager.isActive ? "" : "opacity-75";

  if (record.games === 0) {
    return `${baseClass} border-[#d9dee4] bg-[#f1f3f5] text-[#8a939e] ${inactiveClass}`;
  }

  if (record.winPercentage < 0.4) {
    return `${baseClass} border-[#c75a68] bg-[#f8dadd] text-[#5d1f2b] ${inactiveClass}`;
  }

  if (record.winPercentage >= 0.6) {
    return `${baseClass} border-[#6aa982] bg-[#dff3e8] text-[#123b2a] ${inactiveClass}`;
  }

  return `${baseClass} border-[#d59a2d] bg-[#fff1bf] text-[#4f3700] ${inactiveClass}`;
}

function getColumnHeaderClass(manager: HeadToHeadManagerOption) {
  return `min-w-24 border-r border-[#e8ebef] px-3 py-3 text-center font-semibold ${
    manager.isActive ? "bg-[#f8f9fb]" : "bg-[#fafafa] text-[#8a939e]"
  }`;
}

function getRowHeaderClass(manager: HeadToHeadManagerOption) {
  return `sticky left-0 z-10 min-w-40 border-r border-[#e8ebef] px-3 py-3 text-left font-semibold ${
    manager.isActive ? "bg-white" : "bg-[#fafafa] text-[#8a939e]"
  }`;
}

function getHeaderLinkClass(manager: HeadToHeadManagerOption) {
  return `underline-offset-4 hover:text-[#2f6f50] hover:underline ${
    manager.isActive ? "text-[#17191f]" : "text-[#7a828c]"
  }`;
}

function getCellWrapperClass(
  rowManager: HeadToHeadManagerOption,
  columnManager: HeadToHeadManagerOption,
) {
  return `border-r border-[#eef0f3] px-2 py-2 ${
    rowManager.isActive && columnManager.isActive ? "" : "bg-[#fafafa]"
  }`;
}
