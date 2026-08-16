import { NextResponse } from "next/server";
import { readDirectory } from "@/lib/data";
import type { WardSummary } from "@/lib/types";

export async function GET() {
  const dir = readDirectory();
  const summaries: WardSummary[] = dir.wards.map((w) => ({
    slug: w.slug,
    name: w.name,
    isStake: !!w.isStake,
  }));
  return NextResponse.json(summaries);
}
