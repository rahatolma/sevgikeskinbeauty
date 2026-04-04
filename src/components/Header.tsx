import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <Link href="/" className={styles.logoLink}>
          {/* Gerçek logo kullanımı */}
          <div className={styles.logoWrapper}>
            <Image 
              src="/images/logo.png" 
              alt="Sevgi Keskin Beauty Logo"
              fill
              className={styles.logoImage}
              priority
            />
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Anasayfa</Link>
          <Link href="/hizmetlerimiz" className={styles.navLink}>Hizmetlerimiz</Link>
          <Link href="/hakkimizda" className={styles.navLink}>Hakkımızda</Link>
          <Link href="/iletisim" className={styles.navLink}>İletişim</Link>
          <Link href="/rezervasyon" className={styles.navBookingBtn}>Randevu Al</Link>
        </nav>
      </div>
    </header>
  );
}
