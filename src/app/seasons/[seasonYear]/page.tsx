import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeasonMatchupsTable } from "@/components/SeasonMatchupsTable";
import { SeasonStandingsTable } from "@/components/SeasonStandingsTable";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import type { MarginRecord, ScoreRecord } from "@/lib/stats/leagueStats";
import { getSeasonProfile } from "@/lib/stats/seasonProfile";

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
  const summaryCards = [
    {
      label: "Teams",
      value: profile.teams.length,
      detail: "managers in this season",
      tone: "bg-[#eef5f1]",
    },
    {
      label: "Matchups",
      value: profile.matchupCount,
      detail: `${profile.officialMatchupCount} official`,
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Regular",
      value: profile.regularMatchupCount,
      detail: "regular season matchups",
      tone: "bg-[#e7f6f8]",
    },
    {
      label: "Postseason",
      value: profile.playoffMatchupCount,
      detail: `${profile.consolationMatchupCount} consolation`,
      tone: "bg-[#f5edf7]",
    },
  ];
  const recordCards = [
    {
      label: "Highest Score",
      value: formatScore(profile.records.highestScore),
      detail: formatScoreRecord(profile.records.highestScore),
    },
    {
      label: "Lowest Score",
      value: formatScore(profile.records.lowestScore),
      detail: formatScoreRecord(profile.records.lowestScore),
    },
    {
      label: "Biggest Win",
      value: formatMargin(profile.records.biggestWin),
      detail: formatMarginRecord(profile.records.biggestWin),
    },
    {
      label: "Biggest Loss",
      value: formatMargin(profile.records.biggestLoss),
      detail: formatMarginRecord(profile.records.biggestLoss),
    },
    {
      label: "Closest Win",
      value: formatMargin(profile.records.closestWin),
      detail: formatMarginRecord(profile.records.closestWin),
    },
    {
      label: "Closest Loss",
      value: formatMargin(profile.records.closestLoss),
      detail: formatMarginRecord(profile.records.closestLoss),
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
                Season Archive
              </p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
                {profile.seasonYear} Season
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
                {profile.teams.length} teams, {profile.matchupCount} matchups,
                and {profile.regularMatchupCount} regular season games from the
                historical workbook.
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

        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
              <p className="mt-2 text-sm leading-5 text-[#66707a]">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            </article>
          ))}
        </section>

        <SeasonStandingsTable standingsByScope={profile.standingsByScope} />

        <SeasonMatchupsTable matchups={profile.matchups} />
      </div>
    </main>
  );
}

function formatScore(record: ScoreRecord | null) {
  return record ? record.points.toFixed(1) : "0.0";
}

function formatMargin(record: MarginRecord | null) {
  return record ? formatMarginValue(record.margin) : "0.0";
}

function formatScoreRecord(record: ScoreRecord | null) {
  if (!record) {
    return "No games logged";
  }

  return `${record.managerName}, Week ${record.weekNumber} vs ${record.opponentManagerName}`;
}

function formatMarginRecord(record: MarginRecord | null) {
  if (!record) {
    return "No games logged";
  }

  return `${record.managerName}, Week ${record.weekNumber} by ${formatMarginValue(record.margin)}`;
}

function formatMarginValue(margin: number) {
  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
