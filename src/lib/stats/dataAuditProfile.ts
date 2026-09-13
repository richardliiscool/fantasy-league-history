import type {
  EntityId,
  FantasyTeam,
  LeagueData,
  Manager,
  Matchup,
  MatchupGameType,
  Score,
  Season,
  Week,
} from "../domain/types";

export type AuditSeverity = "notice" | "warning";

export type DataAuditIssue = {
  id: string;
  severity: AuditSeverity;
  area: string;
  title: string;
  detail: string;
  seasonYear: number | null;
};

export type SeasonAuditRow = {
  seasonId: EntityId;
  seasonYear: number;
  teamCount: number;
  weekCount: number;
  matchupCount: number;
  regularMatchupCount: number;
  playoffMatchupCount: number;
  consolationMatchupCount: number;
  finalPlacementCount: number;
  expectedFinalPlacementCount: number;
  tiedFinishLabels: string[];
  missingFinishLabels: string[];
  tieCount: number;
  status: "clean" | "review" | "warning";
};

export type TieAuditRow = {
  matchupId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  isFinalSeedingGame: boolean;
  firstManagerId: EntityId;
  firstManagerName: string;
  secondManagerId: EntityId;
  secondManagerName: string;
  score: number;
};

export type ScoreOutlierAuditRow = {
  matchupId: EntityId;
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  managerId: EntityId;
  managerName: string;
  opponentManagerName: string;
  points: number;
  thresholdLabel: string;
};

export type DuplicateScoreLineAuditRow = {
  seasonYear: number;
  weekNumber: number;
  gameType: MatchupGameType;
  scoreLine: string;
  matchupIds: EntityId[];
};

export type DataAuditSummary = {
  seasonCount: number;
  managerCount: number;
  teamCount: number;
  matchupCount: number;
  teamResultCount: number;
  warningCount: number;
  noticeCount: number;
  tieCount: number;
  scoreOutlierCount: number;
  duplicateScoreLineCount: number;
};

export type DataAuditProfile = {
  summary: DataAuditSummary;
  seasons: SeasonAuditRow[];
  issues: DataAuditIssue[];
  ties: TieAuditRow[];
  scoreOutliers: ScoreOutlierAuditRow[];
  duplicateScoreLines: DuplicateScoreLineAuditRow[];
};

type AuditIndexes = {
  managers: Map<EntityId, Manager>;
  seasons: Map<EntityId, Season>;
  teams: Map<EntityId, FantasyTeam>;
  weeks: Map<EntityId, Week>;
};

type FinalPlacement = {
  teamId: EntityId;
  managerId: EntityId | null;
  finish: number;
};

const LOW_SCORE_THRESHOLD = 50;
const HIGH_SCORE_THRESHOLD = 200;

const indexById = <T extends { id: EntityId }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

const buildIndexes = (data: LeagueData): AuditIndexes => ({
  managers: indexById(data.managers),
  seasons: indexById(data.seasons),
  teams: indexById(data.teams),
  weeks: indexById(data.weeks),
});

const compareSeasonRows = (first: SeasonAuditRow, second: SeasonAuditRow) =>
  first.seasonYear - second.seasonYear;

const compareIssues = (first: DataAuditIssue, second: DataAuditIssue) =>
  getSeveritySortValue(second.severity) - getSeveritySortValue(first.severity) ||
  (first.seasonYear ?? 0) - (second.seasonYear ?? 0) ||
  first.area.localeCompare(second.area) ||
  first.title.localeCompare(second.title);

const compareMatchups = (
  first: Pick<TieAuditRow | ScoreOutlierAuditRow, "seasonYear" | "weekNumber" | "matchupId">,
  second: Pick<TieAuditRow | ScoreOutlierAuditRow, "seasonYear" | "weekNumber" | "matchupId">,
) =>
  first.seasonYear - second.seasonYear ||
  first.weekNumber - second.weekNumber ||
  first.matchupId.localeCompare(second.matchupId);

const getSeveritySortValue = (severity: AuditSeverity) =>
  severity === "warning" ? 2 : 1;

const getManagerName = (
  indexes: AuditIndexes,
  teamId: EntityId,
) => {
  const team = indexes.teams.get(teamId);
  const manager = team ? indexes.managers.get(team.managerId) : null;

  return manager?.displayName ?? "Unknown manager";
};

const getManagerId = (indexes: AuditIndexes, teamId: EntityId) =>
  indexes.teams.get(teamId)?.managerId ?? "unknown-manager";

const formatFinishLabel = (finish: number) => `#${finish}`;

const formatScore = (score: number) => score.toFixed(1);

const getScoreOutlierThreshold = (points: number) => {
  if (points < LOW_SCORE_THRESHOLD) {
    return `< ${LOW_SCORE_THRESHOLD}`;
  }

  if (points >= HIGH_SCORE_THRESHOLD) {
    return `>= ${HIGH_SCORE_THRESHOLD}`;
  }

  return null;
};

const getFinalPlacements = (
  matchup: Matchup,
  indexes: AuditIndexes,
): FinalPlacement[] => {
  if (!matchup.finalStanding) {
    return [];
  }

  return [
    {
      teamId: matchup.scores[0].teamId,
      managerId: indexes.teams.get(matchup.scores[0].teamId)?.managerId ?? null,
      finish: matchup.finalStanding.firstTeamFinish,
    },
    {
      teamId: matchup.scores[1].teamId,
      managerId: indexes.teams.get(matchup.scores[1].teamId)?.managerId ?? null,
      finish: matchup.finalStanding.secondTeamFinish,
    },
  ];
};

const getCountsByFinish = (placements: FinalPlacement[]) =>
  placements.reduce<Map<number, number>>((counts, placement) => {
    counts.set(placement.finish, (counts.get(placement.finish) ?? 0) + 1);
    return counts;
  }, new Map());

const getTiedFinishLabels = (placements: FinalPlacement[]) =>
  Array.from(getCountsByFinish(placements).entries())
    .filter(([, count]) => count > 1)
    .sort(([firstFinish], [secondFinish]) => firstFinish - secondFinish)
    .map(([finish, count]) => `${formatFinishLabel(finish)} x${count}`);

const getMissingFinishLabels = (
  placements: FinalPlacement[],
  teamCount: number,
) => {
  const finishCounts = getCountsByFinish(placements);

  return Array.from({ length: teamCount }, (_, index) => index + 1)
    .filter((finish) => !finishCounts.has(finish))
    .map(formatFinishLabel);
};

const getDuplicateManagerIds = (placements: FinalPlacement[]) => {
  const counts = placements.reduce<Map<EntityId, number>>((managerCounts, item) => {
    if (!item.managerId) {
      return managerCounts;
    }

    managerCounts.set(item.managerId, (managerCounts.get(item.managerId) ?? 0) + 1);
    return managerCounts;
  }, new Map());

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([managerId]) => managerId);
};

const getSeasonStatus = ({
  finalPlacementCount,
  expectedFinalPlacementCount,
  duplicateManagerIds,
  tiedFinishLabels,
}: {
  finalPlacementCount: number;
  expectedFinalPlacementCount: number;
  duplicateManagerIds: EntityId[];
  tiedFinishLabels: string[];
}): SeasonAuditRow["status"] => {
  if (
    finalPlacementCount !== expectedFinalPlacementCount ||
    duplicateManagerIds.length > 0
  ) {
    return "warning";
  }

  return tiedFinishLabels.length > 0 ? "review" : "clean";
};

const buildSeasonRows = (
  data: LeagueData,
  indexes: AuditIndexes,
  issues: DataAuditIssue[],
) =>
  data.seasons.map((season) => {
    const teams = data.teams.filter((team) => team.seasonId === season.id);
    const weeks = data.weeks.filter((week) => week.seasonId === season.id);
    const matchups = data.matchups.filter(
      (matchup) => matchup.seasonId === season.id,
    );
    const finalPlacements = matchups.flatMap((matchup) =>
      getFinalPlacements(matchup, indexes),
    );
    const tiedFinishLabels = getTiedFinishLabels(finalPlacements);
    const missingFinishLabels = getMissingFinishLabels(
      finalPlacements,
      teams.length,
    );
    const duplicateManagerIds = getDuplicateManagerIds(finalPlacements);
    const status = getSeasonStatus({
      finalPlacementCount: finalPlacements.length,
      expectedFinalPlacementCount: teams.length,
      duplicateManagerIds,
      tiedFinishLabels,
    });

    if (finalPlacements.length !== teams.length) {
      issues.push({
        id: `season-${season.year}-placement-count`,
        severity: "warning",
        area: "Final standings",
        title: `${season.year} placement count mismatch`,
        detail: `${finalPlacements.length} final placements for ${teams.length} teams.`,
        seasonYear: season.year,
      });
    }

    for (const managerId of duplicateManagerIds) {
      const managerName = indexes.managers.get(managerId)?.displayName ?? managerId;

      issues.push({
        id: `season-${season.year}-duplicate-placement-${managerId}`,
        severity: "warning",
        area: "Final standings",
        title: `${season.year} duplicate final placement`,
        detail: `${managerName} appears more than once in final placement rows.`,
        seasonYear: season.year,
      });
    }

    if (tiedFinishLabels.length > 0) {
      issues.push({
        id: `season-${season.year}-tied-finish`,
        severity: "notice",
        area: "Final standings",
        title: `${season.year} tied finish`,
        detail: `Shared finish detected: ${tiedFinishLabels.join(", ")}. Missing slots: ${missingFinishLabels.join(", ") || "none"}.`,
        seasonYear: season.year,
      });
    }

    return {
      seasonId: season.id,
      seasonYear: season.year,
      teamCount: teams.length,
      weekCount: weeks.length,
      matchupCount: matchups.length,
      regularMatchupCount: matchups.filter(
        (matchup) => matchup.gameType === "regular",
      ).length,
      playoffMatchupCount: matchups.filter(
        (matchup) => matchup.gameType === "playoff",
      ).length,
      consolationMatchupCount: matchups.filter(
        (matchup) => matchup.gameType === "consolation",
      ).length,
      finalPlacementCount: finalPlacements.length,
      expectedFinalPlacementCount: teams.length,
      tiedFinishLabels,
      missingFinishLabels,
      tieCount: matchups.filter(
        (matchup) => matchup.scores[0].points === matchup.scores[1].points,
      ).length,
      status,
    };
  });

const buildTieRows = (data: LeagueData, indexes: AuditIndexes): TieAuditRow[] =>
  data.matchups
    .filter((matchup) => matchup.scores[0].points === matchup.scores[1].points)
    .map((matchup) => {
      const season = indexes.seasons.get(matchup.seasonId);
      const week = indexes.weeks.get(matchup.weekId);

      return {
        matchupId: matchup.id,
        seasonYear: season?.year ?? 0,
        weekNumber: week?.number ?? 0,
        gameType: matchup.gameType,
        isFinalSeedingGame: matchup.isFinalSeedingGame ?? false,
        firstManagerId: getManagerId(indexes, matchup.scores[0].teamId),
        firstManagerName: getManagerName(indexes, matchup.scores[0].teamId),
        secondManagerId: getManagerId(indexes, matchup.scores[1].teamId),
        secondManagerName: getManagerName(indexes, matchup.scores[1].teamId),
        score: matchup.scores[0].points,
      };
    })
    .sort(compareMatchups);

const buildScoreOutliers = (
  data: LeagueData,
  indexes: AuditIndexes,
): ScoreOutlierAuditRow[] =>
  data.matchups
    .flatMap((matchup) => {
      const season = indexes.seasons.get(matchup.seasonId);
      const week = indexes.weeks.get(matchup.weekId);

      return matchup.scores.flatMap((score, scoreIndex) => {
        const thresholdLabel = getScoreOutlierThreshold(score.points);

        if (!thresholdLabel) {
          return [];
        }

        const opponentScore = matchup.scores[scoreIndex === 0 ? 1 : 0];

        return {
          matchupId: matchup.id,
          seasonYear: season?.year ?? 0,
          weekNumber: week?.number ?? 0,
          gameType: matchup.gameType,
          managerId: getManagerId(indexes, score.teamId),
          managerName: getManagerName(indexes, score.teamId),
          opponentManagerName: getManagerName(indexes, opponentScore.teamId),
          points: score.points,
          thresholdLabel,
        };
      });
    })
    .sort(compareMatchups);

const getDuplicateScoreKey = (
  season: Season | undefined,
  week: Week | undefined,
  matchup: Matchup,
) => {
  const scoreLine = [...matchup.scores.map((score) => score.points)]
    .sort((first, second) => first - second)
    .map(formatScore)
    .join("-");

  return `${season?.year ?? 0}:${week?.number ?? 0}:${matchup.gameType}:${scoreLine}`;
};

const buildDuplicateScoreLines = (
  data: LeagueData,
  indexes: AuditIndexes,
): DuplicateScoreLineAuditRow[] => {
  const matchupIdsByScoreKey = data.matchups.reduce<Map<string, EntityId[]>>(
    (groups, matchup) => {
      const season = indexes.seasons.get(matchup.seasonId);
      const week = indexes.weeks.get(matchup.weekId);
      const scoreKey = getDuplicateScoreKey(season, week, matchup);

      groups.set(scoreKey, [...(groups.get(scoreKey) ?? []), matchup.id]);
      return groups;
    },
    new Map(),
  );

  return Array.from(matchupIdsByScoreKey.entries())
    .filter(([, matchupIds]) => matchupIds.length > 1)
    .map(([scoreKey, matchupIds]) => {
      const [seasonYear, weekNumber, gameType, scoreLine] = scoreKey.split(":");

      return {
        seasonYear: Number(seasonYear),
        weekNumber: Number(weekNumber),
        gameType: gameType as MatchupGameType,
        scoreLine,
        matchupIds,
      };
    })
    .sort(
      (first, second) =>
        first.seasonYear - second.seasonYear ||
        first.weekNumber - second.weekNumber ||
        first.scoreLine.localeCompare(second.scoreLine),
    );
};

const addReferenceIssues = (
  data: LeagueData,
  indexes: AuditIndexes,
  issues: DataAuditIssue[],
) => {
  for (const matchup of data.matchups) {
    const season = indexes.seasons.get(matchup.seasonId);
    const week = indexes.weeks.get(matchup.weekId);

    if (!season) {
      issues.push({
        id: `${matchup.id}-missing-season`,
        severity: "warning",
        area: "References",
        title: "Missing season",
        detail: `${matchup.id} references ${matchup.seasonId}.`,
        seasonYear: null,
      });
    }

    if (!week) {
      issues.push({
        id: `${matchup.id}-missing-week`,
        severity: "warning",
        area: "References",
        title: "Missing week",
        detail: `${matchup.id} references ${matchup.weekId}.`,
        seasonYear: season?.year ?? null,
      });
    }

    if (week && week.seasonId !== matchup.seasonId) {
      issues.push({
        id: `${matchup.id}-week-season-mismatch`,
        severity: "warning",
        area: "References",
        title: "Week belongs to another season",
        detail: `${matchup.id} uses ${week.id}, which belongs to ${week.seasonId}.`,
        seasonYear: season?.year ?? null,
      });
    }

    for (const score of matchup.scores) {
      addScoreReferenceIssues(score, matchup, indexes, issues);
    }

    if (matchup.scores[0].teamId === matchup.scores[1].teamId) {
      issues.push({
        id: `${matchup.id}-duplicate-team`,
        severity: "warning",
        area: "References",
        title: "Team plays itself",
        detail: `${matchup.id} has the same team on both sides.`,
        seasonYear: season?.year ?? null,
      });
    }

    if (matchup.isFinalSeedingGame && !matchup.finalStanding) {
      issues.push({
        id: `${matchup.id}-missing-final-standing`,
        severity: "warning",
        area: "Final standings",
        title: "Final seeding game without placements",
        detail: `${matchup.id} is marked final seeding but has no finish values.`,
        seasonYear: season?.year ?? null,
      });
    }

    if (!matchup.isFinalSeedingGame && matchup.finalStanding) {
      issues.push({
        id: `${matchup.id}-unexpected-final-standing`,
        severity: "warning",
        area: "Final standings",
        title: "Placement values outside final seeding",
        detail: `${matchup.id} has finish values without final seeding enabled.`,
        seasonYear: season?.year ?? null,
      });
    }
  }
};

const addScoreReferenceIssues = (
  score: Score,
  matchup: Matchup,
  indexes: AuditIndexes,
  issues: DataAuditIssue[],
) => {
  const season = indexes.seasons.get(matchup.seasonId);
  const team = indexes.teams.get(score.teamId);

  if (!team) {
    issues.push({
      id: `${matchup.id}-${score.teamId}-missing-team`,
      severity: "warning",
      area: "References",
      title: "Missing team",
      detail: `${matchup.id} references ${score.teamId}.`,
      seasonYear: season?.year ?? null,
    });
    return;
  }

  if (!indexes.managers.has(team.managerId)) {
    issues.push({
      id: `${matchup.id}-${team.managerId}-missing-manager`,
      severity: "warning",
      area: "References",
      title: "Missing manager",
      detail: `${team.name} references ${team.managerId}.`,
      seasonYear: season?.year ?? null,
    });
  }

  if (team.seasonId !== matchup.seasonId) {
    issues.push({
      id: `${matchup.id}-${team.id}-team-season-mismatch`,
      severity: "warning",
      area: "References",
      title: "Team belongs to another season",
      detail: `${team.name} belongs to ${team.seasonId}, not ${matchup.seasonId}.`,
      seasonYear: season?.year ?? null,
    });
  }
};

export const getDataAuditProfile = (data: LeagueData): DataAuditProfile => {
  const indexes = buildIndexes(data);
  const issues: DataAuditIssue[] = [];

  addReferenceIssues(data, indexes, issues);

  const seasons = buildSeasonRows(data, indexes, issues).sort(compareSeasonRows);
  const ties = buildTieRows(data, indexes);
  const scoreOutliers = buildScoreOutliers(data, indexes);
  const duplicateScoreLines = buildDuplicateScoreLines(data, indexes);
  const sortedIssues = issues.sort(compareIssues);
  const warningCount = sortedIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const noticeCount = sortedIssues.filter(
    (issue) => issue.severity === "notice",
  ).length;

  return {
    summary: {
      seasonCount: data.seasons.length,
      managerCount: data.managers.length,
      teamCount: data.teams.length,
      matchupCount: data.matchups.length,
      teamResultCount: data.matchups.length * 2,
      warningCount,
      noticeCount,
      tieCount: ties.length,
      scoreOutlierCount: scoreOutliers.length,
      duplicateScoreLineCount: duplicateScoreLines.length,
    },
    seasons,
    issues: sortedIssues,
    ties,
    scoreOutliers,
    duplicateScoreLines,
  };
};
