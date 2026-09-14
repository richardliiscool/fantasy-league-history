import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import { getDataAuditProfile } from "./dataAuditProfile";

describe("data audit profile", () => {
  it("summarizes imported workbook coverage", () => {
    const profile = getDataAuditProfile(historicalLeagueData);

    expect(profile.summary).toMatchObject({
      seasonCount: 10,
      managerCount: 17,
      teamCount: 120,
      matchupCount: 981,
      teamResultCount: 1962,
      warningCount: 0,
      tieCount: 1,
      duplicateScoreLineCount: 0,
    });
    expect(profile.seasons).toHaveLength(10);
    expect(profile.seasons.every((season) => season.teamCount === 12)).toBe(
      true,
    );
  });

  it("surfaces the 2022 championship tie as a review item", () => {
    const profile = getDataAuditProfile(historicalLeagueData);
    const season2022 = profile.seasons.find(
      (season) => season.seasonYear === 2022,
    );

    expect(profile.ties).toEqual([
      expect.objectContaining({
        matchupId: "matchup-2022-w17-01",
        seasonYear: 2022,
        weekNumber: 17,
        gameType: "playoff",
        isFinalSeedingGame: true,
        firstManagerName: "LD Lu",
        secondManagerName: "Josh Charest",
        score: 103.66,
      }),
    ]);
    expect(season2022).toMatchObject({
      finalPlacementCount: 12,
      expectedFinalPlacementCount: 12,
      tiedFinishLabels: ["#1 x2"],
      missingFinishLabels: ["#2"],
      tieCount: 1,
      status: "review",
    });
    expect(profile.issues).toContainEqual(
      expect.objectContaining({
        severity: "notice",
        area: "Final standings",
        title: "2022 tied finish",
      }),
    );
  });

  it("lists score outliers without treating them as structural warnings", () => {
    const profile = getDataAuditProfile(historicalLeagueData);

    expect(profile.summary.scoreOutlierCount).toBe(8);
    expect(profile.scoreOutliers).toContainEqual(
      expect.objectContaining({
        seasonYear: 2015,
        weekNumber: 3,
        managerName: "Josh Charest",
        points: 201.98,
        thresholdLabel: ">= 200",
      }),
    );
    expect(profile.scoreOutliers).toContainEqual(
      expect.objectContaining({
        seasonYear: 2016,
        weekNumber: 5,
        managerName: "Joana Karanxha",
        points: 48.4,
        thresholdLabel: "< 50",
      }),
    );
    expect(profile.summary.warningCount).toBe(0);
  });

  it("keeps normal seasons clean when placements are complete", () => {
    const profile = getDataAuditProfile(historicalLeagueData);
    const cleanSeasons = profile.seasons.filter(
      (season) => season.status === "clean",
    );

    expect(cleanSeasons.map((season) => season.seasonYear)).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024,
    ]);
    expect(profile.duplicateScoreLines).toEqual([]);
  });
});
