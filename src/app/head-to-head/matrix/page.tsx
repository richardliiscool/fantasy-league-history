import type { Metadata } from "next";
import Link from "next/link";
import { HeadToHeadMatrixDashboard } from "@/components/HeadToHeadMatrixDashboard";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import { getHeadToHeadMatrixProfile } from "@/lib/stats/headToHeadMatrixProfile";

export const metadata: Metadata = {
  title: "Head-to-Head Matrix | Fantasy League History",
};

export default function HeadToHeadMatrixPage() {
  const profile = getHeadToHeadMatrixProfile(historicalLeagueData);

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
              href="/head-to-head"
              className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
            >
              Rivalry Board
            </Link>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold uppercase text-[#58606a]">
              Head-to-Head Matrix
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              Rivalry Map
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              A league-wide grid of manager-vs-manager records. Each cell links
              to the detailed head-to-head page for that rivalry.
            </p>
          </div>
        </header>

        <HeadToHeadMatrixDashboard profile={profile} />
      </div>
    </main>
  );
}
