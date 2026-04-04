import Link from 'next/link';
import { Settings, ListTree, Calendar, Users, LogOut } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Sevgi Keskin</h2>
          <p>Admin OS</p>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.navItem}>
            <Settings size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/hizmetler" className={`${styles.navItem} ${styles.active}`}>
            <ListTree size={20} />
            <span>Kategori ve Hizmetler</span>
          </Link>
          <Link href="/admin/randevular" className={styles.navItem}>
            <Calendar size={20} />
            <span>Randevular</span>
          </Link>
          <Link href="/admin/uzmanlar" className={styles.navItem}>
            <Users size={20} />
            <span>Uzman Yönetimi</span>
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
  );
}
