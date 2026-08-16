import type { EffortBlock, EffortPost } from "./types";

export function sortedEffortsByDate(posts: EffortPost[]): EffortPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function formatPostDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function textParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function postExcerpt(content: EffortBlock[], maxLen = 200): string {
  const firstText = content.find((b): b is Extract<EffortBlock, { type: "text" }> => b.type === "text");
  const [first] = firstText ? textParagraphs(firstText.text) : [];
  if (!first) return "";
  if (first.length <= maxLen) return first;
  return `${first.slice(0, maxLen).trimEnd()}…`;
}

export const EFFORTS_PAGE_SIZE = 10;

export interface ArchiveMonth {
  year: number;
  month: number; // 1–12
  count: number;
}

function postDate(post: EffortPost): Date | null {
  const d = new Date(`${post.date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Builds the list of distinct year/month combinations that have posts, used
// to populate the archive filter — so the dropdown only ever offers periods
// that actually have something in them.
export function buildArchive(posts: EffortPost[]): ArchiveMonth[] {
  const map = new Map<string, ArchiveMonth>();
  for (const post of posts) {
    const d = postDate(post);
    if (!d) continue;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${month}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { year, month, count: 1 });
  }
  return [...map.values()].sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));
}

export function filterPostsByArchive(posts: EffortPost[], year?: number, month?: number): EffortPost[] {
  if (!year && !month) return posts;
  return posts.filter((post) => {
    const d = postDate(post);
    if (!d) return false;
    if (year && d.getFullYear() !== year) return false;
    if (month && d.getMonth() + 1 !== month) return false;
    return true;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, totalPages };
}
