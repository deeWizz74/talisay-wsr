"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Incorrect username or password.");
      return;
    }
    router.push("/admin");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-xs font-extrabold text-accent-foreground">
          WSR
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground">Talisay Stake WSR Directory</p>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} className="h-11">
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
        <Link href="/" className="text-center text-sm text-muted-foreground hover:text-accent">
          ← Back to directory
        </Link>
      </form>
    </div>
  );
}
