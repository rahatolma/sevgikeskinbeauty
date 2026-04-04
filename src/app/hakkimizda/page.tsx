import Image from "next/image";
import Link from "next/link";
import styles from "./hakkimizda.module.css";
import HeroSlider from "@/components/HeroSlider";

export const metadata = {
  title: "Hakkımızda | Sevgi Keskin Beauty",
  description: "Güzellikte uzmanlık, güven ve kişisel yaklaşım. Sevgi Keskin Beauty ile tanışın.",
};

const SvgCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function HakkimizdaPage() {
  return (
    <main className={styles.pageWrapper}>
      {/* 1. HERO SECTION (ANA SAYFA YAPISI) */}
      <HeroSlider 
        title={<>Cildiniz için doğru olanı <br/>birlikte belirliyoruz</>}
        subtitle={<>Her bakım aynı değildir.<br/>Cildinizin ihtiyacına özel analiz ve uygulama ile gerçek sonuçlar sunuyoruz.</>}
        imageSrc="/images/slider/about.png"
        ctaLink="/iletisim"
        ctaText="RANDEVU AL"
        ctaNote=""
        reverse={true}
      />

      {/* 2. MARKA HİKAYESİ (DERGİ YAPISI) - ZIG-ZAG 1 (Sol İmaj) */}
      <section className={styles.storySection}>
         <div className={`container ${styles.storyGrid}`}>
            <div className={styles.storyImageWrapper}>
               <Image 
                 src="/images/ai-teams/story_texture.png" 
                 alt="Klinik Ortamı Detay" 
                 fill
                 className={styles.storyImage}
               />
            </div>
            <div className={styles.storyContent}>
               <h2 className={styles.storyTitle}>Sevgi Keskin Beauty</h2>
               <p className={styles.storyLead}>
                 Güzellik, doğru dokunuşlarla başlar.<br/>
                 Sevgi Keskin Beauty olarak her müşterimize kişisel yaklaşarak, cilt yapısına ve ihtiyaçlarına özel bakım protokolleri oluşturuyoruz.
               </p>
               <p className={styles.storyParagraph}>
                 Uzmanlığımızı, en güncel teknolojiler ve profesyonel uygulamalarla birleştirerek, doğal ve sağlıklı sonuçlar elde etmeyi hedefliyoruz. Amacımız yalnızca bakım yapmak değil, kendinizi daha iyi hissetmenizi sağlayan bir deneyim sunmak.
               </p>
            </div>
         </div>
      </section>

      {/* 3. KURUCU / UZMAN BLOĞU - ZIG-ZAG 2 (Sol Metin) */}
      <section className={styles.founderSection}>
         <div className={`container ${styles.founderGrid}`}>
            <div className={styles.founderContent}>
               <h3 className={styles.founderName}>Sevgi Keskin <span>– Kurucu & Uzman Estetisyen</span></h3>
               <div className={styles.founderQuote}>
                  <p>
                    Güzellik ve bakım alanındaki deneyimim boyunca her müşterinin farklı olduğunu öğrendim.
                    Bu yüzden standart uygulamalar yerine, kişiye özel çözümler sunmayı benimsiyorum.
                  </p>
                  <p>
                    Her dokunuşta doğallığı koruyan, abartıdan uzak ve gerçekten etkili sonuçlar elde etmeyi hedefliyorum.
                  </p>
               </div>
               
               <ul className={styles.founderBullets}>
                   <li><SvgCheck /> 15+ Yıl Klinik ve Kozmetik Deneyim</li>
                   <li><SvgCheck /> İleri Seviye Anti-Aging Uzmanlığı</li>
                   <li><SvgCheck /> Bütünsel Cilt Terapisi Yaklaşımı</li>
               </ul>

               <p className={styles.founderPhilosophy}>
                 "Her danışanımız için önce analiz, sonra uygulama prensibiyle ilerliyoruz."
               </p>

            </div>
            <div className={styles.founderImageWrapper}>
               <Image 
                 src="/images/ai-teams/founder_portrait.png" 
                 alt="Sevgi Keskin" 
                 fill
                 className={styles.founderImage}
               />
            </div>
         </div>
      </section>

      {/* 4. GÜVEN BLOĞU (SAYILAR) */}
      <section className={styles.statsSection}>
         <div className="container">
            <div className={styles.statsGrid}>
               <div className={styles.statItem}>
                  <span className={styles.statNumber}>15+</span>
                  <span className={styles.statLabel}>Yıl Deneyim</span>
               </div>
               <div className={styles.statItem}>
                   <span className={styles.statNumber}>1000+</span>
                   <span className={styles.statLabel}>Başarılı Uygulama</span>
               </div>
               <div className={styles.statItem}>
                   <span className={styles.statNumber}>%95</span>
                   <span className={styles.statLabel}>Müşteri Memnuniyeti</span>
               </div>
            </div>
         </div>
      </section>

      {/* 5. EKİP KARTLARI */}
      <section className={styles.teamSection}>
         <div className="container">
            <div className={styles.teamGrid}>
               
               <div className={styles.teamCard}>
                  <div className={styles.teamImageWrapper}>
                     <Image src="/images/ai-teams/founder_portrait.png" alt="Sevgi Keskin" fill className={styles.teamImage} />
                  </div>
                  <div className={styles.teamCardInner}>
                     <h4 className={styles.teamName}>Sevgi Keskin <br/><span>Uzman Estetisyen</span></h4>
                     <p className={styles.teamBio}>
                        Cilt yenileme, anti-aging ve leke tedavileri konusunda uzmanlaşmıştır.
                     </p>
                  </div>
               </div>
               
               <div className={styles.teamCard}>
                  <div className={styles.teamImageWrapper}>
                     <Image src="/images/ai-teams/team_kardelen.png" alt="Kardelen" fill className={styles.teamImage} />
                  </div>
                  <div className={styles.teamCardInner}>
                     <h4 className={styles.teamName}>Kardelen <br/><span>Güzellik Uzmanı</span></h4>
                     <p className={styles.teamBio}>
                        Cilt bakımı ve kişiye özel bakım protokollerinde deneyimlidir.
                     </p>
                  </div>
               </div>

               <div className={styles.teamCard}>
                  <div className={styles.teamImageWrapper}>
                     <Image src="/images/ai-teams/team_berna.png" alt="Berna" fill className={styles.teamImage} />
                  </div>
                  <div className={styles.teamCardInner}>
                     <h4 className={styles.teamName}>Berna <br/><span>Terapist</span></h4>
                     <p className={styles.teamBio}>
                        Masaj ve rahatlatıcı terapiler alanında profesyonel uygulamalar sunar.
                     </p>
                  </div>
               </div>

            </div>
         </div>
      </section>



      {/* 7. FINAL CTA */}
      <section className={styles.ctaSection}>
         <div className="container">
            <div className={styles.ctaContent}>
               <h2 className={styles.ctaTitle}>Sizin için en doğru bakım planını birlikte oluşturalım</h2>
               <p className={styles.ctaSubtitle}>İlk adımı atın, gerisini biz planlayalım.</p>
               <Link href="/iletisim" className={styles.ctaBtn}>
                  Randevu Al
               </Link>
            </div>
         </div>
      </section>

    </main>
  );
}
