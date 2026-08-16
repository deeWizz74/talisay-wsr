"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WardSummary } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export function WardJumpForm({ wards }: { wards: WardSummary[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState(wards[0]?.slug ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/directory?ward=${slug}`);
      }}
      className="riso-card relative flex flex-col gap-3 p-6 sm:p-7"
    >
      <label htmlFor="ward-jump" className="text-xs font-extrabold uppercase tracking-[0.1em] text-foreground">
        Go straight to your ward
      </label>
      <select
        id="ward-jump"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="h-12 w-full rounded-sm border-[1.5px] border-foreground/25 bg-card px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {wards.map((w) => (
          <option key={w.slug} value={w.slug}>
            {w.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="accent" className="h-12 w-full gap-2 rounded-sm text-base">
        Open directory <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
