import catalogData from "@/data/products.json";
import type { Product, ProductCatalog } from "./types";

let cache: ProductCatalog | null = null;

export function getCatalog(): ProductCatalog {
  if (!cache) cache = catalogData as unknown as ProductCatalog;
  return cache;
}

export function getAllProducts(): Product[] {
  return getCatalog().urunler;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find(
    (p) => p.slug === slug || p.id === slug,
  );
}

export function toCard(p: Product) {
  return {
    id: p.id,
    ad: p.ad,
    url: p.url,
    gorsel: p.gorsel,
    fiyat: p.fiyat_gosterim,
    fiyat_liste: p.fiyat_liste_gosterim ?? null,
    indirim_yuzde: p.indirim_yuzde ?? null,
    ozet: p.ozet,
  };
}
