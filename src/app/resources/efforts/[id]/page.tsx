import { notFound } from "next/navigation";
import { allPeopleWithContext, readDirectory } from "@/lib/data";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { formatPostDate, textParagraphs } from "@/lib/blog";
import { buildMentionIndex } from "@/lib/mentions";
import type { MentionIndex } from "@/lib/mentions";
import { RichParagraph } from "@/lib/richtext";
import type { EffortBlock } from "@/lib/types";

function BlockContent({ block, mentionIndex }: { block: EffortBlock; mentionIndex: MentionIndex }) {
  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.url} alt={block.caption} className="w-full rounded-xl object-cover" />
        {block.caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>
        )}
      </figure>
    );
  }

  const paragraphs = textParagraphs(block.text);
  return (
    <>
      {paragraphs.map((para, i) => (
        <RichParagraph key={i} text={para} mentionIndex={mentionIndex} />
      ))}
    </>
  );
}

export default async function EffortPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dir = readDirectory();
  const post = dir.info.wsrEfforts.find((p) => p.id === id);
  if (!post) notFound();

  const mentionIndex = buildMentionIndex(allPeopleWithContext(dir));

  return (
    <div className="flex-1">
      <SiteHeader backHref="/resources/efforts" backLabel="← All efforts" />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <article>
          <p className="text-xs text-muted-foreground">{formatPostDate(post.date)}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{post.title || "Untitled post"}</h1>

          {post.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photo} alt="" className="mt-6 w-full rounded-xl object-cover" style={{ maxHeight: 420 }} />
          )}

          <div className="mt-6 flex flex-col gap-4">
            {post.content.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              post.content.map((block) => <BlockContent key={block.id} block={block} mentionIndex={mentionIndex} />)
            )}
          </div>
        </article>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
