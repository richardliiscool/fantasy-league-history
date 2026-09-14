import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import {
  getHeadToHeadMatrixProfile,
  type HeadToHeadMatrixProfile,
} from "./headToHeadMatrixProfile";

function requireCell(
  profile: HeadToHeadMatrixProfile,
  rowManagerId: string,
  columnManagerId: string,
) {
  const row = profile.rows.find(
    (matrixRow) => matrixRow.manager.managerId === rowManagerId,
  );
  const columnIndex = profile.managers.findIndex(
    (manager) => manager.managerId === columnManagerId,
  );
  const cell = row?.cells[columnIndex];

  if (!cell) {
    throw new Error(`Expected cell for ${rowManagerId} vs ${columnManagerId}`);
  }

  return cell;
}

describe("head-to-head matrix profile", () => {
  it("builds a square matrix with empty self cells", () => {
    const profile = getHeadToHeadMatrixProfile(historicalLeagueData);

    expect(profile).toMatchObject({
      managerCount: 17,
      activeManagerCount: 12,
      inactiveManagerCount: 5,
    });
    expect(profile.rows).toHaveLength(17);
    expect(profile.rows.every((row) => row.cells.length === 17)).toBe(true);

    for (const [rowIndex, row] of profile.rows.entries()) {
      expect(row.cells[rowIndex]).toBeNull();
    }
  });

  it("keeps directional rivalry records attached to the row manager", () => {
    const profile = getHeadToHeadMatrixProfile(historicalLeagueData);
    const richardVsLd = requireCell(
      profile,
      "manager-richard-li",
      "manager-ld-lu",
    );
    const ldVsRichard = requireCell(
      profile,
      "manager-ld-lu",
      "manager-richard-li",
    );

    expect(richardVsLd.summariesByScope.official).toMatchObject({
      games: 16,
      wins: 8,
      losses: 8,
      ties: 0,
      winPercentage: 0.5,
      pointsFor: 1784.16,
      pointsAgainst: 1843.76,
    });
    expect(ldVsRichard.summariesByScope.official).toMatchObject({
      games: 16,
      wins: 8,
      losses: 8,
      ties: 0,
      winPercentage: 0.5,
      pointsFor: 1843.76,
      pointsAgainst: 1784.16,
    });
  });

  it("surfaces the tied 2022 championship in playoff matrix records", () => {
    const profile = getHeadToHeadMatrixProfile(historicalLeagueData);
    const ldVsJosh = requireCell(
      profile,
      "manager-ld-lu",
      "manager-josh-charest",
    );
    const joshVsLd = requireCell(
      profile,
      "manager-josh-charest",
      "manager-ld-lu",
    );

    expect(ldVsJosh.summariesByScope.playoff.ties).toBeGreaterThan(0);
    expect(joshVsLd.summariesByScope.playoff.ties).toBeGreaterThan(0);
    expect(ldVsJosh.summariesByScope.playoff.games).toBe(
      joshVsLd.summariesByScope.playoff.games,
    );
  });
});
