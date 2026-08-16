import type { ReactNode } from "react";
import type { PersonContext } from "./data";
import { NameMention } from "@/components/blog/NameMention";

export interface MentionIndex {
  byName: Map<string, PersonContext>;
  names: string[];
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMentionIndex(people: PersonContext[]): MentionIndex {
  const byName = new Map<string, PersonContext>();
  const names: string[] = [];
  for (const ctx of people) {
    const name = ctx.person.name.trim();
    const key = name.toLowerCase();
    if (!name || byName.has(key)) continue;
    byName.set(key, ctx);
    names.push(name);
  }
  names.sort((a, b) => b.length - a.length);
  return { byName, names };
}

export function renderTextWithMentions(text: string, index: MentionIndex): ReactNode {
  if (!text || index.names.length === 0) return text;

  const pattern = index.names.map(escapeRegExp).join("|");
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const match = index.byName.get(part.toLowerCase());
    if (match) {
      return (
        <NameMention key={i} context={match}>
          {part}
        </NameMention>
      );
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}
