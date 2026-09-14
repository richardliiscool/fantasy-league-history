import { describe, expect, it } from "vitest";
import { historicalLeagueData } from "../data/historicalLeagueData";
import { buildGameResults } from "./leagueStats";
import {
  getHeadToHeadProfile,
  getHeadToHeadRivalryProfile,
  type HeadToHeadRivalryProfile,
} from "./headToHeadProfile";

function requireRivalry(
  firstManagerId: string,
  secondManagerId: string,
): HeadToHeadRivalryProfile {
  const rivalry = getHeadToHeadRivalryProfile(
    historicalLeagueData,
    firstManagerId,
    secondManagerId,
  );

  if (!rivalry) {
    throw new Error(
      `Expected rivalry for ${firstManagerId} vs ${secondManagerId}`,
    );
  }

  return rivalry;
}

describe("head-to-head profile", () => {
  it("builds manager options, defaults, and ordered rivalries", () => {
    const profile = getHeadToHeadProfile(historicalLeagueData);

    expect(profile.managers).toHaveLength(17);
    expect(profile.defaultFirstManagerId).toBe("manager-richard-li");
    expect(profile.defaultSecondManagerId).toBe("manager-ld-lu");
    expect(profile.rivalries).toHaveLength(17 * 16);
  });

  it("keeps each head-to-head matchup as one row for the selected view", () => {
    const rivalry = requireRivalry("manager-richard-li", "manager-ld-lu");
    const directionalResults = buildGameResults(historicalLeagueData).filter(
      (game) =>
        game.managerId === "manager-richard-li" &&
        game.opponentManagerId === "manager-ld-lu",
    );

    expect(rivalry.games).toHaveLength(directionalResults.length);
    expect(new Set(rivalry.games.map((game) => game.matchupId)).size).toBe(
      rivalry.games.length,
    );
    expect(rivalry.games.every((game) => game.first.managerId === "manager-richard-li")).toBe(
      true,
    );
    expect(rivalry.games.every((game) => game.second.managerId === "manager-ld-lu")).toBe(
      true,
    );
    expect(rivalry.summariesByScope.official.games).toBe(
      rivalry.games.filter(
        (game) => game.gameType === "regular" || game.gameType === "playoff",
      ).length,
    );
  });

  it("preserves the tied 2022 championship in the LD versus Josh rivalry", () => {
    const rivalry = requireRivalry("manager-ld-lu", "manager-josh-charest");
    const championship = rivalry.games.find(
      (game) => game.matchupId === "matchup-2022-w17-01",
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
        outcome: "tie",
      },
      second: {
        managerName: "Josh Charest",
        points: 103.66,
        outcome: "tie",
      },
    });
    expect(rivalry.summariesByScope.playoff.first.ties).toBeGreaterThan(0);
    expect(rivalry.summariesByScope.playoff.second.ties).toBeGreaterThan(0);
  });

  it("returns null for missing managers and self-comparisons", () => {
    expect(
      getHeadToHeadRivalryProfile(
        historicalLeagueData,
        "manager-richard-li",
        "manager-richard-li",
      ),
    ).toBeNull();
    expect(
      getHeadToHeadRivalryProfile(
        historicalLeagueData,
        "manager-richard-li",
        "manager-does-not-exist",
      ),
    ).toBeNull();
  });
});
