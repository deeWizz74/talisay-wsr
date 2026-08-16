import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

const SECTIONS = [
  { href: "/resources/faq", title: "PEF FAQ", description: "Common questions about the Perpetual Education Fund." },
  { href: "/resources/spotlight", title: "Spotlight", description: "Meet the people serving on your WSR committees." },
  {
    href: "/resources/efforts",
    title: "Stake and Ward WSR Efforts",
    description: "What stake and ward committees are working on.",
  },
];

export default function ResourcesHubPage() {
  return (
    <div className="flex-1">
      <SiteHeader backHref="/directory" backLabel="View directory" />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PEF questions, specialist spotlights, and Stake and Ward WSR efforts.
        </p>

        <div className="mt-10 flex flex-col">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center justify-between gap-4 border-t py-5 transition-colors hover:text-accent last:border-b"
            >
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
              </div>
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
