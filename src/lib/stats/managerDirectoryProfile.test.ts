import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import { getManagerDirectoryProfile } from "./managerDirectoryProfile";

describe("manager directory profile", () => {
  it("builds one directory row for each imported manager", () => {
    const profile = getManagerDirectoryProfile(historicalLeagueData);

    expect(profile).toMatchObject({
      managerCount: 17,
      activeManagerCount: 12,
      inactiveManagerCount: 5,
      podiumManagerCount: 12,
      titleCount: 12,
    });
    expect(profile.rows).toHaveLength(17);
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
      lastSeasonYear: 2025,
      seasonsPlayed: 11,
      seasonYears: [
        2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
      ],
      career: {
        games: 165,
        wins: 103,
        losses: 62,
        ties: 0,
        winPercentage: 0.624,
        pointsFor: 19870.88,
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
      gold: 2,
      silver: 1,
      bronze: 2,
      totalPodiums: 5,
      firstPlaceYears: [2022, 2025],
      secondPlaceYears: [2015],
      thirdPlaceYears: [2016, 2017],
    });
    expect(
      profile.rows.find((row) => row.managerId === "manager-richard-li")
        ?.trophyTally,
    ).toMatchObject({
      gold: 2,
      silver: 2,
      bronze: 2,
      totalPodiums: 6,
      secondPlaceYears: [2024, 2025],
    });
    expect(kevin?.trophyTally).toMatchObject({
      gold: 0,
      silver: 0,
      bronze: 0,
      totalPodiums: 0,
    });
  });
});
