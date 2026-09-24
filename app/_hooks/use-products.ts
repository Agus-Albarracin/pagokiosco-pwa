"use client";
import { useCallback, useEffect, useState } from "react";
import { listProducts, type Product } from "@/entities/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(
    () =>
      listProducts()
        .then((result) => {
          setProducts(result);
          setError("");
        })
        .catch(() => {
          setError(
            "No pudimos abrir tus datos. Revisá el almacenamiento del navegador y reintentá.",
          );
        })
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [refresh]);

  return { products, loading, error, refresh };
}
