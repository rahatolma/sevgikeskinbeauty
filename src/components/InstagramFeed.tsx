import Image from "next/image";
import styles from "./InstagramFeed.module.css";

const feedImages = [
  { id: 1, src: "/images/slider/slide1.jpg", alt: "Instagram 1" },
  { id: 2, src: "/images/slider/slide2.jpg", alt: "Instagram 2" },
  { id: 3, src: "/images/slider/slide3.jpg", alt: "Instagram 3" },
  { id: 4, src: "/images/massage.png", alt: "Instagram 4" },
  { id: 5, src: "/images/about-vertical.jpg", alt: "Instagram 5" },
];

const SvgInsta = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function InstagramFeed() {
  return (
    <section className={styles.feedWrapper}>
      {feedImages.map((img) => (
        <div key={img.id} className={styles.imageBox}>
          <Image 
             src={img.src} 
             alt={img.alt} 
             fill 
             className={styles.image} 
          />
          <div className={styles.overlay}>
             <div className={styles.iconWrapper}>
               <SvgInsta />
             </div>
          </div>
        </div>
      ))}
    </section>
  );
}
