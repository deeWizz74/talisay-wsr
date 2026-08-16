import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { readDirectory } from "@/lib/data";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const dir = readDirectory();
  return NextResponse.json(dir.wards);
}
