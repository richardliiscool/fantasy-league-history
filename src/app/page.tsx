import { sampleLeagueData } from "@/lib/data/sampleLeague";
import type { MarginRecord, ScoreRecord } from "@/lib/stats/leagueStats";
import { summarizeLeague } from "@/lib/stats/leagueStats";

export default function Home() {
  const summary = summarizeLeague(sampleLeagueData);
  const { records, standings } = summary;
  const statCards = [
    {
      label: "Managers",
      value: summary.managerCount,
      detail: "tracked across sample history",
      tone: "bg-[#eef5f1]",
    },
    {
      label: "Seasons",
      value: summary.seasonCount,
      detail: "ready for historical import",
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Matchups",
      value: summary.matchupCount,
      detail: `${summary.gameCount} team results`,
      tone: "bg-[#e7f6f8]",
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
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#d9dee4] bg-white p-2 shadow-sm">
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

        <section className="grid gap-4 lg:grid-cols-[0.72fr_1fr]">
          <div className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#58606a]">
                  Data Source
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
                  Sample history
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
                  Manual/fake data
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Next input</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  Excel workbook
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8ebef] pt-3">
                <dt className="text-sm text-[#58606a]">Later input</dt>
                <dd className="text-sm font-semibold text-[#17191f]">
                  Sleeper API
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

        <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#e8ebef] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-[#58606a]">
                All-Time Standings
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
                Manager records
              </h2>
            </div>
            <p className="hidden rounded-md bg-[#f0b429]/20 px-3 py-2 text-sm font-semibold text-[#7c5200] sm:block">
              MVP data model
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[#58606a]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Record</th>
                  <th className="px-4 py-3 font-semibold">Win %</th>
                  <th className="px-4 py-3 font-semibold">PF</th>
                  <th className="px-4 py-3 font-semibold">PA</th>
                  <th className="px-4 py-3 font-semibold">Avg PF</th>
                  <th className="px-4 py-3 font-semibold">High</th>
                  <th className="px-4 py-3 font-semibold">Low</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => (
                  <tr
                    key={standing.managerId}
                    className="border-t border-[#e8ebef]"
                  >
                    <td className="px-4 py-3 font-semibold text-[#17191f]">
                      {standing.managerName}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">
                      {standing.wins}-{standing.losses}
                      {standing.ties > 0 ? `-${standing.ties}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">
                      {standing.winPercentage.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">
                      {standing.pointsFor.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">
                      {standing.pointsAgainst.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">
                      {standing.averagePointsFor.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-[#2f6f50]">
                      {formatNullableScore(standing.highestScore)}
                    </td>
                    <td className="px-4 py-3 text-[#b23b4a]">
                      {formatNullableScore(standing.lowestScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatNullableScore(score: number | null) {
  return score === null ? "0.0" : score.toFixed(1);
}

function formatScore(record: ScoreRecord | null) {
  return record ? record.points.toFixed(1) : "0.0";
}

function formatMargin(record: MarginRecord | null) {
  return record ? record.margin.toFixed(1) : "0.0";
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

  return `${record.managerName}, ${record.seasonYear} Week ${record.weekNumber} by ${record.margin.toFixed(1)}`;
}
