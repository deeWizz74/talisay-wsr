"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone, Mail, Copy, Check } from "lucide-react";
import type { Person } from "@/lib/types";

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

function messengerUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://m.me/${v.replace(/^@/, "")}`;
}

function ProfileCardBody({
  person,
  role,
  roleDescription,
}: {
  person: Person;
  role: string;
  roleDescription?: string;
}) {
  const [copied, setCopied] = useState(false);
  const mUrl = useMemo(() => messengerUrl(person.messenger), [person.messenger]);

  const handleCopyEmail = async () => {
    if (!person.email) return;
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore, the address is still visible
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            mUrl ? "bg-[color:var(--success)]" : "bg-muted-foreground/30",
          )}
          aria-hidden="true"
        />
        <span>{mUrl ? "Reachable on Messenger" : "No Messenger on file"}</span>
      </div>

      <div className="flex items-center gap-4">
        {person.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photo}
            alt={person.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground ring-2 ring-border">
            {initials(person.name)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold tracking-tight text-card-foreground">{person.name}</h3>
          <p className="mt-0.5 text-sm font-medium text-accent">{role}</p>
        </div>
      </div>

      {roleDescription && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{roleDescription}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mUrl ? (
          <Button asChild variant="secondary" className="h-12 justify-start gap-3 rounded-xl bg-[color:var(--messenger-bg)] text-[color:var(--messenger)] hover:bg-[color:var(--messenger-bg)]/80">
            <a href={mUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Message
            </a>
          </Button>
        ) : (
          <Button variant="secondary" disabled className="h-12 justify-start gap-3 rounded-xl">
            <MessageCircle className="h-4 w-4" /> No Messenger
          </Button>
        )}

        {person.phone ? (
          <Button asChild variant="secondary" className="h-12 justify-start gap-3 rounded-xl bg-[color:var(--success-bg)] text-[color:var(--success)] hover:bg-[color:var(--success-bg)]/80">
            <a href={`tel:${person.phone}`}>
              <Phone className="h-4 w-4" /> {person.phone}
            </a>
          </Button>
        ) : person.email ? (
          <Button variant="secondary" onClick={handleCopyEmail} className="h-12 justify-start gap-3 rounded-xl">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Email"}
          </Button>
        ) : (
          <Button variant="secondary" disabled className="h-12 justify-start gap-3 rounded-xl">
            <Mail className="h-4 w-4" /> No phone or email
          </Button>
        )}
      </div>
    </>
  );
}

export function ProfileCard({
  person,
  role,
  roleDescription,
  className,
  bare = false,
}: {
  person: Person;
  role: string;
  roleDescription?: string;
  className?: string;
  bare?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (bare) {
    return <ProfileCardBody person={person} role={role} roleDescription={roleDescription} />;
  }

  return (
    <motion.div
      key={person.id}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Card className="w-full overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <ProfileCardBody person={person} role={role} roleDescription={roleDescription} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
