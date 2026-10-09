import { createStore, del, get, set } from "idb-keyval";

// Everything personal stays in this browser's IndexedDB: the shopper's photo and saved looks.
const store = typeof indexedDB === "undefined" ? undefined : createStore("billy", "kv");

export type Verdict = "yes" | "maybe" | "no";

export type Look = {
  id: string;
  createdAt: number;
  image: string;
  garment: {
    title: string;
    image: string;
    listingId?: string;
    price?: number;
    sourceUrl?: string;
  };
  verdict?: Verdict;
};

export const getMe = () => (store ? get<string>("me", store) : Promise.resolve(undefined));
export const setMe = (dataUrl: string) => set("me", dataUrl, store);
export const clearMe = () => del("me", store);

export async function getLooks(): Promise<Look[]> {
  if (!store) return [];
  return (await get<Look[]>("looks", store)) ?? [];
}

export async function saveLooks(looks: Look[]) {
  await set("looks", looks, store);
}
