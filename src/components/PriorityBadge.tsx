"use client";

import { memo } from "react";
import type { Priority } from "@/generated/prisma/client";
import { badge } from "@/lib/styles";

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> =
  {
    LOW: {
      label: "Low",
      className: "bg-accent-soft text-accent-text",
    },
    MEDIUM: {
      label: "Medium",
      className: "bg-accent-soft text-accent-text",
    },
    HIGH: {
      label: "High",
      className: "bg-accent-soft text-accent-text",
    },
  };

export default memo(function PriorityBadge({
  priority,
}: {
  priority: Priority;
}) {
  const config = PRIORITY_CONFIG[priority];
  return <span className={`${badge} ${config.className}`}>{config.label}</span>;
});
