"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { reviews, Review } from "@/data/reviews";

const SvgStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F4B400" stroke="#F4B400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const categories = ["Tümü", "Cilt Bakımı", "Leke Tedavisi", "Vücut Şekillendirme", "Lazer Epilasyon", "Genel"];

export default function MusteriDeneyimleriPage() {
  const [activeCategory, setActiveCategory] = useState("Tümü");

  // Filtreleme mantığı
  const filteredReviews = activeCategory === "Tümü" 
    ? reviews 
    : reviews.filter(r => r.category === activeCategory);

  return (
    <main className={styles.pageContainer}>
      
      {/* Hero Alanı */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.title}>Müşteri Deneyimleri</h1>
          <p className={styles.subtitle}>Söz bizde değil, değişimi yaşayanlarda.</p>
        </div>
      </section>

      {/* Ana Filtre ve Grid Alanı */}
      <section className={styles.contentSection}>
        <div className="container">
          
          <div className={styles.filterWrapper}>
            {categories.map((cat) => (
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
            {filteredReviews.map((review: Review) => (
              <div key={review.id} className={styles.card}>
                <div className={styles.cardHeader}>
                   <div className={styles.stars}>
                     <SvgStar /><SvgStar /><SvgStar /><SvgStar /><SvgStar />
                   </div>
                   <span className={styles.categoryBadge}>{review.category}</span>
                </div>
                <p className={styles.text}>{review.text}</p>
                <div className={styles.authorArea}>
                  <div className={styles.authorInitial}>
                    {review.name.charAt(0)}
                  </div>
                  <span className={styles.name}>{review.name}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </main>
  );
}
