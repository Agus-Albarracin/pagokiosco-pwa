import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/products/route";
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
