"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./Testimonials.module.css";
import { supabase } from "@/lib/supabase";

type DBReview = {
  id: string;
  name: string;
  text: string;
  category: string;
  rating: number;
  is_highlight: boolean;
  service_id: string | null;
  services: {
    name: string;
    is_featured: boolean;
    category_id: string;
    service_categories: {
      name: string;
    } | null;
  } | null;
};

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

  const [reviewsToDisplay, setReviewsToDisplay] = useState<DBReview[]>([]);

  useEffect(() => {
    async function fetchReviews() {
       const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          services (
            name,
            is_featured,
            category_id,
            service_categories (
              name
            )
          )
        `)
        .eq('is_active', true)
        .eq('is_highlight', true)
        .order('sort_order', { ascending: true });
       if (data && data.length > 0) {
          setReviewsToDisplay(data as DBReview[]);
       }
    }
    fetchReviews();
  }, []);

  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        
        <div className={styles.header}>
           <h2 className={styles.title}>Gerçek Müşteri Deneyimleri</h2>
           <p className={styles.subtitle}>Bizim değil, müşterilerimizin söyledikleri</p>
        </div>

        <div className={styles.grid}>
          {reviewsToDisplay.map((review) => {
            const isFeatured = review.services?.is_featured ?? false;
            const categoryName = review.services?.name || review.services?.service_categories?.name || review.category || "Genel";
            
            return (
              <div key={review.id} className={`${styles.card} ${isFeatured ? styles.highlightCard : ""}`}>
                {isFeatured && (
                  <div className={styles.highlightBadge}>
                    ⭐ ÖNE ÇIKAN DENEYİM
                  </div>
                )}
                <div className={styles.cardHeader}>
                  <div className={styles.stars}>
                    {Array.from({length: review.rating || 5}).map((_, i) => (
                      <SvgStar key={i} />
                    ))}
                  </div>
                  <span className={styles.categoryBadge}>{categoryName}</span>
                </div>
                <p className={styles.text}>{review.text}</p>
                <div className={styles.authorArea}>
                  <span className={styles.name}>{review.name}</span>
                </div>
              </div>
            );
          })}
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
