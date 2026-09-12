import type { EntityId, LeagueData, MatchupGameType } from "../domain/types";
import { filterGameResultsByScope, type GameScope } from "./gameFilters";
import {
  buildGameResults,
  type GameOutcome,
  type GameResult,
} from "./leagueStats";
import { getManagerActivities } from "./managerActivity";
import {
  summarizeManagerGames,
  type ManagerRecordSummary,
} from "./managerProfile";

export type HeadToHeadManagerOption = {
  managerId: EntityId;
  managerName: string;
  isActive: boolean;
};

export type HeadToHeadParticipant = {
  managerId: EntityId;
  managerName: string;
  teamId: EntityId;
  teamName: string;
  points: number;
  outcome: GameOutcome;
  margin: number;
};

export type HeadToHeadGameRow = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  isFinalSeedingGame: boolean;
  first: HeadToHeadParticipant;
  second: HeadToHeadParticipant;
  winner: HeadToHeadParticipant | null;
  margin: number;
};

export type HeadToHeadScopeSummary = {
  scope: GameScope;
  games: number;
  first: ManagerRecordSummary;
  second: ManagerRecordSummary;
};

export type HeadToHeadRivalryProfile = {
  firstManagerId: EntityId;
  firstManagerName: string;
  firstIsActive: boolean;
  secondManagerId: EntityId;
  secondManagerName: string;
  secondIsActive: boolean;
  summariesByScope: Record<GameScope, HeadToHeadScopeSummary>;
  games: HeadToHeadGameRow[];
};

export type HeadToHeadProfile = {
  managers: HeadToHeadManagerOption[];
  defaultFirstManagerId: EntityId | null;
  defaultSecondManagerId: EntityId | null;
  rivalries: HeadToHeadRivalryProfile[];
};

const GAME_SCOPES = [
  "official",
  "regular",
  "playoff",
  "consolation",
] satisfies GameScope[];

const GAME_TYPE_SORT_ORDER: Record<MatchupGameType, number> = {
  regular: 1,
  playoff: 2,
  consolation: 3,
};

const PREFERRED_FIRST_MANAGER_ID = "manager-richard-li";
const PREFERRED_SECOND_MANAGER_ID = "manager-ld-lu";

const roundTo = (value: number, places = 2) => Number(value.toFixed(places));

const compareHeadToHeadGamesAscending = (
  first: HeadToHeadGameRow,
  second: HeadToHeadGameRow,
) =>
  first.seasonYear - second.seasonYear ||
  first.weekNumber - second.weekNumber ||
  GAME_TYPE_SORT_ORDER[first.gameType] - GAME_TYPE_SORT_ORDER[second.gameType] ||
  first.matchupId.localeCompare(second.matchupId);

const reverseOutcome = (outcome: GameOutcome): GameOutcome => {
  if (outcome === "win") {
    return "loss";
  }

  if (outcome === "loss") {
    return "win";
  }

  return "tie";
};

const toParticipant = (
  game: GameResult,
  perspective: "manager" | "opponent",
): HeadToHeadParticipant => {
  if (perspective === "manager") {
    return {
      managerId: game.managerId,
      managerName: game.managerName,
      teamId: game.teamId,
      teamName: game.teamName,
      points: game.pointsFor,
      outcome: game.outcome,
      margin: game.margin,
    };
  }

  return {
    managerId: game.opponentManagerId,
    managerName: game.opponentManagerName,
    teamId: game.opponentTeamId,
    teamName: game.opponentTeamName,
    points: game.pointsAgainst,
    outcome: reverseOutcome(game.outcome),
    margin: roundTo(game.margin * -1),
  };
};

const toHeadToHeadGameRow = (game: GameResult): HeadToHeadGameRow => {
  const first = toParticipant(game, "manager");
  const second = toParticipant(game, "opponent");
  const winner =
    first.points === second.points ? null : first.points > second.points ? first : second;

  return {
    matchupId: game.matchupId,
    seasonId: game.seasonId,
    seasonYear: game.seasonYear,
    weekNumber: game.weekNumber,
    gameType: game.gameType,
    isFinalSeedingGame: game.isFinalSeedingGame,
    first,
    second,
    winner,
    margin: roundTo(Math.abs(game.margin)),
  };
};

const getManagerOptions = (data: LeagueData): HeadToHeadManagerOption[] => {
  const activities = getManagerActivities(data);
  const activityByManagerId = new Map(
    activities.map((activity) => [activity.managerId, activity]),
  );

  return data.managers
    .map((manager) => ({
      managerId: manager.id,
      managerName: manager.displayName,
      isActive: activityByManagerId.get(manager.id)?.isActive ?? false,
    }))
    .sort((first, second) => {
      if (first.isActive !== second.isActive) {
        return first.isActive ? -1 : 1;
      }

      return first.managerName.localeCompare(second.managerName);
    });
};

const getDefaultFirstManagerId = (
  managers: HeadToHeadManagerOption[],
): EntityId | null =>
  managers.find((manager) => manager.managerId === PREFERRED_FIRST_MANAGER_ID)
    ?.managerId ??
  managers.find((manager) => manager.isActive)?.managerId ??
  managers[0]?.managerId ??
  null;

const getDefaultSecondManagerId = (
  managers: HeadToHeadManagerOption[],
  firstManagerId: EntityId | null,
): EntityId | null =>
  managers.find(
    (manager) =>
      manager.managerId === PREFERRED_SECOND_MANAGER_ID &&
      manager.managerId !== firstManagerId,
  )?.managerId ??
  managers.find(
    (manager) => manager.isActive && manager.managerId !== firstManagerId,
  )?.managerId ??
  managers.find((manager) => manager.managerId !== firstManagerId)?.managerId ??
  null;

const getManagerById = (
  managers: HeadToHeadManagerOption[],
  managerId: EntityId,
) => managers.find((manager) => manager.managerId === managerId);

const getDirectionalGames = (
  gameResults: GameResult[],
  managerId: EntityId,
  opponentManagerId: EntityId,
) =>
  gameResults.filter(
    (game) =>
      game.managerId === managerId &&
      game.opponentManagerId === opponentManagerId,
  );

const getSummariesByScope = (
  firstGames: GameResult[],
  secondGames: GameResult[],
): Record<GameScope, HeadToHeadScopeSummary> =>
  GAME_SCOPES.reduce(
    (summaries, scope) => {
      const scopedFirstGames = filterGameResultsByScope(firstGames, scope);
      const scopedSecondGames = filterGameResultsByScope(secondGames, scope);

      return {
        ...summaries,
        [scope]: {
          scope,
          games: scopedFirstGames.length,
          first: summarizeManagerGames(scopedFirstGames),
          second: summarizeManagerGames(scopedSecondGames),
        },
      };
    },
    {} as Record<GameScope, HeadToHeadScopeSummary>,
  );

export const getHeadToHeadRivalryProfile = (
  data: LeagueData,
  firstManagerId: EntityId,
  secondManagerId: EntityId,
  gameResults = buildGameResults(data),
): HeadToHeadRivalryProfile | null => {
  if (firstManagerId === secondManagerId) {
    return null;
  }

  const managers = getManagerOptions(data);
  const firstManager = getManagerById(managers, firstManagerId);
  const secondManager = getManagerById(managers, secondManagerId);

  if (!firstManager || !secondManager) {
    return null;
  }

  const firstGames = getDirectionalGames(
    gameResults,
    firstManagerId,
    secondManagerId,
  );
  const secondGames = getDirectionalGames(
    gameResults,
    secondManagerId,
    firstManagerId,
  );

  return {
    firstManagerId,
    firstManagerName: firstManager.managerName,
    firstIsActive: firstManager.isActive,
    secondManagerId,
    secondManagerName: secondManager.managerName,
    secondIsActive: secondManager.isActive,
    summariesByScope: getSummariesByScope(firstGames, secondGames),
    games: firstGames.map(toHeadToHeadGameRow).sort(compareHeadToHeadGamesAscending),
  };
};

export const getHeadToHeadProfile = (data: LeagueData): HeadToHeadProfile => {
  const managers = getManagerOptions(data);
  const gameResults = buildGameResults(data);
  const defaultFirstManagerId = getDefaultFirstManagerId(managers);
  const defaultSecondManagerId = getDefaultSecondManagerId(
    managers,
    defaultFirstManagerId,
  );
  const rivalries = managers.flatMap((firstManager) =>
    managers.flatMap((secondManager) => {
      const rivalry = getHeadToHeadRivalryProfile(
        data,
        firstManager.managerId,
        secondManager.managerId,
        gameResults,
      );

      return rivalry ? [rivalry] : [];
    }),
  );

  return {
    managers,
    defaultFirstManagerId,
    defaultSecondManagerId,
    rivalries,
  };
};
