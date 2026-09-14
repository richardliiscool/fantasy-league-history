import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManagerLink } from "@/components/ManagerLink";
import { SeasonMatchupsTable } from "@/components/SeasonMatchupsTable";
import { SeasonStandingsTable } from "@/components/SeasonStandingsTable";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import {
  getManagerActivities,
  type ManagerActivity,
} from "@/lib/stats/managerActivity";
import {
  getSeasonProfile,
  type SeasonGameRecord,
  type SeasonMatchupSummary,
  type SeasonScoreRecord,
} from "@/lib/stats/seasonProfile";

type SeasonPageProps = {
  params: Promise<{
    seasonYear: string;
  }>;
};

export function generateStaticParams() {
  return historicalLeagueData.seasons.map((season) => ({
    seasonYear: String(season.year),
  }));
}

export async function generateMetadata({
  params,
}: SeasonPageProps): Promise<Metadata> {
  const { seasonYear } = await params;
  const parsedSeasonYear = Number(seasonYear);
  const profile = Number.isFinite(parsedSeasonYear)
    ? getSeasonProfile(historicalLeagueData, parsedSeasonYear)
    : null;

  return {
    title: profile
      ? `${profile.seasonYear} Season | Fantasy League History`
      : "Season | Fantasy League History",
  };
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { seasonYear } = await params;
  const parsedSeasonYear = Number(seasonYear);

  if (!Number.isFinite(parsedSeasonYear)) {
    notFound();
  }

  const profile = getSeasonProfile(historicalLeagueData, parsedSeasonYear);
  const managerActivities = getManagerActivities(historicalLeagueData);
  const activityByManagerId = new Map(
    managerActivities.map((activity) => [activity.managerId, activity]),
  );

  if (!profile) {
    notFound();
  }

  const sortedSeasons = [...historicalLeagueData.seasons].sort(
    (first, second) => first.year - second.year,
  );
  const seasonIndex = sortedSeasons.findIndex(
    (season) => season.year === profile.seasonYear,
  );
  const previousSeason = sortedSeasons[seasonIndex - 1] ?? null;
  const nextSeason = sortedSeasons[seasonIndex + 1] ?? null;
  const championshipLabel =
    profile.champions.length > 1 ? "Championship Tie" : "Champion";
  const recordCards = [
    {
      label: "Highest Score",
      value: formatScore(profile.records.highestScore?.points),
      detail: formatFeaturedRecordDetail(profile.records.highestScore),
      scoreLine: formatFeaturedScoreLine(profile.records.highestScore),
    },
    {
      label: "Lowest Score",
      value: formatScore(profile.records.lowestScore?.points),
      detail: formatFeaturedRecordDetail(profile.records.lowestScore),
      scoreLine: formatFeaturedScoreLine(profile.records.lowestScore),
    },
    {
      label: "Biggest Margin",
      value: formatMargin(profile.records.biggestMargin),
      detail: formatGameRecordDetail(profile.records.biggestMargin),
      scoreLine: formatGameRecordScoreLine(profile.records.biggestMargin),
    },
    {
      label: "Closest Game",
      value: formatMargin(profile.records.closestGame),
      detail: formatGameRecordDetail(profile.records.closestGame),
      scoreLine: formatGameRecordScoreLine(profile.records.closestGame),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#17191f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-[#d9dee4] pb-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
            >
              Back to League Vault
            </Link>
            <Link
              href="/seasons"
              className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
            >
              All Seasons
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-[#58606a]">
                Season Archive
              </p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
                {profile.seasonYear} Season
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
                A year-specific archive with the final finish order, record
                games, and weekly matchup log from the historical workbook.
              </p>
            </div>

            <nav
              aria-label="Season navigation"
              className="flex flex-wrap gap-2 lg:justify-end"
            >
              {previousSeason && (
                <Link
                  href={`/seasons/${previousSeason.year}`}
                  className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
                >
                  {previousSeason.year}
                </Link>
              )}
              {nextSeason && (
                <Link
                  href={`/seasons/${nextSeason.year}`}
                  className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
                >
                  {nextSeason.year}
                </Link>
              )}
            </nav>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[0.78fr_1.42fr]">
          <article className="rounded-lg border border-[#c5d8cc] bg-[#eef5f1] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#58606a]">
              {championshipLabel}
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#17191f]">
              {profile.champions.length > 0
                ? profile.champions.map((champion, index) => (
                    <span key={champion.managerId}>
                      {index > 0 && " + "}
                      <ManagerLink
                        managerId={champion.managerId}
                        managerName={champion.managerName}
                        isActive={getManagerIsActive(
                          activityByManagerId,
                          champion.managerId,
                        )}
                        linkClassName="text-3xl"
                      />
                    </span>
                  ))
                : "Not recorded"}
            </h2>
            <p className="mt-3 text-sm leading-5 text-[#66707a]">
              {formatChampionshipDetail(profile.championshipMatchup)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-5 text-[#17191f]">
              {formatMatchupScoreLine(profile.championshipMatchup)}
            </p>
          </article>

          <SeasonStandingsTable
            finalStandings={profile.finalStandings}
            managerActivities={managerActivities}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recordCards.map((record) => (
            <article
              key={record.label}
              className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-[#58606a]">
                {record.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#17191f]">
                {record.value}
              </p>
              <p className="mt-2 min-h-10 text-sm leading-5 text-[#66707a]">
                {record.detail}
              </p>
              <p className="mt-2 text-sm font-semibold leading-5 text-[#17191f]">
                {record.scoreLine}
              </p>
            </article>
          ))}
        </section>

        <SeasonMatchupsTable
          matchups={profile.matchups}
          managerActivities={managerActivities}
        />
      </div>
    </main>
  );
}

function getManagerIsActive(
  activityByManagerId: Map<string, ManagerActivity>,
  managerId: string,
) {
  return activityByManagerId.get(managerId)?.isActive ?? false;
}

function formatScore(score: number | null | undefined) {
  return score === null || score === undefined ? "0.0" : score.toFixed(1);
}

function formatMargin(record: SeasonGameRecord | null) {
  return record ? formatMarginValue(record.margin) : "0.0";
}

function formatFeaturedRecordDetail(
  record: SeasonScoreRecord | null,
) {
  if (!record) {
    return "No games logged";
  }

  return `${record.featured.managerName}, Week ${record.matchup.weekNumber} vs ${record.opponent.managerName}`;
}

function formatFeaturedScoreLine(
  record: SeasonScoreRecord | null,
) {
  if (!record) {
    return "";
  }

  return `${record.featured.managerName} ${formatScore(record.featured.points)} - ${record.opponent.managerName} ${formatScore(record.opponent.points)}`;
}

function formatGameRecordDetail(record: SeasonGameRecord | null) {
  if (!record) {
    return "No games logged";
  }

  return `Week ${record.matchup.weekNumber} ${formatGameType(record.matchup.gameType)} game`;
}

function formatGameRecordScoreLine(record: SeasonGameRecord | null) {
  return record ? formatMatchupScoreLine(record.matchup) : "";
}

function formatChampionshipDetail(matchup: SeasonMatchupSummary | null) {
  if (!matchup) {
    return "No championship placement game recorded";
  }

  return matchup.winner
    ? `Week ${matchup.weekNumber} title game`
    : `Week ${matchup.weekNumber} title game tied`;
}

function formatMatchupScoreLine(matchup: SeasonMatchupSummary | null) {
  if (!matchup) {
    return "";
  }

  return `${matchup.first.managerName} ${formatScore(matchup.first.points)} - ${matchup.second.managerName} ${formatScore(matchup.second.points)}`;
}

function formatGameType(gameType: SeasonMatchupSummary["gameType"]) {
  if (gameType === "regular") {
    return "regular";
  }

  if (gameType === "playoff") {
    return "playoff";
  }

  return "consolation";
}

function formatMarginValue(margin: number) {
  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
