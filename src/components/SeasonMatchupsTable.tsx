"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GAME_SCOPE_LABELS,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type { SeasonMatchupSummary } from "@/lib/stats/seasonProfile";
import {
  SegmentedControl,
  type SegmentOption,
} from "./SegmentedControl";
import {
  SelectControl,
  type SelectOption,
} from "./SelectControl";

type MatchupScope = "all" | GameScope;
type WeekFilter = "all" | string;

type SeasonMatchupsTableProps = {
  matchups: SeasonMatchupSummary[];
};

const MATCHUP_BATCH_SIZE = 24;

const matchupScopeOptions: SegmentOption<MatchupScope>[] = [
  { value: "all", label: "All" },
  { value: "official", label: GAME_SCOPE_LABELS.official },
  { value: "regular", label: GAME_SCOPE_LABELS.regular },
  { value: "playoff", label: GAME_SCOPE_LABELS.playoff },
  { value: "consolation", label: GAME_SCOPE_LABELS.consolation },
];

export function SeasonMatchupsTable({ matchups }: SeasonMatchupsTableProps) {
  const [matchupScope, setMatchupScope] = useState<MatchupScope>("all");
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [visibleMatchupCount, setVisibleMatchupCount] =
    useState(MATCHUP_BATCH_SIZE);
  const weekOptions = useMemo<SelectOption<WeekFilter>[]>(
    () => [
      { value: "all", label: "All weeks" },
      ...Array.from(new Set(matchups.map((matchup) => matchup.weekNumber)))
        .sort((first, second) => first - second)
        .map((weekNumber) => ({
          value: String(weekNumber),
          label: `Week ${weekNumber}`,
        })),
    ],
    [matchups],
  );
  const filteredMatchups = useMemo(
    () =>
      matchups.filter(
        (matchup) =>
          matchesMatchupScope(matchup, matchupScope) &&
          matchesWeek(matchup, weekFilter),
      ),
    [matchupScope, matchups, weekFilter],
  );
  const visibleMatchups = useMemo(
    () => filteredMatchups.slice(0, visibleMatchupCount),
    [filteredMatchups, visibleMatchupCount],
  );
  const canShowMoreMatchups = visibleMatchupCount < filteredMatchups.length;

  const handleMatchupScopeChange = (nextMatchupScope: MatchupScope) => {
    setMatchupScope(nextMatchupScope);
    setVisibleMatchupCount(MATCHUP_BATCH_SIZE);
  };

  const handleWeekFilterChange = (nextWeekFilter: WeekFilter) => {
    setWeekFilter(nextWeekFilter);
    setVisibleMatchupCount(MATCHUP_BATCH_SIZE);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#e8ebef] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">
            Weekly Matchups
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Season game log
          </h2>
          <p className="mt-2 text-sm text-[#66707a]">
            Showing {visibleMatchups.length} of {filteredMatchups.length} matchups
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <SegmentedControl
            label="Games"
            value={matchupScope}
            options={matchupScopeOptions}
            onChange={handleMatchupScopeChange}
          />
          <SelectControl
            label="Week"
            value={weekFilter}
            options={weekOptions}
            onChange={handleWeekFilterChange}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Week</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Matchup</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Winner</th>
              <th className="px-4 py-3 font-semibold">Margin</th>
            </tr>
          </thead>
          <tbody>
            {visibleMatchups.map((matchup) => (
              <tr key={matchup.matchupId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  Week {matchup.weekNumber}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{formatGameType(matchup.gameType)}</span>
                    {matchup.isFinalSeedingGame && (
                      <span className="rounded-md bg-[#fff4d6] px-2 py-1 text-xs font-semibold text-[#7c5200]">
                        Final seeding
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  <div className="flex flex-col gap-1">
                    <ManagerTeamLine
                      managerId={matchup.first.managerId}
                      managerName={matchup.first.managerName}
                      teamName={matchup.first.teamName}
                    />
                    <ManagerTeamLine
                      managerId={matchup.second.managerId}
                      managerName={matchup.second.managerName}
                      teamName={matchup.second.teamName}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(matchup.first.points)}-
                  {formatScore(matchup.second.points)}
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {matchup.winner ? (
                    <Link
                      href={`/managers/${matchup.winner.managerId}`}
                      className="underline-offset-4 hover:text-[#2f6f50] hover:underline"
                    >
                      {matchup.winner.managerName}
                    </Link>
                  ) : (
                    "Tie"
                  )}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatMarginValue(matchup.margin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canShowMoreMatchups && (
        <div className="border-t border-[#e8ebef] px-4 py-4">
          <button
            type="button"
            onClick={() =>
              setVisibleMatchupCount((currentCount) =>
                currentCount + MATCHUP_BATCH_SIZE,
              )
            }
            className="rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
          >
            Show 24 more
          </button>
        </div>
      )}
    </section>
  );
}

function ManagerTeamLine({
  managerId,
  managerName,
  teamName,
}: {
  managerId: string;
  managerName: string;
  teamName: string;
}) {
  return (
    <span>
      <Link
        href={`/managers/${managerId}`}
        className="font-semibold text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
      >
        {managerName}
      </Link>
      <span className="text-[#7a828c]"> / {teamName}</span>
    </span>
  );
}

function matchesMatchupScope(
  matchup: SeasonMatchupSummary,
  scope: MatchupScope,
) {
  if (scope === "all") {
    return true;
  }

  if (scope === "official") {
    return matchup.gameType === "regular" || matchup.gameType === "playoff";
  }

  return matchup.gameType === scope;
}

function matchesWeek(matchup: SeasonMatchupSummary, weekFilter: WeekFilter) {
  return weekFilter === "all" || matchup.weekNumber === Number(weekFilter);
}

function formatGameType(gameType: SeasonMatchupSummary["gameType"]) {
  if (gameType === "regular") {
    return "Regular";
  }

  if (gameType === "playoff") {
    return "Playoff";
  }

  return "Consolation";
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatMarginValue(margin: number) {
  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
