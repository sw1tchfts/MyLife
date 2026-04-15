"use client";

import { memo } from "react";
import type { Priority } from "@/generated/prisma/client";
import { badge } from "@/lib/styles";

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> =
  {
    LOW: {
      label: "Low",
      className: "bg-elevated text-body",
    },
    MEDIUM: {
      label: "Medium",
      className: "bg-warning-soft text-warning-text",
    },
    HIGH: {
      label: "High",
      className: "bg-danger-soft text-danger-text",
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
