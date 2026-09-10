import { describe, expect, it } from "vitest";
import { sampleLeagueData } from "../data/sampleLeague";
import {
  buildGameResults,
  getLeagueRecords,
  getManagerStandings,
} from "./leagueStats";

describe("league stats", () => {
  it("builds one game result per team in every matchup", () => {
    const results = buildGameResults(sampleLeagueData);

    expect(results).toHaveLength(sampleLeagueData.matchups.length * 2);
  });

  it("sorts standings by all-time win percentage, then points", () => {
    const standings = getManagerStandings(sampleLeagueData);

    expect(standings[0]).toMatchObject({
      managerName: "Maya Patel",
      games: 7,
      wins: 4,
      losses: 2,
      ties: 1,
      winPercentage: 0.643,
    });
  });

  it("finds high, low, and margin records", () => {
    const records = getLeagueRecords(buildGameResults(sampleLeagueData));

    expect(records.highestScore).toMatchObject({
      managerName: "Richard Lia",
      points: 164.3,
      seasonYear: 2023,
      weekNumber: 3,
    });
    expect(records.lowestScore).toMatchObject({
      managerName: "Richard Lia",
      points: 76.4,
      seasonYear: 2024,
      weekNumber: 3,
    });
    expect(records.biggestWin).toMatchObject({
      managerName: "Richard Lia",
      margin: 62.3,
    });
    expect(records.closestWin).toMatchObject({
      managerName: "Richard Lia",
      margin: 0.7,
    });
  });
});
