# Üniversite Öğrenci Bilgi Chatbotu — Starter Prompt

Bu dosyayı bir AI coding agent’a **olduğu gibi** yapıştır. Köşeli parantezleri `[...]` hedef üniversiteye göre doldur.

---

## Rolün

Sen bir AI coding agent’sın. `[ÜNİVERSİTE_ADI]` için bir **öğrenci bilgi chatbotu** kuracaksın. Hedef: aday ve mevcut öğrencinin web sitesinde sayfa gezmeden; ücret, burs, kayıt, bölüm, kampüs/konum sorularını sorarak doğru cevap alması.

Kanallar (sırayla):

1. Önce **web widget** (demo + gömülebilir script)
2. Sonra (isteğe bağlı) WhatsApp — aynı API beynini paylaşır

Kullanıcının geçmişi olabilir: Supabase / Vercel / test WhatsApp numarası. **Demo aşamasında ağır altyapı kurma.**

---

## Mutlak kurallar (asla esneme)

1. **Emin olmadığın hiçbir sayıyı koyma.** Ücret, kontenjan, tarih uydurma. Bilmiyorsan “bilgim yok + resmi iletişim” de.
2. **Üçüncü parti sitelerden ücret alma.** Sadece üniversitenin resmi domain’i: `[https://ornek.edu.tr]`
3. Kullanıcı “şu URL doğru kaynak” dediyse **o URL’yi tek doğruluk kaynağı** say; WebSearch sonuçlarını ücret için kullanma.
4. Kritik sayılar (ücret vb.) **yapısal JSON’dan** okunur. LLM serbest üretmez; yalnızca bağlamdaki sayıları aktarır.
5. Site tabloları Word’den yapıştırılmış / `rowspan`/`colspan` olabilir. Düz `text()` ile parse etme; grid’e aç.
6. Scrape’ten önce **canlı doğrulama** yap; Supabase’e veya production DB’ye erken yazma.
7. Sitede olmayan bilgi (yurt ücreti vb.) için **manuel override dosyası** bırak; scraper o dosyaya dokunmasın.
8. API anahtarını sohbete / commit’e / log’a yazma. `.env.local` + platform env.
9. `robots.txt` ve nazik crawl (throttle, anlamlı User-Agent).
10. Türkçe dışı diller: bilinen dillerde cevap; **tanınmayan ama Türkçe olmayan** → İngilizce (asla sessizce Türkçe’ye düşme).

---

## Kullanıcıdan iste (yoksa sorma, sonra varsayımla devam etme)

- Resmi site kökü: `[ORIGIN]`
- Yerli öğrenci ücret sayfası URL’leri
- Uluslararası / USD ücret sayfası URL’leri
- Öncelikli konular: ücret, burs, kayıt belgeleri, kampüs, yurt…
- Asistan adı + maskot (varsa)
- LLM API anahtarı (Mistral / OpenAI / vb.) — env’e koy
- İlk kanal: widget mi, WhatsApp mı?

---

## Faz 0 — Keşif (kod yazmadan önce kısa)

1. `robots.txt`, sitemap, ana menü yapısını incele.
2. Ücret tablolarının HTML’ini aç; `rowspan` / MsoNormalTable var mı bak.
3. İngilizce site gerçekten çevrilmiş mi, yoksa sadece URL mi İngilizce? (Slug’dan alias üretilebilir.)
4. Kullanıcıya 5–10 satırlık plan özeti ver; onay sonrası Faz 1’e geç.

---

## Faz 1 — Veri katmanı (önce doğruluk)

### 1.1 Proje iskeleti

- Node + TypeScript (veya mevcut stack)
- `scripts/` scrape & parse
- `data/*.json` üretilen veri (git’e girer)
- `data/raw/` HTML önbelleği (**gitignore** — büyür)
- `.env.local` (**gitignore**)
- `npm run scrape | build:data | verify`

### 1.2 HTTP katmanı

- Cache’li `fetchPage`, throttle (~300–500ms), izinli path listesi
- User-Agent: chatbot bot + iletişim e-postası

### 1.3 Ücret parse (kritik)

- Yerli (TRY) ve uluslararası (USD) tabloları ayrı parse et
- `tableToGrid`: rowspan/colspan açılmış 2D dizi
- Program adı normalize / slug; `(İngilizce)` varyantlarını ayır
- Çıktı örneği `programs.json`:
    - `ad`, `fakulte`, `seviye`, `egitim_dili`, `akademik_yil`
    - `ucret_try: { tam, burslu_50, kaynak }`
    - `ucret_usd_uluslararasi: { erken_kayit, standart, kontenjan, kaynak } | null`
    - `kaynak_url`, `guncellenme`
- TL ile USD listesi uyuşmuyorsa **uydurma eşleme yapma**; raporda belirt

### 1.4 İçerik kataloğu (tüm siteyi indeksleme)

Kürate liste: kayıt belgeleri, burs, uluslararası başvuru, ulaşım, yurt (tanıtım), SSS, hakkımızda…

Her sayfa için:

- Temiz metin (inline `<a>` / telefon / PDF linklerini kaybetme)
- Tablolar → markdown
- PDF / harita / görsel / tel / e-posta ayrı alanlar

Çıktı: `content.json` (chunk’lar + `ornek_sorular` + `kategori`)

### 1.5 Kampüs

`campus.json`: adres, telefon E.164, WhatsApp (bozuksa düzelt + kaynak hali sakla), koordinat, harita, otobüs hatları, görseller.

### 1.6 Manuel override

`overrides.json`:

```json
{
    "manuel_bilgiler": [
        {
            "id": "yurt-ucretleri",
            "baslik": "...",
            "ornek_sorular": ["..."],
            "icerik": "",
            "aktif": false,
            "not": "Sitede yok; elle doldurulacak"
        }
    ]
}
```

`aktif=false` veya boş içerik → bot uydurmaz, bilmediğini söyler.

### 1.7 İngilizce program adları

Mümkünse sitemap-en / İngilizce URL slug ↔ Türkçe title eşlemesiyle `aliases.json` üret. Elle çeviri uydurma.

### 1.8 Doğrulama (zorunlu kapı)

`verify` script:

- Ücret sayfalarını **canlı** yeniden çek
- `programs.json` ile hücre hücre karşılaştır
- Uyuşmazlıkta exit code ≠ 0

Spot check: kullanıcının verdiği örnek program (örn. Psikoloji tam / %50).

**Bu kapı geçmeden chatbot UI’ye geçme. Supabase’e bu aşamada veri basma.**

---

## Faz 2 — Soru yanıtlama motoru (Supabase’siz demo)

### Mimari

```
Widget / ileride WhatsApp
        ↓
   POST /api/chat  (SSE stream)
        ↓
  retrieve (niyet + program eşle + içerik ara)
        ↓
  buildContext (yapısal ücret + chunk + kampüs)
        ↓
  LLM (düşük temperature) → sadece bağlamdan cevap
```

### Retrieve

- Dil tespiti (aşağıdaki dil kuralları)
- Niyet: ücret / liste / konum / uluslararası
- Program eşleme: Türkçe + İngilizce adlar; ayırt edici token
- İçerik: token ağırlıklı arama (başlık/örnek soru > gövde)
- Ek kartlar: harita, PDF, bölüm sayfası — **yalnızca en alakalı 1–2 chunk’tan**; alakasız otopark PDF’i sızmasın

### Prompt kuralları (LLM)

- Sadece BAĞLAM
- Sayıları birebir kopyala
- Lisans vs lisansüstü tablolarını karıştırma
- Uluslararası / yabancı dil sorusunda **USD ver, yerli TL’yi verme** (açıkça TL sorulmadıkça)
- Cevaba asistan adı ile başlama (“Mudy:” yok)
- Kaynak satırı cevap dilinde (`Kaynak:` / `Source:` / …)
- “Bilgim yok” da cevap dilinde + telefon/e-posta

### Dil politikası

Bilinen diller (manuel anahtar kelime + yazı sistemi):  
TR, EN, RU, UZ, HR (ve ihtiyaca DE/FR/ES/AR…)

- Bilinen dil → o dilde cevap
- **Türkçe değil + tanınmıyor → İngilizce** (asla default TR değil)
- Tek Türkçe harf (`why ı am`) İngilizceyi ezmesin

### Halüsinasyon testleri (otomatik)

En az şunlar:

- Bilinen bir programın tam / burslu ücreti (kullanıcı teyidi)
- Olmayan fakülte ücreti → fiyat uydurmama
- Yurt ücreti (sitede yoksa) → uydurmama
- USD listesinde olmayan program → dolar uydurmama
- İngilizce / Rusça / Özbekçe soru → dil + doğru para birimi
- “Hangi bölümler” çok dilli liste niyeti

Önce `test:retrieval` (ücretsiz), sonra uçtan uca LLM testi. Rate limit’e retry koy.

---

## Faz 3 — Widget + demo sunum sayfası

- Shadow DOM widget: launcher, sohbet, SSE, markdown, ek kartlar
- Marka renkleri siteden; asistan adı + maskot (`/mudy.jpeg` benzeri)
- **Avatar/API URL’leri `script.src` origin’inden** çözülsün (başka siteye gömülünce host’ta görsel arama)
- Demo sayfası: amaç, hizmet alanı, eklenecekler, yol haritası, fayda, vizyon, dene butonları
- CORS `*` (widget gömme için)
- Gömme örneği:

```html
<script
    src="https://[DEPLOY]/widget.js"
    data-api="https://[DEPLOY]/api/chat"
    data-baslik="[ASISTAN_ADI]"
    defer
></script>
```

---

## Faz 4 — Deploy (hız odaklı demo)

- **Sadece Vercel + JSON dosyaları + LLM API.** Demo için Supabase ekleme (ek latency).
- `data/raw` deploy’a girmez (`.vercelignore` / gitignore)
- `MISTRAL_API_KEY` (veya seçilen LLM) yalnızca Vercel env
- Serverless: `/api/chat` (SSE, maxDuration yeterli), `/api/health`, `public/`
- Cevap süresinin darboğazı DB değil LLM’dir

WhatsApp / OBS / kişiye özel veri → sonraki faz; ayrı entegrasyon ve izin ister.

---

## Teslim kontrol listesi

- [ ] Resmi ücret URL’leri parse + `verify` yeşil
- [ ] Kullanıcı örnek sayısı birebir
- [ ] `overrides.json` ile eksik konular hazır
- [ ] Halüsinasyon tuzakları geçiyor
- [ ] Widget localhost + başka domain’de maskot görünüyor
- [ ] TR dışı dil politikası doğru
- [ ] GitHub’da secret yok; Vercel’de env var
- [ ] README: scrape, verify, dev, gömme snippet

---

## Bu promptu kullanırken agent’a ek cümle

> Mudanya / mudy projesindeki yaklaşımı referans al: önce scrape+verify, sonra retrieval+LLM, en son widget ve Vercel. Supabase’i demo için kullanma. Her adımda doğruluğu hızdan önde tut.

### Hedef üniversite (doldur)

| Alan                   | Değer              |
| ---------------------- | ------------------ |
| Üniversite             | `[ÜNİVERSİTE_ADI]` |
| Site                   | `[ORIGIN]`         |
| Yerli ücret URL        | `[...]`            |
| USD / uluslararası URL | `[...]`            |
| Asistan adı            | `[...]`            |
| LLM                    | `[Mistral / ...]`  |
| İlk kanal              | `web widget`       |

Şimdi Faz 0 ile başla; onaydan sonra Faz 1.
