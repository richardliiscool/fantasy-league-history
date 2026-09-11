import type { EntityId, LeagueData, MatchupGameType } from "../domain/types";
import {
  buildGameResults,
  getLeagueRecords,
  isRecordEligibleGame,
  type GameOutcome,
  type GameResult,
  type LeagueRecords,
} from "./leagueStats";
import { getManagerActivities, type ManagerActivity } from "./managerActivity";

export type ManagerRecordSummary = {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  averagePointsFor: number;
  averagePointsAgainst: number;
  highestScore: number | null;
  lowestScore: number | null;
};

export type ManagerGameSummary = {
  matchupId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  opponentManagerId: EntityId;
  opponentManagerName: string;
  pointsFor: number;
  pointsAgainst: number;
  margin: number;
  outcome: GameOutcome;
};

export type ManagerStreak = {
  outcome: Extract<GameOutcome, "win" | "loss">;
  games: number;
  start: ManagerGameSummary;
  end: ManagerGameSummary;
};

export type ManagerSeasonSplit = {
  seasonId: EntityId;
  seasonYear: number;
  regular: ManagerRecordSummary;
  playoff: ManagerRecordSummary;
  consolation: ManagerRecordSummary;
  official: ManagerRecordSummary;
};

export type ManagerSeasonMark = {
  seasonYear: number;
  record: ManagerRecordSummary;
};

export type ManagerHeadToHeadSummary = {
  opponentManagerId: EntityId;
  opponentManagerName: string;
  opponentIsActive: boolean;
  record: ManagerRecordSummary;
};

export type ManagerProfile = {
  managerId: EntityId;
  managerName: string;
  isActive: boolean;
  lastSeasonYear: number | null;
  seasonsPlayed: number;
  seasonYears: number[];
  career: ManagerRecordSummary;
  regularSeason: ManagerRecordSummary;
  playoffs: ManagerRecordSummary;
  consolation: ManagerRecordSummary;
  records: LeagueRecords;
  bestRegularSeason: ManagerSeasonMark | null;
  worstRegularSeason: ManagerSeasonMark | null;
  longestWinningStreak: ManagerStreak | null;
  longestLosingStreak: ManagerStreak | null;
  seasonSplits: ManagerSeasonSplit[];
  headToHead: ManagerHeadToHeadSummary[];
  recentGames: ManagerGameSummary[];
};

const roundTo = (value: number, places = 1) => Number(value.toFixed(places));

const GAME_TYPE_SORT_ORDER: Record<MatchupGameType, number> = {
  regular: 1,
  playoff: 2,
  consolation: 3,
};

const emptyRecord = (): ManagerRecordSummary => ({
  games: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  winPercentage: 0,
  pointsFor: 0,
  pointsAgainst: 0,
  averagePointsFor: 0,
  averagePointsAgainst: 0,
  highestScore: null,
  lowestScore: null,
});

export const summarizeManagerGames = (
  games: GameResult[],
): ManagerRecordSummary => {
  const record = emptyRecord();

  for (const game of games) {
    record.games += 1;
    record.pointsFor = roundTo(record.pointsFor + game.pointsFor, 2);
    record.pointsAgainst = roundTo(
      record.pointsAgainst + game.pointsAgainst,
      2,
    );
    record.highestScore =
      record.highestScore === null
        ? game.pointsFor
        : Math.max(record.highestScore, game.pointsFor);
    record.lowestScore =
      record.lowestScore === null
        ? game.pointsFor
        : Math.min(record.lowestScore, game.pointsFor);

    if (game.outcome === "win") {
      record.wins += 1;
    } else if (game.outcome === "loss") {
      record.losses += 1;
    } else {
      record.ties += 1;
    }
  }

  return {
    ...record,
    winPercentage:
      record.games === 0
        ? 0
        : roundTo((record.wins + record.ties * 0.5) / record.games, 3),
    averagePointsFor:
      record.games === 0 ? 0 : roundTo(record.pointsFor / record.games, 1),
    averagePointsAgainst:
      record.games === 0
        ? 0
        : roundTo(record.pointsAgainst / record.games, 1),
  };
};

const compareGamesAscending = (first: GameResult, second: GameResult) => {
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
};

const compareGamesDescending = (first: GameResult, second: GameResult) =>
  compareGamesAscending(second, first);

const toManagerGameSummary = (game: GameResult): ManagerGameSummary => ({
  matchupId: game.matchupId,
  seasonYear: game.seasonYear,
  weekNumber: game.weekNumber,
  gameType: game.gameType,
  opponentManagerId: game.opponentManagerId,
  opponentManagerName: game.opponentManagerName,
  pointsFor: game.pointsFor,
  pointsAgainst: game.pointsAgainst,
  margin: game.margin,
  outcome: game.outcome,
});

const getLongestStreak = (
  games: GameResult[],
  outcome: Extract<GameOutcome, "win" | "loss">,
): ManagerStreak | null => {
  let current: GameResult[] = [];
  let best: GameResult[] = [];

  for (const game of [...games].sort(compareGamesAscending)) {
    if (game.outcome === outcome) {
      current = [...current, game];
    } else {
      current = [];
    }

    if (current.length > best.length) {
      best = current;
    }
  }

  if (best.length === 0) {
    return null;
  }

  const start = best[0];
  const end = best[best.length - 1];

  return {
    outcome,
    games: best.length,
    start: toManagerGameSummary(start),
    end: toManagerGameSummary(end),
  };
};

const getSeasonYearsForManager = (data: LeagueData, managerId: EntityId) => {
  const seasonYears = new Map<EntityId, number>(
    data.seasons.map((season) => [season.id, season.year]),
  );

  return Array.from(
    new Set(
      data.teams
        .filter((team) => team.managerId === managerId)
        .map((team) => seasonYears.get(team.seasonId))
        .filter((year): year is number => year !== undefined),
    ),
  ).sort((first, second) => first - second);
};

const rankRegularSeason = (
  first: ManagerSeasonSplit,
  second: ManagerSeasonSplit,
) => {
  if (first.regular.winPercentage !== second.regular.winPercentage) {
    return first.regular.winPercentage - second.regular.winPercentage;
  }

  if (first.regular.wins !== second.regular.wins) {
    return first.regular.wins - second.regular.wins;
  }

  return first.regular.pointsFor - second.regular.pointsFor;
};

const getSeasonMark = (
  season: ManagerSeasonSplit | undefined,
): ManagerSeasonMark | null =>
  season
    ? {
        seasonYear: season.seasonYear,
        record: season.regular,
      }
    : null;

const getManagerHeadToHead = (
  officialGames: GameResult[],
  activityByManagerId: Map<EntityId, ManagerActivity>,
): ManagerHeadToHeadSummary[] => {
  const gamesByOpponent = new Map<EntityId, GameResult[]>();

  for (const game of officialGames) {
    gamesByOpponent.set(game.opponentManagerId, [
      ...(gamesByOpponent.get(game.opponentManagerId) ?? []),
      game,
    ]);
  }

  return Array.from(gamesByOpponent.entries())
    .map(([opponentManagerId, games]) => ({
      opponentManagerId,
      opponentManagerName: games[0].opponentManagerName,
      opponentIsActive:
        activityByManagerId.get(opponentManagerId)?.isActive ?? false,
      record: summarizeManagerGames(games),
    }))
    .sort((first, second) => {
      if (second.record.games !== first.record.games) {
        return second.record.games - first.record.games;
      }

      if (second.record.winPercentage !== first.record.winPercentage) {
        return second.record.winPercentage - first.record.winPercentage;
      }

      return first.opponentManagerName.localeCompare(second.opponentManagerName);
    });
};

export const getManagerProfile = (
  data: LeagueData,
  managerId: EntityId,
  gameResults = buildGameResults(data),
): ManagerProfile | null => {
  const manager = data.managers.find((item) => item.id === managerId);

  if (!manager) {
    return null;
  }

  const activities = getManagerActivities(data);
  const activityByManagerId = new Map(
    activities.map((activity) => [activity.managerId, activity]),
  );
  const managerActivity = activityByManagerId.get(managerId);
  const managerGames = gameResults.filter((game) => game.managerId === managerId);
  const officialGames = managerGames.filter(isRecordEligibleGame);
  const regularSeasonGames = managerGames.filter(
    (game) => game.gameType === "regular",
  );
  const playoffGames = managerGames.filter((game) => game.gameType === "playoff");
  const consolationGames = managerGames.filter(
    (game) => game.gameType === "consolation",
  );
  const seasonYears = getSeasonYearsForManager(data, managerId);
  const seasonSplits = seasonYears.map((seasonYear) => {
    const season = data.seasons.find((item) => item.year === seasonYear);
    const seasonGames = managerGames.filter(
      (game) => game.seasonYear === seasonYear,
    );
    const regular = summarizeManagerGames(
      seasonGames.filter((game) => game.gameType === "regular"),
    );
    const playoff = summarizeManagerGames(
      seasonGames.filter((game) => game.gameType === "playoff"),
    );
    const consolation = summarizeManagerGames(
      seasonGames.filter((game) => game.gameType === "consolation"),
    );

    return {
      seasonId: season?.id ?? `season-${seasonYear}`,
      seasonYear,
      regular,
      playoff,
      consolation,
      official: summarizeManagerGames(
        seasonGames.filter((game) => isRecordEligibleGame(game)),
      ),
    };
  });
  const rankedRegularSeasons = seasonSplits
    .filter((season) => season.regular.games > 0)
    .sort(rankRegularSeason);

  return {
    managerId,
    managerName: manager.displayName,
    isActive: managerActivity?.isActive ?? false,
    lastSeasonYear: managerActivity?.lastSeasonYear ?? null,
    seasonsPlayed: seasonYears.length,
    seasonYears,
    career: summarizeManagerGames(officialGames),
    regularSeason: summarizeManagerGames(regularSeasonGames),
    playoffs: summarizeManagerGames(playoffGames),
    consolation: summarizeManagerGames(consolationGames),
    records: getLeagueRecords(officialGames),
    bestRegularSeason: getSeasonMark(rankedRegularSeasons.at(-1)),
    worstRegularSeason: getSeasonMark(rankedRegularSeasons.at(0)),
    longestWinningStreak: getLongestStreak(officialGames, "win"),
    longestLosingStreak: getLongestStreak(officialGames, "loss"),
    seasonSplits,
    headToHead: getManagerHeadToHead(officialGames, activityByManagerId),
    recentGames: [...officialGames]
      .sort(compareGamesDescending)
      .slice(0, 10)
      .map(toManagerGameSummary),
  };
};
