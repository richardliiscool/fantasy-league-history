import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManagerProfileTables } from "@/components/ManagerProfileTables";
import { ManagerSeasonBreakdownTable } from "@/components/ManagerSeasonBreakdownTable";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import {
  getManagerProfile,
  type ManagerRecordSummary,
  type ManagerStreak,
} from "@/lib/stats/managerProfile";

type ManagerPageProps = {
  params: Promise<{
    managerId: string;
  }>;
};

export function generateStaticParams() {
  return historicalLeagueData.managers.map((manager) => ({
    managerId: manager.id,
  }));
}

export async function generateMetadata({
  params,
}: ManagerPageProps): Promise<Metadata> {
  const { managerId } = await params;
  const profile = getManagerProfile(historicalLeagueData, managerId);

  return {
    title: profile
      ? `${profile.managerName} | Fantasy League History`
      : "Manager | Fantasy League History",
  };
}

export default async function ManagerPage({ params }: ManagerPageProps) {
  const { managerId } = await params;
  const profile = getManagerProfile(historicalLeagueData, managerId);

  if (!profile) {
    notFound();
  }

  const careerCards = [
    {
      label: "Official Record",
      value: formatRecord(profile.career),
      detail: `${profile.career.games} games`,
      tone: "bg-[#eef5f1]",
    },
    {
      label: "Win %",
      value: profile.career.winPercentage.toFixed(3),
      detail: "regular + playoff",
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Avg PF",
      value: formatScore(profile.career.averagePointsFor),
      detail: `${formatScore(profile.career.pointsFor)} total`,
      tone: "bg-[#e7f6f8]",
    },
    {
      label: "Avg PA",
      value: formatScore(profile.career.averagePointsAgainst),
      detail: `${formatScore(profile.career.pointsAgainst)} total`,
      tone: "bg-[#f5edf7]",
    },
  ];
  const highlightCards = [
    {
      label: "Best Regular Season",
      value: profile.bestRegularSeason
        ? String(profile.bestRegularSeason.seasonYear)
        : "N/A",
      detail: profile.bestRegularSeason
        ? formatRecord(profile.bestRegularSeason.record)
        : "No season data",
    },
    {
      label: "Worst Regular Season",
      value: profile.worstRegularSeason
        ? String(profile.worstRegularSeason.seasonYear)
        : "N/A",
      detail: profile.worstRegularSeason
        ? formatRecord(profile.worstRegularSeason.record)
        : "No season data",
    },
    {
      label: "Highest Score",
      value: formatOptionalScore(profile.records.highestScore?.points),
      detail: profile.records.highestScore
        ? `${profile.records.highestScore.seasonYear} Week ${profile.records.highestScore.weekNumber} vs ${profile.records.highestScore.opponentManagerName}`
        : "No games logged",
    },
    {
      label: "Lowest Score",
      value: formatOptionalScore(profile.records.lowestScore?.points),
      detail: profile.records.lowestScore
        ? `${profile.records.lowestScore.seasonYear} Week ${profile.records.lowestScore.weekNumber} vs ${profile.records.lowestScore.opponentManagerName}`
        : "No games logged",
    },
    {
      label: "Longest Win Streak",
      value: formatStreakLength(profile.longestWinningStreak),
      detail: formatStreakRange(profile.longestWinningStreak),
    },
    {
      label: "Longest Loss Streak",
      value: formatStreakLength(profile.longestLosingStreak),
      detail: formatStreakRange(profile.longestLosingStreak),
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
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-[#58606a]">
                Manager Profile
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
                  {profile.managerName}
                </h1>
                <span className={getProfileActivityBadgeClass(profile.isActive)}>
                  {profile.isActive
                    ? "Active"
                    : `Last active ${profile.lastSeasonYear ?? "N/A"}`}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
                {profile.seasonsPlayed} seasons played:{" "}
                {profile.seasonYears.join(", ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#d9dee4] bg-white p-2 shadow-sm sm:grid-cols-4">
              {careerCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-md px-3 py-3 ${card.tone}`}
                >
                  <p className="text-xs font-semibold text-[#58606a]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#17191f]">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-[#66707a]">
                    {card.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {highlightCards.map((card) => (
            <article
              key={card.label}
              className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm"
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

        <ManagerSeasonBreakdownTable seasons={profile.seasonSplits} />

        <ManagerProfileTables
          headToHead={profile.headToHead}
          games={profile.games}
        />
      </div>
    </main>
  );
}

function formatRecord(record: ManagerRecordSummary) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatOptionalScore(score: number | null | undefined) {
  return score === null || score === undefined ? "N/A" : formatScore(score);
}

function formatStreakLength(streak: ManagerStreak | null) {
  return streak ? String(streak.games) : "N/A";
}

function formatStreakRange(streak: ManagerStreak | null) {
  if (!streak) {
    return "No streak logged";
  }

  return `${streak.start.seasonYear} W${streak.start.weekNumber} to ${streak.end.seasonYear} W${streak.end.weekNumber}`;
}

function getProfileActivityBadgeClass(isActive: boolean) {
  return `rounded-md px-3 py-2 text-sm font-semibold ${
    isActive ? "bg-[#eef5f1] text-[#2f6f50]" : "bg-[#eceff3] text-[#7a828c]"
  }`;
}
