import Link from "next/link";
import {
  LeagueStandingsTable,
  type LeagueStandingsByScope,
} from "@/components/LeagueStandingsTable";
import {
  historicalImportSummary,
  historicalLeagueData,
} from "@/lib/data/historicalLeagueData";
import {
  filterGameResultsByScope,
  type GameScope,
} from "@/lib/stats/gameFilters";
import type { MarginRecord, ScoreRecord } from "@/lib/stats/leagueStats";
import { getManagerActivities } from "@/lib/stats/managerActivity";
import {
  buildGameResults,
  getManagerStandings,
  summarizeLeague,
} from "@/lib/stats/leagueStats";

export default function Home() {
  const allGameResults = buildGameResults(historicalLeagueData);
  const officialGameResults = filterGameResultsByScope(
    allGameResults,
    "official",
  );
  const summary = summarizeLeague(historicalLeagueData, officialGameResults);
  const { records } = summary;
  const seasons = historicalLeagueData.seasons.map((season) => season.year);
  const managerActivities = getManagerActivities(historicalLeagueData);
  const activityByManagerId = new Map(
    managerActivities.map((activity) => [activity.managerId, activity]),
  );
  const activeManagerCount = managerActivities.filter(
    (activity) => activity.isActive,
  ).length;
  const matchupCountBySeasonId = historicalLeagueData.matchups.reduce(
    (counts, matchup) =>
      counts.set(matchup.seasonId, (counts.get(matchup.seasonId) ?? 0) + 1),
    new Map<string, number>(),
  );
  const seasonCards = [...historicalLeagueData.seasons]
    .sort((first, second) => second.year - first.year)
    .map((season) => ({
      year: season.year,
      label: season.label,
      matchups: matchupCountBySeasonId.get(season.id) ?? 0,
    }));
  const seasonRange = `${Math.min(...seasons)}-${Math.max(...seasons)}`;
  const officialMatchups = officialGameResults.length / 2;
  const standingsByScope = (
    ["official", "regular", "playoff", "consolation"] satisfies GameScope[]
  ).reduce((scopes, scope) => {
    const scopedGameResults = filterGameResultsByScope(allGameResults, scope);

    return {
      ...scopes,
      [scope]: getManagerStandings(
        historicalLeagueData,
        scopedGameResults,
      ).map((standing) => ({
        ...standing,
        activity: activityByManagerId.get(standing.managerId) ?? null,
      })),
    };
  }, {} as LeagueStandingsByScope);
  const statCards = [
    {
      label: "Managers",
      value: summary.managerCount,
      detail: `${activeManagerCount} active / ${summary.managerCount} total`,
      tone: "bg-[#eef5f1]",
    },
    {
      label: "Seasons",
      value: summary.seasonCount,
      detail: seasonRange,
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Raw Matchups",
      value: summary.matchupCount,
      detail: "from the workbook",
      tone: "bg-[#e7f6f8]",
    },
    {
      label: "Official Games",
      value: officialMatchups,
      detail: `${summary.gameCount} team results`,
      tone: "bg-[#f5edf7]",
    },
  ];
  const recordCards = [
    {
      label: "Highest Score",
      value: formatScore(records.highestScore),
      detail: formatScoreRecord(records.highestScore),
    },
    {
      label: "Lowest Score",
      value: formatScore(records.lowestScore),
      detail: formatScoreRecord(records.lowestScore),
    },
    {
      label: "Biggest Win",
      value: formatMargin(records.biggestWin),
      detail: formatMarginRecord(records.biggestWin),
    },
    {
      label: "Biggest Loss",
      value: formatMargin(records.biggestLoss),
      detail: formatMarginRecord(records.biggestLoss),
    },
    {
      label: "Closest Win",
      value: formatMargin(records.closestWin),
      detail: formatMarginRecord(records.closestWin),
    },
    {
      label: "Closest Loss",
      value: formatMargin(records.closestLoss),
      detail: formatMarginRecord(records.closestLoss),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#17191f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-[#d9dee4] pb-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-[#2f6f50]">
              Fantasy League History
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              League Vault
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/managers"
                className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                Managers
              </Link>
              <Link
                href="/records"
                className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                Records
              </Link>
              <Link
                href="/head-to-head"
                className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                Head-to-Head
              </Link>
              <Link
                href="/head-to-head/matrix"
                className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                H2H Matrix
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#d9dee4] bg-white p-2 shadow-sm sm:grid-cols-4">
            {statCards.map((card) => (
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
        </header>

        <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#e8ebef] px-4 py-4">
            <p className="text-sm font-semibold text-[#58606a]">
              Season Archive
            </p>
            <h2 className="text-2xl font-semibold text-[#17191f]">
              Browse by year
            </h2>
          </div>
          <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4">
            {seasonCards.map((season) => (
              <Link
                key={season.year}
                href={`/seasons/${season.year}`}
                className="rounded-md border border-[#e8ebef] bg-[#f8f9fb] p-3 underline-offset-4 transition hover:border-[#2f6f50] hover:bg-white hover:underline"
              >
                <span className="block text-xl font-semibold text-[#17191f]">
                  {season.year}
                </span>
                <span className="mt-1 block text-sm text-[#66707a]">
                  {season.matchups} matchups
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.72fr_1fr]">
          <div className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#58606a]">
                  Data Source
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
                  Historical workbook
                </h2>
              </div>
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-[#244c39] bg-[#2f6f50] p-2">
                <div className="grid h-full w-full grid-cols-3 gap-1">
                  <span className="border-r border-white/50" />
                  <span className="border-r border-white/50" />
                  <span />
                </div>
              </div>
            </div>
            <dl className="mt-5 grid gap-3">
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Current input</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  Excel Game Log
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Regular season</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  {historicalImportSummary.gameTypeCounts.regular}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Playoff</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  {historicalImportSummary.gameTypeCounts.playoff}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Consolation kept</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  {historicalImportSummary.gameTypeCounts.consolation}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </section>

        <LeagueStandingsTable standingsByScope={standingsByScope} />
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

  return `${record.managerName}, ${record.seasonYear} Week ${record.weekNumber} vs ${record.opponentManagerName}`;
}

function formatMarginRecord(record: MarginRecord | null) {
  if (!record) {
    return "No games logged";
  }

  return `${record.managerName}, ${record.seasonYear} Week ${record.weekNumber} by ${formatMarginValue(record.margin)}`;
}

function formatMarginValue(margin: number) {
  return margin > 0 && margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
}
