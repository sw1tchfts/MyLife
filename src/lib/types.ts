import type { Status, Priority } from "@/generated/prisma/client";

export type { Status, Priority };

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
