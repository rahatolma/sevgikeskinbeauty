"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabase";

type DBReview = {
  id: string;
  name: string;
  text: string;
  category: string;
  rating: number;
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F4B400" stroke="#F4B400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);


export default function MusteriDeneyimleriPage() {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [reviews, setReviews] = useState<DBReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getReviews() {
       const { data } = await supabase.from('reviews').select(`
          *,
          services (
            name,
            is_featured,
            category_id,
            service_categories (
              name
            )
          )
       `).eq('is_active', true).order('created_at', {ascending: false});
       setReviews(data as DBReview[] || []);
       setLoading(false);
    }
    getReviews();
  }, []);

  // Filtreleme için kategorileri dinamik oluştur
  const dynamicCategories = ["Tümü", ...Array.from(new Set(reviews.map(r => r.services?.service_categories?.name || r.category || "Genel"))).sort((a,b) => a.localeCompare(b, 'tr'))];

  // Filtreleme mantığı
  const filteredReviews = activeCategory === "Tümü" 
    ? reviews 
    : reviews.filter(r => (r.services?.service_categories?.name || r.category || "Genel") === activeCategory);

  return (
    <main className={styles.pageContainer}>
      
      {/* Ana Filtre ve Grid Alanı */}
      <section className={styles.contentSection}>
        <div className="container">
          
          <div className={styles.headerArea}>
            <h1 className={styles.pageTitle}>Müşteri Deneyimleri</h1>
            <p className={styles.pageSubtitle}>Söz bizde değil, değişimi yaşayanlarda.</p>
          </div>

          <div className={styles.filterWrapper}>
            {dynamicCategories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.masonryGrid}>
            {loading && <p style={{color:'#6b7280'}}>Yorumlar yükleniyor...</p>}
            {!loading && filteredReviews.map((review) => {
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

        </div>
      </section>

    </main>
  );
}
