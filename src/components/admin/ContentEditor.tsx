"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Trash2 } from "lucide-react";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { initials } from "@/lib/format";
import { formatPostDate, sortedEffortsByDate } from "@/lib/blog";
import type { FaqEntry, EffortPost, EffortBlock, SpotlightEntry } from "@/lib/types";
import { ArrowUp, ArrowDown, Bold, Italic, Quote, List, Link2 } from "lucide-react";

function newId() {
  return `id${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function FaqSection({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: FaqEntry[];
  onChange: (entries: FaqEntry[]) => void;
}) {
  const updateEntry = (id: string, field: "question" | "answer", value: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));
  const add = () => onChange([...entries, { id: newId(), question: "", answer: "" }]);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {entries.map((e) => (
        <div key={e.id} className="grid grid-cols-1 gap-2 border-t py-3 first:border-t-0 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <Input placeholder="Question" value={e.question} onChange={(ev) => updateEntry(e.id, "question", ev.target.value)} />
          <Input placeholder="Answer" value={e.answer} onChange={(ev) => updateEntry(e.id, "answer", ev.target.value)} />
          <Button variant="outline" size="sm" onClick={() => remove(e.id)} className="gap-1.5 text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="mt-3" onClick={add}>
        Add question
      </Button>
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TextBlockEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value: current } = el;
    const selected = current.slice(selectionStart, selectionEnd);
    const next = current.slice(0, selectionStart) + marker + selected + marker + current.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + marker.length, selectionStart + marker.length + selected.length);
    });
  };

  const prefixLines = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value: current } = el;
    const lineStart = current.lastIndexOf("\n", selectionStart - 1) + 1;
    const nextBreak = current.indexOf("\n", selectionEnd);
    const lineEnd = nextBreak === -1 ? current.length : nextBreak;
    const segment = current.slice(lineStart, lineEnd);
    const prefixed = segment
      .split("\n")
      .map((line) => (line.startsWith(marker) ? line : marker + line))
      .join("\n");
    onChange(current.slice(0, lineStart) + prefixed + current.slice(lineEnd));
    requestAnimationFrame(() => el.focus());
  };

  const insertLink = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value: current } = el;
    const selected = current.slice(selectionStart, selectionEnd) || "link text";
    const next = `${current.slice(0, selectionStart)}[${selected}](https://)${current.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div>
      <div className="mb-1.5 flex gap-1">
        <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" title="Bold" onClick={() => wrapSelection("**")}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" title="Italic" onClick={() => wrapSelection("_")}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" title="Quote" onClick={() => prefixLines("> ")}>
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" title="Bulleted list" onClick={() => prefixLines("- ")}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" title="Link" onClick={insertLink}>
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Textarea
        ref={ref}
        rows={4}
        placeholder="Write a paragraph. Leave a blank line for a new paragraph."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BlockEditor({
  post,
  onContentChange,
  onAddImage,
}: {
  post: EffortPost;
  onContentChange: (content: EffortBlock[]) => void;
  onAddImage: () => void;
}) {
  const updateBlock = (blockId: string, patch: Partial<EffortBlock>) => {
    onContentChange(post.content.map((b) => (b.id === blockId ? ({ ...b, ...patch } as EffortBlock) : b)));
  };
  const removeBlock = (blockId: string) => onContentChange(post.content.filter((b) => b.id !== blockId));
  const moveBlock = (blockId: string, dir: -1 | 1) => {
    const idx = post.content.findIndex((b) => b.id === blockId);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= post.content.length) return;
    const next = [...post.content];
    [next[idx], next[target]] = [next[target], next[idx]];
    onContentChange(next);
  };
  const addText = () => onContentChange([...post.content, { id: newId(), type: "text", text: "" }]);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t pt-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Post content</span>

      {post.content.map((block, i) => (
        <div key={block.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {block.type === "text" ? "Text" : "Image"}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveBlock(block.id, -1)}
                disabled={i === 0}
                className="h-7 w-7 p-0"
                title="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveBlock(block.id, 1)}
                disabled={i === post.content.length - 1}
                className="h-7 w-7 p-0"
                title="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeBlock(block.id)}
                className="h-7 w-7 p-0 text-destructive"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {block.type === "text" ? (
            <TextBlockEditor value={block.text} onChange={(text) => updateBlock(block.id, { text })} />
          ) : (
            <div className="flex items-start gap-3">
              {block.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.url} alt="" className="h-20 w-28 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <Camera className="h-4 w-4" />
                </div>
              )}
              <Input
                placeholder="Caption (optional)"
                value={block.caption}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addText}>
          + Add text
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onAddImage}>
          + Add image
        </Button>
      </div>
    </div>
  );
}

function PostSummaryRow({ post, onExpand }: { post: EffortPost; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-accent"
    >
      <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted text-muted-foreground">
        {post.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{post.title || "Untitled post"}</span>
        <span className="block text-xs text-muted-foreground">
          {formatPostDate(post.date)} · {post.content.length} block{post.content.length === 1 ? "" : "s"}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-accent">Edit</span>
    </button>
  );
}

export function EffortsSection({
  title,
  posts,
  onChange,
  onPhotoUploaded,
}: {
  title: string;
  posts: EffortPost[];
  onChange: (posts: EffortPost[]) => void;
  onPhotoUploaded: () => void;
}) {
  const [photoTarget, setPhotoTarget] = useState<string | null>(null);
  const [imageBlockTarget, setImageBlockTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updatePost = (id: string, field: "title" | "date", value: string) => {
    onChange(posts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const setContent = (id: string, content: EffortBlock[]) => {
    onChange(posts.map((p) => (p.id === id ? { ...p, content } : p)));
  };
  const remove = (id: string) => {
    onChange(posts.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };
  const add = () => {
    const id = newId();
    onChange([...posts, { id, title: "", date: todayISO(), photo: "", content: [] }]);
    setExpandedId(id);
  };

  const addImageBlock = (postId: string, url: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setContent(postId, [...post.content, { id: newId(), type: "image", url, caption: "" }]);
  };

  const sorted = sortedEffortsByDate(posts);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          if (expandedId !== p.id) {
            return <PostSummaryRow key={p.id} post={p} onExpand={() => setExpandedId(p.id)} />;
          }
          return (
            <div key={p.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Editing post
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpandedId(null)}>
                  Collapse
                </Button>
              </div>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setPhotoTarget(p.id)}
                  className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
                  title="Change cover photo"
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-4 w-4" />
                    </span>
                  )}
                </button>

                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
                  <Field label="Title" value={p.title} onChange={(v) => updatePost(p.id, "title", v)} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </span>
                    <Input type="date" value={p.date} onChange={(e) => updatePost(p.id, "date", e.target.value)} />
                  </label>
                </div>
              </div>

              <BlockEditor
                post={p}
                onContentChange={(content) => setContent(p.id, content)}
                onAddImage={() => setImageBlockTarget(p.id)}
              />

              <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="mt-4 gap-1.5 text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Remove post
              </Button>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" className="mt-3" onClick={add}>
        Add post
      </Button>

      <PhotoUploadDialog
        uploadUrl={photoTarget ? `/api/admin/efforts/${photoTarget}/photo` : null}
        open={photoTarget !== null}
        onOpenChange={(open) => !open && setPhotoTarget(null)}
        onUploaded={onPhotoUploaded}
      />
      <PhotoUploadDialog
        uploadUrl={imageBlockTarget ? `/api/admin/efforts/${imageBlockTarget}/upload-image` : null}
        open={imageBlockTarget !== null}
        onOpenChange={(open) => !open && setImageBlockTarget(null)}
        onUploadedUrl={(url) => {
          if (imageBlockTarget) addImageBlock(imageBlockTarget, url);
        }}
      />
    </div>
  );
}

const SPOTLIGHT_BLANK: Omit<SpotlightEntry, "id"> = {
  name: "",
  photo: "",
  calling: "",
  family: "",
  workSchool: "",
  hobbies: "",
  funFact: "",
  favoriteScripture: "",
  gratefulFor: "",
  messageToWard: "",
};

export function SpotlightSection({
  title,
  entries,
  onChange,
  onPhotoUploaded,
}: {
  title: string;
  entries: SpotlightEntry[];
  onChange: (entries: SpotlightEntry[]) => void;
  onPhotoUploaded: () => void;
}) {
  const [photoTarget, setPhotoTarget] = useState<string | null>(null);

  const updateEntry = (id: string, field: keyof SpotlightEntry, value: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));
  const add = () => onChange([...entries, { id: newId(), ...SPOTLIGHT_BLANK }]);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {entries.map((e) => (
        <div key={e.id} className="border-t py-4 first:border-t-0">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setPhotoTarget(e.id)}
              className="relative h-14 w-14 shrink-0"
              title={`Change photo for ${e.name || "this person"}`}
            >
              {e.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.photo} alt={e.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials(e.name)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                <Camera className="h-3 w-3" />
              </span>
            </button>

            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name" value={e.name} onChange={(v) => updateEntry(e.id, "name", v)} />
              <Field label="Calling" value={e.calling} onChange={(v) => updateEntry(e.id, "calling", v)} />
              <Field label="Family" value={e.family} onChange={(v) => updateEntry(e.id, "family", v)} />
              <Field label="Work / School" value={e.workSchool} onChange={(v) => updateEntry(e.id, "workSchool", v)} />
              <Field label="Hobbies" value={e.hobbies} onChange={(v) => updateEntry(e.id, "hobbies", v)} />
              <Field label="Fun Fact" value={e.funFact} onChange={(v) => updateEntry(e.id, "funFact", v)} />
              <Field
                label="Favorite Scripture"
                value={e.favoriteScripture}
                onChange={(v) => updateEntry(e.id, "favoriteScripture", v)}
              />
              <Field
                label="Something I'm Grateful For"
                value={e.gratefulFor}
                onChange={(v) => updateEntry(e.id, "gratefulFor", v)}
              />
            </div>
          </div>

          <div className="mt-3">
            <Field
              label="A Message to the Ward"
              value={e.messageToWard}
              onChange={(v) => updateEntry(e.id, "messageToWard", v)}
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => remove(e.id)} className="mt-3 gap-1.5 text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="mt-3" onClick={add}>
        Add person
      </Button>

      <PhotoUploadDialog
        uploadUrl={photoTarget ? `/api/admin/spotlight/${photoTarget}/photo` : null}
        open={photoTarget !== null}
        onOpenChange={(open) => !open && setPhotoTarget(null)}
        onUploaded={onPhotoUploaded}
      />
    </div>
  );
}
