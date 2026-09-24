import path from "node:path";
import { test } from "node:test";
import { RuleTester } from "eslint";
import { architectureRule } from "../../scripts/eslint-architecture.mjs";

test("límites de arquitectura: aliases, rutas relativas, reexports y imports dinámicos", () => {
  const filename = (file) => path.resolve(file);
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
  });
  tester.run("architecture/boundaries", architectureRule, {
    valid: [
      {
        filename: filename("app/_components/kiosk.tsx"),
        code: 'import { Pos } from "@/features/venta";',
      },
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'import { useCart } from "./cart-context";',
      },
      {
        filename: filename("features/venta/checkout.ts"),
        code: 'import { openDatabase } from "@/infrastructure/indexeddb";',
      },
      {
        filename: filename("entities/sale/model.ts"),
        code: 'import { isWeight } from "@/entities/product";',
      },
      { filename: filename("shared/ui/modal.tsx"), code: 'import { useRef } from "react";' },
    ],
    invalid: [
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'import { Cashbook } from "@/features/caja";',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'import { Cashbook } from "../caja";',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("features/venta/index.ts"),
        code: 'export { Cashbook } from "../caja";',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("features/venta/index.ts"),
        code: 'export * from "../caja";',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'const other = import("../caja");',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'const other = require("../caja");',
        errors: [{ messageId: "crossFeature" }],
      },
      {
        filename: filename("app/_components/kiosk.tsx"),
        code: 'import { Pos } from "../../features/venta/pos";',
        errors: [{ messageId: "privateApi" }],
      },
      {
        filename: filename("shared/ui/modal.tsx"),
        code: 'import { Pos } from "@/features/venta";',
        errors: [{ messageId: "upward" }],
      },
      {
        filename: filename("infrastructure/indexeddb.ts"),
        code: 'import { Product } from "@/entities/product";',
        errors: [{ messageId: "upward" }],
      },
      {
        filename: filename("entities/product/model.ts"),
        code: 'import { Sale } from "@/entities/sale";',
        errors: [{ messageId: "entityDependency" }],
      },
      {
        filename: filename("features/venta/pos.tsx"),
        code: 'import { Product } from "@/entities/product/model";',
        errors: [{ messageId: "privateApi" }],
      },
    ],
  });
});
