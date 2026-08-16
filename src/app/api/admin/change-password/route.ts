import { NextResponse } from "next/server";
import { getSessionUser, changePassword } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  const result = changePassword(currentPassword, newPassword);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
