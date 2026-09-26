import Image from "next/image";
import { getCatalog } from "@/lib/catalog";
import styles from "./page.module.css";

const DEMO_QUESTIONS = [
  { text: "5 yaşında oğlum için zeka oyunu önerir misin?", trap: false },
  { text: "Quick Math gerekliliği ve önemi nedir?", trap: false },
  { text: "750 TL üzeri kargo bedava mı?", trap: false },
  { text: "Pırıl lisanslı oyunlar hangileri?", trap: false },
  { text: "Toli Games Monopoly fiyatı ne kadar?", trap: true },
];

const FAYDA_CARDS = [
  {
    icon: "🔎",
    title: "Gezinme yükünü kaldırır",
    text: '"6 yaşında matematik seven çocuğum var" demek, normalde kategori → filtre → ürün → özellikler yolculuğu demek. Toli tek adımda öneri ve kart sunar.',
  },
  {
    icon: "👨‍👩‍👧",
    title: "Ebeveyn",
    text: "Gece de yanıt alır; yaşa uygun oyunu menülerde kaybolmadan bulur. Önerilen ürünü karttan doğrular.",
  },
  {
    icon: "🏫",
    title: "Eğitimci",
    text: "Sınıf ve etkinlik için beceri odaklı oyun seçer; ürünün eğitsel maddelerini sohbetten okur.",
  },
  {
    icon: "📞",
    title: "Tekrarlayan soruları azaltır",
    text: 'Kargo, indirim, yaş uyarısı ve "hangi oyun" soruları sık tekrarlanır. Bunlar otomatik yanıtlanınca ekip ve mağaza desteği gerçek istisnalara odaklanır.',
  },
  {
    icon: "🏪",
    title: "Toli Games",
    text: 'Tekrarlayan "hangi oyun" yükü azalır; hangi beceri / yaş kombinasyonunun arandığı görünür hale gelir.',
  },
  {
    icon: "⚖️",
    title: "Fiyat tutarlılığı",
    text: "Kritik tutarlar katalogdan okunur; indirimli / liste fiyatı karışmaz.",
  },
  {
    icon: "🎯",
    title: "Tek doğru kaynak",
    text: "Yanıtlar yalnızca toligames.com kataloğundan üretilir. Site güncellenince veri yeniden çekilir; ayrı bir içerik havuzu bakımı gerekmez.",
  },
  {
    icon: "🛡️",
    title: "Yanlış bilgi koruması",
    text: "Katalogda olmayan ürün veya konuda tahmin yok; resmi mağazaya yönlendirme var.",
  },
  {
    icon: "💸",
    title: "Düşük işletme maliyeti",
    text: "Veri JSON dosyasında; ağır veritabanı şart değil. Güncelleme: scrape + doğrulama komutları.",
  },
];

export default function HomePage() {
  const catalog = getCatalog();
  const urunSayisi = catalog.meta.urun_sayisi;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <Image src="/toli.jpeg" alt="Toli" width={44} height={44} priority />
          <div className={styles.brandText}>
            <strong>Toli Asistan</strong>
            <span>Toli Games oyun danışmanı</span>
          </div>
        </div>
        <div className={styles.navLinks}>
          <button type="button" data-scroll-target="hizmet">
            Hizmet
          </button>
          <button type="button" data-scroll-target="fayda">
            Fayda
          </button>
          <button type="button" data-scroll-target="eklenecek">
            Eklenecekler
          </button>
          <button type="button" data-scroll-target="deneyin">
            Deneyin
          </button>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden />
            Demo · toligames.com kataloğu
          </span>
          <h1 className={styles.title}>
            Doğru oyunu aramaktan çıkarıp{" "}
            <span className={styles.titleAccent}>sormaya</span> çevirdik.
          </h1>
          <p className={styles.lead}>
            Yaş, ilgi alanı ve beceriye göre oyun önerir. Fiyat ve açıklamalar
            yalnızca resmi mağaza verisinden gelir.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className={styles.ctaPrimary} id="toli-open-chat">
              Toli ile konuşun
            </button>
            <button
              type="button"
              className={styles.ctaGhost}
              data-scroll-target="hizmet"
            >
              Neleri yanıtlıyor?
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <Image
              src="/toli.jpeg"
              alt="Toli maskotu"
              width={320}
              height={320}
              priority
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </header>

      <section className={styles.stats} aria-label="Özet">
        <article className={styles.statCard}>
          <p className={styles.statValue}>{urunSayisi}</p>
          <p className={styles.statLabel}>Ürün kaydı</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statValue}>%100</p>
          <p className={styles.statLabel}>Katalog kaynaklı</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statValue}>7/24</p>
          <p className={styles.statLabel}>Demo erişim</p>
        </article>
      </section>

      <div className={styles.content}>
        <section className={styles.block} id="hizmet">
          <h2 className={styles.blockTitle}>Hizmet alanı</h2>
          <p className={styles.blockLead}>
            Bu demoda yanıtlanan başlıklar. Katalogda yoksa tahmin etmez,
            mağazaya yönlendirir.
          </p>
          <div className={styles.checkGrid}>
            <div className={styles.checkItem}>
              <span className={styles.checkMark}>✓</span>
              <div>
                <strong>Oyun önerisi</strong>
                <p>Yaş, beceri ve stoka göre öneri, sohbet içi ürün kartı.</p>
              </div>
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkMark}>✓</span>
              <div>
                <strong>Fiyat ve indirim</strong>
                <p>Liste ve indirimli fiyat, sitedeki güncel tutarlar.</p>
              </div>
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkMark}>✓</span>
              <div>
                <strong>Ürün özellikleri</strong>
                <p>Uzun açıklamalardaki maddeler (ör. gereklilik ve önem).</p>
              </div>
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkMark}>✓</span>
              <div>
                <strong>Mağaza bilgisi</strong>
                <p>Kargo eşiği ve sitede yer alan genel bilgiler.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.block} id="fayda">
          <h2 className={styles.blockTitle}>Fayda</h2>
          <p className={styles.blockLead}>
            Ürün bilgisi sitede var; asıl zorluk doğru oyuna ulaşmak.
            Ebeveynler en çok yaşa uygunluk, beceri kazanımı ve fiyat
            soruyor — bu bilgiler kategori sayfalarına ve uzun ürün
            metinlerine dağılmış durumda. Toli bu dağınıklığı gizleyip tek
            sohbet penceresine indiriyor.
          </p>
          <p className={styles.faydaSub}>Kim ne kazanıyor?</p>
          <div className={styles.benefitGrid}>
            {FAYDA_CARDS.map((card) => (
              <article key={card.title} className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden>
                  {card.icon}
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.block} id="eklenecek">
          <h2 className={styles.blockTitle}>Eklenecek kısımlar</h2>
          <p className={styles.blockLead}>
            Bu demo çalışır durumda; aşağıdakiler canlı mağaza entegrasyonu
            için sıradaki adımlar.
          </p>
          <div className={styles.pendingList}>
            <div className={styles.pendingItem}>
              <strong>toligames.com’a gömme</strong> — Widget script’inin
              mağaza temasına göre canlı sitede çalışması.
            </div>
            <div className={styles.pendingItem}>
              <strong>Otomatik katalog yenileme</strong> — Fiyat, indirim ve
              yeni ürünlerin periyodik scrape ile güncellenmesi.
            </div>
            <div className={styles.pendingItem}>
              <strong>Stok bilgisi</strong> — &quot;Tükendi&quot; gibi
              durumların katalog yanıtına yansıması.
            </div>
            <div className={styles.pendingItem}>
              <strong>Sohbet analitiği</strong> — Hangi soruların sık geldiğini
              görüp öneri ve prompt iyileştirmesi.
            </div>
          </div>

          <h3 className={styles.subBlockTitle}>Yol haritası</h3>
          <div className={styles.roadmap}>
            <article className={`${styles.roadStep} ${styles.roadStepCurrent}`}>
              <span className={styles.stepNum}>1</span>
              <div>
                <h3>Katalog + demo asistan</h3>
                <p>
                  Ürün verisi JSON’da; Vercel’de sohbet, widget ve tuzak soru
                  testleri — şu an buradasınız.
                </p>
              </div>
            </article>
            <article className={styles.roadStep}>
              <span className={styles.stepNum}>2</span>
              <div>
                <h3>Canlı site gömme</h3>
                <p>
                  Aynı API ve widget’ın toligate üzerinde marka renkleriyle
                  yayına alınması.
                </p>
              </div>
            </article>
            <article className={styles.roadStep}>
              <span className={styles.stepNum}>3</span>
              <div>
                <h3>Operasyon ve ölçüm</h3>
                <p>
                  Zamanlanmış veri güncellemesi, stok eşlemesi ve soru
                  istatistikleriyle sürekli iyileştirme.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className={`${styles.block} ${styles.demoSection}`} id="deneyin">
          <h2 className={styles.blockTitle}>Deneyin</h2>
          <p className={styles.blockLead}>
            Sağ alttaki Toli veya örnek sorulardan biri. Kesik çerçeve: katalogda
            olmayan ürün (tuzak).
          </p>
          <div className={styles.demoChips}>
            {DEMO_QUESTIONS.map((q) => (
              <button
                key={q.text}
                type="button"
                className={
                  q.trap
                    ? `${styles.demoChip} ${styles.demoChipTrap}`
                    : styles.demoChip
                }
                data-toli-question={q.text}
              >
                {q.text}
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} Toli Asistan demo ·{" "}
          <a href="https://www.toligames.com/">toligames.com</a>
        </p>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: `
function toliScrollTo(id){
  var el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-scroll-target]').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.preventDefault();
    var id=btn.getAttribute('data-scroll-target');
    if(id) toliScrollTo(id);
  });
});
document.getElementById('toli-open-chat')?.addEventListener('click',function(){window.ToliAsistan?.open();});
document.querySelectorAll('[data-toli-question]').forEach(function(btn){
  btn.addEventListener('click',function(){
    var q=btn.getAttribute('data-toli-question');
    if(window.ToliAsistan?.ask) window.ToliAsistan.ask(q);
    else window.ToliAsistan?.open();
  });
});
`,
        }}
      />
    </div>
  );
}
