import { describe, it, expect } from "vitest";
import { validateCreateInput, validateUpdateInput } from "../types";

describe("validateCreateInput", () => {
  it("accepts a valid task with all fields", () => {
    const result = validateCreateInput({
      title: "Buy groceries",
      description: "Milk, eggs, bread",
      status: "TODO",
      priority: "HIGH",
      dueDate: "2026-04-15",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.parsed).toEqual({
      title: "Buy groceries",
      description: "Milk, eggs, bread",
      status: "TODO",
      priority: "HIGH",
      dueDate: "2026-04-15",
    });
  });

  it("accepts a task with only a title", () => {
    const result = validateCreateInput({ title: "Minimal task" });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("Minimal task");
  });

  it("trims whitespace from title", () => {
    const result = validateCreateInput({ title: "  padded title  " });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("padded title");
  });

  it("rejects missing body", () => {
    const result = validateCreateInput(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Request body must be a JSON object");
  });

  it("rejects non-object body", () => {
    const result = validateCreateInput("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Request body must be a JSON object");
  });

  it("rejects missing title", () => {
    const result = validateCreateInput({ description: "No title here" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Title is required and must be a non-empty string"
    );
  });

  it("rejects empty string title", () => {
    const result = validateCreateInput({ title: "" });
    expect(result.valid).toBe(false);
  });

  it("rejects whitespace-only title", () => {
    const result = validateCreateInput({ title: "   " });
    expect(result.valid).toBe(false);
  });

  it("rejects non-string description", () => {
    const result = validateCreateInput({ title: "Test", description: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Description must be a string");
  });

  it("rejects invalid status", () => {
    const result = validateCreateInput({ title: "Test", status: "INVALID" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Status must be one of/);
  });

  it("rejects invalid priority", () => {
    const result = validateCreateInput({ title: "Test", priority: "URGENT" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Priority must be one of/);
  });

  it("rejects invalid date string", () => {
    const result = validateCreateInput({ title: "Test", dueDate: "not-a-date" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Due date must be a valid date string");
  });

  it("accepts null dueDate", () => {
    const result = validateCreateInput({ title: "Test", dueDate: null });
    expect(result.valid).toBe(true);
    expect(result.parsed?.dueDate).toBeNull();
  });

  it("collects multiple errors at once", () => {
    const result = validateCreateInput({
      title: "",
      status: "INVALID",
      priority: "WRONG",
      dueDate: "bad",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["TODO", "IN_PROGRESS", "DONE"]) {
      const result = validateCreateInput({ title: "Test", status });
      expect(result.valid).toBe(true);
    }
  });

  it("accepts all valid priorities", () => {
    for (const priority of ["LOW", "MEDIUM", "HIGH"]) {
      const result = validateCreateInput({ title: "Test", priority });
      expect(result.valid).toBe(true);
    }
  });
});

describe("validateUpdateInput", () => {
  it("accepts a full update", () => {
    const result = validateUpdateInput({
      title: "Updated title",
      status: "DONE",
      priority: "LOW",
    });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("Updated title");
    expect(result.parsed?.status).toBe("DONE");
  });

  it("accepts an empty object (no fields to update)", () => {
    const result = validateUpdateInput({});
    expect(result.valid).toBe(true);
  });

  it("rejects non-object body", () => {
    const result = validateUpdateInput(null);
    expect(result.valid).toBe(false);
  });

  it("rejects empty string title", () => {
    const result = validateUpdateInput({ title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Title must be a non-empty string");
  });

  it("allows omitting title entirely", () => {
    const result = validateUpdateInput({ status: "IN_PROGRESS" });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBeUndefined();
  });

  it("rejects invalid status", () => {
    const result = validateUpdateInput({ status: "CANCELLED" });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = validateUpdateInput({ priority: "CRITICAL" });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid dueDate", () => {
    const result = validateUpdateInput({ dueDate: "nope" });
    expect(result.valid).toBe(false);
  });

  it("accepts null dueDate to clear it", () => {
    const result = validateUpdateInput({ dueDate: null });
    expect(result.valid).toBe(true);
    expect(result.parsed?.dueDate).toBeNull();
  });

  it("trims title whitespace", () => {
    const result = validateUpdateInput({ title: "  trimmed  " });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("trimmed");
  });
});
