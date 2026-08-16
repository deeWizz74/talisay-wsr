import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { readDirectory, writeDirectory, UPLOADS_DIR } from "@/lib/data";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const dir = readDirectory();
  const entry = dir.info.spotlight.find((e) => e.id === id);
  if (!entry) return NextResponse.json({ error: "Spotlight entry not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `spotlight-${id}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

  if (entry.photo) {
    const old = path.join(process.cwd(), "public", entry.photo);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  entry.photo = `/uploads/${filename}`;
  writeDirectory(dir);
  return NextResponse.json(entry);
}
