import type { Metadata } from "next";
import Link from "next/link";
import { RecordsDashboard } from "@/components/RecordsDashboard";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import { getRecordsProfile } from "@/lib/stats/recordsProfile";

export const metadata: Metadata = {
  title: "Records | Fantasy League History",
};

export default function RecordsPage() {
  const profile = getRecordsProfile(historicalLeagueData);

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
              Records
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              League Record Book
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              Single-game records, margin records, and manager-season stat
              lines calculated from the imported matchup history.
            </p>
          </div>
        </header>

        <RecordsDashboard profile={profile} />
      </div>
    </main>
  );
}
