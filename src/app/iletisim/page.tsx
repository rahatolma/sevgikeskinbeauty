import Link from "next/link";
import styles from "./iletisim.module.css";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "İletişim | Sevgi Keskin Beauty",
  description: "Bize ulaşın. Randevu ve güzellik danışmanlığı için iletişim sayfamız.",
};

// İnce Çizgili İletişim İkonları
const SvgMapPin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const SvgPhone = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const SvgMail = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

export default function IletisimPage() {
  return (
    <main className={styles.pageWrapper}>
      {/* Map Placeholder Area */}
      <div className={styles.mapArea}>
         <iframe
           src="https://maps.google.com/maps?q=Acarverde%20Rezidans,%20Beykoz,%20Istanbul&t=&z=14&ie=UTF8&iwloc=&output=embed"
           className={styles.realMap}
           allowFullScreen
           loading="lazy"
           referrerPolicy="no-referrer-when-downgrade"
         ></iframe>
      </div>

      {/* İletişim İçerik ve Form (Split Screen) */}
      <section className={styles.contactSection}>
        <div className="container">
           <div className={styles.contactGrid}>
              
              {/* Sol Taraf - Bilgiler */}
              <div className={styles.infoCol}>
                 <h4 className={styles.subtext}>BİZE ULAŞIN</h4>
                 <h1 className={styles.mainTitle}>Güzellik Ritüelinizi<br/>Birlikte Planlayalım</h1>
                 
                 <div className={styles.infoList}>
                    <div className={styles.infoItem}>
                       <div className={styles.icon}><SvgMapPin /></div>
                       <div className={styles.infoText}>
                          <h5>Adresimiz</h5>
                          <p>Acarverde Rezidans, Acarkent Sitesi<br/>9. Cadde C Blok No: 11<br/>Beykoz, İstanbul</p>
                       </div>
                    </div>
                    <div className={styles.infoItem}>
                       <div className={styles.icon}><SvgPhone /></div>
                       <div className={styles.infoText}>
                          <h5>Telefon</h5>
                          <p>(+90) 530 883 47 74</p>
                       </div>
                    </div>
                    <div className={styles.infoItem}>
                       <div className={styles.icon}><SvgMail /></div>
                       <div className={styles.infoText}>
                          <h5>E-Posta</h5>
                          <p>info@sevgikeskinbeauty.com</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Sağ Taraf - Minimalist Form */}
              <div className={styles.formCol}>
                 <ContactForm 
                    formClass={styles.contactForm} 
                    inputGroupClass={styles.inputGroup} 
                    submitBtnClass={styles.submitBtn} 
                 />
              </div>

           </div>
        </div>
      </section>

    </main>
  );
}
