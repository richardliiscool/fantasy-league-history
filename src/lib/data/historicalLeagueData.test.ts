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
      sourceFiles: {
        "Fantasy History.xlsx": 779,
        "espn-ffl-2023.json": 101,
        "espn-ffl-2024.json": 101,
        "sleeper-ffl-2025-1254892718270722048.json": 98,
      },
      matchupRows: 1079,
      managerCount: 17,
      seasonCount: 11,
      teamEntries: 132,
      weekEntries: 182,
    });

    expect(historicalLeagueData.matchups).toHaveLength(1079);
    expect(historicalLeagueData.managers).toHaveLength(17);
    expect(historicalLeagueData.seasons.map((season) => season.year)).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
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
      "2023": 101,
      "2024": 101,
      "2025": 98,
    });
    expect(historicalImportSummary.gameTypeCounts).toEqual({
      consolation: 133,
      playoff: 58,
      regular: 888,
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
      "2023": 6,
      "2024": 6,
      "2025": 6,
    });

    const seasonTeamCounts = countBy(
      historicalLeagueData.teams.map((team) => team.seasonId),
    );
    expect(Object.values(seasonTeamCounts)).toEqual(Array(11).fill(12));
  });

  it("preserves ESPN team names across workbook and ESPN-imported seasons", () => {
    expect(
      historicalLeagueData.teams.find(
        (team) => team.id === "team-2015-richard-li",
      ),
    ).toMatchObject({
      managerId: "manager-richard-li",
      name: "Mrs. Albie",
    });
    expect(
      historicalLeagueData.teams.find(
        (team) => team.id === "team-2022-richard-li",
      ),
    ).toMatchObject({
      managerId: "manager-richard-li",
      name: "Me So Herbert",
    });
    expect(
      historicalLeagueData.teams.find(
        (team) => team.id === "team-2024-nolan-feeny",
      ),
    ).toMatchObject({
      managerId: "manager-nolan-feeny",
      name: "Blew 42",
    });
    expect(
      historicalLeagueData.teams.find(
        (team) => team.id === "team-2025-richard-li",
      ),
    ).toMatchObject({
      managerId: "manager-richard-li",
      name: "My Worthy Skatt",
    });
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

    expect(
      historicalLeagueData.matchups.find(
        (matchup) => matchup.id === "matchup-2022-w17-06",
      ),
    ).toMatchObject({
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

    expect(
      historicalLeagueData.matchups.find(
        (matchup) => matchup.id === "matchup-2024-w17-06",
      ),
    ).toMatchObject({
      id: "matchup-2024-w17-06",
      seasonId: "season-2024",
      weekId: "week-2024-17",
      gameType: "consolation",
      isFinalSeedingGame: true,
      finalSeedingRank: 11,
      finalStanding: {
        firstTeamFinish: 12,
        secondTeamFinish: 11,
      },
      source: {
        workbook: "espn-ffl-2024.json",
        sheet: "schedule",
        rowNumber: 103,
      },
    });

    expect(
      historicalLeagueData.matchups.find(
        (matchup) => matchup.id === "matchup-2025-w17-01",
      ),
    ).toMatchObject({
      id: "matchup-2025-w17-01",
      seasonId: "season-2025",
      weekId: "week-2025-17",
      gameType: "playoff",
      isFinalSeedingGame: true,
      finalSeedingRank: 1,
      finalStanding: {
        firstTeamFinish: 2,
        secondTeamFinish: 1,
      },
      source: {
        workbook: "sleeper-ffl-2025-1254892718270722048.json",
        sheet: "matchups",
        rowNumber: 1701,
      },
      scores: [
        { teamId: "team-2025-richard-li", points: 99.1 },
        { teamId: "team-2025-josh-charest", points: 132.4 },
      ],
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

    expect(recordEligibleResults).toHaveLength(1892);
    expect(richard).toMatchObject({
      games: 165,
      wins: 103,
      losses: 62,
      ties: 0,
      winPercentage: 0.624,
      pointsFor: 19870.88,
      pointsAgainst: 18453.16,
      averagePointsFor: 120.4,
      averagePointsAgainst: 111.8,
    });
  });

  it("summarizes the homepage data from regular plus playoff games", () => {
    const recordEligibleResults = buildGameResults(historicalLeagueData).filter(
      isRecordEligibleGame,
    );
    const summary = summarizeLeague(historicalLeagueData, recordEligibleResults);

    expect(summary.matchupCount).toBe(1079);
    expect(summary.gameCount).toBe(1892);
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
      1892,
    );
    expect(filterGameResultsByScope(allGameResults, "regular")).toHaveLength(
      1776,
    );
    expect(filterGameResultsByScope(allGameResults, "playoff")).toHaveLength(
      116,
    );
    expect(
      filterGameResultsByScope(allGameResults, "consolation"),
    ).toHaveLength(266);
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
      lastSeasonYear: 2025,
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
      lastSeasonYear: 2025,
      seasonsPlayed: 11,
      seasonYears: [
        2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
      ],
      career: {
        games: 162,
        wins: 83,
        losses: 78,
        ties: 1,
        pointsFor: 19237.12,
        pointsAgainst: 18715.72,
        averagePointsFor: 118.7,
        averagePointsAgainst: 115.5,
      },
      regularSeason: {
        games: 148,
        wins: 76,
        losses: 72,
        ties: 0,
      },
      playoffs: {
        games: 14,
        wins: 7,
        losses: 6,
        ties: 1,
      },
      trophyTally: {
        gold: 2,
        silver: 1,
        bronze: 2,
        totalPodiums: 5,
        firstPlaceYears: [2022, 2025],
        secondPlaceYears: [2015],
        thirdPlaceYears: [2016, 2017],
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
    expect(josh?.games).toHaveLength(180);
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
      finalFinish: 2,
      madePlayoffs: true,
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
      finalFinish: 1,
      madePlayoffs: true,
      playoff: {
        wins: 2,
        losses: 0,
        ties: 1,
        pointsFor: 347.12,
      },
    });
  });
});
