export const priceFromMargin = (cost: number, margin: number) =>
  Math.ceil((cost * (1 + margin / 100) - 1e-9) / 50) * 50;

export const marginFromPrice = (cost: number, price: number) =>
  cost > 0 ? ((price - cost) / cost) * 100 : 0;
