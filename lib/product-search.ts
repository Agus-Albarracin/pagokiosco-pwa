import type { Product } from "./domain";

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

// Build once per catalog update, not once per keystroke. Older records without
// a brand remain searchable, without changing their EAN/SKU or migrating stock.
export function createProductSearch(products: Product[]) {
  const index = products.map((product) => ({
    product,
    text: normalizeSearch(`${product.nombre} ${product.marca ?? ""} ${product.ean}`),
  }));
  return (query: string): Product[] => {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    return index
      .filter((entry) => words.every((word) => entry.text.includes(word)))
      .map((entry) => entry.product);
  };
}
