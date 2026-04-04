import Image from "next/image";
import Link from "next/link";
import styles from "./HeroSlider.module.css";

interface HeroSliderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  imageSrc?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaNote?: string;
  reverse?: boolean; // Deprecated: Use alignment
  alignment?: "left" | "right" | "center" | "fullbleed-left" | "fullbleed-left-heavy";
}

export default function HeroSlider({
  title = <>Daha genç bir cilt değil,<br />daha doğru bir bakım deneyimi.</>,
  subtitle = "Cildinize gerçekten ihtiyacı olan uygulamaları birlikte belirliyoruz.",
  imageSrc = "/images/slider/hero_model_final.png",
  ctaText = "RANDEVU AL",
  ctaLink = "/rezervasyon",
  ctaNote = "*Ücretsiz cilt analizi",
  reverse = false,
  alignment = "left"
}: HeroSliderProps = {}) {
  const isRight = alignment === "right" || reverse;
  const isCenter = alignment === "center";

  let imageLayerClass = styles.imageLayerLeft;
  let anchorClass = styles.imageAnchorLeft;
  let contentClass = "";

  if (isRight) {
    imageLayerClass = styles.imageLayerRight;
    anchorClass = styles.imageAnchorRight;
    contentClass = styles.heroContentReverse;
  } else if (isCenter) {
    imageLayerClass = styles.imageLayerCenter;
    anchorClass = styles.imageAnchorCenter;
    contentClass = styles.heroContentCenter;
  }
  
  const isFullBleedLeft = alignment === "fullbleed-left" || alignment === "fullbleed-left-heavy";
  if (isFullBleedLeft) {
    imageLayerClass = alignment === "fullbleed-left-heavy" ? styles.imageLayerFullBleedHeavy : styles.imageLayerFullBleed;
    anchorClass = styles.imageAnchorFullBleed;
    contentClass = styles.heroContentFullBleedLeft;
  }

  return (
    <section className={`${styles.heroRoot} ${isCenter ? styles.heroRootCenter : ''}`}>
      
      {/* CENTERED CONTENT GRID FOR TEXT AND IMAGES (1600px BOUNDED) */}
      <div className={`${styles.heroContent} ${contentClass}`}>
        
        {/* --- GÖRSEL BLOĞU (FLEX ITEM) --- */}
        {(!isCenter && !isFullBleedLeft) && (
          <div className={`${styles.leftBlock} ${imageLayerClass}`}>
            <div className={styles.imageLayer}>
              <Image 
                src={imageSrc} 
                alt="Sevgi Keskin Beauty" 
                fill 
                className={`${styles.strictBottomImage} ${anchorClass}`}
                priority
              />
            </div>
          </div>
        )}

        {/* --- SAĞ BLOK (METİN) --- */}
        <div className={styles.textConstraintBlock}>
          <div className={styles.textWrapper}>
            <div className={styles.textLayer}>
              <h1 className={styles.title}>
                {title}
              </h1>
              <p className={styles.subtitle}>
                {subtitle}
              </p>
              
              <div className={`${styles.ctaGroup} ${isCenter ? styles.ctaGroupCenter : ''}`}>
                <Link href={ctaLink} className={styles.btnPrimary}>
                  {ctaText}
                </Link>
                {ctaNote && <span className={styles.ctaNote}>{ctaNote}</span>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MERKEZ GÖRSELİ VEYA FULLBLEED GÖRSEL (MUTLAK ARKA PLAN, FULL BLEED) */}
      {(isCenter || isFullBleedLeft) && (
        <div className={styles.heroContentCenterImageLayer}>
           <div className={imageLayerClass}>
             <Image 
                src={imageSrc} 
                alt="Sevgi Keskin Beauty" 
                fill 
                className={`${styles.strictBottomImage} ${anchorClass}`}
                priority
              />
           </div>
        </div>
      )}
    </section>
  );
}
