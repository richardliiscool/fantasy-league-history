import type { EntityId, LeagueData } from "../domain/types";
import type { GameScope } from "./gameFilters";
import {
  getHeadToHeadProfile,
  type HeadToHeadManagerOption,
  type HeadToHeadRivalryProfile,
} from "./headToHeadProfile";
import type { ManagerRecordSummary } from "./managerProfile";

export type HeadToHeadMatrixCell = {
  rowManagerId: EntityId;
  columnManagerId: EntityId;
  summariesByScope: Record<GameScope, ManagerRecordSummary>;
};

export type HeadToHeadMatrixRow = {
  manager: HeadToHeadManagerOption;
  cells: Array<HeadToHeadMatrixCell | null>;
};

export type HeadToHeadMatrixProfile = {
  managerCount: number;
  activeManagerCount: number;
  inactiveManagerCount: number;
  managers: HeadToHeadManagerOption[];
  rows: HeadToHeadMatrixRow[];
};

const getRivalryKey = (firstManagerId: EntityId, secondManagerId: EntityId) =>
  `${firstManagerId}:${secondManagerId}`;

const getRivalryMap = (rivalries: HeadToHeadRivalryProfile[]) =>
  new Map(
    rivalries.map((rivalry) => [
      getRivalryKey(rivalry.firstManagerId, rivalry.secondManagerId),
      rivalry,
    ]),
  );

export const getHeadToHeadMatrixProfile = (
  data: LeagueData,
): HeadToHeadMatrixProfile => {
  const headToHeadProfile = getHeadToHeadProfile(data);
  const rivalryByKey = getRivalryMap(headToHeadProfile.rivalries);
  const rows = headToHeadProfile.managers.map((rowManager) => ({
    manager: rowManager,
    cells: headToHeadProfile.managers.map((columnManager) => {
      if (rowManager.managerId === columnManager.managerId) {
        return null;
      }

      const rivalry = rivalryByKey.get(
        getRivalryKey(rowManager.managerId, columnManager.managerId),
      );

      if (!rivalry) {
        throw new Error(
          `Missing rivalry for ${rowManager.managerId} vs ${columnManager.managerId}.`,
        );
      }

      return {
        rowManagerId: rowManager.managerId,
        columnManagerId: columnManager.managerId,
        summariesByScope: {
          official: rivalry.summariesByScope.official.first,
          regular: rivalry.summariesByScope.regular.first,
          playoff: rivalry.summariesByScope.playoff.first,
          consolation: rivalry.summariesByScope.consolation.first,
        },
      };
    }),
  }));

  return {
    managerCount: headToHeadProfile.managers.length,
    activeManagerCount: headToHeadProfile.managers.filter(
      (manager) => manager.isActive,
    ).length,
    inactiveManagerCount: headToHeadProfile.managers.filter(
      (manager) => !manager.isActive,
    ).length,
    managers: headToHeadProfile.managers,
    rows,
  };
};
