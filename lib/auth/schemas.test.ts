import test from "node:test";
import assert from "node:assert/strict";
import { signupSchema, loginSchema } from "./schemas.ts";

const valid = {
  fullName: "Ada Lovelace",
  email: "  Ada@Example.com ",
  password: "Sup3rSecret",
  confirmPassword: "Sup3rSecret",
  terms: "on",
};

test("signup accepts valid input and normalises email", () => {
  const r = signupSchema.safeParse(valid);
  assert.ok(r.success);
  assert.equal(r.data.email, "ada@example.com");
});
test("signup rejects mismatched passwords", () =>
  assert.equal(signupSchema.safeParse({ ...valid, confirmPassword: "x" }).success, false));
test("signup rejects weak password", () =>
  assert.equal(signupSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success, false));
test("signup requires terms", () =>
  assert.equal(signupSchema.safeParse({ ...valid, terms: undefined }).success, false));
test("login rejects bad email", () =>
  assert.equal(loginSchema.safeParse({ email: "nope", password: "x" }).success, false));
