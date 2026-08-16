import { readDirectory } from "@/lib/data";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function FaqPage() {
  const dir = readDirectory();
  const { pefFaq } = dir.info;

  return (
    <div className="flex-1">
      <SiteHeader backHref="/resources" backLabel="← All resources" />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">PEF FAQ</h1>
        <p className="mt-1 text-sm text-muted-foreground">Common questions about the Perpetual Education Fund.</p>

        {pefFaq.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <dl className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-[280px_1fr]">
            {pefFaq.map((item) => (
              <div key={item.id} className="contents">
                <dt className="border-t py-4 font-semibold text-foreground">{item.question}</dt>
                <dd className="border-t py-4 text-sm leading-relaxed text-muted-foreground sm:border-t">{item.answer}</dd>
              </div>
            ))}
          </dl>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
