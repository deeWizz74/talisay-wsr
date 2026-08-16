"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { ProfileCard } from "@/components/org-chart/ProfileCard";
import { InfoPanel } from "@/components/org-chart/InfoPanel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Group, Person, Ward } from "@/lib/types";

type Selected = { kind: "person"; person: Person; role: string } | { kind: "vacant"; role: string };

function isSelectedPerson(selected: Selected | null, id: string) {
  return selected?.kind === "person" && selected.person.id === id;
}
function isSelectedVacant(selected: Selected | null, role: string) {
  return selected?.kind === "vacant" && selected.role === role;
}

function PersonTile({
  person,
  role,
  selected,
  onSelect,
}: {
  person: Person;
  role: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-sm border border-transparent bg-secondary px-3 py-2.5 text-left transition-colors hover:border-foreground/30",
        selected && "border-accent ring-2 ring-accent/25",
      )}
    >
      {person.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials(person.name)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-foreground">{person.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{role}</span>
      </span>
    </button>
  );
}

function VacantTile({ role, selected, onSelect }: { role: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-sm border border-dashed border-[color:var(--vacant-line)] bg-[color:var(--vacant-bg)] px-3 py-2.5 text-left transition-colors hover:border-accent",
        selected && "border-accent ring-2 ring-accent/25",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-muted-foreground">
        —
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-muted-foreground">Vacant</span>
        <span className="block truncate text-xs text-muted-foreground">{role}</span>
      </span>
    </button>
  );
}

function PeopleRow({
  group,
  selected,
  onSelect,
}: {
  group: Group;
  selected: Selected | null;
  onSelect: (s: Selected) => void;
}) {
  if (group.people.length === 0) {
    return (
      <VacantTile
        role={group.role}
        selected={isSelectedVacant(selected, group.role)}
        onSelect={() => onSelect({ kind: "vacant", role: group.role })}
      />
    );
  }
  return (
    <>
      {group.people.map((p) => (
        <PersonTile
          key={p.id}
          person={p}
          role={group.role}
          selected={isSelectedPerson(selected, p.id)}
          onSelect={() => onSelect({ kind: "person", person: p, role: group.role })}
        />
      ))}
    </>
  );
}

function RoleSection({
  group,
  selected,
  onSelect,
  note,
}: {
  group: Group;
  selected: Selected | null;
  onSelect: (s: Selected) => void;
  note?: string;
}) {
  return (
    <div className="riso-card p-5">
      <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{group.role}</h3>
      <div className="flex flex-wrap gap-2.5">
        <PeopleRow group={group} selected={selected} onSelect={onSelect} />
      </div>

      {group.viceChair && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground/80">
            {group.viceChair.role}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            <PeopleRow group={group.viceChair} selected={selected} onSelect={onSelect} />
          </div>
        </div>
      )}

      {note && <p className="mt-3 text-xs italic text-muted-foreground">{note}</p>}
    </div>
  );
}

export function CommitteeList({ ward, roleLegend }: { ward: Ward; roleLegend: Record<string, string> }) {
  const [selected, setSelected] = useState<Selected | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {ward.leadership && ward.leadership.length > 0 && (
        <>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Stake Leadership
          </h2>
          {ward.leadership.map((g) => (
            <RoleSection key={g.role} group={g} selected={selected} onSelect={setSelected} />
          ))}
        </>
      )}

      <h2 className="mt-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {ward.isStake ? "Stake WSR Committee" : "Ward WSR Committee"}
      </h2>
      <RoleSection group={ward.lead} selected={selected} onSelect={setSelected} />
      {ward.roles.map((g) => (
        <RoleSection key={g.role} group={g} selected={selected} onSelect={setSelected} />
      ))}
      {ward.secretary && (
        <RoleSection
          group={ward.secretary}
          selected={selected}
          onSelect={setSelected}
          note={`Supports the ${ward.lead.role} — doesn't chair its own subcommittee.`}
        />
      )}

      <p className="mt-1 text-center text-xs text-muted-foreground">Tap a name above to see their contact info.</p>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md gap-0 rounded-xl p-0 sm:max-w-md">
          {selected && (
            <div className="p-6 sm:p-7">
              <DialogTitle className="sr-only">
                {selected.kind === "person" ? selected.person.name : "Vacant role"} — {selected.role}
              </DialogTitle>
              {selected.kind === "person" ? (
                <ProfileCard
                  bare
                  person={selected.person}
                  role={selected.role}
                  roleDescription={roleLegend[selected.role]}
                />
              ) : (
                <InfoPanel
                  bare
                  title="Vacant"
                  description={`${roleLegend[selected.role] ?? ""} This role is currently unassigned — contact the ward WSR Specialist if you can serve.`}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
