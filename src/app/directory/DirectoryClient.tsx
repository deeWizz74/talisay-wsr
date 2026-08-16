"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DirectoryMeta, Ward, WardSummary } from "@/lib/types";
import { CommitteeList } from "@/components/committee/CommitteeList";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function DirectoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("ward");

  const [wards, setWards] = useState<WardSummary[] | null>(null);
  const [meta, setMeta] = useState<DirectoryMeta | null>(null);
  const [ward, setWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/wards").then((r) => r.json()), fetch("/api/meta").then((r) => r.json())]).then(
      ([wardList, metaData]: [WardSummary[], DirectoryMeta]) => {
        if (cancelled) return;
        setWards(wardList);
        setMeta(metaData);
        if (!selectedSlug && wardList.length) {
          router.replace(`/directory?ward=${wardList[0].slug}`);
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/wards/${selectedSlug}`)
      .then((r) => r.json())
      .then((data: Ward) => {
        if (!cancelled) {
          setWard(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  return (
    <div>
      <SiteHeader backHref="/resources" backLabel="Resources" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <label className="mb-8 block max-w-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Choose a ward
          </span>
          <select
            className="h-12 w-full rounded-sm border border-input bg-card px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedSlug ?? ""}
            onChange={(e) => router.push(`/directory?ward=${e.target.value}`)}
          >
            {(wards ?? []).map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        {loading || !ward ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">{ward.name}</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {ward.isStake ? "Stake leadership and Welfare & Self-Reliance committee" : "Welfare & Self-Reliance committee"}
            </p>
            <CommitteeList ward={ward} roleLegend={meta?.roleLegend ?? {}} />
          </>
        )}

        {meta && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Last updated: {new Date(meta.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
