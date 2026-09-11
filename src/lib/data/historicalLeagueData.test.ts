import { describe, expect, it } from "vitest";
import {
  historicalImportSummary,
  historicalLeagueData,
} from "./historicalLeagueData";
import {
  buildGameResults,
  getLeagueRecords,
  getManagerStandings,
  isRecordEligibleGame,
  summarizeLeague,
} from "../stats/leagueStats";

const countBy = <T extends string | number>(items: T[]) =>
  items.reduce<Record<string, number>>((counts, item) => {
    counts[String(item)] = (counts[String(item)] ?? 0) + 1;
    return counts;
  }, {});

describe("historical workbook data", () => {
  it("preserves the expected workbook import shape", () => {
    expect(historicalImportSummary).toMatchObject({
      sourceWorkbook: "Fantasy History.xlsx",
      sourceSheet: "Game Log",
      matchupRows: 779,
      managerCount: 16,
      seasonCount: 8,
      teamEntries: 96,
      weekEntries: 131,
    });

    expect(historicalLeagueData.matchups).toHaveLength(779);
    expect(historicalLeagueData.managers).toHaveLength(16);
    expect(historicalLeagueData.seasons.map((season) => season.year)).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
    ]);
  });

  it("preserves per-season matchup and game-type counts", () => {
    expect(historicalImportSummary.seasonMatchupCounts).toEqual({
      "2015": 102,
      "2016": 95,
      "2017": 95,
      "2018": 95,
      "2019": 95,
      "2020": 95,
      "2021": 101,
      "2022": 101,
    });
    expect(historicalImportSummary.gameTypeCounts).toEqual({
      consolation: 102,
      playoff: 41,
      regular: 636,
    });
    expect(historicalImportSummary.seasonFinalSeedingCounts).toEqual({
      "2015": 1,
      "2016": 1,
      "2017": 1,
      "2018": 1,
      "2019": 1,
      "2020": 1,
      "2021": 1,
      "2022": 1,
    });

    const seasonTeamCounts = countBy(
      historicalLeagueData.teams.map((team) => team.seasonId),
    );
    expect(Object.values(seasonTeamCounts)).toEqual(Array(8).fill(12));
  });

  it("keeps each matchup traceable to its workbook row", () => {
    expect(historicalLeagueData.matchups[0]).toMatchObject({
      id: "matchup-2015-w01-01",
      seasonId: "season-2015",
      weekId: "week-2015-1",
      gameType: "regular",
      isFinalSeedingGame: false,
      source: {
        workbook: "Fantasy History.xlsx",
        sheet: "Game Log",
        rowNumber: 4,
      },
      scores: [
        { teamId: "team-2015-josh-charest", points: 94.14 },
        { teamId: "team-2015-richard-li", points: 102.7 },
      ],
    });

    expect(historicalLeagueData.matchups.at(-1)).toMatchObject({
      id: "matchup-2022-w17-06",
      seasonId: "season-2022",
      weekId: "week-2022-17",
      gameType: "consolation",
      source: { rowNumber: 782 },
    });
  });

  it("can reproduce a known all-time stat line from record-eligible games", () => {
    const recordEligibleResults = buildGameResults(historicalLeagueData).filter(
      isRecordEligibleGame,
    );
    const standings = getManagerStandings(
      historicalLeagueData,
      recordEligibleResults,
    );
    const richard = standings.find(
      (standing) => standing.managerName === "Richard Li",
    );

    expect(recordEligibleResults).toHaveLength((636 + 41) * 2);
    expect(richard).toMatchObject({
      games: 118,
      wins: 72,
      losses: 46,
      ties: 0,
      winPercentage: 0.61,
      pointsFor: 14179.2,
      pointsAgainst: 13268.7,
      averagePointsFor: 120.2,
      averagePointsAgainst: 112.4,
    });
  });

  it("summarizes the homepage data from regular plus playoff games", () => {
    const recordEligibleResults = buildGameResults(historicalLeagueData).filter(
      isRecordEligibleGame,
    );
    const summary = summarizeLeague(historicalLeagueData, recordEligibleResults);

    expect(summary.matchupCount).toBe(779);
    expect(summary.gameCount).toBe((636 + 41) * 2);
    expect(summary.records.highestScore).toMatchObject({
      managerName: "Josh Charest",
      points: 201.98,
      seasonYear: 2015,
      weekNumber: 3,
    });
    expect(getLeagueRecords(recordEligibleResults).lowestScore).toMatchObject({
      managerName: "Joana Karanxha",
      points: 48.4,
      seasonYear: 2016,
      weekNumber: 5,
    });
  });
});
