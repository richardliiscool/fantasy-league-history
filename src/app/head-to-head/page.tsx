import type { Metadata } from "next";
import Link from "next/link";
import { HeadToHeadDashboard } from "@/components/HeadToHeadDashboard";
import { historicalLeagueData } from "@/lib/data/historicalLeagueData";
import type { GameScope } from "@/lib/stats/gameFilters";
import { getHeadToHeadProfile } from "@/lib/stats/headToHeadProfile";

export const metadata: Metadata = {
  title: "Head-to-Head | Fantasy League History",
};

type HeadToHeadPageProps = {
  searchParams: Promise<{
    manager?: string | string[];
    opponent?: string | string[];
    scope?: string | string[];
  }>;
};

export default async function HeadToHeadPage({
  searchParams,
}: HeadToHeadPageProps) {
  const profile = getHeadToHeadProfile(historicalLeagueData);
  const query = await searchParams;
  const initialFirstManagerId = getSingleQueryValue(query.manager);
  const initialSecondManagerId = getSingleQueryValue(query.opponent);
  const initialGameScope = getGameScopeQueryValue(query.scope);

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
              href="/head-to-head/matrix"
              className="text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
            >
              Matrix View
            </Link>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold uppercase text-[#58606a]">
              Head-to-Head
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-[#111614] sm:text-5xl">
              Rivalry Board
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66707a]">
              Manager-vs-manager records, scoring splits, margin records, and
              game logs from the imported matchup history.
            </p>
          </div>
        </header>

        <HeadToHeadDashboard
          profile={profile}
          initialFirstManagerId={initialFirstManagerId}
          initialSecondManagerId={initialSecondManagerId}
          initialGameScope={initialGameScope}
        />
      </div>
    </main>
  );
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getGameScopeQueryValue(value: string | string[] | undefined) {
  const scope = getSingleQueryValue(value);

  return isGameScope(scope) ? scope : null;
}

function isGameScope(value: string | undefined): value is GameScope {
  return (
    value === "official" ||
    value === "regular" ||
    value === "playoff" ||
    value === "consolation"
  );
}
