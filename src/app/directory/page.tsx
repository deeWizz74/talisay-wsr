import { Suspense } from "react";
import { DirectoryClient } from "./DirectoryClient";

export default function DirectoryPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
      <DirectoryClient />
    </Suspense>
  );
}
