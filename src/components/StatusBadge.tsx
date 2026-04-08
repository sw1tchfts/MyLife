"use client";

import type { Status } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  TODO: {
    label: "To Do",
    className: "bg-gray-100 text-gray-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  DONE: {
    label: "Done",
    className: "bg-green-100 text-green-700",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
