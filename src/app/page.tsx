import Link from "next/link";
import { readDirectory, computeStats } from "@/lib/data";
import { WardJumpForm } from "@/components/landing/WardJumpForm";
import { Button } from "@/components/ui/button";

const SPECIALIST_ROLES = [
  "Education Specialist",
  "Family Services Specialist",
  "Health and Nutrition Specialist",
  "GAMA Specialist",
  "My Plan Specialist",
  "Business and Employment Specialist",
  "ATPG Specialist",
];

export default function HomePage() {
  const dir = readDirectory();
  const stats = computeStats(dir);
  const wards = dir.wards.map((w) => ({ slug: w.slug, name: w.name, isStake: !!w.isStake }));
  const stake = wards.find((w) => w.isStake);
  const regularWards = wards.filter((w) => !w.isStake);

  return (
    <div className="flex-1">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent-vivid text-xs font-extrabold text-foreground">
              WSR
            </span>
            <p className="text-sm font-semibold text-foreground">Know Your Specialist</p>
          </div>
          <Link href="/resources" className="riso-chip">
            Resources
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="riso-grain relative overflow-hidden py-14 sm:py-20">
          {/* Decorative halftone shapes — purely ornamental, echo the riso reference's
              layered organic circles. Hidden from assistive tech and non-interactive. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute -right-16 -top-10 hidden h-64 w-64 rounded-[45%_55%_60%_40%] bg-foreground/90 sm:block lg:h-80 lg:w-80"
            />
            <div className="riso-halftone absolute -right-6 top-24 hidden h-56 w-56 text-accent-vivid sm:block lg:h-72 lg:w-72" />
            <div className="absolute bottom-6 left-[46%] hidden h-16 w-16 rounded-full bg-secondary sm:block" />
          </div>

          <div className="relative grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
                <span aria-hidden="true" className="h-2 w-2 bg-accent-vivid" />
                Talisay Stake · Welfare &amp; Self-Reliance
              </span>

              <h1 className="mt-4 max-w-lg text-[2.75rem] font-[800] leading-[0.98] tracking-[-0.03em] text-foreground sm:text-[3.5rem]">
                Find your ward&apos;s specialist <span className="text-accent">in a few taps.</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-foreground/75">
                Every ward has a Welfare &amp; Self-Reliance team covering education, family services, health, and
                employment. Look up who serves your ward and message them directly.
              </p>
              <p className="mt-4 max-w-md text-sm font-medium text-muted-foreground">
                {stats.filledRoleSlots} of {stats.totalRoleSlots} specialist roles are filled across {stats.wardsCount}{" "}
                wards right now.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {stake && (
                  <Button asChild variant="accent" size="lg" className="rounded-sm">
                    <Link href={`/directory?ward=${stake.slug}`}>Open directory</Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg" className="rounded-sm">
                  <a href="#every-ward">Browse every ward</a>
                </Button>
              </div>
            </div>

            <WardJumpForm wards={wards} />
          </div>
        </section>

        <section id="every-ward" className="border-t border-border py-12">
          <h2 className="mb-6 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Every ward
          </h2>
          {stake && (
            <Link
              href={`/directory?ward=${stake.slug}`}
              className="riso-tile mb-4 flex items-center justify-between px-5 py-4 text-sm font-bold text-foreground"
            >
              {stake.name}
              <span className="text-xs font-extrabold uppercase tracking-wide text-accent">Stake leadership</span>
            </Link>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {regularWards.map((w) => (
              <Link
                key={w.slug}
                href={`/directory?ward=${w.slug}`}
                className="riso-tile px-5 py-4 text-sm font-bold text-foreground"
              >
                {w.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-12">
          <h2 className="mb-6 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            What each specialist does
          </h2>
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-[220px_1fr]">
            {SPECIALIST_ROLES.map((role) => {
              const desc = dir.meta.roleLegend[role];
              if (!desc) return null;
              return (
                <div key={role} className="contents">
                  <dt className="border-t border-border py-3 font-bold text-foreground">{role}</dt>
                  <dd className="border-t border-border py-3 text-sm leading-relaxed text-foreground/70 sm:border-t">
                    {desc}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <p className="pb-6 pt-4 text-center text-xs text-muted-foreground">
          Directory last updated: {new Date(dir.meta.updatedAt).toLocaleString()}
        </p>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
