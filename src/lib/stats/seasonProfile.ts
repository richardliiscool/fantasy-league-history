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
import {
  buildGameResults,
  getManagerStandings,
  type GameResult,
  type ManagerStanding,
} from "./leagueStats";
import {
  filterGameResultsByScope,
  type GameScope,
} from "./gameFilters";

export type SeasonTeamSummary = {
  teamId: EntityId;
  teamName: string;
  managerId: EntityId;
  managerName: string;
};

export type SeasonStandingRow = ManagerStanding & {
  teamId: EntityId | null;
  teamName: string | null;
};

export type SeasonMatchupParticipant = {
  teamId: EntityId;
  teamName: string;
  managerId: EntityId;
  managerName: string;
  points: number;
  finalFinish: number | null;
};

export type SeasonMatchupSummary = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekId: EntityId;
  weekNumber: number;
  gameType: MatchupGameType;
  isFinalSeedingGame: boolean;
  finalSeedingRank: number | null;
  first: SeasonMatchupParticipant;
  second: SeasonMatchupParticipant;
  winner: SeasonMatchupParticipant | null;
  margin: number;
};

export type SeasonScoreRecord = {
  matchup: SeasonMatchupSummary;
  featured: SeasonMatchupParticipant;
  opponent: SeasonMatchupParticipant;
  points: number;
};

export type SeasonMarginRecord = {
  matchup: SeasonMatchupSummary;
  featured: SeasonMatchupParticipant;
  opponent: SeasonMatchupParticipant;
  margin: number;
};

export type SeasonGameRecord = {
  matchup: SeasonMatchupSummary;
  margin: number;
};

export type SeasonRecordSet = {
  highestScore: SeasonScoreRecord | null;
  lowestScore: SeasonScoreRecord | null;
  biggestWin: SeasonMarginRecord | null;
  biggestLoss: SeasonMarginRecord | null;
  closestGame: SeasonGameRecord | null;
};

export type SeasonFinalStandingRow = SeasonTeamSummary & {
  finish: number;
  regular: ManagerStanding;
  playoffs: ManagerStanding;
  official: ManagerStanding;
};

export type SeasonProfile = {
  seasonId: EntityId;
  seasonYear: number;
  label: string;
  teams: SeasonTeamSummary[];
  champions: SeasonTeamSummary[];
  championshipMatchup: SeasonMatchupSummary | null;
  finalStandings: SeasonFinalStandingRow[];
  matchupCount: number;
  officialMatchupCount: number;
  regularMatchupCount: number;
  playoffMatchupCount: number;
  consolationMatchupCount: number;
  records: SeasonRecordSet;
  standingsByScope: Record<GameScope, SeasonStandingRow[]>;
  matchups: SeasonMatchupSummary[];
};

type SeasonIndexes = {
  managers: Map<EntityId, Manager>;
  teams: Map<EntityId, FantasyTeam>;
  weeks: Map<EntityId, Week>;
};

const GAME_TYPE_SORT_ORDER: Record<MatchupGameType, number> = {
  regular: 1,
  playoff: 2,
  consolation: 3,
};

const roundTo = (value: number, places = 1) => Number(value.toFixed(places));

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

const buildSeasonIndexes = (data: LeagueData): SeasonIndexes => ({
  managers: indexById(data.managers),
  teams: indexById(data.teams),
  weeks: indexById(data.weeks),
});

const toSeasonTeamSummary = (
  team: FantasyTeam,
  managers: Map<EntityId, Manager>,
): SeasonTeamSummary => {
  const manager = requireFromIndex(managers, team.managerId, "manager");

  return {
    teamId: team.id,
    teamName: team.name,
    managerId: manager.id,
    managerName: manager.displayName,
  };
};

const toSeasonStandingRows = (
  data: LeagueData,
  seasonTeams: SeasonTeamSummary[],
  gameResults: GameResult[],
): SeasonStandingRow[] => {
  const teamByManagerId = new Map(
    seasonTeams.map((team) => [team.managerId, team]),
  );

  return getManagerStandings(data, gameResults)
    .filter((standing) => teamByManagerId.has(standing.managerId))
    .map((standing) => {
      const team = teamByManagerId.get(standing.managerId);

      return {
        ...standing,
        teamId: team?.teamId ?? null,
        teamName: team?.teamName ?? null,
      };
    });
};

const toSeasonMatchupParticipant = (
  score: Score,
  indexes: SeasonIndexes,
  finalFinish: number | null,
): SeasonMatchupParticipant => {
  const team = requireFromIndex(indexes.teams, score.teamId, "team");
  const manager = requireFromIndex(indexes.managers, team.managerId, "manager");

  return {
    teamId: team.id,
    teamName: team.name,
    managerId: manager.id,
    managerName: manager.displayName,
    points: score.points,
    finalFinish,
  };
};

const toSeasonMatchupSummary = (
  matchup: Matchup,
  season: Season,
  indexes: SeasonIndexes,
): SeasonMatchupSummary => {
  const week = requireFromIndex(indexes.weeks, matchup.weekId, "week");
  const [firstScore, secondScore] = matchup.scores;
  const first = toSeasonMatchupParticipant(
    firstScore,
    indexes,
    matchup.finalStanding?.firstTeamFinish ?? null,
  );
  const second = toSeasonMatchupParticipant(
    secondScore,
    indexes,
    matchup.finalStanding?.secondTeamFinish ?? null,
  );
  const winner =
    first.points === second.points
      ? null
      : first.points > second.points
        ? first
        : second;

  return {
    matchupId: matchup.id,
    seasonId: season.id,
    seasonYear: season.year,
    weekId: week.id,
    weekNumber: week.number,
    gameType: matchup.gameType,
    isFinalSeedingGame: matchup.isFinalSeedingGame ?? false,
    finalSeedingRank: matchup.finalSeedingRank ?? null,
    first,
    second,
    winner,
    margin: roundTo(Math.abs(first.points - second.points), 2),
  };
};

const compareMatchupsAscending = (
  first: SeasonMatchupSummary,
  second: SeasonMatchupSummary,
) => {
  if (first.weekNumber !== second.weekNumber) {
    return first.weekNumber - second.weekNumber;
  }

  if (first.gameType !== second.gameType) {
    return GAME_TYPE_SORT_ORDER[first.gameType] - GAME_TYPE_SORT_ORDER[second.gameType];
  }

  return first.matchupId.localeCompare(second.matchupId);
};

const countMatchupsByType = (
  matchups: Matchup[],
  gameType: MatchupGameType,
) => matchups.filter((matchup) => matchup.gameType === gameType).length;

const isOfficialMatchup = (matchup: Pick<SeasonMatchupSummary, "gameType">) =>
  matchup.gameType === "regular" || matchup.gameType === "playoff";

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

const getSeasonScoreRecords = (
  matchups: SeasonMatchupSummary[],
): SeasonScoreRecord[] =>
  matchups.flatMap((matchup) => [
    {
      matchup,
      featured: matchup.first,
      opponent: matchup.second,
      points: matchup.first.points,
    },
    {
      matchup,
      featured: matchup.second,
      opponent: matchup.first,
      points: matchup.second.points,
    },
  ]);

const getSeasonWinRecords = (
  matchups: SeasonMatchupSummary[],
): SeasonMarginRecord[] =>
  matchups.flatMap((matchup) => {
    if (!matchup.winner) {
      return [];
    }

    const loser =
      matchup.winner.managerId === matchup.first.managerId
        ? matchup.second
        : matchup.first;

    return [
      {
        matchup,
        featured: matchup.winner,
        opponent: loser,
        margin: matchup.margin,
      },
    ];
  });

const getSeasonLossRecords = (
  matchups: SeasonMatchupSummary[],
): SeasonMarginRecord[] =>
  getSeasonWinRecords(matchups).map((record) => ({
    matchup: record.matchup,
    featured: record.opponent,
    opponent: record.featured,
    margin: record.margin,
  }));

const getSeasonRecords = (
  matchups: SeasonMatchupSummary[],
): SeasonRecordSet => {
  const officialMatchups = matchups.filter(isOfficialMatchup);
  const scoreRecords = getSeasonScoreRecords(officialMatchups);
  const winRecords = getSeasonWinRecords(officialMatchups);
  const lossRecords = getSeasonLossRecords(officialMatchups);
  const closestGame = minBy(officialMatchups, (matchup) => matchup.margin);

  return {
    highestScore: maxBy(scoreRecords, (record) => record.points),
    lowestScore: minBy(scoreRecords, (record) => record.points),
    biggestWin: maxBy(winRecords, (record) => record.margin),
    biggestLoss: maxBy(lossRecords, (record) => record.margin),
    closestGame: closestGame
      ? { matchup: closestGame, margin: closestGame.margin }
      : null,
  };
};

const mapStandingsByManagerId = (standings: SeasonStandingRow[]) =>
  new Map(standings.map((standing) => [standing.managerId, standing]));

const requireStanding = (
  standings: Map<EntityId, SeasonStandingRow>,
  managerId: EntityId,
  label: string,
) => requireFromIndex(standings, managerId, label);

const getChampionshipMatchup = (matchups: SeasonMatchupSummary[]) =>
  matchups.find((matchup) => matchup.finalSeedingRank === 1) ??
  matchups.find(
    (matchup) =>
      matchup.first.finalFinish === 1 || matchup.second.finalFinish === 1,
  ) ??
  null;

const getChampions = (
  championshipMatchup: SeasonMatchupSummary | null,
): SeasonTeamSummary[] => {
  if (!championshipMatchup) {
    return [];
  }

  return [championshipMatchup.first, championshipMatchup.second]
    .filter((participant) => participant.finalFinish === 1)
    .map((participant) => ({
      teamId: participant.teamId,
      teamName: participant.teamName,
      managerId: participant.managerId,
      managerName: participant.managerName,
    }));
};

const getFinalStandings = (
  matchups: SeasonMatchupSummary[],
  standingsByScope: Record<GameScope, SeasonStandingRow[]>,
): SeasonFinalStandingRow[] => {
  const regularStandings = mapStandingsByManagerId(standingsByScope.regular);
  const playoffStandings = mapStandingsByManagerId(standingsByScope.playoff);
  const officialStandings = mapStandingsByManagerId(standingsByScope.official);
  const seenManagerIds = new Set<EntityId>();
  const finalStandingRows: Array<{
    sourceOrder: number;
    standing: SeasonFinalStandingRow;
  }> = [];

  for (const matchup of matchups.filter((item) => item.isFinalSeedingGame)) {
    for (const participant of [matchup.first, matchup.second]) {
      if (
        participant.finalFinish === null ||
        seenManagerIds.has(participant.managerId)
      ) {
        continue;
      }

      seenManagerIds.add(participant.managerId);
      finalStandingRows.push({
        sourceOrder: finalStandingRows.length,
        standing: {
          teamId: participant.teamId,
          teamName: participant.teamName,
          managerId: participant.managerId,
          managerName: participant.managerName,
          finish: participant.finalFinish,
          regular: requireStanding(
            regularStandings,
            participant.managerId,
            "regular standing",
          ),
          playoffs: requireStanding(
            playoffStandings,
            participant.managerId,
            "playoff standing",
          ),
          official: requireStanding(
            officialStandings,
            participant.managerId,
            "official standing",
          ),
        },
      });
    }
  }

  return finalStandingRows
    .sort(
      (first, second) =>
        first.standing.finish - second.standing.finish ||
        first.sourceOrder - second.sourceOrder,
    )
    .map((item) => item.standing);
};

export const getSeasonProfile = (
  data: LeagueData,
  seasonYear: number,
  gameResults = buildGameResults(data),
): SeasonProfile | null => {
  const season = data.seasons.find((item) => item.year === seasonYear);

  if (!season) {
    return null;
  }

  const indexes = buildSeasonIndexes(data);
  const rawSeasonTeams = data.teams.filter(
    (team) => team.seasonId === season.id,
  );
  const teams = rawSeasonTeams
    .map((team) => toSeasonTeamSummary(team, indexes.managers))
    .sort((first, second) => first.managerName.localeCompare(second.managerName));
  const seasonGameResults = gameResults.filter(
    (game) => game.seasonId === season.id,
  );
  const seasonMatchups = data.matchups.filter(
    (matchup) => matchup.seasonId === season.id,
  );
  const matchups = seasonMatchups
    .map((matchup) => toSeasonMatchupSummary(matchup, season, indexes))
    .sort(compareMatchupsAscending);
  const standingsByScope = (
    ["official", "regular", "playoff", "consolation"] satisfies GameScope[]
  ).reduce((scopes, scope) => {
    const scopedResults = filterGameResultsByScope(seasonGameResults, scope);

    return {
      ...scopes,
      [scope]: toSeasonStandingRows(data, teams, scopedResults),
    };
  }, {} as Record<GameScope, SeasonStandingRow[]>);
  const championshipMatchup = getChampionshipMatchup(matchups);
  const champions = getChampions(championshipMatchup);
  const finalStandings = getFinalStandings(matchups, standingsByScope);

  return {
    seasonId: season.id,
    seasonYear: season.year,
    label: season.label,
    teams,
    champions,
    championshipMatchup,
    finalStandings,
    matchupCount: seasonMatchups.length,
    officialMatchupCount:
      countMatchupsByType(seasonMatchups, "regular") +
      countMatchupsByType(seasonMatchups, "playoff"),
    regularMatchupCount: countMatchupsByType(seasonMatchups, "regular"),
    playoffMatchupCount: countMatchupsByType(seasonMatchups, "playoff"),
    consolationMatchupCount: countMatchupsByType(seasonMatchups, "consolation"),
    records: getSeasonRecords(matchups),
    standingsByScope,
    matchups,
  };
};
