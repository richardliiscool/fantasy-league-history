export type EntityId = string;

export type MatchupGameType = "regular" | "playoff" | "consolation";

export type WorkbookSource = {
  workbook: string;
  sheet: string;
  rowNumber: number;
};

export type Manager = {
  id: EntityId;
  displayName: string;
};

export type Season = {
  id: EntityId;
  year: number;
  label: string;
  championManagerId?: EntityId;
};

export type FantasyTeam = {
  id: EntityId;
  seasonId: EntityId;
  managerId: EntityId;
  name: string;
};

export type Week = {
  id: EntityId;
  seasonId: EntityId;
  number: number;
  label: string;
};

export type Score = {
  teamId: EntityId;
  points: number;
};

export type Matchup = {
  id: EntityId;
  seasonId: EntityId;
  weekId: EntityId;
  gameType: MatchupGameType;
  isFinalSeedingGame?: boolean;
  source?: WorkbookSource;
  scores: [Score, Score];
};

export type LeagueData = {
  managers: Manager[];
  seasons: Season[];
  teams: FantasyTeam[];
  weeks: Week[];
  matchups: Matchup[];
};
