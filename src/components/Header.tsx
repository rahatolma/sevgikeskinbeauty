"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <Link href="/" className={styles.logoLink} onClick={closeMobileMenu}>
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
        
        {/* Masaüstü Menü */}
        <nav className={styles.nav}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`}>Anasayfa</Link>
          <Link href="/hizmetlerimiz" className={`${styles.navLink} ${pathname.startsWith('/hizmetlerimiz') ? styles.navLinkActive : ''}`}>Hizmetlerimiz</Link>
          <Link href="/hakkimizda" className={`${styles.navLink} ${pathname === '/hakkimizda' ? styles.navLinkActive : ''}`}>Hakkımızda</Link>
          <Link href="/iletisim" className={`${styles.navLink} ${pathname === '/iletisim' ? styles.navLinkActive : ''}`}>İletişim</Link>
          <Link href="/rezervasyon" className={styles.navBookingBtn}>Randevu Al</Link>
        </nav>

        {/* Mobil Hamburger Butonu */}
        <button className={styles.hamburgerBtn} onClick={toggleMobileMenu} aria-label="Menüyü Aç">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobil Açılır Menü */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          <Link href="/" className={styles.mobileNavLink} onClick={closeMobileMenu}>Anasayfa</Link>
          <Link href="/hizmetlerimiz" className={styles.mobileNavLink} onClick={closeMobileMenu}>Hizmetlerimiz</Link>
          <Link href="/hakkimizda" className={styles.mobileNavLink} onClick={closeMobileMenu}>Hakkımızda</Link>
          <Link href="/iletisim" className={styles.mobileNavLink} onClick={closeMobileMenu}>İletişim</Link>
          <Link href="/rezervasyon" className={styles.mobileNavBookingBtn} onClick={closeMobileMenu}>Randevu Al</Link>
        </nav>
      </div>
    </header>
  );
}
