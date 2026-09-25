import * as cheerio from "cheerio";

export type ProductSection = {
  baslik: string;
  paragraflar: string[];
  maddeler: string[];
  tam_metin: string;
};

export type ParsedProductPage = {
  productDetailModel: Record<string, unknown>;
  ozellikHtml: string;
  bolumler: ProductSection[];
  duz_metin: string;
};

function extractProductDetailModel(html: string): Record<string, unknown> | null {
  const marker = "var productDetailModel = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  if (html[i] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const jsonStr = html.slice(start + marker.length, i + 1);
        return JSON.parse(jsonStr) as Record<string, unknown>;
      }
    }
  }
  return null;
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function parseOzellikSections(html: string): {
  bolumler: ProductSection[];
  duz_metin: string;
} {
  const $ = cheerio.load(html);
  const panel = $("#divTabOzellikler .urunTabAlt").first();
  if (!panel.length) {
    return { bolumler: [], duz_metin: "" };
  }

  panel.find("iframe, script, style").remove();
  const root = panel.clone();
  const bolumler: ProductSection[] = [];

  const h2Nodes = root.find("h2");
  if (h2Nodes.length === 0) {
    const paragraflar = root
      .find("p")
      .toArray()
      .map((el) => cleanText($(el).text()))
      .filter(Boolean);
    const maddeler = root
      .find("li")
      .toArray()
      .map((el) => cleanText($(el).text()))
      .filter(Boolean);
    const intro = cleanText(root.text());
    if (intro || paragraflar.length || maddeler.length) {
      bolumler.push({
        baslik: "Ürün Özellikleri",
        paragraflar,
        maddeler,
        tam_metin: [intro, ...maddeler].filter(Boolean).join("\n"),
      });
    }
    return { bolumler, duz_metin: cleanText(root.text()) };
  }

  h2Nodes.each((_, h2) => {
    const baslik = cleanText($(h2).text());
    const fragment = $("<div></div>");
    $(h2)
      .nextUntil("h2")
      .each((__, el) => {
        fragment.append($(el).clone());
      });

    const paragraflar = fragment
      .find("p")
      .toArray()
      .map((p) => cleanText($(p).text()))
      .filter(Boolean);
    const maddeler = fragment
      .find("li")
      .toArray()
      .map((li) => cleanText($(li).text()))
      .filter(Boolean);
    const tam_metin = cleanText(
      [baslik, ...paragraflar, ...maddeler].join("\n"),
    );
    bolumler.push({ baslik, paragraflar, maddeler, tam_metin });
  });

  return { bolumler, duz_metin: cleanText(root.text()) };
}

export function parseProductHtml(html: string): ParsedProductPage | null {
  const productDetailModel = extractProductDetailModel(html);
  if (!productDetailModel) return null;

  const $ = cheerio.load(html);
  const ozellikHtml =
    $("#divTabOzellikler .urunTabAlt").first().html() ?? "";
  const { bolumler, duz_metin } = parseOzellikSections(html);

  return {
    productDetailModel,
    ozellikHtml,
    bolumler,
    duz_metin,
  };
}

export function extractMinAgeWarning(text: string): {
  min_yas_uyari: number | null;
  yas_uyarisi: string | null;
} {
  const lower = text.toLowerCase();
  const m = lower.match(/(\d+)\s*yaşından\s*küçük/);
  if (m) {
    const n = parseInt(m[1], 10);
    const sentence = text.match(/[^.]*\d+\s*yaşından\s*küçük[^.]*/i)?.[0];
    return { min_yas_uyari: n, yas_uyarisi: sentence ? cleanText(sentence) : null };
  }
  return { min_yas_uyari: null, yas_uyarisi: null };
}
