import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./summary";
test("caja vacía", () => {
  assert.deepEqual(summarize([]), { cash: 0, transfer: 0, total: 0, count: 0 });
});
