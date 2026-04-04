import Link from 'next/link';
import { Calendar, ListTree, Users } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminIndex() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Hoş Geldiniz, Yönetici</h1>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: '600px', margin: 0 }}>
        Platform verilerini, rezervasyonları ve personeli yönetmek için sol menüdeki araçları kullanabilirsiniz. Hızlı erişim için aşağıdaki alanları seçebilirsiniz.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        <Link href="/admin/randevular" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', width: 'fit-content', color: '#92400e' }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>Randevu Yönetimi</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Günlük operasyonları, bekleyen kayıtları ve geçmişi takip et.</p>
          </div>
        </Link>

        <Link href="/admin/hizmetler" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
            <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px', width: 'fit-content', color: '#1e40af' }}>
              <ListTree size={24} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>Kategori & Hizmetler</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Sistemdeki tedavi ağaçlarını oluştur ve vitrini düzenle.</p>
          </div>
        </Link>

        <Link href="/admin/uzmanlar" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
            <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '8px', width: 'fit-content', color: '#065f46' }}>
              <Users size={24} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>Uzman Yönetimi</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Personelleri yönet, onlara hizmet yetkileri tanımla.</p>
          </div>
        </Link>
        
      </div>
    </div>
  );
}
