import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { readDirectory, writeDirectory, findPerson } from "@/lib/data";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const dir = readDirectory();
  const found = findPerson(dir, id);
  if (!found) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const body = await req.json();
  const { name, messenger, phone, email } = body;
  if (typeof name === "string") found.person.name = name.trim();
  if (typeof messenger === "string") found.person.messenger = messenger.trim();
  if (typeof phone === "string") found.person.phone = phone.trim();
  if (typeof email === "string") found.person.email = email.trim();
  writeDirectory(dir);
  return NextResponse.json(found.person);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const dir = readDirectory();
  const found = findPerson(dir, id);
  if (!found) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  if (found.person.photo) {
    const photoPath = path.join(process.cwd(), "public", found.person.photo);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }
  found.group.people.splice(found.idx, 1);
  writeDirectory(dir);
  return NextResponse.json({ ok: true });
}
