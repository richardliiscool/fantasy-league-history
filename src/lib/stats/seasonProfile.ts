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
  getLeagueRecords,
  getManagerStandings,
  type GameResult,
  type LeagueRecords,
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
};

export type SeasonMatchupSummary = {
  matchupId: EntityId;
  seasonId: EntityId;
  seasonYear: number;
  weekId: EntityId;
  weekNumber: number;
  gameType: MatchupGameType;
  isFinalSeedingGame: boolean;
  first: SeasonMatchupParticipant;
  second: SeasonMatchupParticipant;
  winner: SeasonMatchupParticipant | null;
  margin: number;
};

export type SeasonProfile = {
  seasonId: EntityId;
  seasonYear: number;
  label: string;
  teams: SeasonTeamSummary[];
  champion: SeasonTeamSummary | null;
  matchupCount: number;
  officialMatchupCount: number;
  regularMatchupCount: number;
  playoffMatchupCount: number;
  consolationMatchupCount: number;
  records: LeagueRecords;
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
): SeasonMatchupParticipant => {
  const team = requireFromIndex(indexes.teams, score.teamId, "team");
  const manager = requireFromIndex(indexes.managers, team.managerId, "manager");

  return {
    teamId: team.id,
    teamName: team.name,
    managerId: manager.id,
    managerName: manager.displayName,
    points: score.points,
  };
};

const toSeasonMatchupSummary = (
  matchup: Matchup,
  season: Season,
  indexes: SeasonIndexes,
): SeasonMatchupSummary => {
  const week = requireFromIndex(indexes.weeks, matchup.weekId, "week");
  const [firstScore, secondScore] = matchup.scores;
  const first = toSeasonMatchupParticipant(firstScore, indexes);
  const second = toSeasonMatchupParticipant(secondScore, indexes);
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
  const champion =
    season.championManagerId === undefined
      ? null
      : teams.find((team) => team.managerId === season.championManagerId) ??
        null;
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

  return {
    seasonId: season.id,
    seasonYear: season.year,
    label: season.label,
    teams,
    champion,
    matchupCount: seasonMatchups.length,
    officialMatchupCount:
      countMatchupsByType(seasonMatchups, "regular") +
      countMatchupsByType(seasonMatchups, "playoff"),
    regularMatchupCount: countMatchupsByType(seasonMatchups, "regular"),
    playoffMatchupCount: countMatchupsByType(seasonMatchups, "playoff"),
    consolationMatchupCount: countMatchupsByType(seasonMatchups, "consolation"),
    records: getLeagueRecords(
      filterGameResultsByScope(seasonGameResults, "official"),
    ),
    standingsByScope,
    matchups,
  };
};
