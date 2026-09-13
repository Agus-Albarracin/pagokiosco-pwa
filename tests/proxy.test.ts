import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/products/route";
import manaos from "./fixtures/openfoodfacts-manaos.json";
test("API v3 reconoce el producto real 7798113302458", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json(manaos);
    const response = await GET(new Request("http://localhost/api/products?ean=7798113302458&version=3"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" });
  } finally { globalThis.fetch = original; }
});
test("éxitos v3 con advertencias conservan un DTO mínimo y priorizan español", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of ["success_with_warnings", "success_with_errors"]) {
      globalThis.fetch = async () => Response.json({ ...manaos, status, product: { product_name_es: "  Nombre español  ", product_name: "Other name", nutriments: { fat: 4 } } });
      assert.deepEqual(await (await GET(new Request("http://localhost/api/products?ean=7798113302458"))).json(), { found: true, ean: "7798113302458", nombre: "Nombre español" });
    }
    globalThis.fetch = async () => Response.json({ ...manaos, product: { product_name_es: "  ", product_name: "Nombre alternativo" } });
    assert.equal((await (await GET(new Request("http://localhost/api/products?ean=7798113302458"))).json()).nombre, "Nombre alternativo");
  } finally { globalThis.fetch = original; }
});
test("ausencia confirmada y error upstream no son equivalentes", async () => {
  const original = globalThis.fetch;
  try {
    const request = () => new Request("http://localhost/api/products?ean=12345678");
    for (const status of [200, 404]) {
      globalThis.fetch = async () => Response.json({ status: "failure", result: { id: "product_not_found" } }, { status });
      const response = await GET(request());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { found: false, ean: "12345678" });
    }
    for (const payload of [null, [], { status: "failure", result: { id: "internal_error" } }, { status: "success" }, { status: "unknown", product: {} }]) {
      globalThis.fetch = async () => Response.json(payload);
      const response = await GET(request());
      assert.equal(response.status, 502);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.equal((await response.json()).error.code, "UPSTREAM_UNAVAILABLE");
    }
  } finally { globalThis.fetch = original; }
});
test("proxy valida, recorta, cachea y diferencia fallos de ausencias", async () => {
  const original = globalThis.fetch;
  try {
    let called = false;
    globalThis.fetch = async (_url, init) => {
      called = true;
      assert.equal(new Headers(init?.headers).get("User-Agent"), "PagoKioscoPOS - PWA - Version 1.0");
      return Response.json({ status: 1, product: { product_name: "Arroz", nutriments: { fat: 4 }, image_url: "large" } });
    };
    assert.equal((await GET(new Request("http://localhost/api/products?ean=bad"))).status, 400);
    assert.equal(called, false);
    const found = await GET(new Request("http://localhost/api/products?ean=12345678"));
    assert.deepEqual(await found.json(), { found: true, ean: "12345678", nombre: "Arroz" });
    assert.match(found.headers.get("Cache-Control")!, /86400/);
    globalThis.fetch = async () => Response.json({ status: 0 });
    assert.deepEqual(await (await GET(new Request("http://localhost/api/products?ean=12345678"))).json(), { found: false, ean: "12345678" });
    globalThis.fetch = async () => new Response(null, { status: 429 });
    assert.equal((await GET(new Request("http://localhost/api/products?ean=12345678"))).status, 502);
  } finally { globalThis.fetch = original; }
});
