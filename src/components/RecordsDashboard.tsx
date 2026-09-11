"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type {
  GameRecordRow,
  MatchupRecordRow,
  RecordGameScope,
  RecordsProfile,
  SeasonPerformanceRow,
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
};

type SeasonFilter = "all" | string;
type PerformanceSortKey =
  | "seasonYear"
  | "managerName"
  | "teamName"
  | "record"
  | "games"
  | "winPercentage"
  | "pointsFor"
  | "pointsAgainst"
  | "averagePointsFor"
  | "averagePointsAgainst"
  | "highestScore"
  | "lowestScore";

const GAME_RECORD_LIMIT = 10;

const gameScopeOptions: SegmentOption<RecordGameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
  { value: "all", label: "All" },
];

const performanceScopeOptions: SegmentOption<GameScope>[] = [
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

export function RecordsDashboard({ profile }: RecordsDashboardProps) {
  const [gameScope, setGameScope] = useState<RecordGameScope>("official");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [performanceScope, setPerformanceScope] =
    useState<GameScope>("regular");
  const [performanceSortKey, setPerformanceSortKey] =
    useState<PerformanceSortKey>("pointsFor");
  const [performanceSortDirection, setPerformanceSortDirection] =
    useState<SortDirection>("desc");
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
      label: "Biggest Margin",
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
  const performanceRows = useMemo(
    () =>
      profile.seasonPerformanceRowsByScope[performanceScope]
        .filter((row) => matchesSeason(row, seasonFilter))
        .sort((first, second) =>
          comparePerformanceRows(
            first,
            second,
            performanceSortKey,
            performanceSortDirection,
          ),
        ),
    [
      performanceScope,
      performanceSortDirection,
      performanceSortKey,
      profile.seasonPerformanceRowsByScope,
      seasonFilter,
    ],
  );

  const handlePerformanceSort = (nextSortKey: PerformanceSortKey) => {
    setPerformanceSortDirection((currentDirection) =>
      performanceSortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setPerformanceSortKey(nextSortKey);
  };

  return (
    <div className="flex flex-col gap-8">
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
        <GameRecordTable title="Top Scores" rows={topScores} />
        <GameRecordTable title="Lowest Scores" rows={lowestScores} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MatchupRecordTable title="Biggest Margins" rows={biggestMargins} />
        <MatchupRecordTable title="Closest Games" rows={closestGames} />
      </section>

      <SeasonPerformanceTable
        rows={performanceRows}
        scope={performanceScope}
        sortKey={performanceSortKey}
        sortDirection={performanceSortDirection}
        onScopeChange={setPerformanceScope}
        onSort={handlePerformanceSort}
      />
    </div>
  );
}

function GameRecordTable({
  title,
  rows,
}: {
  title: string;
  rows: GameRecordRow[];
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
            {rows.map((row, index) => (
              <tr key={row.matchupId + row.managerId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/managers/${row.managerId}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
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
                <td className="px-4 py-3 text-[#424a53]">
                  {row.opponentManagerName}
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {formatScore(row.pointsFor)}-{formatScore(row.pointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatOutcome(row.outcome)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatchupRecordTable({
  title,
  rows,
}: {
  title: string;
  rows: MatchupRecordRow[];
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
            {rows.map((row, index) => (
              <tr key={row.matchupId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
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
                <td className="px-4 py-3 text-[#424a53]">
                  <Link
                    href={`/managers/${row.first.managerId}`}
                    className="font-semibold text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.first.managerName}
                  </Link>
                  <span className="text-[#7a828c]"> vs </span>
                  <Link
                    href={`/managers/${row.second.managerId}`}
                    className="font-semibold text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.second.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {formatMatchupRecordScoreLine(row)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatMargin(row.margin)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {row.winner ? row.winner.managerName : "Tie"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeasonPerformanceTable({
  rows,
  scope,
  sortKey,
  sortDirection,
  onScopeChange,
  onSort,
}: {
  rows: SeasonPerformanceRow[];
  scope: GameScope;
  sortKey: PerformanceSortKey;
  sortDirection: SortDirection;
  onScopeChange: (scope: GameScope) => void;
  onSort: (sortKey: PerformanceSortKey) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            Season Performances
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Manager seasons
          </h2>
          <p className="mt-2 text-sm text-[#66707a]">
            Showing {rows.length} manager-season rows.
          </p>
        </div>
        <SegmentedControl
          label="Games"
          value={scope}
          options={performanceScopeOptions}
          onChange={onScopeChange}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <SeasonPerformanceHeader
                label="Season"
                sortKey="seasonYear"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Manager"
                sortKey="managerName"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Team"
                sortKey="teamName"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Record"
                sortKey="record"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Games"
                sortKey="games"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Win %"
                sortKey="winPercentage"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="PF"
                sortKey="pointsFor"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="PA"
                sortKey="pointsAgainst"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Avg PF"
                sortKey="averagePointsFor"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Avg PA"
                sortKey="averagePointsAgainst"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="High"
                sortKey="highestScore"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
              <SeasonPerformanceHeader
                label="Low"
                sortKey="lowestScore"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.seasonId}-${row.managerId}`}
                className="border-t border-[#e8ebef]"
              >
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/seasons/${row.seasonYear}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.seasonYear}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/managers/${row.managerId}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">{row.teamName}</td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(row)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">{row.games}</td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatPercentage(row.winPercentage)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(row.pointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(row.pointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(row.averagePointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(row.averagePointsAgainst)}
                </td>
                <td className="px-4 py-3 text-[#2f6f50]">
                  {formatNullableScore(row.highestScore)}
                </td>
                <td className="px-4 py-3 text-[#b23b4a]">
                  {formatNullableScore(row.lowestScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeasonPerformanceHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: PerformanceSortKey;
  activeSortKey: PerformanceSortKey;
  direction: SortDirection;
  onSort: (sortKey: PerformanceSortKey) => void;
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
  row: Pick<GameRecordRow | MatchupRecordRow | SeasonPerformanceRow, "seasonYear">,
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

function comparePerformanceRows(
  first: SeasonPerformanceRow,
  second: SeasonPerformanceRow,
  sortKey: PerformanceSortKey,
  direction: SortDirection,
) {
  const primaryComparison =
    compareSortValues(
      getPerformanceSortValue(first, sortKey),
      getPerformanceSortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  const secondaryComparison =
    compareSortValues(
      getPerformanceSecondarySortValue(first, sortKey),
      getPerformanceSecondarySortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (secondaryComparison !== 0) {
    return secondaryComparison;
  }

  return (
    second.seasonYear - first.seasonYear ||
    first.managerName.localeCompare(second.managerName)
  );
}

function getPerformanceSortValue(
  row: SeasonPerformanceRow,
  sortKey: PerformanceSortKey,
) {
  if (sortKey === "record" || sortKey === "winPercentage") {
    return row.winPercentage;
  }

  if (sortKey === "highestScore" || sortKey === "lowestScore") {
    return row[sortKey] ?? Number.NEGATIVE_INFINITY;
  }

  return row[sortKey];
}

function getPerformanceSecondarySortValue(
  row: SeasonPerformanceRow,
  sortKey: PerformanceSortKey,
) {
  if (sortKey === "record" || sortKey === "winPercentage") {
    return row.pointsFor;
  }

  return row.managerName;
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

function getDefaultSortDirection(sortKey: PerformanceSortKey): SortDirection {
  return sortKey === "managerName" || sortKey === "teamName"
    ? "asc"
    : "desc";
}

function formatGameRecordDetail(row: GameRecordRow | undefined) {
  if (!row) {
    return "No games found";
  }

  return `${row.managerName}, ${row.seasonYear} Week ${row.weekNumber} vs ${row.opponentManagerName}`;
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

function formatRecord(
  record: Pick<SeasonPerformanceRow, "wins" | "losses" | "ties">,
) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
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

function formatNullableScore(score: number | null) {
  return score === null ? "N/A" : formatScore(score);
}

function formatMargin(margin: number | null | undefined) {
  if (margin === null || margin === undefined) {
    return "0.0";
  }

  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
