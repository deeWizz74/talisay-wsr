import { NextResponse } from "next/server";
import { readDirectory } from "@/lib/data";

export async function GET() {
  const dir = readDirectory();
  return NextResponse.json(dir.meta);
}
