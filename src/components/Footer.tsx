import Link from "next/link";
import styles from "./Footer.module.css";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <div className={styles.footerLogoImgWrapper}>
              <Image src="/images/logo.png" alt="Sevgi Keskin Beauty Logo" fill style={{objectFit: 'contain'}} />
            </div>
            <p className={styles.footerText}>
              Güzellik, doğru bakım ile başlar.<br />
              Sevgi Keskin Beauty’de her uygulama, size özel planlanır.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Keşfet</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/">Anasayfa</Link></li>
              <li><Link href="/hizmetlerimiz">Hizmetlerimiz</Link></li>
              <li><Link href="/hakkimizda">Hakkımızda</Link></li>
              <li><Link href="/iletisim">İletişim</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>İletişim & Saatler</h4>
            <p className={styles.footerText}>
              Acarverde Rezidans, Acarkent Sitesi<br />
              9. Cadde C Blok No: 11, Beykoz
            </p>
            <p className={styles.footerText} style={{ marginTop: '1rem' }}>
              (+90) 530 883 47 74<br />
              info@sevgikeskinbeauty.com
            </p>
            <p className={styles.footerText} style={{ marginTop: '1.5rem', color: 'var(--color-gold)' }}>
              Pzt - Cts: 09:00 - 19:30<br />
              Pazar: Kapalı
            </p>
            <p className={styles.footerText} style={{ marginTop: '1.5rem' }}>
              Instagram: <a href="https://instagram.com/sevgikeskinbeauty" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>@sevgikeskinbeauty</a>
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Özel fırsatları kaçırmayın</h4>
            <p className={styles.footerText} style={{ marginBottom: '1.5rem' }}>
              Yeni kampanyalar ve size özel bakım önerileri için bültene katılın
            </p>
            <NewsletterForm 
              containerClass={styles.newsletterForm} 
              inputClass={styles.newsletterInput} 
              btnClass={styles.newsletterBtn} 
            />
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.bottomFlex}>
            <p>&copy; {new Date().getFullYear()} Sevgi Keskin Beauty. Tüm hakları saklıdır.</p>
            <p className={styles.legalLinks}>
              KVKK &nbsp;|&nbsp; Gizlilik Politikası &nbsp;|&nbsp; Çerezler
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
