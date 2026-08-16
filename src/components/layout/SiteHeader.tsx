import Link from "next/link";

export function SiteHeader({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent-vivid text-xs font-extrabold text-foreground">
            WSR
          </span>
          <span className="text-sm font-semibold text-foreground">Know Your Specialist</span>
        </Link>
        <Link href={backHref} className="riso-chip">
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
