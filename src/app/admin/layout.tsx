"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ListTree, Calendar, Users, LogOut, Mailbox, MessageCircle } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.adminContainer}>
      <style dangerouslySetInnerHTML={{__html: `
        .admin-global-font-enforcer, .admin-global-font-enforcer * {
           font-family: var(--font-jost), sans-serif !important;
        }
      `}} />
      <div className="admin-global-font-enforcer" style={{ display: 'flex', width: '100%' }}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Sevgi Keskin</h2>
          <p>Admin OS</p>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}>
            <Settings size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/hizmetler" className={`${styles.navItem} ${pathname.startsWith('/admin/hizmetler') ? styles.active : ''}`}>
            <ListTree size={20} />
            <span>Kategori ve Hizmetler</span>
          </Link>
          <Link href="/admin/randevular" className={`${styles.navItem} ${pathname.startsWith('/admin/randevular') ? styles.active : ''}`}>
            <Calendar size={20} />
            <span>Randevular</span>
          </Link>
          <Link href="/admin/uzmanlar" className={`${styles.navItem} ${pathname.startsWith('/admin/uzmanlar') ? styles.active : ''}`}>
            <Users size={20} />
            <span>Uzman Yönetimi</span>
          </Link>
          <Link href="/admin/iletisim" className={`${styles.navItem} ${pathname.startsWith('/admin/iletisim') ? styles.active : ''}`}>
            <Mailbox size={20} />
            <span>İletişim & Aboneler</span>
          </Link>
          <Link href="/admin/yorumlar" className={`${styles.navItem} ${pathname.startsWith('/admin/yorumlar') ? styles.active : ''}`}>
            <MessageCircle size={20} />
            <span>Müşteri Yorumları</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
      </div>
    </div>
  );
}
