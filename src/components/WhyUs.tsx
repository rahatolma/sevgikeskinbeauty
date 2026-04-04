import Image from 'next/image';
import Link from 'next/link';
import styles from './WhyUs.module.css';

export default function WhyUs() {
  const reasons = [
    {
      title: "Kişiye Özel Yaklaşım",
      description: "Her bakım, cilt analizi ile başlar ve tamamen size özel planlanır.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      )
    },
    {
      title: "Uzman ve Deneyimli Kadro",
      description: "Alanında uzman ekibimiz, en doğru uygulamayı güvenle sunar.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      )
    },
    {
      title: "Sonuç Odaklı Bakımlar",
      description: "Amacımız sadece bakım yapmak değil, gözle görülür sonuçlar elde etmektir.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
      )
    },
    {
      title: "Hijyen ve Kalite Standartları",
      description: "Tüm uygulamalarımızda en yüksek hijyen ve kalite standartlarını uygularız.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 7V2"/><path d="M15 7V2"/><path d="M12 2v5"/><path d="M5 10c0-1.66 1.34-3 3-3h8c1.66 0 3 1.34 3 3 0 1.66-1.34 3-3 3h-8c-1.66 0-3-1.34-3-3z"/></svg>
      )
    }
  ];

  return (
    <section className={styles.whyUsSection}>
      <div className="container">
        <div className={styles.splitLayout}>
          
          {/* Left Content Column */}
          <div className={styles.contentCol}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Neden Bizi Tercih Etmelisiniz?</h2>
              <p className={styles.sectionSubtitle}>Her cilt farklıdır. Biz de her bakımda size özel yaklaşırız.</p>
            </div>

            <div className={styles.reasonsList}>
              {reasons.map((reason, index) => (
                <div key={index} className={styles.reasonCard}>
                  <div className={styles.iconWrapper}>
                    {reason.icon}
                  </div>
                  <div className={styles.reasonContent}>
                    <h4 className={styles.reasonTitle}>{reason.title}</h4>
                    <p className={styles.reasonDesc}>{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.ctaBox}>
              <p className={styles.ctaText}>Sizin için en doğru bakım planını birlikte oluşturalım.</p>
              <p className={styles.ctaSubtext}>Ücretsiz cilt analizi ile başlayın.</p>
              <Link href="/iletisim" className={styles.ctaBtn}>
                RANDEVU AL
              </Link>
            </div>
          </div>

          {/* Right Image Column */}
          <div className={styles.imageCol}>
            <div className={styles.imageWrapper}>
              <div className={styles.aestheticBorder}></div>
              <Image 
                src="/images/neden-biz.png" 
                alt="Uzman Bakım Anı" 
                fill 
                className={styles.mainImage}
                sizes="(max-width: 992px) 100vw, 50vw"
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
