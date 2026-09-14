import { describe, expect, it } from "vitest";
import {
  historicalImportSummary,
  historicalLeagueData,
} from "../data/historicalLeagueData";
import { getSeasonProfile, type SeasonProfile } from "./seasonProfile";

function requireSeasonProfile(seasonYear: number): SeasonProfile {
  const profile = getSeasonProfile(historicalLeagueData, seasonYear);

  if (!profile) {
    throw new Error(`Expected ${seasonYear} season profile to exist`);
  }

  return profile;
}

describe("season profile", () => {
  it("builds a season page data model for an imported season", () => {
    const profile = requireSeasonProfile(2022);

    expect(profile).toMatchObject({
      seasonYear: 2022,
      label: "2022 Season",
      matchupCount: historicalImportSummary.seasonMatchupCounts["2022"],
    });
    expect(profile.teams).toHaveLength(12);
    expect(profile.finalStandings).toHaveLength(12);
    expect(profile.matchups).toHaveLength(profile.matchupCount);
    expect(
      new Set(profile.matchups.map((matchup) => matchup.matchupId)).size,
    ).toBe(profile.matchupCount);
  });

  it("keeps season standings tied to that season's teams", () => {
    const profile = requireSeasonProfile(2022);
    const richard = profile.standingsByScope.official.find(
      (standing) => standing.managerName === "Richard Li",
    );

    expect(profile.standingsByScope.official).toHaveLength(12);
    expect(richard).toMatchObject({
      managerId: "manager-richard-li",
      teamId: "team-2022-richard-li",
      teamName: "Me So Herbert",
    });
    expect(richard?.games).toBeGreaterThan(0);
  });

  it("summarizes matchup counts and chronological game rows", () => {
    const profile = requireSeasonProfile(2022);
    const rawSeasonMatchups = historicalLeagueData.matchups.filter(
      (matchup) => matchup.seasonId === "season-2022",
    );

    expect(profile.regularMatchupCount).toBe(
      rawSeasonMatchups.filter((matchup) => matchup.gameType === "regular")
        .length,
    );
    expect(profile.playoffMatchupCount).toBe(
      rawSeasonMatchups.filter((matchup) => matchup.gameType === "playoff")
        .length,
    );
    expect(profile.consolationMatchupCount).toBe(
      rawSeasonMatchups.filter((matchup) => matchup.gameType === "consolation")
        .length,
    );
    expect(profile.officialMatchupCount).toBe(
      profile.regularMatchupCount + profile.playoffMatchupCount,
    );
    expect(profile.matchups[0]).toMatchObject({
      seasonYear: 2022,
      weekNumber: 1,
    });
    expect(profile.matchups.at(-1)?.weekNumber).toBe(17);
  });

  it("preserves the tied 2022 championship as co-champions", () => {
    const profile = requireSeasonProfile(2022);

    expect(profile.champions.map((champion) => champion.managerName)).toEqual([
      "LD Lu",
      "Josh Charest",
    ]);
    expect(profile.championshipMatchup).toMatchObject({
      weekNumber: 17,
      gameType: "playoff",
      finalSeedingRank: 1,
      margin: 0,
      first: {
        managerName: "LD Lu",
        points: 103.66,
        finalFinish: 1,
      },
      second: {
        managerName: "Josh Charest",
        points: 103.66,
        finalFinish: 1,
      },
      winner: null,
    });
    expect(
      profile.finalStandings
        .slice(0, 2)
        .map((standing) => [standing.finish, standing.managerName]),
    ).toEqual([
      [1, "LD Lu"],
      [1, "Josh Charest"],
    ]);
    expect(profile.finalStandings.map((standing) => standing.finish)).toEqual([
      1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("reads a normal season champion from the final placement rows", () => {
    const profile = requireSeasonProfile(2021);
    const profile2023 = requireSeasonProfile(2023);
    const profile2024 = requireSeasonProfile(2024);

    expect(profile.champions.map((champion) => champion.managerName)).toEqual([
      "LD Lu",
    ]);
    expect(profile.finalStandings[0]).toMatchObject({
      finish: 1,
      managerName: "LD Lu",
    });
    expect(profile2023.champions.map((champion) => champion.managerName)).toEqual([
      "Albert Feeny",
    ]);
    expect(profile2023.finalStandings[0]).toMatchObject({
      finish: 1,
      managerName: "Albert Feeny",
    });
    expect(profile2024.champions.map((champion) => champion.managerName)).toEqual([
      "Tony Zheng",
    ]);
    expect(profile2024.finalStandings.slice(0, 2)).toMatchObject([
      { finish: 1, managerName: "Tony Zheng" },
      { finish: 2, managerName: "Richard Li" },
    ]);
    expect(profile2024.finalStandings.map((standing) => standing.finish)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("keeps season records attached to their source matchup", () => {
    const profile = requireSeasonProfile(2022);

    expect(profile.records.highestScore?.matchup.weekNumber).toBeGreaterThan(0);
    expect(profile.records.highestScore?.opponent.managerName).toBeTruthy();
    expect(profile.records.biggestMargin).toMatchObject({
      margin: 74.24,
      matchup: {
        weekNumber: 13,
        first: { managerName: "Billy Kim", points: 162.4 },
        second: { managerName: "Nick Bello", points: 88.16 },
      },
    });
    expect(profile.records.closestGame).toMatchObject({
      margin: 0,
      matchup: {
        weekNumber: 17,
        first: { managerName: "LD Lu", points: 103.66 },
        second: { managerName: "Josh Charest", points: 103.66 },
      },
    });
  });

  it("returns null for seasons that are not imported yet", () => {
    expect(getSeasonProfile(historicalLeagueData, 2025)).toBeNull();
  });
});
