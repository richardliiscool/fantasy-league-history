import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import { getSeasonsIndexProfile } from "./seasonsIndexProfile";

describe("seasons index profile", () => {
  it("lists imported seasons from newest to oldest", () => {
    const profile = getSeasonsIndexProfile(historicalLeagueData);

    expect(profile.seasons.map((season) => season.seasonYear)).toEqual([
      2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    ]);
  });

  it("builds the latest season podium from final placement rows", () => {
    const profile = getSeasonsIndexProfile(historicalLeagueData);
    const season2025 = profile.seasons.find(
      (season) => season.seasonYear === 2025,
    );

    expect(season2025?.podiumRows).toMatchObject([
      {
        finish: 1,
        badge: "Gold",
        managerName: "Josh Charest",
        teamName: "Bijan Mustard",
      },
      {
        finish: 2,
        badge: "Silver",
        managerName: "Richard Li",
        teamName: "My Worthy Skatt",
      },
      {
        finish: 3,
        badge: "Bronze",
        managerName: "Nick Bello",
        teamName: "DK",
      },
      {
        finish: 12,
        badge: "💩",
        managerName: "Thomas Du",
        teamName: "tdu0",
      },
    ]);
  });

  it("preserves tied podium finishes and includes last place", () => {
    const profile = getSeasonsIndexProfile(historicalLeagueData);
    const season2022 = profile.seasons.find(
      (season) => season.seasonYear === 2022,
    );

    expect(season2022?.podiumRows.map((row) => row.badge)).toEqual([
      "Gold",
      "Gold",
      "Bronze",
      "💩",
    ]);
    expect(season2022?.podiumRows.slice(0, 3).map((row) => row.managerName)).toEqual([
      "LD Lu",
      "Josh Charest",
      "Tony Zheng",
    ]);
  });
});
