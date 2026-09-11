import Link from "next/link";
import { formatPercentage } from "@/lib/formatters";
import type { SeasonFinalStandingRow } from "@/lib/stats/seasonProfile";

type SeasonStandingsTableProps = {
  finalStandings: SeasonFinalStandingRow[];
};

export function SeasonStandingsTable({
  finalStandings,
}: SeasonStandingsTableProps) {
  const finishCounts = getFinishCounts(finalStandings);

  return (
    <section className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm">
      <div className="border-b border-[#e8ebef] px-4 py-4">
        <p className="text-sm font-semibold text-[#58606a]">
          Final Standings
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
          Playoff finish order
        </h2>
        <p className="mt-2 text-sm text-[#66707a]">
          Ordered by the final placement data from the historical workbook.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#f8f9fb] text-[#58606a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Finish</th>
              <th className="px-4 py-3 font-semibold">Manager</th>
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold">Regular</th>
              <th className="px-4 py-3 font-semibold">Playoffs</th>
              <th className="px-4 py-3 font-semibold">Official</th>
              <th className="px-4 py-3 font-semibold">Win %</th>
              <th className="px-4 py-3 font-semibold">PF</th>
              <th className="px-4 py-3 font-semibold">Avg PF</th>
            </tr>
          </thead>
          <tbody>
            {finalStandings.map((standing) => (
              <tr
                key={standing.managerId}
                className={`border-t border-[#e8ebef] ${
                  standing.finish === 1 ? "bg-[#eef5f1]" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex min-w-12 justify-center rounded-md bg-[#f8f9fb] px-2 py-1 text-sm font-semibold text-[#17191f]">
                    {formatFinish(
                      standing.finish,
                      finishCounts.get(standing.finish) ?? 0,
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/managers/${standing.managerId}`}
                    className="text-[#17191f] underline-offset-4 hover:text-[#2f6f50] hover:underline"
                  >
                    {standing.managerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {standing.teamName}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.regular)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.playoffs)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatRecord(standing.official)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatPercentage(standing.official.winPercentage)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.pointsFor)}
                </td>
                <td className="px-4 py-3 text-[#424a53]">
                  {formatScore(standing.official.averagePointsFor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getFinishCounts(finalStandings: SeasonFinalStandingRow[]) {
  return finalStandings.reduce<Map<number, number>>((counts, standing) => {
    counts.set(standing.finish, (counts.get(standing.finish) ?? 0) + 1);
    return counts;
  }, new Map());
}

function formatFinish(finish: number, count: number) {
  return count > 1 ? `T-${finish}` : String(finish);
}

function formatRecord(
  record: Pick<SeasonFinalStandingRow["official"], "wins" | "losses" | "ties">,
) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatScore(score: number) {
  return score.toFixed(1);
}
