import type { Metadata } from "next";
import Link from "next/link";
import { historicalImportSummary } from "@/lib/data/historicalLeagueData";

export const metadata: Metadata = {
  title: "Data Sources | Fantasy League History",
};

const sourceRows = [
  {
    years: "2015-2022",
    source: "Excel archive",
    status: "Imported",
    detail:
      "Weekly matchups, scores, team names, playoff placement rows, and historical exceptions came from the manually maintained workbook.",
  },
  {
    years: "2023-2024",
    source: "ESPN archive",
    status: "Imported",
    detail:
      "Private ESPN snapshots were imported locally, mapped to league managers, and converted into the same app-shaped dataset.",
  },
  {
    years: "2025",
    source: "Sleeper archive",
    status: "Imported",
    detail:
      "Completed Sleeper season data was imported from local raw snapshots, including weekly matchups and playoff bracket placement.",
  },
  {
    years: "2026",
    source: "Sleeper preview",
    status: "Preview only",
    detail:
      "The in-season Sleeper league can be previewed locally, but it is intentionally excluded from official historical records until complete.",
  },
];

const coverageItems = [
  {
    label: "Seasons",
    value: historicalImportSummary.seasonCount,
    detail: "completed seasons in the committed app data",
  },
  {
    label: "Matchups",
    value: historicalImportSummary.matchupRows,
    detail: "head-to-head matchups across all imported sources",
  },
  {
    label: "Managers",
    value: historicalImportSummary.managerCount,
    detail: "unique historical managers",
  },
  {
    label: "Team Entries",
    value: historicalImportSummary.teamEntries,
    detail: "manager-season team/nickname records",
  },
];

export default function DataSourcesPage() {
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
              Data Sources
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              What powers the records
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              The app runs from committed generated data, while private raw
              exports and credentials stay local.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 rounded-lg border border-[#d9dee4] bg-white p-2 shadow-sm xl:grid-cols-4">
          {coverageItems.map((item) => (
            <div key={item.label} className="rounded-md bg-[#eef5f1] px-3 py-3">
              <p className="text-xs font-semibold text-[#58606a]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#17191f]">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-4 text-[#66707a]">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
          <div className="border-b border-[#e8ebef] px-4 py-4">
            <p className="text-sm font-semibold text-[#58606a]">
              Source Timeline
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
              Imported coverage
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[#f8f9fb] text-[#58606a]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Years</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">What it provides</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={`${row.years}-${row.source}`} className="border-t border-[#e8ebef]">
                    <td className="px-4 py-3 font-semibold text-[#17191f]">
                      {row.years}
                    </td>
                    <td className="px-4 py-3 text-[#424a53]">{row.source}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusClass(row.status)}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 leading-5 text-[#66707a]">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <InfoPanel
            title="What is committed"
            items={[
              "Generated TypeScript data used by the app.",
              "Manager/team/source mapping files needed to regenerate the app data.",
              "Stats logic, pages, tests, and documentation.",
            ]}
          />
          <InfoPanel
            title="What stays local"
            items={[
              "Raw Excel workbooks and raw ESPN/Sleeper JSON archives.",
              "Private ESPN credentials in .env.local.",
              "Preview-only current-season Sleeper data.",
            ]}
          />
        </section>

        <section className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#58606a]">
            Current Boundary
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Matchup-level history only
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66707a]">
            The app currently tracks managers, teams, seasons, weeks, matchups,
            scores, records, and final placements. Player-level box scores are
            not part of the imported historical dataset yet, and financial
            tracking is intentionally out of scope.
          </p>
        </section>
      </div>
    </main>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
      <h2 className="text-2xl font-semibold text-[#17191f]">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-5 text-[#66707a]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2f6f50]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getStatusClass(status: string) {
  const baseClass =
    "inline-flex min-w-24 justify-center rounded-md border px-2 py-1 text-xs font-semibold";

  return status === "Imported"
    ? `${baseClass} border-[#6aa982] bg-[#dff3e8] text-[#123b2a]`
    : `${baseClass} border-[#d9dee4] bg-white text-[#58606a]`;
}
