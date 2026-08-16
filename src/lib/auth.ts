import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const SECRET_FILE = path.join(DATA_DIR, "session-secret.txt");

const SESSION_COOKIE = "wsr_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

interface AdminRecord {
  username: string;
  passwordHash: string;
}

function getSessionSecret(): string {
  if (!fs.existsSync(SECRET_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"));
  }
  return fs.readFileSync(SECRET_FILE, "utf8").trim();
}

// Single admin account, no public signup. Set ADMIN_USER/ADMIN_PASS in the
// environment for a stable login that survives a host resetting local disk;
// otherwise a random password is generated once and printed to the server log.
export function bootstrapAdmin(): void {
  if (fs.existsSync(ADMIN_FILE)) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASS || crypto.randomBytes(6).toString("base64url");
  const passwordHash = bcrypt.hashSync(password, 10);
  const record: AdminRecord = { username, passwordHash };
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(record, null, 2));
  console.log("========================================================");
  console.log(" Admin account created:");
  console.log("   username:", username);
  console.log("   password:", password);
  console.log(" Log in at /admin/login and change the password after.");
  console.log("========================================================");
}

function readAdmin(): AdminRecord {
  bootstrapAdmin();
  return JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
}

function writeAdmin(admin: AdminRecord): void {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));
}

export function verifyCredentials(username: string, password: string): boolean {
  const admin = readAdmin();
  return username === admin.username && bcrypt.compareSync(password || "", admin.passwordHash);
}

export function changePassword(currentPassword: string, newPassword: string): { ok: boolean; error?: string } {
  const admin = readAdmin();
  if (!bcrypt.compareSync(currentPassword || "", admin.passwordHash)) {
    return { ok: false, error: "Current password is incorrect" };
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters" };
  }
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeAdmin(admin);
  return { ok: true };
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function issueToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { username: data.username };
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, issueToken(username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<{ username: string } | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}
