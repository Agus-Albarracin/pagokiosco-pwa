export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pagokiosco", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("products"))
        db.createObjectStore("products", { keyPath: "ean" });
      if (!db.objectStoreNames.contains("sales")) {
        const sales = db.createObjectStore("sales", { keyPath: "id" });
        sales.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("waste")) db.createObjectStore("waste", { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(new Error("No se pudo abrir el almacenamiento local."));
    request.onblocked = () =>
      reject(new Error("Cerrá otras pestañas de PagoKiosco y volvé a intentar."));
  });
}

export function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? new Error("No se guardaron los cambios. Volvé a intentar."));
    tx.onerror = () => reject(tx.error);
  });
}
