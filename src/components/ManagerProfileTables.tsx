"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type {
  ManagerGameSummary,
  ManagerHeadToHeadSummary,
} from "@/lib/stats/managerProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";

type OpponentStatusFilter = "all" | "active" | "inactive";

type ManagerProfileTablesProps = {
  headToHead: ManagerHeadToHeadSummary[];
  games: ManagerGameSummary[];
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
  const filteredHeadToHead = useMemo(
    () =>
      headToHead.filter((row) =>
        matchesOpponentStatus(row.opponentIsActive, opponentStatus),
      ),
    [headToHead, opponentStatus],
  );
  const filteredGames = useMemo(
    () =>
      games.filter(
        (game) =>
          matchesGameScope(game, gameScope) &&
          matchesOpponentStatus(game.opponentIsActive, gameOpponentStatus),
      ),
    [gameOpponentStatus, gameScope, games],
  );

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
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[#58606a]">
              <tr>
                <th className="px-4 py-3 font-semibold">Opponent</th>
                <th className="px-4 py-3 font-semibold">Record</th>
                <th className="px-4 py-3 font-semibold">Win %</th>
                <th className="px-4 py-3 font-semibold">Avg PF</th>
                <th className="px-4 py-3 font-semibold">Avg PA</th>
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
                    {row.record.winPercentage.toFixed(3)}
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
              Showing {filteredGames.length} games
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <SegmentedControl
              label="Games"
              value={gameScope}
              options={gameScopeOptions}
              onChange={setGameScope}
            />
            <SegmentedControl
              label="Opponents"
              value={gameOpponentStatus}
              options={opponentStatusOptions}
              onChange={setGameOpponentStatus}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead className="bg-[#f8f9fb] text-[#58606a]">
              <tr>
                <th className="px-4 py-3 font-semibold">Game</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Opponent</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
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
                    {formatScore(game.pointsFor)}-{formatScore(game.pointsAgainst)}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${getOutcomeClass(
                      game.outcome,
                    )}`}
                  >
                    {formatGameOutcome(game)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function formatGameOutcome(game: ManagerGameSummary) {
  if (game.outcome === "tie") {
    return "T";
  }

  const margin = formatMarginValue(Math.abs(game.margin));

  return game.outcome === "win" ? `W +${margin}` : `L -${margin}`;
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
