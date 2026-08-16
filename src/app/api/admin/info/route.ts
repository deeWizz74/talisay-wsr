import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { readDirectory, writeDirectory } from "@/lib/data";
import type { EffortBlock, EffortPost, FaqEntry, SpotlightEntry } from "@/lib/types";

const STRING_FIELDS_SPOTLIGHT: (keyof SpotlightEntry)[] = [
  "id",
  "name",
  "photo",
  "calling",
  "family",
  "workSchool",
  "hobbies",
  "funFact",
  "favoriteScripture",
  "gratefulFor",
  "messageToWard",
];

function isFaqEntry(v: unknown): v is FaqEntry {
  const e = v as FaqEntry;
  return !!e && typeof e.id === "string" && typeof e.question === "string" && typeof e.answer === "string";
}

function isSpotlightEntry(v: unknown): v is SpotlightEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return STRING_FIELDS_SPOTLIGHT.every((key) => typeof e[key] === "string");
}

function isEffortBlock(v: unknown): v is EffortBlock {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  if (typeof e.id !== "string") return false;
  if (e.type === "text") return typeof e.text === "string";
  if (e.type === "image") return typeof e.url === "string" && typeof e.caption === "string";
  return false;
}

function isEffortPost(v: unknown): v is EffortPost {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.title === "string" &&
    typeof e.date === "string" &&
    typeof e.photo === "string" &&
    Array.isArray(e.content) &&
    e.content.every(isEffortBlock)
  );
}

function removeOrphanedPhotos(oldEntries: { id: string; photo: string }[], keptIds: Set<string>) {
  for (const old of oldEntries) {
    if (!keptIds.has(old.id) && old.photo) {
      const photoPath = path.join(process.cwd(), "public", old.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
  }
}

function collectEffortPhotoUrls(posts: EffortPost[]): Set<string> {
  const urls = new Set<string>();
  for (const post of posts) {
    if (post.photo) urls.add(post.photo);
    for (const block of post.content) {
      if (block.type === "image" && block.url) urls.add(block.url);
    }
  }
  return urls;
}

function removeOrphanedEffortPhotos(oldPosts: EffortPost[], newPosts: EffortPost[]) {
  const oldUrls = collectEffortPhotoUrls(oldPosts);
  const newUrls = collectEffortPhotoUrls(newPosts);
  for (const url of oldUrls) {
    if (!newUrls.has(url)) {
      const photoPath = path.join(process.cwd(), "public", url);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const dir = readDirectory();
  return NextResponse.json(dir.info);
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { pefFaq, spotlight, wsrEfforts } = body ?? {};
  if (!Array.isArray(pefFaq) || !pefFaq.every(isFaqEntry)) {
    return NextResponse.json({ error: "Invalid pefFaq" }, { status: 400 });
  }
  if (!Array.isArray(spotlight) || !spotlight.every(isSpotlightEntry)) {
    return NextResponse.json({ error: "Invalid spotlight" }, { status: 400 });
  }
  if (!Array.isArray(wsrEfforts) || !wsrEfforts.every(isEffortPost)) {
    return NextResponse.json({ error: "Invalid wsrEfforts" }, { status: 400 });
  }

  const dir = readDirectory();

  removeOrphanedPhotos(dir.info.spotlight, new Set(spotlight.map((e: SpotlightEntry) => e.id)));
  removeOrphanedEffortPhotos(dir.info.wsrEfforts, wsrEfforts);

  dir.info = { pefFaq, spotlight, wsrEfforts };
  writeDirectory(dir);
  return NextResponse.json(dir.info);
}
