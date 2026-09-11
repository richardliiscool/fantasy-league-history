import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import {
  getRecordsProfile,
  matchesRecordGameScope,
} from "./recordsProfile";

describe("records profile", () => {
  it("builds all-time game rows and deduplicated matchup rows", () => {
    const profile = getRecordsProfile(historicalLeagueData);

    expect(profile.gameRows).toHaveLength(
      historicalLeagueData.matchups.length * 2,
    );
    expect(profile.matchupRows).toHaveLength(
      historicalLeagueData.matchups.length,
    );
    expect(profile.seasons.map((season) => season.seasonYear)).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
    ]);
  });

  it("keeps the tied 2022 championship available for closest-game records", () => {
    const profile = getRecordsProfile(historicalLeagueData);
    const championship = profile.matchupRows.find(
      (row) => row.matchupId === "matchup-2022-w17-01",
    );

    expect(championship).toMatchObject({
      seasonYear: 2022,
      weekNumber: 17,
      gameType: "playoff",
      winner: null,
      margin: 0,
      first: {
        managerName: "LD Lu",
        points: 103.66,
      },
      second: {
        managerName: "Josh Charest",
        points: 103.66,
      },
    });
  });

  it("builds a podium tally from final placement rows", () => {
    const profile = getRecordsProfile(historicalLeagueData);
    const ld = profile.trophyTallies.find(
      (row) => row.managerName === "LD Lu",
    );
    const josh = profile.trophyTallies.find(
      (row) => row.managerName === "Josh Charest",
    );
    const richard = profile.trophyTallies.find(
      (row) => row.managerName === "Richard Li",
    );

    expect(profile.trophyTallies[0]).toMatchObject({
      managerName: "LD Lu",
      gold: 3,
      silver: 0,
      bronze: 0,
      totalPodiums: 3,
      firstPlaceYears: [2019, 2021, 2022],
    });
    expect(josh).toMatchObject({
      gold: 1,
      silver: 1,
      bronze: 2,
      totalPodiums: 4,
      firstPlaceYears: [2022],
      secondPlaceYears: [2015],
      thirdPlaceYears: [2016, 2017],
    });
    expect(richard).toMatchObject({
      gold: 2,
      silver: 0,
      bronze: 2,
      totalPodiums: 4,
      firstPlaceYears: [2015, 2017],
      thirdPlaceYears: [2020, 2021],
    });
    expect(ld?.secondPlaceYears).toEqual([]);
    expect(
      profile.trophyTallies.reduce((total, row) => total + row.gold, 0),
    ).toBe(9);
    expect(
      profile.trophyTallies.reduce((total, row) => total + row.silver, 0),
    ).toBe(7);
    expect(
      profile.trophyTallies.reduce((total, row) => total + row.bronze, 0),
    ).toBe(8);
  });

  it("supports official, regular, playoff, consolation, and all scopes", () => {
    const profile = getRecordsProfile(historicalLeagueData);

    expect(
      profile.gameRows.filter((row) => matchesRecordGameScope(row, "official")),
    ).toHaveLength((636 + 41) * 2);
    expect(
      profile.gameRows.filter((row) => matchesRecordGameScope(row, "regular")),
    ).toHaveLength(636 * 2);
    expect(
      profile.gameRows.filter((row) => matchesRecordGameScope(row, "playoff")),
    ).toHaveLength(41 * 2);
    expect(
      profile.gameRows.filter((row) =>
        matchesRecordGameScope(row, "consolation"),
      ),
    ).toHaveLength(102 * 2);
    expect(
      profile.gameRows.filter((row) => matchesRecordGameScope(row, "all")),
    ).toHaveLength(historicalLeagueData.matchups.length * 2);
  });

  it("builds sortable manager-season stat rows", () => {
    const profile = getRecordsProfile(historicalLeagueData);
    const regularRows = profile.seasonPerformanceRowsByScope.regular;
    const tony2022 = regularRows.find(
      (row) => row.seasonYear === 2022 && row.managerName === "Tony Zheng",
    );

    expect(regularRows).toHaveLength(96);
    expect(tony2022).toMatchObject({
      games: 14,
      wins: 10,
      losses: 4,
      pointsFor: 1583.3,
      pointsAgainst: 1533.38,
      averagePointsFor: 113.1,
    });
  });
});
