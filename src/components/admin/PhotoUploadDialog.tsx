"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PhotoUploadDialog({
  uploadUrl,
  open,
  onOpenChange,
  onUploaded,
  onUploadedUrl,
}: {
  uploadUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
  onUploadedUrl?: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadUrl) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(uploadUrl, { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Upload failed.");
      return;
    }
    const json = await res.json().catch(() => null);
    setFile(null);
    onOpenChange(false);
    onUploaded?.();
    if (json?.url) onUploadedUrl?.(json.url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload photo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
