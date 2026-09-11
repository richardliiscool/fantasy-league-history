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

export type TrophyTallyRow = {
  managerId: EntityId;
  managerName: string;
  gold: number;
  silver: number;
  bronze: number;
  totalPodiums: number;
  firstPlaceYears: number[];
  secondPlaceYears: number[];
  thirdPlaceYears: number[];
};

export type RecordsProfile = {
  seasons: RecordsSeason[];
  trophyTallies: TrophyTallyRow[];
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

const emptyTrophyTally = (
  managerId: EntityId,
  managerName: string,
): TrophyTallyRow => ({
  managerId,
  managerName,
  gold: 0,
  silver: 0,
  bronze: 0,
  totalPodiums: 0,
  firstPlaceYears: [],
  secondPlaceYears: [],
  thirdPlaceYears: [],
});

const addPodiumFinish = (
  tally: TrophyTallyRow,
  finish: number,
  seasonYear: number,
) => {
  if (finish === 1) {
    tally.gold += 1;
    tally.firstPlaceYears.push(seasonYear);
  } else if (finish === 2) {
    tally.silver += 1;
    tally.secondPlaceYears.push(seasonYear);
  } else if (finish === 3) {
    tally.bronze += 1;
    tally.thirdPlaceYears.push(seasonYear);
  }

  tally.totalPodiums = tally.gold + tally.silver + tally.bronze;
};

const getTrophyTallies = (data: LeagueData): TrophyTallyRow[] => {
  const managerById = new Map(
    data.managers.map((manager) => [manager.id, manager]),
  );
  const seasonById = new Map(
    data.seasons.map((season) => [season.id, season]),
  );
  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const tallies = new Map<EntityId, TrophyTallyRow>();
  const countedPlacements = new Set<string>();

  for (const matchup of data.matchups) {
    if (!matchup.isFinalSeedingGame || !matchup.finalStanding) {
      continue;
    }

    const season = seasonById.get(matchup.seasonId);

    if (!season) {
      throw new Error(`Missing season for matchup "${matchup.id}".`);
    }

    const placements = [
      {
        score: matchup.scores[0],
        finish: matchup.finalStanding.firstTeamFinish,
      },
      {
        score: matchup.scores[1],
        finish: matchup.finalStanding.secondTeamFinish,
      },
    ];

    for (const placement of placements) {
      if (![1, 2, 3].includes(placement.finish)) {
        continue;
      }

      const team = teamById.get(placement.score.teamId);

      if (!team) {
        throw new Error(`Missing team for score "${placement.score.teamId}".`);
      }

      const manager = managerById.get(team.managerId);

      if (!manager) {
        throw new Error(`Missing manager for team "${team.id}".`);
      }

      const placementKey = `${season.id}:${manager.id}`;

      if (countedPlacements.has(placementKey)) {
        continue;
      }

      countedPlacements.add(placementKey);

      const existingTally =
        tallies.get(manager.id) ??
        emptyTrophyTally(manager.id, manager.displayName);
      addPodiumFinish(existingTally, placement.finish, season.year);
      tallies.set(manager.id, existingTally);
    }
  }

  return Array.from(tallies.values()).sort(
    (first, second) =>
      second.gold - first.gold ||
      second.silver - first.silver ||
      second.bronze - first.bronze ||
      second.totalPodiums - first.totalPodiums ||
      first.managerName.localeCompare(second.managerName),
  );
};

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
    trophyTallies: getTrophyTallies(data),
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
