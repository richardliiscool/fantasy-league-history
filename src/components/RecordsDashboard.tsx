"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ManagerLink } from "@/components/ManagerLink";
import { GAME_SCOPE_LABELS } from "@/lib/stats/gameFilters";
import type { ManagerActivity } from "@/lib/stats/managerActivity";
import type {
  GameRecordRow,
  MatchupRecordRow,
  RecordGameScope,
  RecordsProfile,
  TrophyTallyRow,
} from "@/lib/stats/recordsProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import {
  SelectControl,
  type SelectOption,
} from "./SelectControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type RecordsDashboardProps = {
  profile: RecordsProfile;
  managerActivities: ManagerActivity[];
};

type SeasonFilter = "all" | string;
type TrophySortKey =
  | "rank"
  | "managerName"
  | "gold"
  | "silver"
  | "bronze"
  | "totalPodiums";

const GAME_RECORD_LIMIT = 10;

const gameScopeOptions: SegmentOption<RecordGameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
  { value: "all", label: "All" },
];

export function RecordsDashboard({
  profile,
  managerActivities,
}: RecordsDashboardProps) {
  const [gameScope, setGameScope] = useState<RecordGameScope>("official");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const activityByManagerId = useMemo(
    () =>
      new Map(
        managerActivities.map((activity) => [activity.managerId, activity]),
      ),
    [managerActivities],
  );
  const seasonOptions = useMemo<SelectOption<SeasonFilter>[]>(
    () => [
      { value: "all", label: "All seasons" },
      ...[...profile.seasons]
        .sort((first, second) => second.seasonYear - first.seasonYear)
        .map((season) => ({
          value: String(season.seasonYear),
          label: String(season.seasonYear),
        })),
    ],
    [profile.seasons],
  );
  const filteredGameRows = useMemo(
    () =>
      profile.gameRows.filter(
        (row) =>
          matchesScope(row, gameScope) && matchesSeason(row, seasonFilter),
      ),
    [gameScope, profile.gameRows, seasonFilter],
  );
  const filteredMatchupRows = useMemo(
    () =>
      profile.matchupRows.filter(
        (row) =>
          matchesScope(row, gameScope) && matchesSeason(row, seasonFilter),
      ),
    [gameScope, profile.matchupRows, seasonFilter],
  );
  const topScores = useMemo(
    () =>
      [...filteredGameRows]
        .sort(compareGameRowsByScoreDescending)
        .slice(0, GAME_RECORD_LIMIT),
    [filteredGameRows],
  );
  const lowestScores = useMemo(
    () =>
      [...filteredGameRows]
        .sort(compareGameRowsByScoreAscending)
        .slice(0, GAME_RECORD_LIMIT),
    [filteredGameRows],
  );
  const biggestMargins = useMemo(
    () =>
      [...filteredMatchupRows]
        .sort(compareMatchupsByMarginDescending)
        .slice(0, GAME_RECORD_LIMIT),
    [filteredMatchupRows],
  );
  const closestGames = useMemo(
    () =>
      [...filteredMatchupRows]
        .sort(compareMatchupsByMarginAscending)
        .slice(0, GAME_RECORD_LIMIT),
    [filteredMatchupRows],
  );
  const recordCards = [
    {
      label: "Highest Score",
      value: formatScore(topScores[0]?.pointsFor),
      detail: formatGameRecordDetail(topScores[0]),
      scoreLine: formatGameRecordScoreLine(topScores[0]),
    },
    {
      label: "Lowest Score",
      value: formatScore(lowestScores[0]?.pointsFor),
      detail: formatGameRecordDetail(lowestScores[0]),
      scoreLine: formatGameRecordScoreLine(lowestScores[0]),
    },
    {
      label: "Dominated",
      value: formatMargin(biggestMargins[0]?.margin),
      detail: formatMatchupRecordDetail(biggestMargins[0]),
      scoreLine: formatMatchupRecordScoreLine(biggestMargins[0]),
    },
    {
      label: "Closest Game",
      value: formatMargin(closestGames[0]?.margin),
      detail: formatMatchupRecordDetail(closestGames[0]),
      scoreLine: formatMatchupRecordScoreLine(closestGames[0]),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <TrophyTallyTable
        rows={profile.trophyTallies}
        activityByManagerId={activityByManagerId}
      />

      <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#58606a]">
              Record Filters
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              League record book
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#66707a]">
              Showing {filteredMatchupRows.length} matchups and{" "}
              {filteredGameRows.length} team results.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <SegmentedControl
              label="Games"
              value={gameScope}
              options={gameScopeOptions}
              onChange={setGameScope}
            />
            <SelectControl
              label="Season"
              value={seasonFilter}
              options={seasonOptions}
              onChange={setSeasonFilter}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {recordCards.map((record) => (
          <article
            key={record.label}
            className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-[#58606a]">
              {record.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#17191f]">
              {record.value}
            </p>
            <p className="mt-2 min-h-10 text-sm leading-5 text-[#66707a]">
              {record.detail}
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-[#17191f]">
              {record.scoreLine}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GameRecordTable
          title="Top Scores"
          rows={topScores}
          activityByManagerId={activityByManagerId}
        />
        <GameRecordTable
          title="Lowest Scores"
          rows={lowestScores}
          activityByManagerId={activityByManagerId}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MatchupRecordTable
          title="Dominated"
          rows={biggestMargins}
          activityByManagerId={activityByManagerId}
        />
        <MatchupRecordTable
          title="Closest Games"
          rows={closestGames}
          activityByManagerId={activityByManagerId}
        />
      </section>
    </div>
  );
}

function TrophyTallyTable({
  rows,
  activityByManagerId,
}: {
  rows: TrophyTallyRow[];
  activityByManagerId: Map<string, ManagerActivity>;
}) {
  const [sortKey, setSortKey] = useState<TrophySortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const rankByManagerId = useMemo(
    () => new Map(rows.map((row, index) => [row.managerId, index + 1])),
    [rows],
  );
  const sortedRows = useMemo(
    () =>
      [...rows].sort((first, second) =>
        compareTrophyRows(
          first,
          second,
          sortKey,
          sortDirection,
          rankByManagerId,
        ),
      ),
    [rankByManagerId, rows, sortDirection, sortKey],
  );

  const handleSort = (nextSortKey: TrophySortKey) => {
    setSortDirection((currentDirection) =>
      sortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultTrophySortDirection(nextSortKey),
    );
    setSortKey(nextSortKey);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Trophy Tally
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Gold, silver, bronze
        </h2>
        <p className="mt-2 text-sm leading-5 text-[#66707a]">
          Counted from official final placement rows, so tied finishes are kept
          as tied finishes.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <TrophyTallyHeader
                label="Rank"
                sortKey="rank"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TrophyTallyHeader
                label="Manager"
                sortKey="managerName"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TrophyTallyHeader
                label="Gold"
                sortKey="gold"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TrophyTallyHeader
                label="Silver"
                sortKey="silver"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TrophyTallyHeader
                label="Bronze"
                sortKey="bronze"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <TrophyTallyHeader
                label="Podiums"
                sortKey="totalPodiums"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 font-semibold">Seasons</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isActive = getManagerIsActive(
                activityByManagerId,
                row.managerId,
              );

              return (
                <tr
                  key={row.managerId}
                  className={getRecordTableRowClass(isActive)}
                >
                  <td className="px-4 py-3 font-semibold text-[#17191f]">
                    {rankByManagerId.get(row.managerId)}
                  </td>
                  <td className="px-4 py-3">
                    <ManagerLink
                      managerId={row.managerId}
                      managerName={row.managerName}
                      isActive={isActive}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PodiumCount value={row.gold} tone="gold" />
                  </td>
                  <td className="px-4 py-3">
                    <PodiumCount value={row.silver} tone="silver" />
                  </td>
                  <td className="px-4 py-3">
                    <PodiumCount value={row.bronze} tone="bronze" />
                  </td>
                  <td className={getRecordTableEmphasisCellClass(isActive)}>
                    {row.totalPodiums}
                  </td>
                  <td className={getRecordTableCellClass(isActive)}>
                    {formatPodiumYears(row)}
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

function TrophyTallyHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: TrophySortKey;
  activeSortKey: TrophySortKey;
  direction: SortDirection;
  onSort: (sortKey: TrophySortKey) => void;
}) {
  return (
    <th className="px-4 py-3">
      <SortableHeader
        label={label}
        sortKey={sortKey}
        activeSortKey={activeSortKey}
        direction={direction}
        onSort={onSort}
      />
    </th>
  );
}

function GameRecordTable({
  title,
  rows,
  activityByManagerId,
}: {
  title: string;
  rows: GameRecordRow[];
  activityByManagerId: Map<string, ManagerActivity>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Single-Game Records
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Manager</th>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Opponent</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isActive = getManagerIsActive(
                activityByManagerId,
                row.managerId,
              );
              const opponentIsActive = getManagerIsActive(
                activityByManagerId,
                row.opponentManagerId,
              );

              return (
                <tr
                  key={row.matchupId + row.managerId}
                  className={getRecordTableRowClass(isActive)}
                >
                  <td className="px-4 py-3 font-semibold text-[#17191f]">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <ManagerLink
                      managerId={row.managerId}
                      managerName={row.managerName}
                      isActive={isActive}
                    />
                  </td>
                  <td className={getRecordTableCellClass(isActive)}>
                    <Link
                      href={`/seasons/${row.seasonYear}`}
                      className="underline-offset-4 hover:text-[#2f6f50] hover:underline"
                    >
                      {row.seasonYear} Week {row.weekNumber}
                    </Link>
                    <span className="text-[#7a828c]">
                      {" "}
                      / {formatGameType(row.gameType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ManagerLink
                      managerId={row.opponentManagerId}
                      managerName={row.opponentManagerName}
                      isActive={opponentIsActive}
                    />
                  </td>
                  <td className={getRecordTableEmphasisCellClass(isActive)}>
                    {formatScore(row.pointsFor)}-{formatScore(row.pointsAgainst)}
                  </td>
                  <td className={getRecordTableCellClass(isActive)}>
                    {formatOutcome(row.outcome)}
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

function MatchupRecordTable({
  title,
  rows,
  activityByManagerId,
}: {
  title: string;
  rows: MatchupRecordRow[];
  activityByManagerId: Map<string, ManagerActivity>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Matchup Records
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Matchup</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Margin</th>
              <th className="px-4 py-3 font-semibold">Winner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const firstIsActive = getManagerIsActive(
                activityByManagerId,
                row.first.managerId,
              );
              const secondIsActive = getManagerIsActive(
                activityByManagerId,
                row.second.managerId,
              );
              const rowIsActive = firstIsActive && secondIsActive;

              return (
                <tr
                  key={row.matchupId}
                  className={getRecordTableRowClass(rowIsActive)}
                >
                  <td className="px-4 py-3 font-semibold text-[#17191f]">
                    {index + 1}
                  </td>
                  <td className={getRecordTableCellClass(rowIsActive)}>
                    <Link
                      href={`/seasons/${row.seasonYear}`}
                      className="underline-offset-4 hover:text-[#2f6f50] hover:underline"
                    >
                      {row.seasonYear} Week {row.weekNumber}
                    </Link>
                    <span className="text-[#7a828c]">
                      {" "}
                      / {formatGameType(row.gameType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ManagerLink
                        managerId={row.first.managerId}
                        managerName={row.first.managerName}
                        isActive={firstIsActive}
                      />
                      <span className="text-[#7a828c]">vs</span>
                      <ManagerLink
                        managerId={row.second.managerId}
                        managerName={row.second.managerName}
                        isActive={secondIsActive}
                      />
                    </div>
                  </td>
                  <td className={getRecordTableEmphasisCellClass(rowIsActive)}>
                    {formatMatchupRecordScoreLine(row)}
                  </td>
                  <td className={getRecordTableCellClass(rowIsActive)}>
                    {formatMargin(row.margin)}
                  </td>
                  <td className="px-4 py-3">
                    {row.winner ? (
                      <ManagerLink
                        managerId={row.winner.managerId}
                        managerName={row.winner.managerName}
                        isActive={getManagerIsActive(
                          activityByManagerId,
                          row.winner.managerId,
                        )}
                      />
                    ) : (
                      <span
                        className={rowIsActive ? "text-[#424a53]" : "text-[#8a939e]"}
                      >
                        Tie
                      </span>
                    )}
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

function matchesScope(
  row: Pick<GameRecordRow | MatchupRecordRow, "gameType">,
  scope: RecordGameScope,
) {
  if (scope === "all") {
    return true;
  }

  if (scope === "official") {
    return row.gameType === "regular" || row.gameType === "playoff";
  }

  return row.gameType === scope;
}

function matchesSeason(
  row: Pick<GameRecordRow | MatchupRecordRow, "seasonYear">,
  seasonFilter: SeasonFilter,
) {
  return seasonFilter === "all" || row.seasonYear === Number(seasonFilter);
}

function compareGameRowsByScoreDescending(
  first: GameRecordRow,
  second: GameRecordRow,
) {
  return (
    second.pointsFor - first.pointsFor ||
    compareGameRowsAscending(first, second) ||
    first.managerName.localeCompare(second.managerName)
  );
}

function compareGameRowsByScoreAscending(
  first: GameRecordRow,
  second: GameRecordRow,
) {
  return (
    first.pointsFor - second.pointsFor ||
    compareGameRowsAscending(first, second) ||
    first.managerName.localeCompare(second.managerName)
  );
}

function compareMatchupsByMarginDescending(
  first: MatchupRecordRow,
  second: MatchupRecordRow,
) {
  return second.margin - first.margin || compareGameRowsAscending(first, second);
}

function compareMatchupsByMarginAscending(
  first: MatchupRecordRow,
  second: MatchupRecordRow,
) {
  return first.margin - second.margin || compareGameRowsAscending(first, second);
}

function compareGameRowsAscending(
  first: Pick<GameRecordRow | MatchupRecordRow, "seasonYear" | "weekNumber" | "matchupId">,
  second: Pick<GameRecordRow | MatchupRecordRow, "seasonYear" | "weekNumber" | "matchupId">,
) {
  return (
    first.seasonYear - second.seasonYear ||
    first.weekNumber - second.weekNumber ||
    first.matchupId.localeCompare(second.matchupId)
  );
}

function compareTrophyRows(
  first: TrophyTallyRow,
  second: TrophyTallyRow,
  sortKey: TrophySortKey,
  direction: SortDirection,
  rankByManagerId: Map<string, number>,
) {
  const primaryComparison =
    compareSortValues(
      getTrophySortValue(first, sortKey, rankByManagerId),
      getTrophySortValue(second, sortKey, rankByManagerId),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return (
    (rankByManagerId.get(first.managerId) ?? 0) -
    (rankByManagerId.get(second.managerId) ?? 0)
  );
}

function getTrophySortValue(
  row: TrophyTallyRow,
  sortKey: TrophySortKey,
  rankByManagerId: Map<string, number>,
) {
  if (sortKey === "rank") {
    return rankByManagerId.get(row.managerId) ?? Number.POSITIVE_INFINITY;
  }

  return row[sortKey];
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

function getDefaultTrophySortDirection(sortKey: TrophySortKey): SortDirection {
  return sortKey === "rank" || sortKey === "managerName" ? "asc" : "desc";
}

function getManagerIsActive(
  activityByManagerId: Map<string, ManagerActivity>,
  managerId: string,
) {
  return activityByManagerId.get(managerId)?.isActive ?? false;
}

function getRecordTableRowClass(isActive: boolean) {
  return `border-t border-[#e8ebef] ${isActive ? "" : "bg-[#fafafa]"}`;
}

function getRecordTableCellClass(isActive: boolean) {
  return `px-4 py-3 ${isActive ? "text-[#424a53]" : "text-[#8a939e]"}`;
}

function getRecordTableEmphasisCellClass(isActive: boolean) {
  return `px-4 py-3 font-semibold ${
    isActive ? "text-[#17191f]" : "text-[#8a939e]"
  }`;
}

function formatGameRecordDetail(row: GameRecordRow | undefined) {
  if (!row) {
    return "No games found";
  }

  return `${row.managerName}, ${row.seasonYear} Week ${row.weekNumber} vs ${row.opponentManagerName}`;
}

function formatPodiumYears(row: TrophyTallyRow) {
  const parts = [
    formatPodiumYearGroup("1st", row.firstPlaceYears),
    formatPodiumYearGroup("2nd", row.secondPlaceYears),
    formatPodiumYearGroup("3rd", row.thirdPlaceYears),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "No podiums";
}

function formatPodiumYearGroup(label: string, years: number[]) {
  return years.length > 0 ? `${label}: ${years.join(", ")}` : "";
}

function formatGameRecordScoreLine(row: GameRecordRow | undefined) {
  if (!row) {
    return "";
  }

  return `${formatScore(row.pointsFor)} - ${formatScore(row.pointsAgainst)}`;
}

function formatMatchupRecordDetail(row: MatchupRecordRow | undefined) {
  if (!row) {
    return "No games found";
  }

  return `${row.seasonYear} Week ${row.weekNumber} ${formatGameType(row.gameType)} game`;
}

function formatMatchupRecordScoreLine(row: MatchupRecordRow | undefined) {
  if (!row) {
    return "";
  }

  return `${row.first.managerName} ${formatScore(row.first.points)} - ${row.second.managerName} ${formatScore(row.second.points)}`;
}

function formatOutcome(outcome: GameRecordRow["outcome"]) {
  if (outcome === "win") {
    return "Win";
  }

  if (outcome === "loss") {
    return "Loss";
  }

  return "Tie";
}

function formatGameType(gameType: GameRecordRow["gameType"]) {
  if (gameType === "regular") {
    return "Regular";
  }

  if (gameType === "playoff") {
    return "Playoff";
  }

  return "Consolation";
}

function formatScore(score: number | null | undefined) {
  return score === null || score === undefined ? "0.0" : score.toFixed(1);
}

function formatMargin(margin: number | null | undefined) {
  if (margin === null || margin === undefined) {
    return "0.0";
  }

  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
