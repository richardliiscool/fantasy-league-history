"use client";

import Link from "next/link";
import { useState } from "react";
import type { DataAuditProfile } from "@/lib/stats/dataAuditProfile";

type DataAuditSummaryDialogProps = {
  profile: DataAuditProfile;
};

export function DataAuditSummaryDialog({
  profile,
}: DataAuditSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cleanSeasonCount = profile.seasons.filter(
    (season) => season.status === "clean",
  ).length;
  const reviewSeasonCount = profile.seasons.length - cleanSeasonCount;
  const hasWarnings = profile.summary.warningCount > 0;
  const statusLabel = hasWarnings ? "Warnings found" : "No structural warnings";

  return (
    <section className="rounded-lg border border-[#d9dee4] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#58606a]">Data Health</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#17191f]">
            Audit summary
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66707a]">
            Quick check for missing references, placement issues, tied games,
            score outliers, and duplicate score lines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-md border border-[#2f6f50] bg-[#eef5f1] px-3 py-2 text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
          >
            Open audit summary
          </button>
          <Link
            href="/audit"
            className="rounded-md border border-[#b8c0c9] bg-white px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
          >
            Full audit page
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <AuditStatCard
          label="Status"
          value={statusLabel}
          tone={hasWarnings ? "warning" : "clean"}
        />
        <AuditStatCard
          label="Clean Seasons"
          value={`${cleanSeasonCount}/${profile.summary.seasonCount}`}
          detail={
            reviewSeasonCount > 0
              ? `${reviewSeasonCount} season needs review`
              : "all seasons clean"
          }
        />
        <AuditStatCard
          label="Notices"
          value={String(profile.summary.noticeCount)}
          detail={`${profile.summary.tieCount} tied game logged`}
        />
        <AuditStatCard
          label="Outliers"
          value={String(profile.summary.scoreOutlierCount)}
          detail="tracked, not treated as warnings"
        />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17191f]/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-audit-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-[#d9dee4] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e8ebef] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[#58606a]">
                  Data Health
                </p>
                <h3
                  id="data-audit-dialog-title"
                  className="mt-1 text-2xl font-semibold text-[#17191f]"
                >
                  Audit summary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <div className="grid gap-2 sm:grid-cols-3">
                <AuditStatCard
                  label="Warnings"
                  value={String(profile.summary.warningCount)}
                  tone={hasWarnings ? "warning" : "clean"}
                />
                <AuditStatCard
                  label="Notices"
                  value={String(profile.summary.noticeCount)}
                />
                <AuditStatCard
                  label="Duplicate Scores"
                  value={String(profile.summary.duplicateScoreLineCount)}
                />
              </div>

              <section className="rounded-md border border-[#e8ebef] p-4">
                <h4 className="text-sm font-semibold text-[#58606a]">
                  Review Items
                </h4>
                {profile.issues.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {profile.issues.slice(0, 5).map((issue) => (
                      <article
                        key={issue.id}
                        className="rounded-md border border-[#e8ebef] bg-[#f8f9fb] p-3"
                      >
                        <p className="text-sm font-semibold text-[#17191f]">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[#66707a]">
                          {issue.detail}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase text-[#58606a]">
                          {issue.severity} / {issue.area}
                          {issue.seasonYear ? ` / ${issue.seasonYear}` : ""}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-5 text-[#66707a]">
                    No structural warnings or notices are currently logged.
                  </p>
                )}
              </section>

              <section className="rounded-md border border-[#e8ebef] p-4">
                <h4 className="text-sm font-semibold text-[#58606a]">
                  Known Non-Warnings
                </h4>
                <p className="mt-2 text-sm leading-5 text-[#66707a]">
                  Score outliers and the 2022 tied championship remain visible
                  for review, but they are preserved as real historical data.
                </p>
              </section>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#e8ebef] px-5 py-4">
              <Link
                href="/audit"
                className="rounded-md border border-[#2f6f50] bg-[#eef5f1] px-3 py-2 text-sm font-semibold text-[#2f6f50] underline-offset-4 hover:underline"
              >
                Open full audit
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-[#b8c0c9] px-3 py-2 text-sm font-semibold text-[#17191f] underline-offset-4 hover:border-[#2f6f50] hover:text-[#2f6f50] hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AuditStatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "clean" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "clean"
      ? "bg-[#dff3e8]"
      : tone === "warning"
        ? "bg-[#fff1bf]"
        : "bg-[#f8f9fb]";

  return (
    <div className={`rounded-md px-3 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold text-[#58606a]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#17191f]">{value}</p>
      {detail && (
        <p className="mt-1 text-xs leading-4 text-[#66707a]">{detail}</p>
      )}
    </div>
  );
}
