import Image from "next/image";
import Link from "next/link";
import styles from "./hakkimizda.module.css";
import HeroSlider from "@/components/HeroSlider";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Hakkımızda | Sevgi Keskin Beauty",
  description: "Güzellikte uzmanlık, güven ve kişisel yaklaşım. Sevgi Keskin Beauty ile tanışın.",
};

const SvgCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default async function HakkimizdaPage() {

  const { data: specialists } = await supabase
    .from('specialists')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <main className={styles.pageWrapper}>
      {/* 1. HERO SECTION (ANA SAYFA YAPISI) */}
      <HeroSlider 
        title={<>Standart bakım değil, <br/>size özel çözüm sunuyoruz.</>}
        subtitle={<>Her cilt farklıdır. Bu yüzden her uygulama öncesi analiz yapar, cildinize gerçekten ihtiyaç duyduğu bakımı planlarız.</>}
        imageSrc="/images/slider/hakkimizda_02.png"
        ctaLink="/rezervasyon"
        ctaText="RANDEVU AL"
        ctaNote=""
        alignment="fullbleed-left-heavy"
        showSecondaryBtn={false}
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
                 src="/images/slider/sevgikeskin.png" 
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
               
               {specialists?.map((spec) => (
                   <div key={spec.id} className={styles.teamCard}>
                      <div className={styles.teamImageWrapper}>
                         {spec.avatar_url ? (
                             <Image src={spec.avatar_url} alt={spec.full_name} fill className={styles.teamImage} style={{objectFit: 'cover'}} />
                         ) : (
                             <div style={{width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <span style={{color: '#9ca3af', fontSize: '3rem'}}>👤</span>
                             </div>
                         )}
                      </div>
                      <div className={styles.teamCardInner}>
                         <h4 className={styles.teamName}>{spec.full_name} <br/><span>{spec.role_title || 'Uzman'}</span></h4>
                         <p className={styles.teamBio}>
                            {spec.bio || 'Hakkında bilgi bulunmuyor.'}
                         </p>
                      </div>
                   </div>
               ))}

            </div>
         </div>
      </section>

    </main>
  );
}
