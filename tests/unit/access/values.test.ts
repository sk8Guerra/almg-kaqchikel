import { describe, expect, it } from "vitest";
import { email } from "@/modules/access/domain/values";
import { InvalidEmailError } from "@/modules/access/domain/errors";

describe("Email (FR-016)", () => {
  it("lowercases the address so casing never creates a second person", () => {
    expect(email("Persona@ALMG.GT")).toBe(email("persona@almg.gt"));
  });

  it("trims surrounding whitespace", () => {
    expect(email("  persona@almg.gt  ")).toBe("persona@almg.gt");
  });

  it("rejects malformed addresses in the constructor, not at every query", () => {
    expect(() => email("no-es-correo")).toThrow(InvalidEmailError);
    expect(() => email("")).toThrow(InvalidEmailError);
  });
});
