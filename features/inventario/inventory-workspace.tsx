"use client";
import { useState } from "react";
import { quantityLabel, type Product } from "@/entities/product";
import { ProductForm } from "./product-form";
import { StockEntry } from "./stock-entry";
import { StockReceipt } from "./stock-receipt";
import { WasteForm } from "./waste-form";

type Props = {
  products: Product[];
  disabled: boolean;
  active: boolean;
  showSavedNotice: boolean;
  onRefresh: () => Promise<void>;
  onNotice: (notice: string) => void;
};

export function InventoryWorkspace({
  products,
  disabled,
  active,
  showSavedNotice,
  onRefresh,
  onNotice,
}: Props) {
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [receipt, setReceipt] = useState<Product | null>(null);
  const [waste, setWaste] = useState<Product | null>(null);
  return (
    <>
      {active && (
        <StockEntry
          products={products}
          disabled={disabled}
          onCreate={() => {
            onNotice("");
            setEditor("new");
          }}
          onSelect={(product) => {
            onNotice("");
            setReceipt(product);
          }}
          onEdit={(product) => setEditor(product)}
          onWaste={(product) => {
            onNotice("");
            setWaste(product);
          }}
        />
      )}
      {editor && (
        <ProductForm
          product={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await onRefresh();
            onNotice(
              !showSavedNotice
                ? ""
                : editor === "new"
                  ? "Producto agregado al catálogo. Stock inicial guardado."
                  : "Producto actualizado.",
            );
          }}
        />
      )}
      {waste && (
        <WasteForm
          product={waste}
          onClose={() => setWaste(null)}
          onSaved={async (product) => {
            await onRefresh();
            onNotice(
              "Merma registrada: " +
                product.nombre +
                " · Stock: " +
                quantityLabel(product.stock, product),
            );
          }}
        />
      )}
      {receipt && (
        <StockReceipt
          product={receipt}
          onClose={() => setReceipt(null)}
          onSaved={async (product) => {
            await onRefresh();
            onNotice(
              "Stock actualizado: " +
                product.nombre +
                " · " +
                quantityLabel(product.stock, product) +
                ".",
            );
          }}
        />
      )}
    </>
  );
}
