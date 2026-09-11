import type {
  EntityId,
  FantasyTeam,
  LeagueData,
  Manager,
  Matchup,
  MatchupGameType,
  Score,
  Season,
  Week,
} from "../domain/types";

export type GameOutcome = "win" | "loss" | "tie";

export const RECORD_ELIGIBLE_GAME_TYPES: MatchupGameType[] = [
  "regular",
  "playoff",
];

export type GameResult = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekId: EntityId;
  weekNumber: number;
  gameType: MatchupGameType;
  isFinalSeedingGame: boolean;
  teamId: EntityId;
  teamName: string;
  managerId: EntityId;
  managerName: string;
  opponentTeamId: EntityId;
  opponentTeamName: string;
  opponentManagerId: EntityId;
  opponentManagerName: string;
  pointsFor: number;
  pointsAgainst: number;
  margin: number;
  outcome: GameOutcome;
};

export type ManagerStanding = {
  managerId: EntityId;
  managerName: string;
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

export type ScoreRecord = {
  managerName: string;
  teamName: string;
  seasonYear: number;
  weekNumber: number;
  points: number;
  opponentManagerName: string;
  opponentPoints: number;
};

export type MarginRecord = ScoreRecord & {
  margin: number;
};

export type LeagueRecords = {
  highestScore: ScoreRecord | null;
  lowestScore: ScoreRecord | null;
  biggestWin: MarginRecord | null;
  biggestLoss: MarginRecord | null;
  closestWin: MarginRecord | null;
  closestLoss: MarginRecord | null;
};

export type LeagueSummary = {
  managerCount: number;
  seasonCount: number;
  matchupCount: number;
  gameCount: number;
  standings: ManagerStanding[];
  records: LeagueRecords;
};

type StandingAccumulator = {
  managerId: EntityId;
  managerName: string;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  highestScore: number | null;
  lowestScore: number | null;
};

type LeagueIndexes = {
  managers: Map<EntityId, Manager>;
  seasons: Map<EntityId, Season>;
  teams: Map<EntityId, FantasyTeam>;
  weeks: Map<EntityId, Week>;
};

const roundTo = (value: number, places = 1) =>
  Number(value.toFixed(places));

const indexById = <T extends { id: EntityId }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

const requireFromIndex = <T>(
  index: Map<EntityId, T>,
  id: EntityId,
  label: string,
) => {
  const value = index.get(id);

  if (!value) {
    throw new Error(`Missing ${label} for id "${id}"`);
  }

  return value;
};

const buildIndexes = (data: LeagueData): LeagueIndexes => ({
  managers: indexById(data.managers),
  seasons: indexById(data.seasons),
  teams: indexById(data.teams),
  weeks: indexById(data.weeks),
});

const getOutcome = (pointsFor: number, pointsAgainst: number): GameOutcome => {
  if (pointsFor > pointsAgainst) {
    return "win";
  }

  if (pointsFor < pointsAgainst) {
    return "loss";
  }

  return "tie";
};

const toGameResult = (
  matchup: Matchup,
  season: Season,
  week: Week,
  indexes: LeagueIndexes,
  score: Score,
  opponentScore: Score,
): GameResult => {
  const team = requireFromIndex(indexes.teams, score.teamId, "team");
  const opponentTeam = requireFromIndex(
    indexes.teams,
    opponentScore.teamId,
    "opponent team",
  );
  const manager = requireFromIndex(indexes.managers, team.managerId, "manager");
  const opponentManager = requireFromIndex(
    indexes.managers,
    opponentTeam.managerId,
    "opponent manager",
  );
  const margin = roundTo(score.points - opponentScore.points, 2);

  return {
    matchupId: matchup.id,
    seasonId: season.id,
    seasonYear: season.year,
    weekId: week.id,
    weekNumber: week.number,
    gameType: matchup.gameType,
    isFinalSeedingGame: matchup.isFinalSeedingGame ?? false,
    teamId: team.id,
    teamName: team.name,
    managerId: manager.id,
    managerName: manager.displayName,
    opponentTeamId: opponentTeam.id,
    opponentTeamName: opponentTeam.name,
    opponentManagerId: opponentManager.id,
    opponentManagerName: opponentManager.displayName,
    pointsFor: score.points,
    pointsAgainst: opponentScore.points,
    margin,
    outcome: getOutcome(score.points, opponentScore.points),
  };
};

export const buildGameResults = (data: LeagueData): GameResult[] => {
  const indexes = buildIndexes(data);

  return data.matchups.flatMap((matchup) => {
    const season = requireFromIndex(
      indexes.seasons,
      matchup.seasonId,
      "season",
    );
    const week = requireFromIndex(indexes.weeks, matchup.weekId, "week");
    const [firstScore, secondScore] = matchup.scores;

    return [
      toGameResult(matchup, season, week, indexes, firstScore, secondScore),
      toGameResult(matchup, season, week, indexes, secondScore, firstScore),
    ];
  });
};

export const getManagerStandings = (
  data: LeagueData,
  gameResults = buildGameResults(data),
): ManagerStanding[] => {
  const standings = new Map<EntityId, StandingAccumulator>(
    data.managers.map((manager) => [
      manager.id,
      {
        managerId: manager.id,
        managerName: manager.displayName,
        games: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        highestScore: null,
        lowestScore: null,
      },
    ]),
  );

  for (const game of gameResults) {
    const standing = standings.get(game.managerId);

    if (!standing) {
      continue;
    }

    standing.games += 1;
    standing.pointsFor = roundTo(standing.pointsFor + game.pointsFor, 2);
    standing.pointsAgainst = roundTo(
      standing.pointsAgainst + game.pointsAgainst,
      2,
    );
    standing.highestScore =
      standing.highestScore === null
        ? game.pointsFor
        : Math.max(standing.highestScore, game.pointsFor);
    standing.lowestScore =
      standing.lowestScore === null
        ? game.pointsFor
        : Math.min(standing.lowestScore, game.pointsFor);

    if (game.outcome === "win") {
      standing.wins += 1;
    } else if (game.outcome === "loss") {
      standing.losses += 1;
    } else {
      standing.ties += 1;
    }
  }

  return Array.from(standings.values())
    .map((standing) => ({
      ...standing,
      winPercentage:
        standing.games === 0
          ? 0
          : roundTo((standing.wins + standing.ties * 0.5) / standing.games, 3),
      averagePointsFor:
        standing.games === 0
          ? 0
          : roundTo(standing.pointsFor / standing.games, 1),
      averagePointsAgainst:
        standing.games === 0
          ? 0
          : roundTo(standing.pointsAgainst / standing.games, 1),
    }))
    .sort((first, second) => {
      if (second.winPercentage !== first.winPercentage) {
        return second.winPercentage - first.winPercentage;
      }

      return second.pointsFor - first.pointsFor;
    });
};

export const isRecordEligibleGame = (game: Pick<GameResult, "gameType">) =>
  RECORD_ELIGIBLE_GAME_TYPES.includes(game.gameType);

const maxBy = <T>(items: T[], score: (item: T) => number) =>
  items.reduce<T | null>(
    (best, item) => (best === null || score(item) > score(best) ? item : best),
    null,
  );

const minBy = <T>(items: T[], score: (item: T) => number) =>
  items.reduce<T | null>(
    (best, item) => (best === null || score(item) < score(best) ? item : best),
    null,
  );

const toScoreRecord = (game: GameResult): ScoreRecord => ({
  managerName: game.managerName,
  teamName: game.teamName,
  seasonYear: game.seasonYear,
  weekNumber: game.weekNumber,
  points: game.pointsFor,
  opponentManagerName: game.opponentManagerName,
  opponentPoints: game.pointsAgainst,
});

const toMarginRecord = (game: GameResult): MarginRecord => ({
  ...toScoreRecord(game),
  margin: roundTo(Math.abs(game.margin), 1),
});

export const getLeagueRecords = (gameResults: GameResult[]): LeagueRecords => {
  const wins = gameResults.filter((game) => game.outcome === "win");
  const losses = gameResults.filter((game) => game.outcome === "loss");
  const highestScore = maxBy(gameResults, (game) => game.pointsFor);
  const lowestScore = minBy(gameResults, (game) => game.pointsFor);
  const biggestWin = maxBy(wins, (game) => game.margin);
  const biggestLoss = maxBy(losses, (game) => Math.abs(game.margin));
  const closestWin = minBy(wins, (game) => game.margin);
  const closestLoss = minBy(losses, (game) => Math.abs(game.margin));

  return {
    highestScore: highestScore ? toScoreRecord(highestScore) : null,
    lowestScore: lowestScore ? toScoreRecord(lowestScore) : null,
    biggestWin: biggestWin ? toMarginRecord(biggestWin) : null,
    biggestLoss: biggestLoss ? toMarginRecord(biggestLoss) : null,
    closestWin: closestWin ? toMarginRecord(closestWin) : null,
    closestLoss: closestLoss ? toMarginRecord(closestLoss) : null,
  };
};

export const summarizeLeague = (
  data: LeagueData,
  gameResults = buildGameResults(data),
): LeagueSummary => {

  return {
    managerCount: data.managers.length,
    seasonCount: data.seasons.length,
    matchupCount: data.matchups.length,
    gameCount: gameResults.length,
    standings: getManagerStandings(data, gameResults),
    records: getLeagueRecords(gameResults),
  };
};
