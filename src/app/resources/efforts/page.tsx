import Link from "next/link";
import { readDirectory } from "@/lib/data";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EffortsArchiveFilter } from "@/components/blog/EffortsArchiveFilter";
import {
  EFFORTS_PAGE_SIZE,
  buildArchive,
  filterPostsByArchive,
  formatPostDate,
  paginate,
  postExcerpt,
  sortedEffortsByDate,
} from "@/lib/blog";

function pageHref(page: number, year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/resources/efforts${qs ? `?${qs}` : ""}`;
}

export default async function EffortsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const dir = readDirectory();
  const allPosts = sortedEffortsByDate(dir.info.wsrEfforts);
  const archive = buildArchive(allPosts);

  const year = sp.year ? Number(sp.year) : undefined;
  const month = sp.month ? Number(sp.month) : undefined;
  const filtered = filterPostsByArchive(allPosts, year, month);

  const { items: posts, page, totalPages } = paginate(filtered, Number(sp.page) || 1, EFFORTS_PAGE_SIZE);

  return (
    <div className="flex-1">
      <SiteHeader backHref="/resources" backLabel="← All resources" />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Stake and Ward WSR Efforts</h1>
        <p className="mt-1 text-sm text-muted-foreground">What stake and ward committees are working on.</p>

        {archive.length > 0 && <EffortsArchiveFilter archive={archive} selectedYear={year} selectedMonth={month} />}

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            {allPosts.length === 0 ? "Nothing here yet." : "No posts match that filter."}
          </p>
        ) : (
          <div className="mt-8 flex flex-col">
            {posts.map((post) => {
              const href = `/resources/efforts/${post.id}`;
              return (
                <article key={post.id} className="flex gap-5 border-t py-6 first:border-t-0">
                  {post.photo && (
                    <Link href={href} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.photo} alt="" className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28" />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{formatPostDate(post.date)}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      <Link href={href} className="hover:text-accent">
                        {post.title || "Untitled post"}
                      </Link>
                    </h2>
                    {postExcerpt(post.content) && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {postExcerpt(post.content)}
                      </p>
                    )}
                    <Link href={href} className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
                      Read more →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-between border-t pt-6">
            {page > 1 ? (
              <Link href={pageHref(page - 1, year, month)} className="riso-chip">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1, year, month)} className="riso-chip">
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
