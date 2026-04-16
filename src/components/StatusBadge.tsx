"use client";

import { memo } from "react";
import type { Status } from "@/generated/prisma/client";
import { badge } from "@/lib/styles";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  TODO: {
    label: "To Do",
    className: "bg-elevated text-body",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-accent-soft text-accent-text",
  },
  DONE: {
    label: "Done",
    className: "bg-success-soft text-success-text",
  },
};

export default memo(function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return <span className={`${badge} ${config.className}`}>{config.label}</span>;
});
