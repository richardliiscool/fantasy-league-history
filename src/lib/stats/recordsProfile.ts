import type { EntityId, LeagueData, MatchupGameType } from "../domain/types";
import { filterGameResultsByScope, type GameScope } from "./gameFilters";
import {
  buildGameResults,
  getManagerStandings,
  type GameOutcome,
  type GameResult,
  type ManagerStanding,
} from "./leagueStats";

export type RecordGameScope = "all" | GameScope;

export type RecordsSeason = {
  seasonId: EntityId;
  seasonYear: number;
  label: string;
};

export type GameRecordRow = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  managerId: EntityId;
  managerName: string;
  teamName: string;
  opponentManagerId: EntityId;
  opponentManagerName: string;
  opponentTeamName: string;
  pointsFor: number;
  pointsAgainst: number;
  margin: number;
  outcome: GameOutcome;
};

export type MatchupRecordParticipant = {
  managerId: EntityId;
  managerName: string;
  teamName: string;
  points: number;
};

export type MatchupRecordRow = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  first: MatchupRecordParticipant;
  second: MatchupRecordParticipant;
  winner: MatchupRecordParticipant | null;
  margin: number;
};

export type SeasonPerformanceRow = ManagerStanding & {
  seasonId: EntityId;
  seasonYear: number;
  teamId: EntityId;
  teamName: string;
};

export type SeasonPerformanceRowsByScope = Record<
  GameScope,
  SeasonPerformanceRow[]
>;

export type RecordsProfile = {
  seasons: RecordsSeason[];
  gameRows: GameRecordRow[];
  matchupRows: MatchupRecordRow[];
  seasonPerformanceRowsByScope: SeasonPerformanceRowsByScope;
};

const GAME_TYPE_SORT_ORDER: Record<MatchupGameType, number> = {
  regular: 1,
  playoff: 2,
  consolation: 3,
};

const GAME_SCOPES = [
  "official",
  "regular",
  "playoff",
  "consolation",
] satisfies GameScope[];

const roundTo = (value: number, places = 2) => Number(value.toFixed(places));

const compareGamesAscending = (
  first: Pick<GameRecordRow, "seasonYear" | "weekNumber" | "gameType" | "matchupId">,
  second: Pick<GameRecordRow, "seasonYear" | "weekNumber" | "gameType" | "matchupId">,
) =>
  first.seasonYear - second.seasonYear ||
  first.weekNumber - second.weekNumber ||
  GAME_TYPE_SORT_ORDER[first.gameType] - GAME_TYPE_SORT_ORDER[second.gameType] ||
  first.matchupId.localeCompare(second.matchupId);

const toGameRecordRow = (game: GameResult): GameRecordRow => ({
  matchupId: game.matchupId,
  seasonId: game.seasonId,
  seasonYear: game.seasonYear,
  weekNumber: game.weekNumber,
  gameType: game.gameType,
  managerId: game.managerId,
  managerName: game.managerName,
  teamName: game.teamName,
  opponentManagerId: game.opponentManagerId,
  opponentManagerName: game.opponentManagerName,
  opponentTeamName: game.opponentTeamName,
  pointsFor: game.pointsFor,
  pointsAgainst: game.pointsAgainst,
  margin: game.margin,
  outcome: game.outcome,
});

const toParticipant = (game: GameResult): MatchupRecordParticipant => ({
  managerId: game.managerId,
  managerName: game.managerName,
  teamName: game.teamName,
  points: game.pointsFor,
});

const getMatchupRows = (gameResults: GameResult[]): MatchupRecordRow[] => {
  const gamesByMatchup = new Map<EntityId, GameResult[]>();

  for (const game of gameResults) {
    gamesByMatchup.set(game.matchupId, [
      ...(gamesByMatchup.get(game.matchupId) ?? []),
      game,
    ]);
  }

  return Array.from(gamesByMatchup.values())
    .map((games) => {
      const [firstGame, secondGame] = games;

      if (!firstGame || !secondGame) {
        throw new Error("Expected each matchup to have two game results.");
      }

      const first = toParticipant(firstGame);
      const second = toParticipant(secondGame);
      const winner =
        first.points === second.points
          ? null
          : first.points > second.points
            ? first
            : second;

      return {
        matchupId: firstGame.matchupId,
        seasonId: firstGame.seasonId,
        seasonYear: firstGame.seasonYear,
        weekNumber: firstGame.weekNumber,
        gameType: firstGame.gameType,
        first,
        second,
        winner,
        margin: roundTo(Math.abs(first.points - second.points)),
      };
    })
    .sort(compareGamesAscending);
};

const getSeasonPerformanceRows = (
  data: LeagueData,
  gameResults: GameResult[],
  scope: GameScope,
): SeasonPerformanceRow[] =>
  data.seasons.flatMap((season) => {
    const seasonTeams = data.teams.filter((team) => team.seasonId === season.id);
    const teamByManagerId = new Map(
      seasonTeams.map((team) => [team.managerId, team]),
    );
    const scopedResults = filterGameResultsByScope(
      gameResults.filter((game) => game.seasonId === season.id),
      scope,
    );

    return getManagerStandings(data, scopedResults)
      .filter((standing) => standing.games > 0)
      .filter((standing) => teamByManagerId.has(standing.managerId))
      .map((standing) => {
        const team = teamByManagerId.get(standing.managerId);

        if (!team) {
          throw new Error(`Missing team for manager "${standing.managerId}".`);
        }

        return {
          ...standing,
          seasonId: season.id,
          seasonYear: season.year,
          teamId: team.id,
          teamName: team.name,
        };
      });
  });

export const matchesRecordGameScope = (
  row: Pick<GameRecordRow | MatchupRecordRow, "gameType">,
  scope: RecordGameScope,
) => {
  if (scope === "all") {
    return true;
  }

  if (scope === "official") {
    return row.gameType === "regular" || row.gameType === "playoff";
  }

  return row.gameType === scope;
};

export const getRecordsProfile = (data: LeagueData): RecordsProfile => {
  const gameResults = buildGameResults(data);

  return {
    seasons: data.seasons
      .map((season) => ({
        seasonId: season.id,
        seasonYear: season.year,
        label: season.label,
      }))
      .sort((first, second) => first.seasonYear - second.seasonYear),
    gameRows: gameResults.map(toGameRecordRow).sort(compareGamesAscending),
    matchupRows: getMatchupRows(gameResults),
    seasonPerformanceRowsByScope: GAME_SCOPES.reduce(
      (rowsByScope, scope) => ({
        ...rowsByScope,
        [scope]: getSeasonPerformanceRows(data, gameResults, scope),
      }),
      {} as SeasonPerformanceRowsByScope,
    ),
  };
};
