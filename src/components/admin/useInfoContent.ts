"use client";

import { useEffect, useRef, useState } from "react";
import type { InfoContent } from "@/lib/types";

export function useInfoContent() {
  const [info, setInfo] = useState<InfoContent | null>(null);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  const reload = () => {
    fetch("/api/admin/info")
      .then((r) => r.json())
      .then((data: InfoContent) => {
        setInfo(data);
        loaded.current = true;
      });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (next: InfoContent) => {
    if (!loaded.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch("/api/admin/info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 500);
  };

  const update = (next: InfoContent) => {
    setInfo(next);
    save(next);
  };

  return { info, saved, update, reload };
}
