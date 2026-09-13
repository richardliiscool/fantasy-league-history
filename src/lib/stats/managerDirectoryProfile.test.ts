import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import { getManagerDirectoryProfile } from "./managerDirectoryProfile";

describe("manager directory profile", () => {
  it("builds one directory row for each imported manager", () => {
    const profile = getManagerDirectoryProfile(historicalLeagueData);

    expect(profile).toMatchObject({
      managerCount: 16,
      activeManagerCount: 12,
      inactiveManagerCount: 4,
      podiumManagerCount: 11,
      titleCount: 9,
    });
    expect(profile.rows).toHaveLength(16);
    expect(profile.rows.slice(0, 12).every((row) => row.isActive)).toBe(true);
    expect(profile.rows.slice(12).every((row) => !row.isActive)).toBe(true);
  });

  it("keeps career stats and activity data attached to each manager", () => {
    const profile = getManagerDirectoryProfile(historicalLeagueData);
    const richard = profile.rows.find(
      (row) => row.managerId === "manager-richard-li",
    );
    const kevin = profile.rows.find(
      (row) => row.managerId === "manager-kevin-zhang",
    );

    expect(richard).toMatchObject({
      managerName: "Richard Li",
      isActive: true,
      firstSeasonYear: 2015,
      lastSeasonYear: 2022,
      seasonsPlayed: 8,
      seasonYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
      career: {
        games: 118,
        wins: 72,
        losses: 46,
        ties: 0,
        winPercentage: 0.61,
        pointsFor: 14179.2,
      },
    });
    expect(kevin).toMatchObject({
      managerName: "Kevin Zhang",
      isActive: false,
      firstSeasonYear: 2015,
      lastSeasonYear: 2015,
      seasonsPlayed: 1,
    });
  });

  it("reuses official trophy tallies for championships and podiums", () => {
    const profile = getManagerDirectoryProfile(historicalLeagueData);
    const ld = profile.rows.find((row) => row.managerId === "manager-ld-lu");
    const josh = profile.rows.find(
      (row) => row.managerId === "manager-josh-charest",
    );
    const kevin = profile.rows.find(
      (row) => row.managerId === "manager-kevin-zhang",
    );

    expect(ld?.trophyTally).toMatchObject({
      gold: 3,
      silver: 0,
      bronze: 0,
      totalPodiums: 3,
      firstPlaceYears: [2019, 2021, 2022],
    });
    expect(josh?.trophyTally).toMatchObject({
      gold: 1,
      silver: 1,
      bronze: 2,
      totalPodiums: 4,
      firstPlaceYears: [2022],
      secondPlaceYears: [2015],
      thirdPlaceYears: [2016, 2017],
    });
    expect(kevin?.trophyTally).toMatchObject({
      gold: 0,
      silver: 0,
      bronze: 0,
      totalPodiums: 0,
    });
  });
});
