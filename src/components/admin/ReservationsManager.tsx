"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Search, Calendar, Filter, X } from "lucide-react";
import styles from "./ReservationsManager.module.css";

// Booking Requests derived from SQL schema
type BookingRequest = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  category_id: string | null;
  service_id: string | null;
  specialist_id: string | null;
  requested_date: string;
  requested_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer_note: string | null;
  internal_note: string | null;
  cancellation_reason: string | null;
  created_at: string;
  // Joined relation data for UI display (we will fetch this)
  service_name?: string;
  category_name?: string;
  specialist_name?: string;
};

const STATUS_MAPPING = {
  'pending': 'Bekliyor',
  'confirmed': 'Onaylandı',
  'completed': 'Tamamlandı',
  'cancelled': 'İptal'
} as const;

type DbStatus = keyof typeof STATUS_MAPPING;

type TimelineLog = {
    id: string;
    action: string;
    note: string | null;
    created_at: string;
};

export default function ReservationsManager() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [logs, setLogs] = useState<TimelineLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          service:services(name, category:service_categories(name)),
          specialist:specialists(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract the joined data to flat properties
      const formattedData = (data || []).map((b: any) => ({
        ...b,
        service_name: b.service?.name || '-',
        category_name: b.service?.category?.name || '-',
        specialist_name: b.specialist?.full_name || 'Atanmadı'
      }));

      setBookings(formattedData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('booking_timeline_logs')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const handleRowClick = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    fetchLogs(booking.id);
  };

  const closeDrawer = () => {
    setSelectedBooking(null);
    setLogs([]);
  };

  const updateStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled', logMessage: string) => {
     try {
       // Update main status
       const { error: updateError } = await supabase
         .from('booking_requests')
         .update({ status: newStatus })
         .eq('id', bookingId);
       
       if (updateError) throw updateError;

       // Insert into Timeline Log (Using Turkish UI string for display)
       const uiAction = STATUS_MAPPING[newStatus] || newStatus;
       const { error: logError } = await supabase
         .from('booking_timeline_logs')
         .insert([{ booking_id: bookingId, action: uiAction, note: logMessage }]);
       
       if (logError) throw logError;

       // Refresh
       fetchBookings();
       if (selectedBooking && selectedBooking.id === bookingId) {
           setSelectedBooking({...selectedBooking, status: newStatus});
           fetchLogs(bookingId);
       }

     } catch(err) {
         console.error("Error updating status:", err);
         alert("Bir hata oluştu");
     }
  };

  // derived metrics
  const todayCount = bookings.filter(b => b.requested_date === new Date().toISOString().split('T')[0]).length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalCount = bookings.length;

  // Render Status Badge helper
  const renderBadge = (status: string) => {
    // If the status isn't in our mapping dictionary, default to lowercasing it
    const uiLabel = STATUS_MAPPING[status as DbStatus] || status;
    switch (status) {
      case 'pending': return <span className={`${styles.badge} ${styles.badgePending}`}>{uiLabel}</span>;
      case 'confirmed': return <span className={`${styles.badge} ${styles.badgeConfirmed}`}>{uiLabel}</span>;
      case 'completed': return <span className={`${styles.badge} ${styles.badgeCompleted}`}>{uiLabel}</span>;
      case 'cancelled': return <span className={`${styles.badge} ${styles.badgeCancelled}`}>{uiLabel}</span>;
      default: return <span className={`${styles.badge}`}>{uiLabel}</span>;
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        b.customer_phone.includes(searchTerm) || 
                        (b.service_name && b.service_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Reverse lookup to find the DB enum from the UI string
    const targetDbEntry = Object.entries(STATUS_MAPPING).find(([k, v]) => v === statusFilter);
    const dbStatusFilter = targetDbEntry ? targetDbEntry[0] : null;

    const matchStatus = statusFilter === 'Tümü' || b.status === dbStatusFilter;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.managerContainer}>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Randevular</h1>
        <button className={styles.btnNew}>
          <PlusCircle size={18} />
          Yeni Randevu Ekle
        </button>
      </div>

      {/* METRICS DASHBOARD */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{todayCount}</div>
          <div className={styles.metricLabel}>Bugünkü Randevular</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{pendingCount}</div>
          <div className={styles.metricLabel}>Bekleyenler</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{approvedCount}</div>
          <div className={styles.metricLabel}>Onaylananlar</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{totalCount}</div>
          <div className={styles.metricLabel}>Tümü</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <div className={styles.searchContainer} style={{position:'relative'}}>
          <Search size={18} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}} />
          <input 
            type="text" 
            placeholder="Müşteri adı, telefon veya hizmet ara"
            className={styles.searchBox}
            style={{paddingLeft: '35px'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filtersGroup}>
          <select className={styles.filterSelect}>
            <option>Tarih: Tümü</option>
            <option>Bugün</option>
            <option>Yarın</option>
            <option>Bu Hafta</option>
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="Tümü">Durum: Tümü</option>
            <option value="Bekliyor">Bekleyenler</option>
            <option value="Onaylandı">Onaylananlar</option>
            <option value="Tamamlandı">Tamamlananlar</option>
            <option value="İptal">İptal Edilenler</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Uzman: Tümü</option>
          </select>
        </div>
      </div>

      {/* MAIN LIST VIEW */}
      <div className={styles.listView}>
        <div className={styles.listHeader}>
          <div>Müşteri</div>
          <div>Hizmet</div>
          <div>Uzman</div>
          <div>Tarih / Saat</div>
          <div>Durum</div>
          <div>Kısa Not</div>
          <div style={{textAlign:'right'}}>İşlemler</div>
        </div>

        {isLoading ? (
          <div style={{padding: '2rem', textAlign:'center', color:'#6b7280'}}>Yükleniyor...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{padding: '3rem', textAlign:'center', color:'#6b7280'}}>Bu filtreye uygun randevu bulunamadı.</div>
        ) : (
          filteredBookings.map(b => (
            <div key={b.id} className={styles.listRow} onClick={() => handleRowClick(b)}>
              <div className={styles.colCustomer}>
                <span className={styles.customerName}>{b.customer_name}</span>
                <span className={styles.customerContact}>{b.customer_phone}</span>
              </div>
              <div className={styles.colService}>
                <span className={styles.serviceName}>{b.service_name}</span>
                <span className={styles.serviceCategory}>{b.category_name}</span>
              </div>
              <div className={styles.colSpecialist}>
                {b.specialist_name}
              </div>
              <div className={styles.colDateTime}>
                <span className={styles.dateText}>{b.requested_date}</span>
                <span className={styles.timeText}>{b.requested_time}</span>
              </div>
              <div>
                {renderBadge(b.status)}
              </div>
              <div className={styles.colNote}>
                {b.customer_note || b.internal_note || '-'}
              </div>
              <div className={styles.colActions}>
                 <span style={{color:'#3b82f6', fontSize:'0.85rem', fontWeight:500}}>Detayı Gör &rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RIGHT SIDE DETAILS DRAWER */}
      {selectedBooking && (
        <div className={styles.drawerOverlay} onClick={(e) => {
            if(e.target === e.currentTarget) closeDrawer();
        }}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Randevu Detayı</h2>
              <button className={styles.closeBtn} onClick={closeDrawer}><X size={24} /></button>
            </div>
            
            <div className={styles.drawerContent}>
                
                {/* Müşteri Bilgileri */}
                <div className={styles.drawerSection}>
                    <div className={styles.sectionTitle}>Müşteri Bilgileri</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Ad Soyad</span>
                        <span className={styles.detailValue}>{selectedBooking.customer_name}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Telefon</span>
                        <span className={styles.detailValue}>{selectedBooking.customer_phone}</span>
                    </div>
                </div>

                {/* Randevu Bilgileri */}
                <div className={styles.drawerSection}>
                    <div className={styles.sectionTitle}>Randevu Bilgileri</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Hizmet Alanı</span>
                        <span className={styles.detailValue}>{selectedBooking.service_name} <br/><span style={{fontSize:'0.75rem', color:'#9ca3af'}}>{selectedBooking.category_name}</span></span>
                    </div>
                    <div className={styles.detailRow} style={{marginTop:'0.5rem'}}>
                        <span className={styles.detailLabel}>Atanan Uzman</span>
                        <span className={styles.detailValue}>{selectedBooking.specialist_name}</span>
                    </div>
                    <div className={styles.detailRow} style={{marginTop:'0.5rem'}}>
                        <span className={styles.detailLabel}>Zaman</span>
                        <span className={styles.detailValue}>{selectedBooking.requested_date} - {selectedBooking.requested_time}</span>
                    </div>
                    <div className={styles.detailRow} style={{marginTop:'0.5rem'}}>
                        <span className={styles.detailLabel}>Durum</span>
                        <span>{renderBadge(selectedBooking.status)}</span>
                    </div>
                    {selectedBooking.customer_note && (
                        <div style={{marginTop:'1.5rem', padding:'1rem', background:'rgba(254, 243, 199, 0.4)', borderRadius:'6px'}}>
                            <strong>Müşteri Notu:</strong> <br/>
                            {selectedBooking.customer_note}
                        </div>
                    )}
                </div>

                {/* Geçmiş / Timeline */}
                <div className={styles.drawerSection}>
                    <div className={styles.sectionTitle}>İşlem Geçmişi</div>
                    <div className={styles.timeline}>
                        {logs.length === 0 ? (
                            <div style={{fontSize:'0.85rem', color:'#9ca3af'}}>Henüz geçmiş eylemi yok.</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className={`${styles.timelineItem} ${log.action === 'İptal' ? styles.error : log.action === 'Tamamlandı' ? styles.success : styles.active}`}>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                        <div className={styles.timelineAction}>{log.action}</div>
                                        {log.note && <div className={styles.timelineNote}>{log.note}</div>}
                                        <div className={styles.timelineTime}>{new Date(log.created_at).toLocaleString('tr-TR')}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Aksiyon Footer */}
            <div className={styles.drawerFooter}>
                {selectedBooking.status === 'pending' && (
                    <button className={`${styles.btnAction} ${styles.btnConfirm}`} onClick={() => updateStatus(selectedBooking.id, 'confirmed', 'Randevu işletme tarafından onaylandı.')}>
                        Onayla
                    </button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <>
                        <button className={`${styles.btnAction}`} style={{background:'#f3f4f6', color:'#111827'}}>
                            Uzman Ata
                        </button>
                        <button className={`${styles.btnAction} ${styles.btnComplete}`} onClick={() => updateStatus(selectedBooking.id, 'completed', 'Randevu tamamlandı olarak işaretlendi.')}>
                            Tamamlandı İşaretle
                        </button>
                        <button className={`${styles.btnAction} ${styles.btnCancel}`} onClick={() => updateStatus(selectedBooking.id, 'cancelled', 'Randevu iptal edildi.')}>
                            İptal Et
                        </button>
                    </>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
