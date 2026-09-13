const headers = { "Cache-Control": "s-maxage=86400, stale-while-revalidate" };
const successStatuses = new Set<unknown>([1, "success", "success_with_warnings", "success_with_errors"]);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export async function GET(request: Request) {
  const ean = new URL(request.url).searchParams.get("ean") ?? "";
  if (!/^\d{8}$|^\d{13}$/.test(ean)) return Response.json({ error: { code: "INVALID_EAN", message: "El código debe tener 8 o 13 dígitos." } }, { status: 400 });
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${ean}.json?fields=product_name,product_name_es`, {
      headers: { "User-Agent": "PagoKioscoPOS - PWA - Version 1.0" },
      next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return Response.json({ found: false, ean }, { headers });
    if (!response.ok) throw new Error("UPSTREAM_FAILURE");
    const data: unknown = await response.json();
    if (!isRecord(data)) throw new Error("INVALID_UPSTREAM_RESPONSE");
    const result = isRecord(data.result) ? data.result : undefined;
    if (data.status === 0 || (data.status === "failure" && result?.id === "product_not_found")) {
      return Response.json({ found: false, ean }, { headers });
    }
    // API v3 uses textual statuses; retain numeric success for legacy responses.
    if (!successStatuses.has(data.status) || !isRecord(data.product)) throw new Error("INVALID_UPSTREAM_RESPONSE");
    const name = [data.product.product_name_es, data.product.product_name]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);
    return Response.json({ found: true, ean, nombre: name?.trim().slice(0, 120) ?? "" }, { headers });
  } catch {
    return Response.json({ error: { code: "UPSTREAM_UNAVAILABLE", message: "No se pudo consultar el catálogo. Podés cargar el producto manualmente." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
