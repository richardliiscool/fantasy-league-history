import type { EntityId, LeagueData } from "../domain/types";
import { filterGameResultsByScope } from "./gameFilters";
import {
  buildGameResults,
  getManagerStandings,
  type ManagerStanding,
} from "./leagueStats";
import {
  getManagerActivities,
  type ManagerActivity,
} from "./managerActivity";
import { getTrophyTallies, type TrophyTallyRow } from "./recordsProfile";

export type ManagerDirectoryRow = {
  managerId: EntityId;
  managerName: string;
  isActive: boolean;
  firstSeasonYear: number | null;
  lastSeasonYear: number | null;
  seasonYears: number[];
  seasonsPlayed: number;
  career: ManagerStanding;
  trophyTally: TrophyTallyRow;
};

export type ManagerDirectoryProfile = {
  managerCount: number;
  activeManagerCount: number;
  inactiveManagerCount: number;
  podiumManagerCount: number;
  titleCount: number;
  rows: ManagerDirectoryRow[];
};

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

const getActivity = (
  activityByManagerId: Map<EntityId, ManagerActivity>,
  managerId: EntityId,
) => activityByManagerId.get(managerId) ?? null;

const compareDirectoryRows = (
  first: ManagerDirectoryRow,
  second: ManagerDirectoryRow,
) => {
  if (first.isActive !== second.isActive) {
    return first.isActive ? -1 : 1;
  }

  return (
    second.career.winPercentage - first.career.winPercentage ||
    second.career.wins - first.career.wins ||
    second.trophyTally.gold - first.trophyTally.gold ||
    first.managerName.localeCompare(second.managerName)
  );
};

export const getManagerDirectoryProfile = (
  data: LeagueData,
): ManagerDirectoryProfile => {
  const gameResults = buildGameResults(data);
  const officialGameResults = filterGameResultsByScope(gameResults, "official");
  const standingsByManagerId = new Map(
    getManagerStandings(data, officialGameResults).map((standing) => [
      standing.managerId,
      standing,
    ]),
  );
  const activities = getManagerActivities(data);
  const activityByManagerId = new Map(
    activities.map((activity) => [activity.managerId, activity]),
  );
  const trophyTallyByManagerId = new Map(
    getTrophyTallies(data).map((tally) => [tally.managerId, tally]),
  );
  const rows = data.managers
    .map((manager) => {
      const career = standingsByManagerId.get(manager.id);
      const activity = getActivity(activityByManagerId, manager.id);
      const trophyTally =
        trophyTallyByManagerId.get(manager.id) ??
        emptyTrophyTally(manager.id, manager.displayName);

      if (!career) {
        throw new Error(`Missing career standing for manager "${manager.id}".`);
      }

      return {
        managerId: manager.id,
        managerName: manager.displayName,
        isActive: activity?.isActive ?? false,
        firstSeasonYear: activity?.firstSeasonYear ?? null,
        lastSeasonYear: activity?.lastSeasonYear ?? null,
        seasonYears: activity?.seasonYears ?? [],
        seasonsPlayed: activity?.seasonYears.length ?? 0,
        career,
        trophyTally,
      };
    })
    .sort(compareDirectoryRows);

  return {
    managerCount: rows.length,
    activeManagerCount: rows.filter((row) => row.isActive).length,
    inactiveManagerCount: rows.filter((row) => !row.isActive).length,
    podiumManagerCount: rows.filter((row) => row.trophyTally.totalPodiums > 0)
      .length,
    titleCount: rows.reduce((total, row) => total + row.trophyTally.gold, 0),
    rows,
  };
};
