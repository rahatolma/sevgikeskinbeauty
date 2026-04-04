import Link from "next/link";
import styles from "./Testimonials.module.css";
import { reviews } from "@/data/reviews"; /* Merkezi datadan çekiyoruz */

const SvgStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F4B400" stroke="#F4B400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const SvgStarBig = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4B400" stroke="#F4B400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export default function Testimonials() {
  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        
        <div className={styles.header}>
           <h2 className={styles.title}>Gerçek Müşteri Deneyimleri</h2>
           <p className={styles.subtitle}>Bizim değil, müşterilerimizin söyledikleri</p>
        </div>

        <div className={styles.grid}>
          {reviews.slice(0, 6).map((review) => (
            <div key={review.id} className={`${styles.card} ${review.isHighlight ? styles.highlightCard : ""}`}>
              {review.isHighlight && <div className={styles.highlightBadge}>Öne Çıkan Deneyim</div>}
              <div className={styles.stars}>
                <SvgStar /><SvgStar /><SvgStar /><SvgStar /><SvgStar />
              </div>
              <p className={styles.text}>{review.text}</p>
              <span className={styles.name}>{review.name}</span>
            </div>
          ))}
        </div>

        {/* TÜM YORUMLARA GİDİŞ LİNKİ */}
        <div className={styles.allReviewsWrapper}>
           <Link href="/musteri-deneyimleri" className={styles.allReviewsBtn}>
             Tüm Müşteri Yorumlarını Gör &rarr;
           </Link>
           <p className={styles.allReviewsSubtext}>Gerçek deneyimlerin tamamını keşfedin</p>
        </div>

        <div className={styles.socialProof}>
           <div className={styles.socialStars}>
              <SvgStarBig /><SvgStarBig /><SvgStarBig /><SvgStarBig /><SvgStarBig />
           </div>
           <p className={styles.socialText}><span>4.9</span> / 5 Ortalama Değerlendirme</p>
           <p className={styles.socialSubtext}>• 120+ Mutlu Müşteri</p>
        </div>
      </div>
    </section>
  );
}
