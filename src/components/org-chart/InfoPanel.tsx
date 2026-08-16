"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export function InfoPanel({
  title,
  description,
  bare = false,
}: {
  title: string;
  description?: string;
  bare?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const body = (
    <>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </>
  );

  if (bare) return body;

  return (
    <motion.div
      key={title}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card>
        <CardContent className="p-6 sm:p-7">{body}</CardContent>
      </Card>
    </motion.div>
  );
}
