import { NextResponse } from "next/server";
import { readDirectory } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dir = readDirectory();
  const ward = dir.wards.find((w) => w.slug === slug);
  if (!ward) return NextResponse.json({ error: "Ward not found" }, { status: 404 });
  return NextResponse.json(ward);
}
