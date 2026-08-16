import { readDirectory } from "@/lib/data";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { initials } from "@/lib/format";
import type { SpotlightEntry } from "@/lib/types";

const FIELDS: { key: keyof SpotlightEntry; label: string }[] = [
  { key: "family", label: "Family" },
  { key: "workSchool", label: "Work / School" },
  { key: "hobbies", label: "Hobbies" },
  { key: "funFact", label: "Fun Fact" },
  { key: "favoriteScripture", label: "Favorite Scripture" },
  { key: "gratefulFor", label: "Something I'm Grateful For" },
  { key: "messageToWard", label: "A Message to the Ward" },
];

export default function SpotlightPage() {
  const dir = readDirectory();
  const { spotlight } = dir.info;

  return (
    <div className="flex-1">
      <SiteHeader backHref="/resources" backLabel="← All resources" />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Spotlight</h1>
        <p className="mt-1 text-sm text-muted-foreground">Meet the people serving on your WSR committees.</p>

        {spotlight.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="mt-10 flex flex-col gap-14">
            {spotlight.map((entry) => (
              <article key={entry.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="relative aspect-[4/5] w-full bg-primary sm:aspect-[16/10]">
                  {entry.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.photo} alt={entry.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-8xl font-extrabold tracking-tight text-primary-foreground/90">
                        {initials(entry.name)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-8 text-center sm:px-10">
                  <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Meet <span className="text-accent">{entry.name || "—"}</span>
                  </h2>
                  {entry.calling && (
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {entry.calling}
                    </p>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-x-8 border-t px-6 sm:grid-cols-[200px_1fr] sm:px-10">
                  {FIELDS.filter(({ key }) => entry[key]).map(({ key, label }, i) => (
                    <div key={key} className="contents">
                      <dt className={`py-4 text-sm font-semibold text-foreground ${i > 0 ? "border-t" : ""}`}>
                        {label}
                      </dt>
                      <dd
                        className={`pb-4 text-sm leading-relaxed text-muted-foreground sm:py-4 ${i > 0 ? "sm:border-t" : ""}`}
                      >
                        {entry[key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Maintained by the Talisay Stake WSR committee. Notice something out of date? Let your ward&apos;s WSR
        Specialist know.
      </footer>
    </div>
  );
}
