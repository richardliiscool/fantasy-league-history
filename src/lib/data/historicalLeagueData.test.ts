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
import { filterGameResultsByScope } from "../stats/gameFilters";
import { getManagerActivities } from "../stats/managerActivity";
import { getManagerProfile } from "../stats/managerProfile";

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
      "2015": 6,
      "2016": 6,
      "2017": 6,
      "2018": 6,
      "2019": 6,
      "2020": 6,
      "2021": 6,
      "2022": 6,
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
      isFinalSeedingGame: true,
      finalSeedingRank: 11,
      finalStanding: {
        firstTeamFinish: 11,
        secondTeamFinish: 12,
      },
      source: { rowNumber: 782 },
    });
  });

  it("preserves the tied 2022 championship finish", () => {
    const championship = historicalLeagueData.matchups.find(
      (matchup) =>
        matchup.seasonId === "season-2022" && matchup.finalSeedingRank === 1,
    );

    expect(championship).toMatchObject({
      id: "matchup-2022-w17-01",
      gameType: "playoff",
      isFinalSeedingGame: true,
      finalStanding: {
        firstTeamFinish: 1,
        secondTeamFinish: 1,
      },
      scores: [
        { teamId: "team-2022-ld-lu", points: 103.66 },
        { teamId: "team-2022-josh-charest", points: 103.66 },
      ],
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
    expect(summary.records.closestWin?.margin).toBeGreaterThan(0);
    expect(summary.records.closestWin?.margin).toBeLessThan(0.1);
  });

  it("filters game results by dashboard scope", () => {
    const allGameResults = buildGameResults(historicalLeagueData);

    expect(filterGameResultsByScope(allGameResults, "official")).toHaveLength(
      (636 + 41) * 2,
    );
    expect(filterGameResultsByScope(allGameResults, "regular")).toHaveLength(
      636 * 2,
    );
    expect(filterGameResultsByScope(allGameResults, "playoff")).toHaveLength(
      41 * 2,
    );
    expect(
      filterGameResultsByScope(allGameResults, "consolation"),
    ).toHaveLength(102 * 2);
  });

  it("marks managers active when they played in the latest imported season", () => {
    const activities = getManagerActivities(historicalLeagueData);
    const richard = activities.find(
      (activity) => activity.managerName === "Richard Li",
    );
    const kevin = activities.find(
      (activity) => activity.managerName === "Kevin Zhang",
    );

    expect(activities.filter((activity) => activity.isActive)).toHaveLength(12);
    expect(richard).toMatchObject({
      isActive: true,
      firstSeasonYear: 2015,
      lastSeasonYear: 2022,
    });
    expect(kevin).toMatchObject({
      isActive: false,
      firstSeasonYear: 2015,
      lastSeasonYear: 2015,
    });
  });

  it("builds a manager profile from the workbook-style team inquiry view", () => {
    const josh = getManagerProfile(
      historicalLeagueData,
      "manager-josh-charest",
    );

    expect(josh).not.toBeNull();
    expect(josh).toMatchObject({
      managerName: "Josh Charest",
      isActive: true,
      lastSeasonYear: 2022,
      seasonsPlayed: 8,
      career: {
        games: 118,
        wins: 62,
        losses: 55,
        ties: 1,
        pointsFor: 13905.8,
        pointsAgainst: 13466.44,
        averagePointsFor: 117.8,
        averagePointsAgainst: 114.1,
      },
      regularSeason: {
        games: 106,
        wins: 57,
        losses: 49,
        ties: 0,
      },
      playoffs: {
        games: 12,
        wins: 5,
        losses: 6,
        ties: 1,
      },
    });
    expect(josh?.bestRegularSeason).toMatchObject({
      seasonYear: 2016,
      record: {
        wins: 9,
        losses: 4,
        ties: 0,
      },
    });
    expect(josh?.worstRegularSeason).toMatchObject({
      seasonYear: 2019,
      record: {
        wins: 2,
        losses: 11,
        ties: 0,
      },
    });
    expect(josh?.records.highestScore).toMatchObject({
      points: 201.98,
      seasonYear: 2015,
      weekNumber: 3,
    });
    expect(josh?.records.lowestScore).toMatchObject({
      points: 59.3,
      seasonYear: 2019,
      weekNumber: 12,
    });
    expect(josh?.longestWinningStreak).toMatchObject({
      games: 4,
    });
    expect(josh?.longestLosingStreak).toMatchObject({
      games: 10,
      start: {
        seasonYear: 2019,
        weekNumber: 5,
      },
      end: {
        seasonYear: 2020,
        weekNumber: 1,
      },
    });
    expect(josh?.games).toHaveLength(130);
    expect(
      josh?.headToHead.find(
        (row) => row.opponentManagerName === "Kevin Zhang",
      ),
    ).toMatchObject({
      opponentIsActive: false,
    });

    const season2015 = josh?.seasonSplits.find(
      (season) => season.seasonYear === 2015,
    );
    const season2022 = josh?.seasonSplits.find(
      (season) => season.seasonYear === 2022,
    );

    expect(season2015).toMatchObject({
      regular: {
        wins: 8,
        losses: 5,
        ties: 0,
        pointsFor: 1612.54,
        averagePointsFor: 124,
      },
      playoff: {
        wins: 2,
        losses: 2,
        ties: 0,
        pointsFor: 587.2,
        averagePointsFor: 146.8,
      },
    });
    expect(season2022).toMatchObject({
      playoff: {
        wins: 2,
        losses: 0,
        ties: 1,
        pointsFor: 347.12,
      },
    });
  });
});
