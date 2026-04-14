"use client";

import { memo } from "react";
import type { Priority } from "@/generated/prisma/client";

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> =
  {
    LOW: {
      label: "Low",
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    },
    MEDIUM: {
      label: "Medium",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    HIGH: {
      label: "High",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  };

export default memo(function PriorityBadge({
  priority,
}: {
  priority: Priority;
}) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
});
