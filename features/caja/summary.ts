import type { Sale } from "@/entities/sale";
import { cents } from "@/shared/lib/money";
export function summarize(sales: Sale[]) {
  const cash =
    sales.filter((s) => s.method === "EFECTIVO").reduce((sum, s) => sum + cents(s.total), 0) / 100;
  const transfer =
    sales.filter((s) => s.method === "TRANSFERENCIA").reduce((sum, s) => sum + cents(s.total), 0) /
    100;
  return { cash, transfer, total: (cents(cash) + cents(transfer)) / 100, count: sales.length };
}
