import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./redirect.ts";

test("allows relative paths", () => assert.equal(safeNext("/dashboard/jobs"), "/dashboard/jobs"));
test("falls back when empty", () => assert.equal(safeNext(null), "/dashboard"));
test("blocks absolute urls", () => assert.equal(safeNext("https://evil.com"), "/dashboard"));
test("blocks protocol relative", () => assert.equal(safeNext("//evil.com"), "/dashboard"));
test("blocks backslash tricks", () => assert.equal(safeNext("/\\evil.com"), "/dashboard"));
