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
      teamName: "Richard Li",
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

  it("returns null for seasons that are not imported yet", () => {
    expect(getSeasonProfile(historicalLeagueData, 2023)).toBeNull();
  });
});
