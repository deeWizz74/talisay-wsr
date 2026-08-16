import type { ReactNode } from "react";
import type { MentionIndex } from "./mentions";
import { renderTextWithMentions } from "./mentions";

// A small, deliberately non-extensible markdown-like subset: bold, italic,
// and links. Kept inline-only (no nesting) so the regex stays simple and
// predictable for non-technical editors typing it by hand.
const INLINE_RE = /\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text: string, mentionIndex: MentionIndex): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_RE.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++}>{renderTextWithMentions(text.slice(lastIndex, match.index), mentionIndex)}</span>,
      );
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {match[3]}
        </a>,
      );
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{renderTextWithMentions(text.slice(lastIndex), mentionIndex)}</span>);
  }
  return nodes;
}

// Renders one paragraph (already split on blank lines by the caller) as a
// quote block, a bullet list, or a plain paragraph, based on its lines.
export function RichParagraph({ text, mentionIndex }: { text: string; mentionIndex: MentionIndex }) {
  const lines = text.split("\n");
  const nonEmpty = lines.filter((l) => l.trim());

  const isQuote = nonEmpty.length > 0 && nonEmpty.every((l) => l.trim().startsWith(">"));
  if (isQuote) {
    const quoteLines = nonEmpty.map((l) => l.trim().replace(/^>\s?/, ""));
    return (
      <blockquote className="riso-tile px-4 py-3 italic text-foreground/80">
        {quoteLines.map((line, i) => (
          <p key={i} className="leading-relaxed">
            {renderInline(line, mentionIndex)}
          </p>
        ))}
      </blockquote>
    );
  }

  const isList = nonEmpty.length > 0 && nonEmpty.every((l) => l.trim().startsWith("- "));
  if (isList) {
    const items = nonEmpty.map((l) => l.trim().replace(/^-\s?/, ""));
    return (
      <ul className="list-disc space-y-1 pl-5 text-base leading-relaxed text-foreground">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, mentionIndex)}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-base leading-relaxed text-foreground">{renderInline(text, mentionIndex)}</p>;
}
