import type { EntityId, LeagueData } from "../domain/types";
import { buildGameResults } from "./leagueStats";
import {
  getSeasonProfile,
  type SeasonFinalStandingRow,
} from "./seasonProfile";

export type SeasonFinishBadge = "Gold" | "Silver" | "Bronze" | "💩";

export type SeasonPodiumRow = {
  finish: number;
  badge: SeasonFinishBadge;
  managerId: EntityId;
  managerName: string;
  teamId: EntityId;
  teamName: string;
  official: SeasonFinalStandingRow["official"];
};

export type SeasonsIndexRow = {
  seasonId: EntityId;
  seasonYear: number;
  label: string;
  podiumRows: SeasonPodiumRow[];
};

export type SeasonsIndexProfile = {
  seasons: SeasonsIndexRow[];
};

const badgeByFinish: Record<1 | 2 | 3 | 12, SeasonFinishBadge> = {
  1: "Gold",
  2: "Silver",
  3: "Bronze",
  12: "💩",
};

const getFinishBadge = (finish: number): SeasonFinishBadge | null => {
  if (finish === 1 || finish === 2 || finish === 3 || finish === 12) {
    return badgeByFinish[finish];
  }

  return null;
};

export const getSeasonsIndexProfile = (
  data: LeagueData,
): SeasonsIndexProfile => {
  const gameResults = buildGameResults(data);
  const seasons = data.seasons
    .map((season) => getSeasonProfile(data, season.year, gameResults))
    .filter((profile) => profile !== null)
    .map((profile) => ({
      seasonId: profile.seasonId,
      seasonYear: profile.seasonYear,
      label: profile.label,
      podiumRows: profile.finalStandings.flatMap((standing) => {
        const badge = getFinishBadge(standing.finish);

        if (!badge) {
          return [];
        }

        return [
          {
            finish: standing.finish,
            badge,
            managerId: standing.managerId,
            managerName: standing.managerName,
            teamId: standing.teamId,
            teamName: standing.teamName,
            official: standing.official,
          },
        ];
      }),
    }))
    .sort((first, second) => second.seasonYear - first.seasonYear);

  return { seasons };
};
