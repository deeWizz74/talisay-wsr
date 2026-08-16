import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { readDirectory, writeDirectory } from "@/lib/data";
import type { Group, Person } from "@/lib/types";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { slug } = await params;
  const { groupKind, roleIndex, name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const dir = readDirectory();
  const ward = dir.wards.find((w) => w.slug === slug);
  if (!ward) return NextResponse.json({ error: "Ward not found" }, { status: 404 });

  let group: Group | undefined;
  if (groupKind === "lead") group = ward.lead;
  else if (groupKind === "roleViceChair") group = ward.roles[roleIndex]?.viceChair;
  else if (groupKind === "secretary") group = ward.secretary;
  else if (groupKind === "leadership") group = (ward.leadership || [])[roleIndex];
  else group = ward.roles[roleIndex];

  if (!group) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const person: Person = {
    id: "p" + Date.now() + Math.floor(Math.random() * 1000),
    name: name.trim(),
    photo: "",
    messenger: "",
    phone: "",
    email: "",
  };
  group.people.push(person);
  writeDirectory(dir);
  return NextResponse.json(person);
}
