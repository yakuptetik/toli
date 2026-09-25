import { getAllProducts, getCatalog, toCard } from "./catalog";
import type { Product, RetrieveResult } from "./types";

const STOP = new Set([
  "için",
  "olan",
  "oyun",
  "oyunu",
  "zeka",
  "toli",
  "games",
  "bir",
  "veya",
  "ile",
  "mi",
  "mı",
  "mu",
  "mü",
  "ne",
  "nedir",
  "nasıl",
  "hangi",
  "var",
  "yok",
  "çocuk",
  "çocuğum",
  "yaşında",
  "yaş",
  "erkek",
  "kız",
  "kızım",
  "oğlum",
  "lütfen",
  "öner",
  "önerir",
  "misiniz",
  "istiyorum",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function parseChildAge(q: string): number | null {
  const m = q.match(/(\d{1,2})\s*yaş/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function detectIntent(q: string): RetrieveResult["intent"] {
  const l = q.toLowerCase();
  if (/kargo|iade|telefon|iletişim|ödeme|bedava|destek/.test(l)) return "store";
  if (
    /öner|tavsiye|hangi oyun|yaşınd|oğlum|kızım|hediye|alsam|alsın|uygun/.test(l)
  )
    return "recommend";
  if (/fiyat|kaç tl|nedir|nasıl oynan|gerekliliği|önemi|özellik|içerik/.test(l))
    return "product_qa";
  return "general";
}

function scoreProduct(p: Product, tokens: string[], q: string): number {
  let score = 0;
  const hay = p.arama_metni;
  const name = p.ad.toLowerCase();

  if (name.includes(q.trim().toLowerCase()) && q.trim().length > 4) score += 80;

  for (const t of tokens) {
    if (name.includes(t)) score += 12;
    if (hay.includes(t)) score += 4;
    for (const b of p.bolumler) {
      if (b.baslik.toLowerCase().includes(t)) score += 10;
      if (b.maddeler.some((m) => m.toLowerCase().includes(t))) score += 6;
    }
    for (const k of p.kategoriler) {
      if (k.toLowerCase().includes(t)) score += 8;
    }
  }

  if (/matematik|dört işlem|sayı|hesap/.test(q) && /math|matematik|hesap|sayı/i.test(hay))
    score += 15;
  if (/pırıl|piril/.test(q.toLowerCase()) && /pırıl|piril/i.test(p.ad))
    score += 20;
  if (/puzzle|yapboz/.test(q.toLowerCase()) && /puzzle|parça/i.test(hay))
    score += 15;
  if (/aile|birlikte/.test(q.toLowerCase()) && /aile|kaliteli zaman/i.test(hay))
    score += 10;
  if (/strateg|strateji|kodlama/.test(q.toLowerCase()) && /strateji|kodlama/i.test(hay))
    score += 12;

  const age = parseChildAge(q);
  if (age != null) {
    if (p.min_yas_uyari != null && age < p.min_yas_uyari) score -= 40;
    else score += 5;
    if (/okul|eğitim|öğren/.test(hay)) score += 4;
  }

  if (!p.stokta) score -= 25;
  return score;
}

function findBestProductMatch(q: string, tokens: string[]): Product | null {
  const products = getAllProducts();
  let best: Product | null = null;
  let bestScore = 0;

  for (const p of products) {
    const slugWords = p.slug.replace(/-/g, " ");
    if (q.toLowerCase().includes(slugWords)) return p;
    const adNorm = p.ad.toLowerCase().replace(/ı/g, "i");
    const qNorm = q.toLowerCase().replace(/ı/g, "i");
    if (qNorm.includes(adNorm.slice(0, Math.min(adNorm.length, 12)))) {
      return p;
    }
  }

  for (const p of products) {
    const s = scoreProduct(p, tokens, q);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 8 ? best : null;
}

function findSectionForQuestion(p: Product, q: string): string {
  const l = q.toLowerCase();
  for (const b of p.bolumler) {
    const bl = (b.baslik + " " + b.tam_metin).toLowerCase();
    if (
      /gerekliliği|önemi/.test(l) &&
      (/gerekliliği|önemi/.test(bl) ||
        b.paragraflar.some((p) => /gerekliliği|önemi/.test(p.toLowerCase())))
    ) {
      return formatSection(b);
    }
    if (/dikkat edilmesi/.test(l) && /dikkat edilmesi/.test(bl)) {
      return formatSection(b);
    }
    if (b.baslik && tokensMatch(l, b.baslik.toLowerCase())) {
      return formatSection(b);
    }
  }
  if (p.bolumler.length) return formatSection(p.bolumler[0]);
  return p.ozet ?? "";
}

function tokensMatch(q: string, title: string): boolean {
  return tokenize(title).some((t) => q.includes(t));
}

const PRICE_QUERY =
  /fiyat|ne kadar|kaç tl|satıyor|satılıyor|var mı|var mi|stokta mı/i;

/** Soruda geçen ayırt edici kelime katalogda yoksa (ör. Monopoly) */
function missingProductNote(q: string): string | null {
  if (!PRICE_QUERY.test(q)) return null;

  const tokens = tokenize(q).filter(
    (t) => !["kadar", "much", "price", "fiyatı", "oyunu"].includes(t),
  );

  for (const t of tokens) {
    if (t.length < 4) continue;
    const inCatalog = getAllProducts().some((p) => {
      const blob = `${p.ad} ${p.slug} ${p.arama_metni}`.toLowerCase();
      return blob.includes(t);
    });
    if (!inCatalog) {
      const label = t.charAt(0).toUpperCase() + t.slice(1);
      return [
        `KATALOG_NOTU: "${label}" adlı (veya bu isimle anılan) ürün toligames.com listesinde yok.`,
        "YANIT: Mağazada bu ürün bulunmuyor; fiyat söyleme. Alakasız oyun adı verme.",
        'Doğal Türkçe kullan (ör. "Monopoly\'yi mağazamızda listelemiyoruz."). Teknik kelime kullanma.',
      ].join("\n");
    }
  }

  return null;
}

function formatPriceBlock(p: Product): string {
  if (p.fiyat_liste_gosterim && p.indirim_yuzde) {
    return [
      `Liste fiyatı (KDV dahil): ${p.fiyat_liste_gosterim}`,
      `İndirimli fiyat (KDV dahil): ${p.fiyat_gosterim ?? "bilinmiyor"}`,
      `İndirim: %${p.indirim_yuzde}`,
    ].join("\n");
  }
  return `Fiyat (KDV dahil): ${p.fiyat_gosterim ?? "bilinmiyor"}`;
}

function formatSection(b: Product["bolumler"][0]): string {
  const lines = [
    `### ${b.baslik}`,
    ...b.paragraflar,
    ...b.maddeler.map((m) => `- ${m}`),
  ].filter(Boolean);
  return lines.join("\n");
}

function buildProductContext(p: Product, q: string): string {
  const section = findSectionForQuestion(p, q);
  return [
    `ÜRÜN: ${p.ad}`,
    `URL: ${p.url}`,
    formatPriceBlock(p),
    `Stok: ${p.stokta ? "var" : "tükendi"}`,
    `Kategoriler: ${p.kategoriler.join(", ") || "-"}`,
    p.yas_uyarisi ? `Yaş uyarısı: ${p.yas_uyarisi}` : "",
    p.ozet ? `Kısa tanıtım: ${p.ozet}` : "",
    section ? `İlgili bölüm:\n${section}` : "",
    p.bolumler.length > 1
      ? `Diğer başlıklar: ${p.bolumler.map((x) => x.baslik).join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function retrieve(query: string): RetrieveResult {
  const q = query.trim();
  const ql = q.toLowerCase();
  const tokens = tokenize(q);
  const intent = detectIntent(q);
  const catalog = getCatalog();
  const products = getAllProducts();

  let ranked = products
    .map((p) => ({ p, s: scoreProduct(p, tokens, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  let matchedProduct = findBestProductMatch(q, tokens);
  if (
    /gerekliliği|önemi/.test(ql) &&
    /quick\s*math|quick math/.test(ql) &&
    !/pırıl|piril/.test(ql)
  ) {
    const pirilQm = getAllProducts().find(
      (p) => p.slug === "piril-quick-math-zeka-oyunu",
    );
    if (pirilQm) matchedProduct = pirilQm;
  }

  if (intent === "product_qa" && matchedProduct) {
    ranked = [{ p: matchedProduct, s: 999 }, ...ranked.filter((r) => r.p.id !== matchedProduct.id)];
  }

  const missingNote = missingProductNote(q);

  let top = ranked.slice(0, intent === "recommend" ? 4 : 3).map((x) => x.p);
  let cards = top.map(toCard);

  const storeBlock = [
    `MAĞAZA: ${catalog.magaza.firma}`,
    `Site: ${catalog.magaza.site}`,
    `Telefon: ${catalog.magaza.telefon}`,
    `E-posta: ${catalog.magaza.eposta}`,
    `Kargo: ${catalog.magaza.kargo}`,
    `İade: ${catalog.magaza.iade}`,
  ].join("\n");

  let contextText = storeBlock + "\n\n";

  if (missingNote) {
    top = [];
    cards = [];
    contextText += missingNote + "\n\n";
  }

  if (!missingNote) {
    if (intent === "store") {
      contextText += "Kullanıcı mağaza / kargo / iletişim sorusu soruyor.\n";
    } else if (
      matchedProduct &&
      (intent === "product_qa" || /quick math|pırıl|bilgin|wecode/i.test(q))
    ) {
      contextText += buildProductContext(matchedProduct, q) + "\n\n";
      if (top.length > 1) {
        contextText +=
          "Alternatif ürünler:\n" +
          top
            .slice(1)
            .map((p) => `- ${p.ad} (${p.fiyat_gosterim}) ${p.url}`)
            .join("\n");
      }
    } else if (top.length > 0) {
      contextText +=
        "ÖNERİLEN ÜRÜNLER (skor sırasına göre):\n" +
        top
          .map((p, i) => {
            return [
              `${i + 1}. ${p.ad}`,
              `   Fiyat: ${
                p.fiyat_liste_gosterim && p.indirim_yuzde
                  ? `${p.fiyat_liste_gosterim} → ${p.fiyat_gosterim} (%${p.indirim_yuzde} indirim)`
                  : (p.fiyat_gosterim ?? "-")
              }`,
              `   URL: ${p.url}`,
              `   Özet: ${p.ozet ?? "-"}`,
              p.yas_uyarisi ? `   Yaş: ${p.yas_uyarisi}` : "",
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n");
      if (matchedProduct) {
        contextText +=
          "\n\nEN YAKIN TEK ÜRÜN DETAYI:\n" +
          buildProductContext(matchedProduct, q);
      }
    }
  }

  return {
    products: top,
    cards,
    contextText,
    intent,
    matchedProduct,
  };
}
