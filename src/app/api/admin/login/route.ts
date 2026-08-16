import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (typeof username !== "string" || typeof password !== "string" || !verifyCredentials(username, password)) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }
  await createSession(username);
  return NextResponse.json({ ok: true });
}
