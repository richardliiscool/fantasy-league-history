import type { Metadata } from "next";
import Link from "next/link";
import { ManagerLink } from "@/components/ManagerLink";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import {
  getDataAuditProfile,
  type DataAuditIssue,
  type DuplicateScoreLineAuditRow,
  type ScoreOutlierAuditRow,
  type SeasonAuditRow,
  type TieAuditRow,
} from "@/lib/stats/dataAuditProfile";
import {
  getManagerActivities,
  type ManagerActivity,
} from "@/lib/stats/managerActivity";

export const metadata: Metadata = {
  title: "Data Audit | Fantasy League History",
};

const leagueContextNotes = [
  {
    season: "2015",
    title: "Two-week playoff rounds",
    detail:
      "Four teams made the playoffs. Semifinals ran across Weeks 14-15 and the final ran across Weeks 16-17, with the matchup total divided across the two weeks in the workbook.",
  },
  {
    season: "2019",
    title: "Scoring format changed",
    detail:
      "League scoring moved from full point-per-reception to half point-per-reception.",
  },
  {
    season: "2021",
    title: "Extra NFL game added",
    detail:
      "The NFL added an extra regular-season game, and the fantasy schedule expanded with it.",
  },
  {
    season: "2023",
    title: "Roster format changed",
    detail:
      "An additional FLEX roster spot was added. This season is not imported yet.",
  },
  {
    season: "2025 onward",
    title: "Platform changed to Sleeper",
    detail:
      "The league moved from ESPN to Sleeper. Seasons from 2025 onward should come from Sleeper rather than the ESPN workbook path.",
  },
];

export default function AuditPage() {
  const profile = getDataAuditProfile(historicalLeagueData);
  const managerActivities = getManagerActivities(historicalLeagueData);
  const activityByManagerId = new Map(
    managerActivities.map((activity) => [activity.managerId, activity]),
  );
  const summaryCards = [
    {
      label: "Structural Warnings",
      value: String(profile.summary.warningCount),
      detail:
        profile.summary.warningCount === 0
          ? "references and placements look complete"
          : "items need review",
      tone: profile.summary.warningCount === 0 ? "bg-[#eef5f1]" : "bg-[#fff1bf]",
    },
    {
      label: "Notices",
      value: String(profile.summary.noticeCount),
      detail: "known edge cases",
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Tied Games",
      value: String(profile.summary.tieCount),
      detail: "exact score ties",
      tone: "bg-[#e7f6f8]",
    },
    {
      label: "Score Review",
      value: String(profile.summary.scoreOutlierCount),
      detail: "below 50 or 200+",
      tone: "bg-[#f5edf7]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#17191f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-[#d9dee4] pb-6">
          <Link
            href="/"
            className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
          >
            Back to League Vault
          </Link>
          <div className="mt-5">
            <p className="text-sm font-semibold uppercase text-[#58606a]">
              Data Audit
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              Workbook QA
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              Structural checks and review queues for the imported historical
              matchup data.
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className={`rounded-lg border border-[#d9dee4] p-4 shadow-sm ${card.tone}`}
            >
              <p className="text-sm font-semibold text-[#58606a]">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#17191f]">
                {card.value}
              </p>
              <p className="mt-2 min-h-10 text-sm leading-5 text-[#66707a]">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <LeagueContextSection />
        <AuditIssuesSection issues={profile.issues} />
        <SeasonCoverageTable seasons={profile.seasons} />

        <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
          <TiedGamesTable
            rows={profile.ties}
            activityByManagerId={activityByManagerId}
          />
          <ScoreOutliersTable
            rows={profile.scoreOutliers}
            activityByManagerId={activityByManagerId}
          />
        </section>

        <DuplicateScoreLinesTable rows={profile.duplicateScoreLines} />
      </div>
    </main>
  );
}

function LeagueContextSection() {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          League Context
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Known era changes
        </h2>
        <p className="mt-2 text-sm leading-5 text-[#66707a]">
          These are intentional league-history notes, not data errors.
        </p>
      </div>
      <div className="grid gap-3 p-3 lg:grid-cols-5">
        {leagueContextNotes.map((note) => (
          <article
            key={`${note.season}:${note.title}`}
            className="rounded-md border border-[#e8ebef] bg-[#f8f9fb] p-3"
          >
            <p className="text-xs font-semibold uppercase text-[#58606a]">
              {note.season}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-[#17191f]">
              {note.title}
            </h3>
            <p className="mt-2 text-sm leading-5 text-[#66707a]">
              {note.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuditIssuesSection({ issues }: { issues: DataAuditIssue[] }) {
  const warningCount = issues.filter((issue) => issue.severity === "warning")
    .length;

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Structural Checks
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          {warningCount === 0 ? "No structural warnings" : "Review warnings"}
        </h2>
      </div>
      <div className="divide-y divide-[#e8ebef]">
        {issues.length > 0 ? (
          issues.map((issue) => <AuditIssueRow key={issue.id} issue={issue} />)
        ) : (
          <p className="px-4 py-4 text-sm text-[#66707a]">
            No warnings or notices found.
          </p>
        )}
      </div>
    </section>
  );
}

function AuditIssueRow({ issue }: { issue: DataAuditIssue }) {
  return (
    <div className="grid gap-3 px-4 py-4 md:grid-cols-[0.16fr_0.22fr_1fr]">
      <div>
        <StatusBadge status={issue.severity} />
      </div>
      <div className="text-sm font-semibold text-[#58606a]">
        {issue.seasonYear ? (
          <Link
            href={`/seasons/${issue.seasonYear}`}
            className="underline-offset-4 hover:text-[#2f6f50] hover:underline"
          >
            {issue.seasonYear}
          </Link>
        ) : (
          "All"
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#17191f]">{issue.title}</p>
        <p className="mt-1 text-sm leading-5 text-[#66707a]">
          {issue.area}: {issue.detail}
        </p>
      </div>
    </div>
  );
}

function SeasonCoverageTable({ seasons }: { seasons: SeasonAuditRow[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Season Coverage
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Counts by year
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Season</th>
              <th className="px-4 py-3 font-semibold">Teams</th>
              <th className="px-4 py-3 font-semibold">Weeks</th>
              <th className="px-4 py-3 font-semibold">Matchups</th>
              <th className="px-4 py-3 font-semibold">Regular</th>
              <th className="px-4 py-3 font-semibold">Playoff</th>
              <th className="px-4 py-3 font-semibold">Consolation</th>
              <th className="px-4 py-3 font-semibold">Placements</th>
              <th className="px-4 py-3 font-semibold">Ties</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr key={season.seasonId} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/seasons/${season.seasonYear}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {season.seasonYear}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.teamCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.weekCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.matchupCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.regularMatchupCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.playoffMatchupCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.consolationMatchupCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.finalPlacementCount}/
                  {season.expectedFinalPlacementCount}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {season.tieCount}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={season.status} />
                  {season.tiedFinishLabels.length > 0 && (
                    <span className="ml-2 text-xs font-semibold text-[#7c5200]">
                      {season.tiedFinishLabels.join(", ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TiedGamesTable({
  rows,
  activityByManagerId,
}: {
  rows: TieAuditRow[];
  activityByManagerId: Map<string, ManagerActivity>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">Tied Games</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Exact score ties
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Managers</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.matchupId} className="border-t border-[#e8ebef]">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/seasons/${row.seasonYear}`}
                      className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                    >
                      {row.seasonYear} Week {row.weekNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ManagerLink
                        managerId={row.firstManagerId}
                        managerName={row.firstManagerName}
                        isActive={getManagerIsActive(
                          activityByManagerId,
                          row.firstManagerId,
                        )}
                      />
                      <span className="text-[#7a828c]">vs</span>
                      <ManagerLink
                        managerId={row.secondManagerId}
                        managerName={row.secondManagerName}
                        isActive={getManagerIsActive(
                          activityByManagerId,
                          row.secondManagerId,
                        )}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#17191f]">
                    {formatScore(row.score)}-{formatScore(row.score)}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {formatGameType(row.gameType)}
                    {row.isFinalSeedingGame ? " / final seeding" : ""}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-[#66707a]" colSpan={4}>
                  No tied games found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScoreOutliersTable({
  rows,
  activityByManagerId,
}: {
  rows: ScoreOutlierAuditRow[];
  activityByManagerId: Map<string, ManagerActivity>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">Score Review</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Outlier score lines
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Manager</th>
              <th className="px-4 py-3 font-semibold">Opponent</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.matchupId}:${row.managerId}`} className="border-t border-[#e8ebef]">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/seasons/${row.seasonYear}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {row.seasonYear} Week {row.weekNumber}
                  </Link>
                  <span className="text-[#7a828c]">
                    {" "}
                    / {formatGameType(row.gameType)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ManagerLink
                    managerId={row.managerId}
                    managerName={row.managerName}
                    isActive={getManagerIsActive(
                      activityByManagerId,
                      row.managerId,
                    )}
                  />
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {row.opponentManagerName}
                </td>
                <td className="px-4 py-3 font-semibold text-[#17191f]">
                  {formatScore(row.points)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {row.thresholdLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DuplicateScoreLinesTable({
  rows,
}: {
  rows: DuplicateScoreLineAuditRow[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Duplicate Score Lines
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Same week, type, and score
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Game</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Matchups</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={`${row.seasonYear}:${row.weekNumber}:${row.scoreLine}`}
                  className="border-t border-[#e8ebef]"
                >
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/seasons/${row.seasonYear}`}
                      className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                    >
                      {row.seasonYear} Week {row.weekNumber}
                    </Link>
                    <span className="text-[#7a828c]">
                      {" "}
                      / {formatGameType(row.gameType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {row.scoreLine}
                  </td>
                  <td className="px-4 py-3 text-[#424a53]">
                    {row.matchupIds.join(", ")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-[#66707a]" colSpan={3}>
                  No duplicate score lines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: "clean" | "review" | "warning" | "notice";
}) {
  const label =
    status === "clean"
      ? "Clean"
      : status === "warning"
        ? "Warning"
        : "Review";
  const className =
    status === "clean"
      ? "bg-[#eef5f1] text-[#2f6f50]"
      : status === "warning"
        ? "bg-[#f8dadd] text-[#8a2635]"
        : "bg-[#fff4d6] text-[#7c5200]";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function getManagerIsActive(
  activityByManagerId: Map<string, ManagerActivity>,
  managerId: string,
) {
  return activityByManagerId.get(managerId)?.isActive ?? false;
}

function formatGameType(gameType: string) {
  if (gameType === "regular") {
    return "Regular";
  }

  if (gameType === "playoff") {
    return "Playoff";
  }

  return "Consolation";
}

function formatScore(score: number) {
  return score.toFixed(1);
}
