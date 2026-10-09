"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createStore, get, set } from "idb-keyval";
import { BagDrawer } from "./BagDrawer";
import { TryOnDrawer } from "./TryOnDrawer";

export type BagItem = { id: string; size: string };

type ShopState = {
  bag: BagItem[];
  addToBag: (item: BagItem) => void;
  removeFromBag: (index: number) => void;
  // Looks of the shopper wearing a single product, by product id. The store swaps
  // these in for the model photo once someone has tried a piece on.
  tries: Record<string, string>;
  recordTry: (id: string, image: string) => void;
  openTryOn: (id: string) => void;
  openBag: () => void;
};

const ShopContext = createContext<ShopState | null>(null);

const BAG_KEY = "etage:bag";
const TRIES_KEY = "shop-tries";
// Same IndexedDB store as Billy's studio, so the shopper's photo is shared.
const idb = typeof indexedDB === "undefined" ? undefined : createStore("billy", "kv");

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [tries, setTries] = useState<Record<string, string>>({});
  const [tryOnId, setTryOnId] = useState<{ id: string; key: number } | null>(null);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    if (idb) get<Record<string, string>>(TRIES_KEY, idb).then((t) => t && setTries(t));
    Promise.resolve().then(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(BAG_KEY) ?? "[]");
        if (Array.isArray(stored)) setBag(stored);
      } catch {}
    });
  }, []);

  const saveBag = useCallback((next: BagItem[]) => {
    setBag(next);
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      bag,
      addToBag: (item) => saveBag([...bag, item]),
      removeFromBag: (index) => saveBag(bag.filter((_, i) => i !== index)),
      tries,
      recordTry: (id, image) => {
        setTries((t) => {
          const next = { ...t, [id]: image };
          if (idb) set(TRIES_KEY, next, idb).catch(() => {});
          return next;
        });
      },
      openTryOn: (id) => {
        setBagOpen(false);
        setTryOnId({ id, key: Date.now() });
      },
      openBag: () => {
        setTryOnId(null);
        setBagOpen(true);
      },
    }),
    [bag, tries, saveBag],
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
      {tryOnId && <TryOnDrawer key={tryOnId.key} productId={tryOnId.id} onClose={() => setTryOnId(null)} />}
      {bagOpen && <BagDrawer onClose={() => setBagOpen(false)} />}
    </ShopContext.Provider>
  );
}
