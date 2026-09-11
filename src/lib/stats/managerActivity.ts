import type { EntityId, LeagueData } from "../domain/types";

export type ManagerActivity = {
  managerId: EntityId;
  managerName: string;
  isActive: boolean;
  firstSeasonYear: number | null;
  lastSeasonYear: number | null;
  seasonYears: number[];
};

const sortNumbers = (first: number, second: number) => first - second;

export const getLatestSeasonYear = (data: LeagueData) =>
  Math.max(...data.seasons.map((season) => season.year));

export const getManagerActivities = (data: LeagueData): ManagerActivity[] => {
  const seasonYearById = new Map(
    data.seasons.map((season) => [season.id, season.year]),
  );
  const latestSeasonYear = getLatestSeasonYear(data);
  const managerSeasonYears = new Map<EntityId, Set<number>>();

  for (const team of data.teams) {
    const seasonYear = seasonYearById.get(team.seasonId);

    if (seasonYear === undefined) {
      continue;
    }

    const years = managerSeasonYears.get(team.managerId) ?? new Set<number>();
    years.add(seasonYear);
    managerSeasonYears.set(team.managerId, years);
  }

  return data.managers.map((manager) => {
    const seasonYears = Array.from(
      managerSeasonYears.get(manager.id) ?? [],
    ).sort(sortNumbers);
    const firstSeasonYear = seasonYears[0] ?? null;
    const lastSeasonYear = seasonYears.at(-1) ?? null;

    return {
      managerId: manager.id,
      managerName: manager.displayName,
      isActive: lastSeasonYear === latestSeasonYear,
      firstSeasonYear,
      lastSeasonYear,
      seasonYears,
    };
  });
};

export const getManagerActivity = (
  data: LeagueData,
  managerId: EntityId,
) =>
  getManagerActivities(data).find(
    (activity) => activity.managerId === managerId,
  ) ?? null;
