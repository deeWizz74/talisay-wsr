import "server-only";
import fs from "fs";
import path from "path";
import type { DirectoryData, Group, Person, Ward, Stats } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
export const DIRECTORY_FILE = path.join(DATA_DIR, "directory.json");
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function readDirectory(): DirectoryData {
  const dir: DirectoryData = JSON.parse(fs.readFileSync(DIRECTORY_FILE, "utf8"));
  if (!dir.info) {
    dir.info = { pefFaq: [], spotlight: [], wsrEfforts: [] };
  }
  // Migrate older posts stored as a single `body` string into the block-based
  // `content` shape (one text block), so old data keeps working after the
  // inline-image feature replaced the plain-text body.
  for (const post of dir.info.wsrEfforts) {
    const legacy = post as unknown as { body?: string; content?: unknown };
    if (!Array.isArray(legacy.content)) {
      post.content = legacy.body ? [{ id: `${post.id}-text`, type: "text", text: legacy.body }] : [];
      delete legacy.body;
    }
  }
  return dir;
}

export function writeDirectory(dir: DirectoryData) {
  dir.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(DIRECTORY_FILE, JSON.stringify(dir, null, 2));
}

// A specialist role chairs its own area (viceChair), and a stake-level
// secretary reports directly to the WSR specialist — both are optional
// extra groups beyond the ward's core leadership/lead/roles structure.
export function wardGroups(ward: Ward): Group[] {
  const groups: Group[] = [...(ward.leadership || []), ward.lead, ...ward.roles];
  for (const r of ward.roles) {
    if (r.viceChair) groups.push(r.viceChair);
  }
  if (ward.secretary) groups.push(ward.secretary);
  return groups;
}

export interface FoundPerson {
  ward: Ward;
  group: Group;
  person: Person;
  idx: number;
}

export function findPerson(dir: DirectoryData, personId: string): FoundPerson | null {
  for (const ward of dir.wards) {
    for (const group of wardGroups(ward)) {
      const idx = group.people.findIndex((p) => p.id === personId);
      if (idx !== -1) return { ward, group, person: group.people[idx], idx };
    }
  }
  return null;
}

export interface PersonContext {
  person: Person;
  role: string;
  wardName: string;
}

export function allPeopleWithContext(dir: DirectoryData): PersonContext[] {
  const result: PersonContext[] = [];
  for (const ward of dir.wards) {
    for (const group of wardGroups(ward)) {
      for (const person of group.people) {
        if (person.name.trim()) {
          result.push({ person, role: group.role, wardName: ward.name });
        }
      }
    }
  }
  return result;
}

export function computeStats(dir: DirectoryData): Stats {
  let filledRoleSlots = 0;
  let totalRoleSlots = 0;
  let totalPeople = 0;
  let peopleWithMessenger = 0;

  for (const ward of dir.wards) {
    const roleGroups = [ward.lead, ...ward.roles];
    for (const g of roleGroups) {
      totalRoleSlots += 1;
      if (g.people.length > 0) filledRoleSlots += 1;
    }
    for (const g of wardGroups(ward)) {
      for (const p of g.people) {
        totalPeople += 1;
        if (p.messenger) peopleWithMessenger += 1;
      }
    }
  }

  return {
    wardsCount: dir.wards.length,
    totalRoleSlots,
    filledRoleSlots,
    vacantRoleSlots: totalRoleSlots - filledRoleSlots,
    totalPeople,
    peopleWithMessenger,
  };
}
