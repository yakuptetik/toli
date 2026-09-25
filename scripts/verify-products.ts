import * as fs from "fs";
import * as path from "path";
import { parseProductHtml } from "./lib/parse-product";

const ORIGIN = "https://www.toligames.com";
const USER_AGENT = "ToliAsistanBot/1.0 (+verify)";

type Catalog = {
  urunler: Array<{
    slug: string;
    url: string;
    ad: string;
    fiyat_try: number | null;
    fiyat_gosterim?: string | null;
    fiyat_liste_gosterim?: string | null;
    indirim_yuzde?: number | null;
    bolumler: Array<{ baslik: string; maddeler: string[] }>;
  }>;
};

async function fetchPrice(url: string): Promise<number | null> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const html = await res.text();
  const parsed = parseProductHtml(html);
  if (!parsed) return null;
  const model = parsed.productDetailModel;
  if (typeof model.productPriceKDVIncluded === "number") {
    return model.productPriceKDVIncluded as number;
  }
  return null;
}

async function main() {
  const file = path.join(process.cwd(), "data", "products.json");
  if (!fs.existsSync(file)) {
    console.error("data/products.json yok — önce npm run scrape");
    process.exit(1);
  }
  const catalog = JSON.parse(fs.readFileSync(file, "utf8")) as Catalog;
  let fails = 0;

  const sample = catalog.urunler.filter((u) =>
    /quick-math|piril-quick-math|bilgin-turkiye/i.test(u.slug),
  );
  const toCheck = sample.length ? sample : catalog.urunler.slice(0, 5);

  for (const u of toCheck) {
    const live = await fetchPrice(u.url);
    if (live == null || u.fiyat_try == null) {
      console.warn(`⚠ ${u.ad}: fiyat doğrulanamadı`);
      continue;
    }
    if (Math.abs(live - u.fiyat_try) > 0.01) {
      console.error(
        `✗ ${u.ad}: JSON ${u.fiyat_try} ≠ canlı ${live} (${u.url})`,
      );
      fails++;
    } else {
      console.log(`✓ ${u.ad}: fiyat ${live} TRY`);
    }
  }

  const bilginDunya = catalog.urunler.find(
    (u) => u.slug === "bilgin-dunya-eglence-oyunu",
  );
  if (bilginDunya) {
    if (
      bilginDunya.fiyat_gosterim !== "₺949,00" ||
      bilginDunya.fiyat_liste_gosterim !== "₺999,00" ||
      bilginDunya.indirim_yuzde !== 5
    ) {
      console.error(
        `✗ Bilgin Dünya indirim: güncel ${bilginDunya.fiyat_gosterim}, liste ${bilginDunya.fiyat_liste_gosterim}, %${bilginDunya.indirim_yuzde}`,
      );
      fails++;
    } else {
      console.log("✓ Bilgin Dünya: ₺999 → ₺949 (%5)");
    }
  }

  const piril = catalog.urunler.find((u) => u.slug === "piril-quick-math-zeka-oyunu");
  if (piril) {
    const section = piril.bolumler.find((b) =>
      /gerekliliği|önemi/i.test(b.baslik + b.maddeler.join(" ")),
    );
    const hasFourOps = piril.bolumler.some((b) =>
      b.maddeler.some((m) => /dört işlem/i.test(m)),
    );
    if (!hasFourOps) {
      console.error("✗ Pırıl Quick Math: dört işlem maddesi JSON’da yok");
      fails++;
    } else {
      console.log("✓ Pırıl Quick Math: gereklilik maddeleri mevcut");
    }
    if (!section && !hasFourOps) fails++;
  }

  if (fails > 0) {
    console.error(`\nVerify FAILED (${fails} sorun)`);
    process.exit(1);
  }
  console.log("\nVerify OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
