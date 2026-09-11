"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import { formatPercentage } from "@/lib/formatters";
import type {
  ManagerGameSummary,
  ManagerHeadToHeadSummary,
} from "@/lib/stats/managerProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import {
  SelectControl,
  type SelectOption,
} from "./SelectControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type OpponentStatusFilter = "all" | "active" | "inactive";
type GameOpponentFilter = "all" | string;
type HeadToHeadSortKey =
  | "opponentManagerName"
  | "record"
  | "games"
  | "winPercentage"
  | "averagePointsFor"
  | "averagePointsAgainst";
type GameLogSortKey =
  | "game"
  | "gameType"
  | "opponentManagerName"
  | "pointsFor"
  | "pointsAgainst"
  | "margin";

type ManagerProfileTablesProps = {
  headToHead: ManagerHeadToHeadSummary[];
  games: ManagerGameSummary[];
};

const GAME_LOG_BATCH_SIZE = 10;

const GAME_TYPE_SORT_ORDER: Record<ManagerGameSummary["gameType"], number> = {
  regular: 1,
  playoff: 2,
  consolation: 3,
};

const gameScopeOptions: SegmentOption<GameScope>[] = [
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

const opponentStatusOptions: SegmentOption<OpponentStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function ManagerProfileTables({
  headToHead,
  games,
}: ManagerProfileTablesProps) {
  const [opponentStatus, setOpponentStatus] =
    useState<OpponentStatusFilter>("all");
  const [gameScope, setGameScope] = useState<GameScope>("official");
  const [gameOpponentStatus, setGameOpponentStatus] =
    useState<OpponentStatusFilter>("all");
  const [gameOpponentId, setGameOpponentId] =
    useState<GameOpponentFilter>("all");
  const [headToHeadSortKey, setHeadToHeadSortKey] =
    useState<HeadToHeadSortKey>("games");
  const [headToHeadSortDirection, setHeadToHeadSortDirection] =
    useState<SortDirection>("desc");
  const [gameSortKey, setGameSortKey] = useState<GameLogSortKey>("game");
  const [gameSortDirection, setGameSortDirection] =
    useState<SortDirection>("desc");
  const [visibleGameCount, setVisibleGameCount] =
    useState(GAME_LOG_BATCH_SIZE);
  const filteredHeadToHead = useMemo(
    () => {
      const filteredRows = headToHead.filter((row) =>
        matchesOpponentStatus(row.opponentIsActive, opponentStatus),
      );

      return [...filteredRows].sort((first, second) =>
        compareHeadToHeadRows(
          first,
          second,
          headToHeadSortKey,
          headToHeadSortDirection,
        ),
      );
    },
    [headToHead, headToHeadSortDirection, headToHeadSortKey, opponentStatus],
  );
  const filteredGames = useMemo(
    () => {
      const filteredRows = games.filter(
        (game) =>
          matchesGameScope(game, gameScope) &&
          matchesOpponentStatus(game.opponentIsActive, gameOpponentStatus) &&
          matchesGameOpponent(game, gameOpponentId),
      );

      return [...filteredRows].sort((first, second) =>
        compareGameRows(first, second, gameSortKey, gameSortDirection),
      );
    },
    [
      gameOpponentId,
      gameOpponentStatus,
      gameScope,
      gameSortDirection,
      gameSortKey,
      games,
    ],
  );
  const gameOpponentOptions = useMemo<SelectOption<GameOpponentFilter>[]>(
    () => {
      const opponentsById = new Map<string, SelectOption<GameOpponentFilter>>();

      for (const game of games) {
        opponentsById.set(game.opponentManagerId, {
          value: game.opponentManagerId,
          label: game.opponentManagerName,
        });
      }

      return [
        { value: "all", label: "All opponents" },
        ...Array.from(opponentsById.values()).sort((first, second) =>
          first.label.localeCompare(second.label),
        ),
      ];
    },
    [games],
  );
  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleGameCount),
    [filteredGames, visibleGameCount],
  );
  const canShowMoreGames = visibleGameCount < filteredGames.length;

  const handleHeadToHeadSort = (nextSortKey: HeadToHeadSortKey) => {
    setHeadToHeadSortDirection((currentDirection) =>
      headToHeadSortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setHeadToHeadSortKey(nextSortKey);
  };

  const handleGameScopeChange = (nextGameScope: GameScope) => {
    setGameScope(nextGameScope);
    setVisibleGameCount(GAME_LOG_BATCH_SIZE);
  };

  const handleGameOpponentStatusChange = (
    nextOpponentStatus: OpponentStatusFilter,
  ) => {
    setGameOpponentStatus(nextOpponentStatus);
    setVisibleGameCount(GAME_LOG_BATCH_SIZE);
  };

  const handleGameOpponentIdChange = (nextOpponentId: GameOpponentFilter) => {
    setGameOpponentId(nextOpponentId);
    setVisibleGameCount(GAME_LOG_BATCH_SIZE);
  };

  const handleGameSort = (nextSortKey: GameLogSortKey) => {
    setGameSortDirection((currentDirection) =>
      gameSortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setGameSortKey(nextSortKey);
    setVisibleGameCount(GAME_LOG_BATCH_SIZE);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#58606a]">
              Head-to-Head
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              Opponent records
            </h2>
            <p className="mt-2 text-sm text-[#66707a]">
              Showing {filteredHeadToHead.length} opponents
            </p>
          </div>
          <SegmentedControl
            label="Opponents"
            value={opponentStatus}
            options={opponentStatusOptions}
            onChange={setOpponentStatus}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[#58606a]">
              <tr>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Opponent"
                    sortKey="opponentManagerName"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Record"
                    sortKey="record"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Games"
                    sortKey="games"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Win %"
                    sortKey="winPercentage"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Avg PF"
                    sortKey="averagePointsFor"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Avg PA"
                    sortKey="averagePointsAgainst"
                    activeSortKey={headToHeadSortKey}
                    direction={headToHeadSortDirection}
                    onSort={handleHeadToHeadSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHeadToHead.map((row) => (
                <tr
                  key={row.opponentManagerId}
                  className={getOpponentRowClass(row.opponentIsActive)}
                >
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/managers/${row.opponentManagerId}`}
                        className={getOpponentLinkClass(row.opponentIsActive)}
                      >
                        {row.opponentManagerName}
                      </Link>
                      {!row.opponentIsActive && (
                        <span className="rounded-md bg-[#eceff3] px-2 py-1 text-xs font-semibold text-[#7a828c]">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={getOpponentCellClass(row.opponentIsActive)}>
                    {formatRecord(row.record)}
                  </td>
                  <td className={getOpponentCellClass(row.opponentIsActive)}>
                    {row.record.games}
                  </td>
                  <td className={getOpponentCellClass(row.opponentIsActive)}>
                    {formatPercentage(row.record.winPercentage)}
                  </td>
                  <td className={getOpponentCellClass(row.opponentIsActive)}>
                    {formatScore(row.record.averagePointsFor)}
                  </td>
                  <td className={getOpponentCellClass(row.opponentIsActive)}>
                    {formatScore(row.record.averagePointsAgainst)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#58606a]">Game Log</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              Filtered results
            </h2>
            <p className="mt-2 text-sm text-[#66707a]">
              Showing {visibleGames.length} of {filteredGames.length} games
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <SegmentedControl
              label="Games"
              value={gameScope}
              options={gameScopeOptions}
              onChange={handleGameScopeChange}
            />
            <SelectControl
              label="Opponent"
              value={gameOpponentId}
              options={gameOpponentOptions}
              onChange={handleGameOpponentIdChange}
            />
            <SegmentedControl
              label="Status"
              value={gameOpponentStatus}
              options={opponentStatusOptions}
              onChange={handleGameOpponentStatusChange}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[#58606a]">
              <tr>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Game"
                    sortKey="game"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Type"
                    sortKey="gameType"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Opponent"
                    sortKey="opponentManagerName"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="PF"
                    sortKey="pointsFor"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="PA"
                    sortKey="pointsAgainst"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    label="Margin"
                    sortKey="margin"
                    activeSortKey={gameSortKey}
                    direction={gameSortDirection}
                    onSort={handleGameSort}
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {visibleGames.map((game) => (
                <tr key={game.matchupId} className="border-t border-[#e8ebef]">
                  <td className="px-4 py-3 font-semibold text-[#17191f]">
                    {game.seasonYear} W{game.weekNumber}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {formatGameType(game.gameType)}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{game.opponentManagerName}</span>
                      {!game.opponentIsActive && (
                        <span className="rounded-md bg-[#eceff3] px-2 py-1 text-xs font-semibold text-[#7a828c]">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {formatScore(game.pointsFor)}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {formatScore(game.pointsAgainst)}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {formatSignedMargin(game.margin)}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${getOutcomeClass(
                      game.outcome,
                    )}`}
                  >
                    {formatGameOutcomeLabel(game.outcome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canShowMoreGames && (
          <div className="border-t border-[#e8ebef] px-4 py-4">
            <button
              type="button"
              onClick={() =>
                setVisibleGameCount((currentCount) =>
                  currentCount + GAME_LOG_BATCH_SIZE,
                )
              }
              className="rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
            >
              Show 10 more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function matchesOpponentStatus(
  isActive: boolean,
  status: OpponentStatusFilter,
) {
  if (status === "active") {
    return isActive;
  }

  if (status === "inactive") {
    return !isActive;
  }

  return true;
}

function matchesGameScope(game: ManagerGameSummary, scope: GameScope) {
  if (scope === "official") {
    return game.gameType === "regular" || game.gameType === "playoff";
  }

  return game.gameType === scope;
}

function matchesGameOpponent(
  game: ManagerGameSummary,
  opponentId: GameOpponentFilter,
) {
  return opponentId === "all" || game.opponentManagerId === opponentId;
}

function compareHeadToHeadRows(
  first: ManagerHeadToHeadSummary,
  second: ManagerHeadToHeadSummary,
  sortKey: HeadToHeadSortKey,
  direction: SortDirection,
) {
  const primaryComparison =
    compareSortValues(
      getHeadToHeadSortValue(first, sortKey),
      getHeadToHeadSortValue(second, sortKey),
    ) * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return (
    compareSortValues(second.record.winPercentage, first.record.winPercentage) ||
    compareSortValues(second.record.games, first.record.games) ||
    compareSortValues(second.record.pointsFor, first.record.pointsFor) ||
    compareSortValues(first.opponentManagerName, second.opponentManagerName)
  );
}

function getHeadToHeadSortValue(
  row: ManagerHeadToHeadSummary,
  sortKey: HeadToHeadSortKey,
) {
  if (sortKey === "opponentManagerName") {
    return row.opponentManagerName;
  }

  if (sortKey === "record") {
    return row.record.wins;
  }

  return row.record[sortKey];
}

function compareGameRows(
  first: ManagerGameSummary,
  second: ManagerGameSummary,
  sortKey: GameLogSortKey,
  direction: SortDirection,
) {
  const baseComparison =
    sortKey === "game"
      ? compareGameChronology(first, second)
      : compareSortValues(
          getGameSortValue(first, sortKey),
          getGameSortValue(second, sortKey),
        );
  const primaryComparison = baseComparison * getSortDirectionMultiplier(direction);

  if (primaryComparison !== 0) {
    return primaryComparison;
  }

  return compareGameChronology(second, first);
}

function getGameSortValue(game: ManagerGameSummary, sortKey: GameLogSortKey) {
  if (sortKey === "game") {
    return game.seasonYear * 100 + game.weekNumber;
  }

  if (sortKey === "gameType") {
    return GAME_TYPE_SORT_ORDER[game.gameType];
  }

  if (sortKey === "margin") {
    return Math.abs(game.margin);
  }

  return game[sortKey];
}

function compareGameChronology(
  first: ManagerGameSummary,
  second: ManagerGameSummary,
) {
  if (first.seasonYear !== second.seasonYear) {
    return first.seasonYear - second.seasonYear;
  }

  if (first.weekNumber !== second.weekNumber) {
    return first.weekNumber - second.weekNumber;
  }

  if (first.gameType !== second.gameType) {
    return GAME_TYPE_SORT_ORDER[first.gameType] - GAME_TYPE_SORT_ORDER[second.gameType];
  }

  return first.matchupId.localeCompare(second.matchupId);
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

function getDefaultSortDirection(
  sortKey: HeadToHeadSortKey | GameLogSortKey,
): SortDirection {
  return sortKey === "opponentManagerName" || sortKey === "gameType"
    ? "asc"
    : "desc";
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

function formatGameType(gameType: ManagerGameSummary["gameType"]) {
  if (gameType === "regular") {
    return "Regular";
  }

  if (gameType === "playoff") {
    return "Playoff";
  }

  return "Consolation";
}

function formatGameOutcomeLabel(outcome: ManagerGameSummary["outcome"]) {
  if (outcome === "tie") {
    return "T";
  }

  return outcome === "win" ? "W" : "L";
}

function formatSignedMargin(margin: number) {
  if (margin === 0) {
    return "0.0";
  }

  const formattedMargin = formatMarginValue(Math.abs(margin));

  return margin > 0 ? `+${formattedMargin}` : `-${formattedMargin}`;
}

function formatMarginValue(margin: number) {
  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}

function getOutcomeClass(outcome: ManagerGameSummary["outcome"]) {
  if (outcome === "win") {
    return "text-[#2f6f50]";
  }

  if (outcome === "loss") {
    return "text-[#b23b4a]";
  }

  return "text-[#7c5200]";
}

function getOpponentRowClass(isActive: boolean) {
  return `border-t border-[#e8ebef] ${isActive ? "" : "bg-[#fafafa]"}`;
}

function getOpponentCellClass(isActive: boolean) {
  return `px-4 py-3 ${isActive ? "text-[#424a53]" : "text-[#8a939e]"}`;
}

function getOpponentLinkClass(isActive: boolean) {
  return `underline-offset-4 hover:text-[#2f6f50] hover:underline ${
    isActive ? "text-[#17191f]" : "text-[#7a828c]"
  }`;
}
