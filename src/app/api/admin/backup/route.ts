import { NextResponse } from "next/server";
import fs from "fs";
import { getSessionUser } from "@/lib/auth";
import { DIRECTORY_FILE } from "@/lib/data";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const body = fs.readFileSync(DIRECTORY_FILE, "utf8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="talisay-wsr-backup-${dateStamp}.json"`,
    },
  });
}
