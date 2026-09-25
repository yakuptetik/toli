import { getCatalog } from "@/lib/catalog";

export async function GET() {
  const catalog = getCatalog();
  return Response.json({
    ok: true,
    urun_sayisi: catalog.meta.urun_sayisi,
    guncellenme: catalog.meta.guncellenme,
  });
}
