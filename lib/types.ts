export type ProductSection = {
  baslik: string;
  paragraflar: string[];
  maddeler: string[];
  tam_metin: string;
};

export type Product = {
  id: string;
  urun_karti_id: number;
  ad: string;
  slug: string;
  url: string;
  marka: string;
  kategoriler: string[];
  fiyat_try: number | null;
  fiyat_gosterim: string | null;
  fiyat_liste_try: number | null;
  fiyat_liste_gosterim: string | null;
  indirim_yuzde: number | null;
  stok: number;
  stokta: boolean;
  gorsel: string | null;
  gorseller: string[];
  teknik_ozellikler: Record<string, string>;
  yas_uyarisi: string | null;
  min_yas_uyari: number | null;
  ozet: string | null;
  bolumler: ProductSection[];
  arama_metni: string;
  ornek_sorular: string[];
  kaynak_url: string;
  guncellenme: string;
};

export type ProductCatalog = {
  meta: {
    kaynak: string;
    urun_sayisi: number;
    guncellenme: string;
    hatalar?: string[];
  };
  magaza: {
    firma: string;
    site: string;
    telefon: string;
    eposta: string;
    kargo: string;
    iade: string;
    ornek_sorular: string[];
  };
  urunler: Product[];
};

export type ProductCard = {
  id: string;
  ad: string;
  url: string;
  gorsel: string | null;
  fiyat: string | null;
  fiyat_liste: string | null;
  indirim_yuzde: number | null;
  ozet: string | null;
};

export type RetrieveResult = {
  products: Product[];
  cards: ProductCard[];
  contextText: string;
  intent: "recommend" | "product_qa" | "store" | "general";
  matchedProduct: Product | null;
};
