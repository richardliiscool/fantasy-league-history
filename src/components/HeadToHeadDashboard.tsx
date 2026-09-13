"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type {
  HeadToHeadGameRow,
  HeadToHeadParticipant,
  HeadToHeadProfile,
  HeadToHeadRivalryProfile,
  HeadToHeadScopeSummary,
} from "@/lib/stats/headToHeadProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import {
  SelectControl,
  type SelectOption,
} from "./SelectControl";
import { SortableHeader, type SortDirection } from "./SortableHeader";

type HeadToHeadDashboardProps = {
  profile: HeadToHeadProfile;
  initialFirstManagerId?: string | null;
  initialSecondManagerId?: string | null;
};

type GameLogSortKey =
  | "game"
  | "gameType"
  | "winner"
  | "firstPoints"
  | "secondPoints"
  | "margin";

const GAME_LOG_BATCH_SIZE = 10;

const GAME_TYPE_SORT_ORDER: Record<HeadToHeadGameRow["gameType"], number> = {
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

export function HeadToHeadDashboard({
  profile,
  initialFirstManagerId,
  initialSecondManagerId,
}: HeadToHeadDashboardProps) {
  const resolvedInitialFirstManagerId = getInitialFirstManagerId(
    profile,
    initialFirstManagerId,
  );
  const resolvedInitialSecondManagerId = getInitialSecondManagerId(
    profile,
    resolvedInitialFirstManagerId,
    initialSecondManagerId,
  );
  const [firstManagerId, setFirstManagerId] = useState(
    resolvedInitialFirstManagerId,
  );
  const [secondManagerId, setSecondManagerId] = useState(
    resolvedInitialSecondManagerId,
  );
  const [gameScope, setGameScope] = useState<GameScope>("official");
  const [gameSortKey, setGameSortKey] = useState<GameLogSortKey>("game");
  const [gameSortDirection, setGameSortDirection] =
    useState<SortDirection>("desc");
  const [visibleGameCount, setVisibleGameCount] =
    useState(GAME_LOG_BATCH_SIZE);
  const managerOptions = useMemo<SelectOption<string>[]>(
    () =>
      profile.managers.map((manager) => ({
        value: manager.managerId,
        label: manager.isActive
          ? manager.managerName
          : `${manager.managerName} (inactive)`,
      })),
    [profile.managers],
  );
  const selectedRivalry = useMemo(
    () =>
      profile.rivalries.find(
        (rivalry) =>
          rivalry.firstManagerId === firstManagerId &&
          rivalry.secondManagerId === secondManagerId,
      ) ?? null,
    [firstManagerId, profile.rivalries, secondManagerId],
  );
  const selectedSummary = selectedRivalry?.summariesByScope[gameScope] ?? null;
  const scopedGames = useMemo(
    () =>
      selectedRivalry
        ? selectedRivalry.games.filter((game) =>
            matchesGameScope(game, gameScope),
          )
        : [],
    [gameScope, selectedRivalry],
  );
  const sortedGames = useMemo(
    () =>
      [...scopedGames].sort((first, second) =>
        compareGameRows(first, second, gameSortKey, gameSortDirection),
      ),
    [gameSortDirection, gameSortKey, scopedGames],
  );
  const visibleGames = useMemo(
    () => sortedGames.slice(0, visibleGameCount),
    [sortedGames, visibleGameCount],
  );
  const canShowMoreGames = visibleGameCount < sortedGames.length;
  const highestScore = useMemo(() => getHighestScore(scopedGames), [scopedGames]);
  const biggestMargin = useMemo(
    () => [...scopedGames].sort(compareGamesByMarginDescending)[0] ?? null,
    [scopedGames],
  );
  const closestGame = useMemo(
    () => [...scopedGames].sort(compareGamesByMarginAscending)[0] ?? null,
    [scopedGames],
  );

  const resetGameLog = () => setVisibleGameCount(GAME_LOG_BATCH_SIZE);

  const handleFirstManagerChange = (nextManagerId: string) => {
    setFirstManagerId(nextManagerId);

    if (nextManagerId === secondManagerId) {
      setSecondManagerId(
        getFallbackManagerId(profile, nextManagerId, firstManagerId),
      );
    }

    resetGameLog();
  };

  const handleSecondManagerChange = (nextManagerId: string) => {
    setSecondManagerId(nextManagerId);

    if (nextManagerId === firstManagerId) {
      setFirstManagerId(
        getFallbackManagerId(profile, nextManagerId, secondManagerId),
      );
    }

    resetGameLog();
  };

  const handleSwapManagers = () => {
    setFirstManagerId(secondManagerId);
    setSecondManagerId(firstManagerId);
    resetGameLog();
  };

  const handleGameScopeChange = (nextScope: GameScope) => {
    setGameScope(nextScope);
    resetGameLog();
  };

  const handleGameSort = (nextSortKey: GameLogSortKey) => {
    setGameSortDirection((currentDirection) =>
      gameSortKey === nextSortKey
        ? flipSortDirection(currentDirection)
        : getDefaultSortDirection(nextSortKey),
    );
    setGameSortKey(nextSortKey);
    resetGameLog();
  };

  if (profile.managers.length < 2) {
    return (
      <section className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
        <p className="text-sm text-[#66707a]">
          At least two managers are needed for head-to-head history.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#58606a]">
              Matchup Lens
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              Manager comparison
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#66707a]">
              {selectedSummary
                ? `${selectedSummary.games} ${GAME_SCOPE_LABELS[
                    gameScope
                  ].toLowerCase()} games`
                : "No games found"}
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <SelectControl
              label="Manager"
              value={firstManagerId}
              options={managerOptions}
              onChange={handleFirstManagerChange}
            />
            <button
              type="button"
              onClick={handleSwapManagers}
              className="min-h-10 rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
            >
              Swap
            </button>
            <SelectControl
              label="Opponent"
              value={secondManagerId}
              options={managerOptions}
              onChange={handleSecondManagerChange}
            />
            <SegmentedControl
              label="Games"
              value={gameScope}
              options={gameScopeOptions}
              onChange={handleGameScopeChange}
            />
          </div>
        </div>
      </section>

      {selectedRivalry && selectedSummary && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Series"
              value={formatRecord(selectedSummary.first)}
              detail={formatSeriesLeader(selectedSummary, selectedRivalry)}
            />
            <SummaryCard
              label="Win %"
              value={formatPercentage(selectedSummary.first.winPercentage)}
              detail={`${selectedRivalry.secondManagerName}: ${formatPercentage(
                selectedSummary.second.winPercentage,
              )}`}
            />
            <SummaryCard
              label="Avg Score"
              value={`${formatScore(
                selectedSummary.first.averagePointsFor,
              )} - ${formatScore(selectedSummary.second.averagePointsFor)}`}
              detail={`${selectedRivalry.firstManagerName} - ${selectedRivalry.secondManagerName}`}
            />
            <SummaryCard
              label="Highest Score"
              value={formatScore(highestScore?.participant.points)}
              detail={formatHighestScoreDetail(highestScore)}
              scoreLine={formatGameScoreLine(highestScore?.game)}
            />
            <SummaryCard
              label="Closest Game"
              value={formatMargin(closestGame?.margin)}
              detail={formatGameDetail(closestGame)}
              scoreLine={formatGameScoreLine(closestGame)}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
            <ComparisonTable
              rivalry={selectedRivalry}
              summary={selectedSummary}
              biggestMargin={biggestMargin}
            />
            <GameLogTable
              rivalry={selectedRivalry}
              rows={visibleGames}
              totalRows={sortedGames.length}
              sortKey={gameSortKey}
              sortDirection={gameSortDirection}
              onSort={handleGameSort}
              canShowMore={canShowMoreGames}
              onShowMore={() =>
                setVisibleGameCount((currentCount) =>
                  currentCount + GAME_LOG_BATCH_SIZE,
                )
              }
            />
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  scoreLine,
}: {
  label: string;
  value: string;
  detail: string;
  scoreLine?: string;
}) {
  return (
    <article className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#58606a]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#17191f]">{value}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[#66707a]">
        {detail}
      </p>
      {scoreLine && (
        <p className="mt-2 text-sm font-semibold leading-5 text-[#17191f]">
          {scoreLine}
        </p>
      )}
    </article>
  );
}

function ComparisonTable({
  rivalry,
  summary,
  biggestMargin,
}: {
  rivalry: HeadToHeadRivalryProfile;
  summary: HeadToHeadScopeSummary;
  biggestMargin: HeadToHeadGameRow | null;
}) {
  const rows = [
    {
      label: "Record",
      first: formatRecord(summary.first),
      second: formatRecord(summary.second),
    },
    {
      label: "Games",
      first: String(summary.first.games),
      second: String(summary.second.games),
    },
    {
      label: "Win %",
      first: formatPercentage(summary.first.winPercentage),
      second: formatPercentage(summary.second.winPercentage),
    },
    {
      label: "PF",
      first: formatScore(summary.first.pointsFor),
      second: formatScore(summary.second.pointsFor),
    },
    {
      label: "PA",
      first: formatScore(summary.first.pointsAgainst),
      second: formatScore(summary.second.pointsAgainst),
    },
    {
      label: "Avg PF",
      first: formatScore(summary.first.averagePointsFor),
      second: formatScore(summary.second.averagePointsFor),
    },
    {
      label: "Avg PA",
      first: formatScore(summary.first.averagePointsAgainst),
      second: formatScore(summary.second.averagePointsAgainst),
    },
    {
      label: "High Score",
      first: formatNullableScore(summary.first.highestScore),
      second: formatNullableScore(summary.second.highestScore),
    },
    {
      label: "Low Score",
      first: formatNullableScore(summary.first.lowestScore),
      second: formatNullableScore(summary.second.lowestScore),
    },
    {
      label: "Biggest Margin",
      first: formatManagerMargin(biggestMargin, rivalry.firstManagerId),
      second: formatManagerMargin(biggestMargin, rivalry.secondManagerId),
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">Rivalry Split</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Side-by-side
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Stat</th>
              <th className="px-4 py-3 font-semibold">
                <Link
                  href={`/managers/${rivalry.firstManagerId}`}
                  className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                >
                  {rivalry.firstManagerName}
                </Link>
              </th>
              <th className="px-4 py-3 font-semibold">
                <Link
                  href={`/managers/${rivalry.secondManagerId}`}
                  className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                >
                  {rivalry.secondManagerName}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#58606a]">
                  {row.label}
                </td>
                <td className="px-4 py-3 text-[#424a53]">{row.first}</td>
                <td className="px-4 py-3 text-[#424a53]">{row.second}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GameLogTable({
  rivalry,
  rows,
  totalRows,
  sortKey,
  sortDirection,
  onSort,
  canShowMore,
  onShowMore,
}: {
  rivalry: HeadToHeadRivalryProfile;
  rows: HeadToHeadGameRow[];
  totalRows: number;
  sortKey: GameLogSortKey;
  sortDirection: SortDirection;
  onSort: (sortKey: GameLogSortKey) => void;
  canShowMore: boolean;
  onShowMore: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">Game Log</p>
        <h2 className="text-2xl font-semibold text-[#17191f]">
          Every matchup
        </h2>
        <p className="text-sm text-[#66707a]">
          Showing {rows.length} of {totalRows} games
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Game"
                  sortKey="game"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Type"
                  sortKey="gameType"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Winner"
                  sortKey="winner"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label={rivalry.firstManagerName}
                  sortKey="firstPoints"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label={rivalry.secondManagerName}
                  sortKey="secondPoints"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortableHeader
                  label="Margin"
                  sortKey="margin"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((game) => (
              <tr key={game.matchupId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {game.seasonYear} W{game.weekNumber}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatGameType(game.gameType)}
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {game.winner?.managerName ?? "Tie"}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${getOutcomeClass(
                    game.first.outcome,
                  )}`}
                >
                  {formatScore(game.first.points)}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${getOutcomeClass(
                    game.second.outcome,
                  )}`}
                >
                  {formatScore(game.second.points)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatMargin(game.margin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canShowMore && (
        <div className="border-t border-[#e8ebef] px-4 py-4">
          <button
            type="button"
            onClick={onShowMore}
            className="rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
          >
            Show 10 more
          </button>
        </div>
      )}
    </section>
  );
}

function getFallbackManagerId(
  profile: HeadToHeadProfile,
  blockedManagerId: string,
  preferredManagerId: string,
) {
  if (preferredManagerId && preferredManagerId !== blockedManagerId) {
    return preferredManagerId;
  }

  return (
    profile.managers.find((manager) => manager.managerId !== blockedManagerId)
      ?.managerId ?? blockedManagerId
  );
}

function hasManager(profile: HeadToHeadProfile, managerId?: string | null) {
  return profile.managers.some((manager) => manager.managerId === managerId);
}

function getInitialFirstManagerId(
  profile: HeadToHeadProfile,
  requestedManagerId?: string | null,
) {
  if (hasManager(profile, requestedManagerId)) {
    return requestedManagerId ?? "";
  }

  return profile.defaultFirstManagerId ?? profile.managers[0]?.managerId ?? "";
}

function getInitialSecondManagerId(
  profile: HeadToHeadProfile,
  firstManagerId: string,
  requestedOpponentId?: string | null,
) {
  if (
    requestedOpponentId &&
    requestedOpponentId !== firstManagerId &&
    hasManager(profile, requestedOpponentId)
  ) {
    return requestedOpponentId;
  }

  if (
    profile.defaultSecondManagerId &&
    profile.defaultSecondManagerId !== firstManagerId
  ) {
    return profile.defaultSecondManagerId;
  }

  if (
    profile.defaultFirstManagerId &&
    profile.defaultFirstManagerId !== firstManagerId
  ) {
    return profile.defaultFirstManagerId;
  }

  return (
    profile.managers.find((manager) => manager.managerId !== firstManagerId)
      ?.managerId ?? ""
  );
}

function matchesGameScope(game: HeadToHeadGameRow, scope: GameScope) {
  if (scope === "official") {
    return game.gameType === "regular" || game.gameType === "playoff";
  }

  return game.gameType === scope;
}

function compareGameRows(
  first: HeadToHeadGameRow,
  second: HeadToHeadGameRow,
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

function getGameSortValue(game: HeadToHeadGameRow, sortKey: GameLogSortKey) {
  if (sortKey === "game") {
    return game.seasonYear * 100 + game.weekNumber;
  }

  if (sortKey === "gameType") {
    return GAME_TYPE_SORT_ORDER[game.gameType];
  }

  if (sortKey === "winner") {
    return game.winner?.managerName ?? "Tie";
  }

  if (sortKey === "firstPoints") {
    return game.first.points;
  }

  if (sortKey === "secondPoints") {
    return game.second.points;
  }

  return game.margin;
}

function compareGameChronology(
  first: HeadToHeadGameRow,
  second: HeadToHeadGameRow,
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

function compareGamesByMarginDescending(
  first: HeadToHeadGameRow,
  second: HeadToHeadGameRow,
) {
  return (
    second.margin - first.margin ||
    compareGameChronology(second, first)
  );
}

function compareGamesByMarginAscending(
  first: HeadToHeadGameRow,
  second: HeadToHeadGameRow,
) {
  return first.margin - second.margin || compareGameChronology(second, first);
}

function getHighestScore(games: HeadToHeadGameRow[]) {
  return games
    .flatMap((game) => [
      { game, participant: game.first },
      { game, participant: game.second },
    ])
    .sort(
      (first, second) =>
        second.participant.points - first.participant.points ||
        compareGameChronology(second.game, first.game),
    )[0] ?? null;
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

function getDefaultSortDirection(sortKey: GameLogSortKey): SortDirection {
  return sortKey === "gameType" || sortKey === "winner" ? "asc" : "desc";
}

function formatRecord(record: {
  wins: number;
  losses: number;
  ties: number;
}) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number | undefined) {
  if (score === undefined) {
    return "-";
  }

  return score.toFixed(1);
}

function formatNullableScore(score: number | null) {
  return score === null ? "-" : formatScore(score);
}

function formatMargin(margin: number | undefined) {
  if (margin === undefined) {
    return "-";
  }

  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}

function formatGameType(gameType: HeadToHeadGameRow["gameType"]) {
  if (gameType === "regular") {
    return "Regular";
  }

  if (gameType === "playoff") {
    return "Playoff";
  }

  return "Consolation";
}

function formatSeriesLeader(
  summary: HeadToHeadScopeSummary,
  rivalry: HeadToHeadRivalryProfile,
) {
  if (summary.games === 0) {
    return "No games in this scope";
  }

  if (summary.first.wins > summary.second.wins) {
    return `${rivalry.firstManagerName} leads ${formatRecord(summary.first)}`;
  }

  if (summary.second.wins > summary.first.wins) {
    return `${rivalry.secondManagerName} leads ${formatRecord(summary.second)}`;
  }

  return `Even ${formatRecord(summary.first)}`;
}

function formatHighestScoreDetail(
  highestScore: {
    game: HeadToHeadGameRow;
    participant: HeadToHeadParticipant;
  } | null,
) {
  if (!highestScore) {
    return "No games in this scope";
  }

  return `${highestScore.participant.managerName}, ${formatGameLabel(
    highestScore.game,
  )}`;
}

function formatGameDetail(game: HeadToHeadGameRow | null) {
  if (!game) {
    return "No games in this scope";
  }

  const result = game.winner ? `${game.winner.managerName} won` : "Tie";

  return `${result}, ${formatGameLabel(game)}`;
}

function formatGameLabel(game: HeadToHeadGameRow) {
  return `${game.seasonYear} W${game.weekNumber} ${formatGameType(
    game.gameType,
  )}`;
}

function formatGameScoreLine(game: HeadToHeadGameRow | undefined | null) {
  if (!game) {
    return "";
  }

  return `${game.first.managerName} ${formatScore(
    game.first.points,
  )} - ${formatScore(game.second.points)} ${game.second.managerName}`;
}

function formatManagerMargin(
  game: HeadToHeadGameRow | null,
  managerId: string,
) {
  if (!game) {
    return "-";
  }

  if (!game.winner) {
    return "0.0";
  }

  const formattedMargin = formatMargin(game.margin);

  return game.winner.managerId === managerId
    ? `+${formattedMargin}`
    : `-${formattedMargin}`;
}

function getOutcomeClass(outcome: HeadToHeadParticipant["outcome"]) {
  if (outcome === "win") {
    return "text-[#2f6f50]";
  }

  if (outcome === "loss") {
    return "text-[#b23b4a]";
  }

  return "text-[#7c5200]";
}
