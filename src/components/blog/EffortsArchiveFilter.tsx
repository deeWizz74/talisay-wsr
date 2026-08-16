"use client";

import { useRouter } from "next/navigation";
import type { ArchiveMonth } from "@/lib/blog";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function EffortsArchiveFilter({
  archive,
  selectedYear,
  selectedMonth,
}: {
  archive: ArchiveMonth[];
  selectedYear?: number;
  selectedMonth?: number;
}) {
  const router = useRouter();

  const years = [...new Set(archive.map((a) => a.year))].sort((a, b) => b - a);
  const months = [...new Set(archive.map((a) => a.month))].sort((a, b) => a - b);

  const navigate = (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    const qs = params.toString();
    router.push(`/resources/efforts${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter</span>
      <select
        value={selectedYear ?? ""}
        onChange={(e) => navigate(e.target.value ? Number(e.target.value) : undefined, selectedMonth)}
        className="h-9 rounded-sm border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={selectedMonth ?? ""}
        onChange={(e) => navigate(selectedYear, e.target.value ? Number(e.target.value) : undefined)}
        className="h-9 rounded-sm border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All months</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {MONTH_NAMES[m - 1]}
          </option>
        ))}
      </select>
      {(selectedYear || selectedMonth) && (
        <button
          type="button"
          onClick={() => navigate(undefined, undefined)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
