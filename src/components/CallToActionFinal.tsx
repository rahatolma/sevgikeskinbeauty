"use client";

import { useState } from "react";
import styles from "./CallToActionFinal.module.css";
import CiltAnaliziModal from "./CiltAnaliziModal";

export default function CallToActionFinal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className={styles.ctaFinalSection}>
        <div className="container">
          <div className={styles.ctaWrapper}>
            <h2 className={styles.title}>Hâlâ Kararsız Mısınız?</h2>
            <p className={styles.subtitle}>
              Cildinizin gerçek ihtiyacını keşfetmek ve size en uygun bakım protokolünü 
              uzmanlarımızla belirlemek için hemen ilk adımı atın.
            </p>
            <div className={styles.actionGroup}>
              <button onClick={() => setIsModalOpen(true)} className={styles.btnPrimary}>
                ÜCRETSİZ CİLT ANALİZİ AL
              </button>
            </div>
            <div className={styles.trustMicroCopy}>
               Karar vermek için tamamen ücretsizdir.
            </div>
          </div>
        </div>
      </section>
      <CiltAnaliziModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
