const headers = { "Cache-Control": "s-maxage=86400, stale-while-revalidate" };
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
    const data = await response.json();
    if (data.status !== 1) return Response.json({ found: false, ean }, { headers });
    const name = data.product?.product_name_es || data.product?.product_name;
    return Response.json({ found: true, ean, nombre: typeof name === "string" ? name.trim().slice(0, 120) : "" }, { headers });
  } catch {
    return Response.json({ error: { code: "UPSTREAM_UNAVAILABLE", message: "No se pudo consultar el catálogo. Podés cargar el producto manualmente." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
