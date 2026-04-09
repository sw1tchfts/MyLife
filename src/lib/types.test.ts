import { describe, it, expect } from "vitest";
import { validateCreateInput, validateUpdateInput } from "./types";

describe("validateCreateInput", () => {
  it("accepts valid input", () => {
    const result = validateCreateInput({ title: "Test task" });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("Test task");
  });

  it("rejects empty title", () => {
    const result = validateCreateInput({ title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("rejects missing title", () => {
    const result = validateCreateInput({});
    expect(result.valid).toBe(false);
  });

  it("accepts valid status", () => {
    const result = validateCreateInput({
      title: "Test",
      status: "IN_PROGRESS",
    });
    expect(result.valid).toBe(true);
    expect(result.parsed?.status).toBe("IN_PROGRESS");
  });

  it("rejects invalid status", () => {
    const result = validateCreateInput({
      title: "Test",
      status: "INVALID",
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateUpdateInput", () => {
  it("accepts partial update", () => {
    const result = validateUpdateInput({ title: "Updated" });
    expect(result.valid).toBe(true);
    expect(result.parsed?.title).toBe("Updated");
  });

  it("accepts empty object (no-op update)", () => {
    const result = validateUpdateInput({});
    expect(result.valid).toBe(true);
  });
});
