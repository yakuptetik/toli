# Toli Asistan

[Toli Games](https://www.toligames.com/) ürün kataloğuna dayalı oyun öneri chatbotu ve tek sayfalık demo sunumu.

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # veya mevcut .env.local
npm run scrape
npm run verify
npm run dev
```

Tarayıcı: `http://localhost:3000` — sağ altta **Toli Asistan** widget’ı.

## Ortam değişkenleri (Vercel + local)

| Değişken | Açıklama |
|----------|----------|
| `MISTRAL_API_KEY` | Mistral API anahtarı |
| `MISTRAL_MODEL` | Örn. `mistral-small-latest` |

## Veri

- `npm run scrape` — sitemap’ten ürün URL’leri, `productDetailModel` + **Ürün Özellikleri** HTML (h2 bölümleri ve madde listeleri) → `data/products.json`
- `data/raw/` — HTML önbellek (gitignore)
- `npm run verify` — örnek ürünlerde canlı fiyat ve Pırıl Quick Math maddeleri kontrolü

## Deploy (Vercel)

1. Repoyu Vercel’e bağlayın.
2. Environment Variables: `MISTRAL_API_KEY`, `MISTRAL_MODEL`.
3. Deploy — `data/products.json` repoda olduğu sürece ek DB gerekmez.

## Gömme

```html
<script
  src="https://SIZIN-VERCEL-URL/widget.js"
  data-api="https://SIZIN-VERCEL-URL/api/chat"
  data-baslik="Toli Asistan"
  defer
></script>
```

## API

- `POST /api/chat` — SSE (`delta`, `products`, `done`)
- `GET /api/health` — katalog özeti
