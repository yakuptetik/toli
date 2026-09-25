import * as fs from "fs";
import * as path from "path";
import {
  extractMinAgeWarning,
  parseProductHtml,
  type ProductSection,
} from "./lib/parse-product";

const ORIGIN = "https://www.toligames.com";
const USER_AGENT = "ToliAsistanBot/1.0 (+https://www.toligames.com; demo chatbot)";
const THROTTLE_MS = 400;

type CatalogProduct = {
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function getProductUrls(): Promise<string[]> {
  const xml = await fetchPage(`${ORIGIN}/sitemap/products/0.xml`);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return [...new Set(locs)];
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "urun" && parts[1]) return parts[1];
    return parts[parts.length - 1] ?? url;
  } catch {
    return url;
  }
}

function buildSearchText(p: Omit<CatalogProduct, "arama_metni" | "ornek_sorular">): string {
  const bits = [
    p.ad,
    p.marka,
    ...p.kategoriler,
    p.ozet ?? "",
    p.yas_uyarisi ?? "",
    ...Object.entries(p.teknik_ozellikler).map(([k, v]) => `${k} ${v}`),
    ...p.bolumler.flatMap((b) => [b.baslik, b.tam_metin, ...b.maddeler]),
  ];
  return bits.join(" ").toLowerCase();
}

function parsePrices(
  model: Record<string, unknown>,
  product: Record<string, unknown> | undefined,
): {
  fiyat_try: number | null;
  fiyat_gosterim: string | null;
  fiyat_liste_try: number | null;
  fiyat_liste_gosterim: string | null;
  indirim_yuzde: number | null;
} {
  const indirimOrani =
    typeof product?.indirimOrani === "number" ? product.indirimOrani : 0;
  const satisStr = product?.satisFiyatiStr as string | undefined;
  const indirimliStr = product?.indirimliFiyatiStr as string | undefined;

  let fiyat_try: number | null =
    typeof model.productPriceKDVIncluded === "number"
      ? (model.productPriceKDVIncluded as number)
      : null;

  if (fiyat_try == null && product) {
    const net =
      typeof product.indirimliFiyati === "number"
        ? product.indirimliFiyati
        : product.satisFiyati;
    const kdv =
      typeof product.indirimliKDV === "number"
        ? product.indirimliKDV
        : product.satisKDV;
    if (typeof net === "number" && typeof kdv === "number") fiyat_try = net + kdv;
  }

  const hasDiscount =
    indirimOrani > 0 &&
    !!satisStr &&
    !!indirimliStr &&
    satisStr !== indirimliStr;

  if (hasDiscount && product) {
    const listeTry =
      typeof product.satisFiyati === "number" &&
      typeof product.satisKDV === "number"
        ? (product.satisFiyati as number) + (product.satisKDV as number)
        : null;
    const indTry =
      typeof product.indirimliFiyati === "number" &&
      typeof product.indirimliKDV === "number"
        ? (product.indirimliFiyati as number) + (product.indirimliKDV as number)
        : fiyat_try;

    return {
      fiyat_try: indTry,
      fiyat_gosterim: indirimliStr,
      fiyat_liste_try: listeTry,
      fiyat_liste_gosterim: satisStr,
      indirim_yuzde: indirimOrani,
    };
  }

  const fiyat_gosterim =
    indirimliStr ??
    satisStr ??
    (fiyat_try != null
      ? `₺${fiyat_try.toFixed(2).replace(".", ",")}`
      : null);

  return {
    fiyat_try,
    fiyat_gosterim,
    fiyat_liste_try: null,
    fiyat_liste_gosterim: null,
    indirim_yuzde: null,
  };
}

function buildSampleQuestions(ad: string, bolumler: ProductSection[]): string[] {
  const qs: string[] = [
    `${ad} nedir?`,
    `${ad} kaç yaş için uygun?`,
    `${ad} fiyatı ne kadar?`,
  ];
  for (const b of bolumler) {
    if (/gerekliliği|önemi/i.test(b.baslik)) {
      qs.push(`${ad} neden önemli?`);
      qs.push(`${ad} gerekliliği ve önemi nedir?`);
    }
    if (/dikkat edilmesi/i.test(b.baslik)) {
      qs.push(`${ad} satın alırken nelere dikkat etmeliyim?`);
    }
  }
  return [...new Set(qs)].slice(0, 8);
}

function mapProduct(url: string, html: string): CatalogProduct | null {
  const parsed = parseProductHtml(html);
  if (!parsed) return null;

  const model = parsed.productDetailModel;
  const product = model.product as Record<string, unknown> | undefined;
  const breadCrumb = (model.breadCrumb as Array<{ tanim?: string }>) ?? [];
  const kategoriler = breadCrumb.map((b) => b.tanim).filter(Boolean) as string[];

  const ad =
    (model.productName as string) ||
    (product?.urunAdi as string) ||
    slugFromUrl(url);
  const slug = slugFromUrl(url);
  const images =
    (model.productImages as Array<{ imagePath?: string }>)?.map(
      (i) => i.imagePath,
    ).filter(Boolean) as string[] ?? [];
  const gorsel =
    images[0] ??
    (product?.spotResimYolu as string | undefined) ??
    null;

  const teknik: Record<string, string> = {};
  const custom = model.customTechnicalDetails as
    | Array<{ tanim?: string; degerler?: Array<{ tanim?: string }> }>
    | undefined;
  for (const row of custom ?? []) {
    const key = row.tanim?.trim();
    const val = row.degerler?.[0]?.tanim?.trim();
    if (key && val) teknik[key] = val;
  }

  const { min_yas_uyari, yas_uyarisi } = extractMinAgeWarning(parsed.duz_metin);
  const ozet =
    parsed.bolumler[0]?.paragraflar[0] ??
    (parsed.duz_metin.slice(0, 280) || null);

  const prices = parsePrices(model, product);

  const stok =
    typeof model.totalStockAmount === "number"
      ? model.totalStockAmount
      : typeof product?.stokAdedi === "number"
        ? (product.stokAdedi as number)
        : 0;

  const base: Omit<CatalogProduct, "arama_metni" | "ornek_sorular"> = {
    id: slug,
    urun_karti_id: (model.productId as number) ?? 0,
    ad,
    slug,
    url: url.startsWith("http") ? url : `${ORIGIN}${url}`,
    marka: (model.brandName as string) ?? "Toli Games",
    kategoriler,
    ...prices,
    stok,
    stokta: stok > 0 && model.productActive !== false,
    gorsel,
    gorseller: images,
    teknik_ozellikler: teknik,
    yas_uyarisi,
    min_yas_uyari,
    ozet,
    bolumler: parsed.bolumler,
    kaynak_url: url.startsWith("http") ? url : `${ORIGIN}${url}`,
    guncellenme: new Date().toISOString(),
  };

  const arama_metni = buildSearchText(base);
  const ornek_sorular = buildSampleQuestions(ad, parsed.bolumler);

  return { ...base, arama_metni, ornek_sorular };
}

async function main() {
  const root = path.join(process.cwd());
  const rawDir = path.join(root, "data", "raw");
  fs.mkdirSync(rawDir, { recursive: true });

  const urls = await getProductUrls();
  console.log(`Sitemap: ${urls.length} ürün URL`);

  const urunler: CatalogProduct[] = [];
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = slugFromUrl(url);
    process.stdout.write(`[${i + 1}/${urls.length}] ${slug} … `);
    try {
      const html = await fetchPage(url);
      fs.writeFileSync(path.join(rawDir, `${slug}.html`), html, "utf8");
      const item = mapProduct(url, html);
      if (!item) {
        errors.push(`${url}: productDetailModel yok`);
        console.log("ATLANDI (parse)");
      } else {
        urunler.push(item);
        console.log("OK");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${url}: ${msg}`);
      console.log("HATA");
    }
    await sleep(THROTTLE_MS);
  }

  const storeInfo = {
    firma: "Toli Games",
    site: ORIGIN,
    telefon: "+90 0224 221 12 92",
    eposta: "info@toligames.com",
    kargo: "750 TL ve üzeri alışverişlerde kargo bedava; aynı gün kargo avantajı.",
    iade: "Koşulsuz iade ve yedek parça garantisi (site bilgisi).",
    ornek_sorular: [
      "Kargo ücreti ne zaman bedava?",
      "5 yaşında erkek çocuğum için oyun önerir misiniz?",
      "Matematik becerisi geliştiren oyunlar hangileri?",
    ],
  };

  const catalog = {
    meta: {
      kaynak: ORIGIN,
      urun_sayisi: urunler.length,
      guncellenme: new Date().toISOString(),
      hatalar: errors,
    },
    magaza: storeInfo,
    urunler: urunler.sort((a, b) => a.ad.localeCompare(b.ad, "tr")),
  };

  fs.writeFileSync(
    path.join(root, "data", "products.json"),
    JSON.stringify(catalog, null, 2),
    "utf8",
  );

  console.log(`\nKaydedildi: data/products.json (${urunler.length} ürün)`);
  if (errors.length) {
    console.log(`Uyarı: ${errors.length} hata/atlanan URL`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
