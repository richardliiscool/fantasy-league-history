import type { Metadata } from "next";
import Link from "next/link";
import { ManagerDirectoryDashboard } from "@/components/ManagerDirectoryDashboard";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import { getManagerDirectoryProfile } from "@/lib/stats/managerDirectoryProfile";

export const metadata: Metadata = {
  title: "Managers | Fantasy League History",
};

export default function ManagersPage() {
  const profile = getManagerDirectoryProfile(historicalLeagueData);
  const statCards = [
    {
      label: "Active",
      value: profile.activeManagerCount,
      detail: "played in latest season",
      tone: "bg-[#eef5f1]",
    },
    {
      label: "Managers",
      value: profile.managerCount,
      detail: `${profile.inactiveManagerCount} inactive`,
      tone: "bg-[#fff4d6]",
    },
    {
      label: "Title Count",
      value: profile.titleCount,
      detail: "includes tied champions",
      tone: "bg-[#e7f6f8]",
    },
    {
      label: "Podium Managers",
      value: profile.podiumManagerCount,
      detail: "finished top 3",
      tone: "bg-[#f5edf7]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#17191f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-[#d9dee4] pb-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
            >
              Back to League Vault
            </Link>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase text-[#58606a]">
                Managers
              </p>
              <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
                Manager Directory
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
                One place to browse every manager, compare career records, and
                jump into profiles or rivalry views.
              </p>
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

        <ManagerDirectoryDashboard profile={profile} />
      </div>
    </main>
  );
}
