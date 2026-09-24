import { test } from "node:test";
import assert from "node:assert/strict";
import { priceFromMargin, marginFromPrice } from "./pricing";
test("redondeo comercial y margen inverso", () => {
  assert.equal(priceFromMargin(100, 40), 150);
  assert.equal(priceFromMargin(1000, 40), 1400);
  assert.equal(priceFromMargin(101, 50), 200);
  assert.equal(marginFromPrice(100, 150), 50);
  assert.equal(marginFromPrice(0, 100), 0);
});
