"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ListTree, Users, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

type DashboardStats = {
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  activeSpecialists: number;
  totalServices: number;
  newMessagesCount: number;
};

type RecentBooking = {
  id: string;
  customer_name: string;
  requested_date: string;
  requested_time: string;
  status: string;
  service_name?: string;
  customer_phone?: string;
  note?: string;
};

export default function AdminIndex() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    activeSpecialists: 0,
    totalServices: 0,
    newMessagesCount: 0
  });
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: bookings },
        { data: latestBookings },
        { count: specialistsCount },
        { count: servicesCount },
        { count: newMessagesCount }
      ] = await Promise.all([
        supabase.from('booking_requests').select(`id, requested_date, status, customer_name, customer_phone, requested_time, note, service:services(name)`),
        supabase.from('booking_requests').select(`id, customer_name, customer_phone, note, requested_date, requested_time, status, service:services(name)`).order('created_at', { ascending: false }).limit(5),
        supabase.from('specialists').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new')
      ]);

      const today = new Date().toISOString().split('T')[0];
      
      let todayCount = 0;
      let pendingCount = 0;
      let completedCount = 0;
      
      const allBookings = bookings || [];
      
      allBookings.forEach(b => {
        if (b.requested_date === today) todayCount++;
        if (b.status === 'pending') pendingCount++;
        if (b.status === 'completed') completedCount++;
      });
      
      const formattedLatest = (latestBookings || []).map((b: any) => {
          const isAnalysis = b.note && b.note.includes("CİLT ANALİZİ TALEBİ");
          return {
              ...b,
              service_name: isAnalysis ? 'Ücretsiz Cilt Analizi Talebi' : (b.service?.name || '-')
          }
      });

      setStats({
        todayAppointments: todayCount,
        pendingAppointments: pendingCount,
        completedAppointments: completedCount,
        activeSpecialists: specialistsCount || 0,
        totalServices: servicesCount || 0,
        newMessagesCount: newMessagesCount || 0
      });
      
      setRecentBookings(formattedLatest);

    } catch (err) {
      console.error("Dashboard verileri çekilirken hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAll = async () => {
    if (stats.pendingAppointments === 0) {
      alert("Onaylanacak beklemede olan randevu bulunmuyor.");
      return;
    }
    if (!confirm(`Bekleyen ${stats.pendingAppointments} adet randevuyu tek seferde onaylamak istediğinize emin misiniz?`)) return;
    
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'confirmed' })
        .eq('status', 'pending');
      if (error) throw error;
      await fetchDashboardData();
    } catch(err) {
      console.error(err);
      alert("Toplu onay sırasında bir hata oluştu.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className={styles.pageHeader} style={{marginBottom: 0}}>
        <div>
            <h1 className={styles.pageTitle}>Dashboard Öğeleri</h1>
            <p style={{ color: '#6b7280', fontSize: '1.05rem', margin: '0.5rem 0 0 0' }}>
                İşletmenizin bugünkü genel durumu ve operasyon özeti.
            </p>
        </div>
      </div>

      {/* MACRO ACTION BUTTONS (SaaS Hızlı İşlemler) - KALDIRILDI */}
      
      {/* AKSİYON MOTORU (Bugün Yapılacaklar) */}
      <div style={{ background: '#1c1c1c', borderRadius: '16px', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
         <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fcfcfc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              ⚡ Bugün Yapılacaklar
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>Sistemdeki acil operasyonel işlemlerinizi buradan yönetebilirsiniz.</p>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Action 1: Pending Approvals */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isLoading ? '#6b7280' : (stats.pendingAppointments > 0 ? '#ef4444' : '#6b7280') }}></div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 500, color: isLoading ? '#9ca3af' : (stats.pendingAppointments > 0 ? 'white' : '#9ca3af') }}>
                    {isLoading ? 'Veriler hesaplanıyor...' : `${stats.pendingAppointments} randevu onay bekliyor`}
                  </span>
               </div>
               <Link href="/yonetim/randevular" style={{ textDecoration: 'none' }}>
                  <button disabled={isLoading} style={{ opacity: isLoading ? 0.5 : 1, background: stats.pendingAppointments > 0 ? 'white' : 'transparent', color: stats.pendingAppointments > 0 ? 'black' : '#6b7280', border: stats.pendingAppointments > 0 ? 'none' : '1px solid #6b7280', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                    Onayla
                  </button>
               </Link>
            </div>

            {/* Action 2: Waiting Messages / Analysis Requests */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isLoading ? '#6b7280' : (stats.newMessagesCount > 0 ? '#eab308' : '#6b7280') }}></div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 500, color: isLoading ? '#9ca3af' : (stats.newMessagesCount > 0 ? 'white' : '#9ca3af') }}>
                    {isLoading ? 'Veriler hesaplanıyor...' : `${stats.newMessagesCount} müşteri mesaj/dönüş bekliyor`}
                  </span>
               </div>
               <Link href="/yonetim/iletisim" style={{ textDecoration: 'none' }}>
                  <button disabled={isLoading} style={{ opacity: isLoading ? 0.5 : 1, background: stats.newMessagesCount > 0 ? '#d4af37' : 'transparent', color: stats.newMessagesCount > 0 ? 'black' : '#6b7280', border: stats.newMessagesCount > 0 ? 'none' : '1px solid #6b7280', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                    Yanıtla / Ara
                  </button>
               </Link>
            </div>

            {/* Action 3: Today's Bookings */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isLoading ? '#6b7280' : (stats.todayAppointments > 0 ? '#10b981' : '#6b7280') }}></div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 500, color: isLoading ? '#9ca3af' : (stats.todayAppointments > 0 ? 'white' : '#9ca3af') }}>
                    {isLoading ? 'Veriler hesaplanıyor...' : `${stats.todayAppointments} randevu bugün gerçekleşecek`}
                  </span>
               </div>
               <Link href="/yonetim/randevular" style={{ textDecoration: 'none' }}>
                  <button style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Detay
                  </button>
               </Link>
            </div>

         </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
              <Calendar size={28} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                    {isLoading ? '-' : stats.todayAppointments}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Bugünkü Randevu</div>
            </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
              <Clock size={28} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                    {isLoading ? '-' : stats.pendingAppointments}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Onay Bekleyen</div>
            </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
              <CheckCircle size={28} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                    {isLoading ? '-' : stats.completedAppointments}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Biten Toplam İşlem</div>
            </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div style={{ padding: '1rem', background: '#e0e7ff', borderRadius: '50%', color: '#4f46e5' }}>
              <Users size={28} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                    {isLoading ? '-' : stats.activeSpecialists}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Aktif Uzman</div>
            </div>
        </div>

      </div>

      {/* Main Grid: Recent Bookings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'stretch' }}>
        
        {/* Recent Bookings */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Son Eklenen Randevular</h2>
                <Link href="/yonetim/randevular" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Tümünü Gör &rarr;</Link>
            </div>
            
            <div style={{ padding: '0' }}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>Yükleniyor...</div>
                ) : recentBookings.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>Henüz randevu yok.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Table Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) minmax(180px, 2fr) minmax(140px, 1.5fr) minmax(100px, 1fr) 100px', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em' }}>
                            <div>MÜŞTERİ</div>
                            <div>HİZMET</div>
                            <div>TARİH / SAAT</div>
                            <div>DURUM</div>
                            <div>İŞLEMLER</div>
                        </div>
                        {recentBookings.map((b, i) => (
                            <div key={b.id} style={{ 
                                padding: '1rem 1.25rem', 
                                display: 'grid', 
                                gridTemplateColumns: 'minmax(180px, 2fr) minmax(180px, 2fr) minmax(140px, 1.5fr) minmax(100px, 1fr) 100px', 
                                gap: '1rem',
                                alignItems: 'center',
                                borderBottom: i !== recentBookings.length - 1 ? '1px solid #f3f4f6' : 'none'
                             }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{b.customer_name}</div>
                                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.2rem' }}>{b.customer_phone}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#111827', fontSize: '0.9rem', fontWeight: 500 }}>{b.service_name}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#111827', fontSize: '0.9rem', fontWeight: 600 }}>{b.requested_date}</div>
                                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.2rem' }}>{b.requested_time}</div>
                                </div>
                                <div>
                                    {b.status === 'pending' && <span style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>BEKLİYOR</span>}
                                    {b.status === 'confirmed' && <span style={{ padding: '0.3rem 0.6rem', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>ONAYLANDI</span>}
                                    {b.status === 'completed' && <span style={{ padding: '0.3rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>TAMAMLANDI</span>}
                                    {b.status === 'cancelled' && <span style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>İPTAL</span>}
                                </div>
                                <div>
                                    <Link href={`/yonetim/randevular?date=${b.requested_date === new Date().toISOString().split('T')[0] ? 'today' : 'all'}`} style={{ padding: '0.4rem 0.8rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', color: '#374151', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'inline-block', textDecoration: 'none' }}>
                                        Detay
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>

    </div>
  );
}
