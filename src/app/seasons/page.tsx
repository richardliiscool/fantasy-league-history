import type { Metadata } from "next";
import Link from "next/link";
import { ManagerLink } from "@/components/ManagerLink";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import { getManagerActivities } from "@/lib/stats/managerActivity";
import {
  getSeasonsIndexProfile,
  type SeasonFinishBadge,
} from "@/lib/stats/seasonsIndexProfile";

export const metadata: Metadata = {
  title: "Seasons | Fantasy League History",
};

export default function SeasonsPage() {
  const profile = getSeasonsIndexProfile(historicalLeagueData);
  const managerActivities = getManagerActivities(historicalLeagueData);
  const activityByManagerId = new Map(
    managerActivities.map((activity) => [activity.managerId, activity]),
  );

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
              Season Archive
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              Seasons
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              Podium and last-place finishes by year, ordered from the latest
              completed season back to the original archive.
            </p>
          </div>
        </header>

        <section className="grid gap-4">
          {profile.seasons.map((season) => (
            <article
              key={season.seasonId}
              className="overflow-hidden rounded-lg border border-[#d9dee4] bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-[#e8ebef] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#58606a]">
                    {season.label}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
                    {season.seasonYear} podium + last place
                  </h2>
                </div>
                <Link
                  href={`/seasons/${season.seasonYear}`}
                  className="w-fit rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
                >
                  View season
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-[#f8f9fb] text-[#58606a]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Finish</th>
                      <th className="px-4 py-3 font-semibold">Manager</th>
                      <th className="px-4 py-3 font-semibold">Nickname</th>
                      <th className="px-4 py-3 font-semibold">Record</th>
                      <th className="px-4 py-3 font-semibold">PF</th>
                      <th className="px-4 py-3 font-semibold">PA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {season.podiumRows.map((row) => {
                      const isActive =
                        activityByManagerId.get(row.managerId)?.isActive ??
                        false;

                      return (
                        <tr
                          key={`${season.seasonId}-${row.managerId}-${row.finish}`}
                          className={`border-t border-[#e8ebef] ${
                            isActive ? "" : "bg-[#fafafa]"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span
                              className={getFinishBadgeClass(row.badge)}
                              aria-label={getFinishBadgeAccessibleLabel(row.badge)}
                              title={getFinishBadgeAccessibleLabel(row.badge)}
                            >
                              {row.badge}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ManagerLink
                              managerId={row.managerId}
                              managerName={row.managerName}
                              isActive={isActive}
                            />
                          </td>
                          <td className={getTableCellClass(isActive)}>
                            {row.teamName}
                          </td>
                          <td className={getTableCellClass(isActive)}>
                            {formatRecord(row.official)}
                          </td>
                          <td className={getTableCellClass(isActive)}>
                            {formatPoints(row.official.pointsFor)}
                          </td>
                          <td className={getTableCellClass(isActive)}>
                            {formatPoints(row.official.pointsAgainst)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function getFinishBadgeClass(badge: SeasonFinishBadge) {
  const baseClass =
    "inline-flex min-w-20 justify-center rounded-md border px-2 py-1 text-xs font-semibold";

  if (badge === "Gold") {
    return `${baseClass} border-[#c79a28] bg-[#fff1bf] text-[#4f3700]`;
  }

  if (badge === "Silver") {
    return `${baseClass} border-[#a9b2bd] bg-[#eef1f4] text-[#424a53]`;
  }

  if (badge === "Bronze") {
    return `${baseClass} border-[#b98258] bg-[#f8e4d7] text-[#5d2d18]`;
  }

  return `${baseClass} border-[#d9dee4] bg-white text-[#17191f]`;
}

function getFinishBadgeAccessibleLabel(badge: SeasonFinishBadge) {
  return badge === "💩" ? "Last Place" : badge;
}

function getTableCellClass(isActive: boolean) {
  return `px-4 py-3 ${isActive ? "text-[#424a53]" : "text-[#8a939e]"}`;
}

function formatRecord(record: { wins: number; losses: number; ties: number }) {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}`;
}

function formatPoints(points: number) {
  return points.toFixed(1);
}
