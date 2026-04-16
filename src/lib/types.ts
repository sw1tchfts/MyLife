import type { Status, Priority, Mood } from "@/generated/prisma/client";

export type { Status, Priority, Mood };

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
}

/* ── Journal types ─────────────────────────────────── */

export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  mood?: Mood | null;
  tags?: string;
  date?: string;
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  mood?: Mood | null;
  tags?: string;
  date?: string;
}

const VALID_MOODS: Mood[] = ["GREAT", "GOOD", "OKAY", "BAD", "TERRIBLE"];

export function validateCreateJournalInput(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: CreateJournalEntryInput;
} {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const obj = data as Record<string, unknown>;

  if (
    !obj.content ||
    typeof obj.content !== "string" ||
    obj.content.trim() === ""
  ) {
    errors.push("Content is required and must be a non-empty string");
  }

  if (obj.title !== undefined && typeof obj.title !== "string") {
    errors.push("Title must be a string");
  }

  if (
    obj.mood !== undefined &&
    obj.mood !== null &&
    !VALID_MOODS.includes(obj.mood as Mood)
  ) {
    errors.push(`Mood must be one of: ${VALID_MOODS.join(", ")}`);
  }

  if (obj.tags !== undefined && typeof obj.tags !== "string") {
    errors.push("Tags must be a string");
  }

  if (obj.date !== undefined) {
    if (typeof obj.date !== "string" || isNaN(Date.parse(obj.date))) {
      errors.push("Date must be a valid date string");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      title: obj.title ? (obj.title as string).trim() : undefined,
      content: (obj.content as string).trim(),
      mood: obj.mood as Mood | null | undefined,
      tags: obj.tags as string | undefined,
      date: obj.date as string | undefined,
    },
  };
}

export function validateUpdateJournalInput(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: UpdateJournalEntryInput;
} {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const obj = data as Record<string, unknown>;

  if (obj.content !== undefined) {
    if (typeof obj.content !== "string" || obj.content.trim() === "") {
      errors.push("Content must be a non-empty string");
    }
  }

  if (obj.title !== undefined && typeof obj.title !== "string") {
    errors.push("Title must be a string");
  }

  if (
    obj.mood !== undefined &&
    obj.mood !== null &&
    !VALID_MOODS.includes(obj.mood as Mood)
  ) {
    errors.push(`Mood must be one of: ${VALID_MOODS.join(", ")}`);
  }

  if (obj.tags !== undefined && typeof obj.tags !== "string") {
    errors.push("Tags must be a string");
  }

  if (obj.date !== undefined) {
    if (typeof obj.date !== "string" || isNaN(Date.parse(obj.date))) {
      errors.push("Date must be a valid date string");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      title: obj.title !== undefined ? (obj.title as string).trim() : undefined,
      content: obj.content ? (obj.content as string).trim() : undefined,
      mood: obj.mood as Mood | null | undefined,
      tags: obj.tags as string | undefined,
      date: obj.date as string | undefined,
    },
  };
}

/* ── Task types ────────────────────────────────────── */

const VALID_STATUSES: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
const VALID_PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export function validateCreateInput(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: CreateTaskInput;
} {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.title || typeof obj.title !== "string" || obj.title.trim() === "") {
    errors.push("Title is required and must be a non-empty string");
  }

  if (obj.description !== undefined && typeof obj.description !== "string") {
    errors.push("Description must be a string");
  }

  if (
    obj.status !== undefined &&
    !VALID_STATUSES.includes(obj.status as Status)
  ) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (
    obj.priority !== undefined &&
    !VALID_PRIORITIES.includes(obj.priority as Priority)
  ) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  if (obj.dueDate !== undefined && obj.dueDate !== null) {
    if (typeof obj.dueDate !== "string" || isNaN(Date.parse(obj.dueDate))) {
      errors.push("Due date must be a valid date string");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      title: (obj.title as string).trim(),
      description: obj.description as string | undefined,
      status: obj.status as Status | undefined,
      priority: obj.priority as Priority | undefined,
      dueDate: obj.dueDate as string | null | undefined,
    },
  };
}

export function validateUpdateInput(data: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: UpdateTaskInput;
} {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const obj = data as Record<string, unknown>;

  if (obj.title !== undefined) {
    if (typeof obj.title !== "string" || obj.title.trim() === "") {
      errors.push("Title must be a non-empty string");
    }
  }

  if (obj.description !== undefined && typeof obj.description !== "string") {
    errors.push("Description must be a string");
  }

  if (
    obj.status !== undefined &&
    !VALID_STATUSES.includes(obj.status as Status)
  ) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (
    obj.priority !== undefined &&
    !VALID_PRIORITIES.includes(obj.priority as Priority)
  ) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  if (obj.dueDate !== undefined && obj.dueDate !== null) {
    if (typeof obj.dueDate !== "string" || isNaN(Date.parse(obj.dueDate))) {
      errors.push("Due date must be a valid date string");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      title: obj.title ? (obj.title as string).trim() : undefined,
      description: obj.description as string | undefined,
      status: obj.status as Status | undefined,
      priority: obj.priority as Priority | undefined,
      dueDate: obj.dueDate as string | null | undefined,
    },
  };
}
