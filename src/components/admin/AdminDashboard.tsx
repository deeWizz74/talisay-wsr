"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Group, Person, Ward } from "@/lib/types";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { FaqSection, SpotlightSection, EffortsSection } from "./ContentEditor";
import { useInfoContent } from "./useInfoContent";
import { Camera, Trash2 } from "lucide-react";

function initials(name: string): string {
  return name
    .replace(/^(Bro\.|Sis\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type GroupKind = "lead" | "leadership" | "role" | "roleViceChair" | "secretary";

function PersonRow({
  person,
  onChanged,
  onRemoved,
  onPhotoClick,
}: {
  person: Person;
  onChanged: () => void;
  onRemoved: () => void;
  onPhotoClick: () => void;
}) {
  const [fields, setFields] = useState({
    name: person.name,
    messenger: person.messenger,
    phone: person.phone,
    email: person.email,
  });
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = (next: typeof fields) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch(`/api/admin/person/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSaved(true);
      onChanged();
      setTimeout(() => setSaved(false), 1500);
    }, 500);
  };

  const update = (key: keyof typeof fields, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save(next);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${person.name}?`)) return;
    await fetch(`/api/admin/person/${person.id}`, { method: "DELETE" });
    onRemoved();
  };

  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-start gap-3 border-t py-3 first:border-t-0 sm:gap-4">
      <button type="button" onClick={onPhotoClick} className="relative h-11 w-11" title={`Change photo for ${person.name}`}>
        {person.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photo} alt={person.name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(person.name)}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Camera className="h-3 w-3" />
        </span>
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input placeholder="Full name" value={fields.name} onChange={(e) => update("name", e.target.value)} />
        <Input
          placeholder="Messenger username or link"
          value={fields.messenger}
          onChange={(e) => update("messenger", e.target.value)}
        />
        <Input placeholder="Phone number" value={fields.phone} onChange={(e) => update("phone", e.target.value)} />
        <Input placeholder="Email (optional)" value={fields.email} onChange={(e) => update("email", e.target.value)} />
        {saved && <span className="text-xs text-[color:var(--success)] sm:col-span-2">Saved ✓</span>}
      </div>

      <Button variant="outline" size="sm" onClick={handleRemove} className="gap-1.5 text-destructive">
        <Trash2 className="h-3.5 w-3.5" /> Remove
      </Button>
    </div>
  );
}

function AddPersonRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <Input placeholder="Add a person by name…" value={name} onChange={(e) => setName(e.target.value)} />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name);
          setName("");
        }}
      >
        Add
      </Button>
    </div>
  );
}

function GroupEditor({
  group,
  wardSlug,
  groupKind,
  roleIndex,
  onRefresh,
  onPhotoClick,
}: {
  group: Group;
  wardSlug: string;
  groupKind: GroupKind;
  roleIndex: number | null;
  onRefresh: () => void;
  onPhotoClick: (personId: string) => void;
}) {
  const addPerson = async (name: string) => {
    await fetch(`/api/admin/ward/${wardSlug}/add-person`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupKind, roleIndex, name }),
    });
    onRefresh();
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{group.role}</h3>
      {group.people.map((p) => (
        <PersonRow key={p.id} person={p} onChanged={onRefresh} onRemoved={onRefresh} onPhotoClick={() => onPhotoClick(p.id)} />
      ))}
      <AddPersonRow onAdd={addPerson} />

      {group.viceChair && (
        <div className="mt-4 border-t border-dashed pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.viceChair.role}</p>
          {group.viceChair.people.map((p) => (
            <PersonRow key={p.id} person={p} onChanged={onRefresh} onRemoved={onRefresh} onPhotoClick={() => onPhotoClick(p.id)} />
          ))}
          <AddPersonRow
            onAdd={async (name) => {
              await fetch(`/api/admin/ward/${wardSlug}/add-person`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupKind: "roleViceChair", roleIndex, name }),
              });
              onRefresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

type Tab = "directory" | "faq" | "spotlight" | "efforts";

const TABS: { id: Tab; label: string }[] = [
  { id: "directory", label: "Directory" },
  { id: "faq", label: "PEF FAQ" },
  { id: "spotlight", label: "Spotlight" },
  { id: "efforts", label: "Efforts" },
];

export function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [wards, setWards] = useState<Ward[] | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("directory");

  const { info, saved: infoSaved, update: updateInfo, reload: reloadInfo } = useInfoContent();

  const loadWards = () => {
    fetch("/api/admin/wards")
      .then((r) => r.json())
      .then((data: Ward[]) => {
        setWards(data);
        setActiveSlug((prev) => prev ?? data[0]?.slug ?? null);
      });
  };

  useEffect(() => {
    loadWards();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const ward = wards?.find((w) => w.slug === activeSlug) ?? null;

  return (
    <div>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-extrabold text-accent-foreground">
              WSR
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Signed in as {username}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/directory" target="_blank" className="text-sm text-muted-foreground hover:text-accent">
              View directory
            </Link>
            <Link href="/resources" target="_blank" className="text-sm text-muted-foreground hover:text-accent">
              View resources
            </Link>
            <Link href="/" target="_blank" className="text-sm text-muted-foreground hover:text-accent">
              View home
            </Link>
            <a href="/api/admin/backup" className="text-sm text-muted-foreground hover:text-accent">
              Download backup
            </a>
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              Change password
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-sm px-4 py-2 text-sm font-bold transition-colors",
                tab === t.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground hover:bg-secondary/70",
              )}
            >
              {t.label}
            </button>
          ))}
          {tab !== "directory" && infoSaved && (
            <span className="text-xs font-semibold text-[color:var(--success)]">Saved ✓</span>
          )}
        </div>

        {tab === "directory" && (
          <>
            <label className="mb-6 block max-w-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Editing ward
              </span>
              <select
                className="h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={activeSlug ?? ""}
                onChange={(e) => setActiveSlug(e.target.value)}
              >
                {(wards ?? []).map((w) => (
                  <option key={w.slug} value={w.slug}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>

            {!ward ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="flex flex-col gap-4">
                {(ward.leadership || []).map((g, i) => (
                  <GroupEditor
                    key={`leadership-${i}`}
                    group={g}
                    wardSlug={ward.slug}
                    groupKind="leadership"
                    roleIndex={i}
                    onRefresh={loadWards}
                    onPhotoClick={setPhotoTarget}
                  />
                ))}
                <GroupEditor
                  group={ward.lead}
                  wardSlug={ward.slug}
                  groupKind="lead"
                  roleIndex={null}
                  onRefresh={loadWards}
                  onPhotoClick={setPhotoTarget}
                />
                {ward.secretary && (
                  <GroupEditor
                    group={ward.secretary}
                    wardSlug={ward.slug}
                    groupKind="secretary"
                    roleIndex={null}
                    onRefresh={loadWards}
                    onPhotoClick={setPhotoTarget}
                  />
                )}
                {ward.roles.map((g, i) => (
                  <GroupEditor
                    key={`role-${i}`}
                    group={g}
                    wardSlug={ward.slug}
                    groupKind="role"
                    roleIndex={i}
                    onRefresh={loadWards}
                    onPhotoClick={setPhotoTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab !== "directory" && !info && <p className="text-sm text-muted-foreground">Loading…</p>}

        {tab === "faq" && info && (
          <FaqSection title="PEF FAQ" entries={info.pefFaq} onChange={(pefFaq) => updateInfo({ ...info, pefFaq })} />
        )}

        {tab === "spotlight" && info && (
          <SpotlightSection
            title="Spotlight"
            entries={info.spotlight}
            onChange={(spotlight) => updateInfo({ ...info, spotlight })}
            onPhotoUploaded={reloadInfo}
          />
        )}

        {tab === "efforts" && info && (
          <EffortsSection
            title="Stake and Ward WSR Efforts"
            posts={info.wsrEfforts}
            onChange={(wsrEfforts) => updateInfo({ ...info, wsrEfforts })}
            onPhotoUploaded={reloadInfo}
          />
        )}
      </main>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <PhotoUploadDialog
        uploadUrl={photoTarget ? `/api/admin/person/${photoTarget}/photo` : null}
        open={photoTarget !== null}
        onOpenChange={(open) => !open && setPhotoTarget(null)}
        onUploaded={loadWards}
      />
    </div>
  );
}
