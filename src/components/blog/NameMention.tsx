import { initials } from "@/lib/format";
import type { PersonContext } from "@/lib/data";

export function NameMention({ context, children }: { context: PersonContext; children: React.ReactNode }) {
  const { person, role, wardName } = context;

  return (
    <span
      tabIndex={0}
      className="group relative inline-block cursor-help border-b border-dashed border-accent/70 font-semibold text-foreground outline-none"
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 max-w-[80vw] -translate-x-1/2 scale-95 rounded-xl border bg-card p-4 text-sm shadow-lg opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus:pointer-events-auto group-focus:scale-100 group-focus:opacity-100">
        <span className="flex items-center gap-3">
          {person.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photo} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(person.name)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block font-semibold text-foreground">{person.name}</span>
            <span className="block text-xs leading-snug text-muted-foreground">
              {role} · {wardName}
            </span>
          </span>
        </span>

        {(person.messenger || person.phone) && (
          <span className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
            {person.messenger && <span className="truncate">Messenger: {person.messenger}</span>}
            {person.phone && <span>Phone: {person.phone}</span>}
          </span>
        )}
      </span>
    </span>
  );
}
