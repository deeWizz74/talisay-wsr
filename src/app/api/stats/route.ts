import { NextResponse } from "next/server";
import { readDirectory, computeStats } from "@/lib/data";

export async function GET() {
  const dir = readDirectory();
  return NextResponse.json(computeStats(dir));
}
