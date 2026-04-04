import Link from "next/link";
import styles from "./BakimSureci.module.css";

const IconSearch = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconFile = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const IconCheck = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default function BakimSureci() {
  return (
    <section className={styles.processSection}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Güzelliğinizi şansa bırakmayın</h2>
          <p className={styles.subtitle}>Cildinizi analiz ediyor, ihtiyacınıza özel bakım planınızı birlikte oluşturuyoruz.</p>
        </div>

        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.iconBox}>
              <IconSearch />
            </div>
            <h3 className={styles.stepTitle}>1. Cilt Analizi</h3>
            <p className={styles.stepDesc}>Cildiniz detaylı şekilde analiz edilir.</p>
          </div>

          <div className={styles.connector}></div>

          <div className={styles.step}>
             <div className={styles.iconBox}>
               <IconFile />
             </div>
             <h3 className={styles.stepTitle}>2. Kişiye Özel Plan</h3>
             <p className={styles.stepDesc}>Size özel bakım protokolü oluşturulur.</p>
          </div>

          <div className={styles.connector}></div>

          <div className={styles.step}>
             <div className={styles.iconBox}>
               <IconCheck />
             </div>
             <h3 className={styles.stepTitle}>3. Uygulama & Takip</h3>
             <p className={styles.stepDesc}>Süreç boyunca gelişim takip edilir.</p>
          </div>
        </div>

        <div className={styles.ctaBox}>
          <p className={styles.ctaLabel}>Ücretsiz cilt analizi ile başlayın</p>
          <Link href="/rezervasyon" className={styles.ctaBtn}>
            RANDEVU AL
          </Link>
        </div>
      </div>
    </section>
  );
}
