import ServiceManager from '@/components/admin/ServiceManager';
import styles from '../admin.module.css';

export default function AdminHizmetlerPage() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kategori ve Hizmet Yönetimi</h1>
      </div>
      
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Sitenizdeki tüm hizmetleri ve rezervasyon ekranındaki sıralamaları buradan "Sürükle & Bırak" ile yönetebilirsiniz. 
        Ana sistem tek bir veritabanından beslendiği için yaptığınız değişiklikler tüm siteye eşzamanlı yansır.
      </p>

      <ServiceManager />
    </div>
  );
}
