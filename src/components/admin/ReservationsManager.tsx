"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Search, Filter, X, Check, XCircle, Clock, CalendarIcon, List } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
  note: string | null;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [dateFilter, setDateFilter] = useState("Tarih: Tümü");
  const [specialistFilter, setSpecialistFilter] = useState("Tümü");
  const [specialists, setSpecialists] = useState<{id:string, full_name:string}[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    // Determine filter from URL if linked from Dashboard
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('date') === 'today') {
        setDateFilter("Bugün");
      }
    }
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

      // Ayrıyeten uzman listesini filtre için çekiyoruz
      const { data: specData } = await supabase.from('specialists').select('id, full_name');
      if (specData) setSpecialists(specData);

      const formattedData = (data || []).map((b: any) => {
        const isAnalysis = b.note && b.note.includes("CİLT ANALİZİ TALEBİ");
        // Tarih yoksa eklendiği tarihi yansıt
        const requestDate = b.requested_date || (b.created_at ? b.created_at.split('T')[0] : '-');
        
        return {
          ...b,
          requested_date: requestDate,
          service_name: isAnalysis ? 'Ücretsiz Cilt Analizi Talebi' : (b.service?.name || '-'),
          category_name: isAnalysis ? 'Ön Görüşme / Analiz' : (b.service?.category?.name || '-'),
          specialist_name: b.specialist?.full_name || (isAnalysis ? 'Sistem (Bekliyor)' : 'Atanmadı')
        };
      });

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
  const renderBadge = (status: string, createdAt: string) => {
    // If the status isn't in our mapping dictionary, default to lowercasing it
    const uiLabel = STATUS_MAPPING[status as DbStatus] || status;
    switch (status) {
      case 'pending': 
        // calculate urgency colors based on hours difference
        const now = new Date().getTime();
        const createdTime = new Date(createdAt).getTime();
        const diffHours = (now - createdTime) / (1000 * 60 * 60);
        
        let badgeClass = styles.badgePendingUrgent1; // Default < 2h (yellow)
        let label: string = uiLabel;
        
        if (diffHours >= 6) {
           badgeClass = styles.badgePendingUrgent3; // > 6h (red)
           label = 'ACİL Bekliyor';
        } else if (diffHours >= 2) {
           badgeClass = styles.badgePendingUrgent2; // 2-6h (orange)
        }
        
        return <span className={`${styles.badge} ${badgeClass}`}>{label}</span>;
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
    
    // Date Filtering
    let matchDate = true;
    if (dateFilter !== 'Tarih: Tümü') {
      const today = new Date();
      const bDate = b.requested_date ? new Date(b.requested_date) : null;
      
      if (bDate) {
         if (dateFilter === 'Bugün') {
            matchDate = bDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
         } else if (dateFilter === 'Yarın') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchDate = bDate.toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0];
         } else if (dateFilter === 'Bu Hafta') {
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            matchDate = bDate >= today && bDate <= endOfWeek;
         }
      } else {
         matchDate = false; // Cannot filter by date if null
      }
    }

    const matchSpecialist = specialistFilter === 'Tümü' || b.specialist_id === specialistFilter || (specialistFilter === 'system' && !b.specialist_id);

    return matchSearch && matchStatus && matchDate && matchSpecialist;
  });

  // --- BULK SELECTION ACTIONS ---
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredBookings.map(b => b.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleBulkAction = async (action: 'confirmed' | 'cancelled' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      const confirmDelete = window.confirm(`Seçili ${selectedIds.length} adet randevuyu kalıcı olarak silmek istediğinize emin misiniz?`);
      if (!confirmDelete) return;
    }
    
    setIsBulkLoading(true);
    try {
      if (action === 'delete') {
         await supabase.from('booking_requests').delete().in('id', selectedIds);
      } else {
         await supabase.from('booking_requests').update({ status: action }).in('id', selectedIds);
      }
      setSelectedIds([]);
      await fetchBookings();
    } catch (err) {
      console.error("Bulk action execution failed:", err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return; // Same day

    // Dest droppableId is the date string
    const newDate = destination.droppableId;
    
    // Optimistic Update
    setBookings(prev => prev.map(b => b.id === draggableId ? { ...b, requested_date: newDate } : b));
    
    try {
      const { error } = await supabase.from('booking_requests').update({ requested_date: newDate }).eq('id', draggableId);
      if (error) {
        throw error;
      }
      
      // Update logs automatically for CRM logic
      await supabase.from('booking_timeline_logs').insert([{ booking_id: draggableId, action: 'Takvimde Ötelendi', note: `Yeni Tarih: ${newDate}` }]);
    } catch(err) {
      alert("Tarih güncellenemedi.");
      fetchBookings(); // Revert
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className={styles.managerContainer}>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Randevular</h1>
        <button className={styles.btnNew} onClick={() => alert("Manuel randevu ekleme formu henüz aktif değil. Supabase üzerinden bağlanacak.")}>
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
          <select className={styles.filterSelect} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="Tarih: Tümü">Tarih: Tümü</option>
            <option value="Bugün">Bugün</option>
            <option value="Yarın">Yarın</option>
            <option value="Bu Hafta">Bu Hafta</option>
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="Tümü">Durum: Tümü</option>
            <option value="Bekliyor">Bekleyenler</option>
            <option value="Onaylandı">Onaylananlar</option>
            <option value="Tamamlandı">Tamamlananlar</option>
            <option value="İptal">İptal Edilenler</option>
          </select>
          <select className={styles.filterSelect} value={specialistFilter} onChange={e => setSpecialistFilter(e.target.value)}>
            <option value="Tümü">Uzman: Tümü</option>
            <option value="system">Sistem (Bekliyor)</option>
            {specialists.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.full_name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '0.25rem' }}>
              <button 
                  onClick={() => setViewMode('list')}
                  style={{ background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? '#111827' : '#6b7280', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                 <List size={16} /> Liste
              </button>
              <button 
                  onClick={() => setViewMode('calendar')}
                  style={{ background: viewMode === 'calendar' ? 'white' : 'transparent', color: viewMode === 'calendar' ? '#111827' : '#6b7280', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                 <CalendarIcon size={16} /> Sürükle-Bırak Takvim
              </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT VIEW */}
      {viewMode === 'list' ? (
      <div className={styles.listView}>
        <div className={styles.listHeader}>
          <div className={styles.checkboxCol}>
            <input 
              type="checkbox" 
              checked={selectedIds.length > 0 && selectedIds.length === filteredBookings.length}
              onChange={toggleSelectAll} 
            />
          </div>
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
              <div className={styles.checkboxCol}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(b.id)} 
                  onChange={(e) => toggleSelectOne(e, b.id)}
                  onClick={(e) => e.stopPropagation()} // Satıra tıklama etkisini iptal et
                />
              </div>
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
                {renderBadge(b.status, b.created_at)}
              </div>
              <div className={styles.colNote}>
                {b.note || b.customer_note || b.internal_note || '-'}
              </div>
              <div className={styles.colActions} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                 {b.status === 'pending' && (
                     <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, 'confirmed', 'Hızlı Onay (Liste)'); }}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Onayla"
                        >
                            <Check size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, 'cancelled', 'Hızlı İptal (Liste)'); }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="İptal Et"
                        >
                            <XCircle size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); alert('Gelişmiş Erteleme takvim modülünden yapılacaktır.'); }}
                            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Ertele"
                        >
                            <Clock size={16} />
                        </button>
                     </>
                 )}
                 <button onClick={(e) => { e.stopPropagation(); handleRowClick(b); }} style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    Detay
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
      ) : (
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '600px' }}>
         <DragDropContext onDragEnd={onDragEnd}>
            {next7Days.map(dateStr => {
               const dayBookings = filteredBookings.filter(b => b.requested_date === dateStr);
               const isToday = dateStr === todayStr;
               return (
                  <div key={dateStr} style={{ minWidth: '300px', flex: 1, background: '#f9fafb', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         {dateStr}
                         {isToday && <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Bugün</span>}
                     </h3>
                     <Droppable droppableId={dateStr}>
                        {(provided, snapshot) => (
                           <div 
                             {...provided.droppableProps} 
                             ref={provided.innerRef} 
                             style={{ flex: 1, background: snapshot.isDraggingOver ? '#f3f4f6' : 'transparent', borderRadius: '8px', minHeight: '150px', transition: 'background 0.2s ease' }}
                           >
                             {dayBookings.map((b, index) => (
                                <Draggable key={b.id} draggableId={b.id} index={index}>
                                   {(provided, snapshot) => (
                                      <div
                                         ref={provided.innerRef}
                                         {...provided.draggableProps}
                                         {...provided.dragHandleProps}
                                         onClick={() => handleRowClick(b)}
                                         style={{
                                            userSelect: 'none',
                                            padding: '1rem',
                                            margin: '0 0 0.75rem 0',
                                            backgroundColor: snapshot.isDragging ? '#ffffff' : 'white',
                                            boxShadow: snapshot.isDragging ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                                            borderRadius: '8px',
                                            borderLeft: `4px solid ${b.status === 'pending' ? '#f59e0b' : b.status === 'confirmed' ? '#10b981' : '#6b7280'}`,
                                            ...provided.draggableProps.style,
                                         }}
                                      >
                                         <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{b.customer_name}</div>
                                         <div style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.3rem 0' }}>{b.service_name}</div>
                                         <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 500 }}>{b.requested_time} | {b.specialist_name}</div>
                                      </div>
                                   )}
                                </Draggable>
                             ))}
                             {provided.placeholder}
                           </div>
                        )}
                     </Droppable>
                  </div>
               )
            })}
         </DragDropContext>
      </div>
      )}

      {/* FIXED BULK ACTION BAR */}
      {selectedIds.length > 0 && (
         <div className={styles.bulkActionBar}>
            <div><strong style={{color:'var(--color-gold)'}}>{selectedIds.length}</strong> randevu seçildi</div>
            <button 
               className={`${styles.bulkBtn} ${styles.bulkBtnApprove}`}
               onClick={() => handleBulkAction('confirmed')}
               disabled={isBulkLoading}
            >
               Tümünü Onayla
            </button>
            <button 
               className={styles.bulkBtn}
               onClick={() => handleBulkAction('cancelled')}
               disabled={isBulkLoading}
            >
               Tümünü İptal Et
            </button>
            <button 
               className={styles.bulkBtn}
               style={{ borderColor: '#ef4444', color: '#ef4444' }}
               onClick={() => handleBulkAction('delete')}
               disabled={isBulkLoading}
            >
               Sistemden Sil
            </button>
            
            <button className={styles.closeBtn} style={{marginLeft: 'auto', color: 'white'}} onClick={() => setSelectedIds([])}>
               <X size={20} />
            </button>
         </div>
      )}

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
                        <span>{renderBadge(selectedBooking.status, selectedBooking.created_at)}</span>
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
                        <button className={`${styles.btnAction}`} style={{background:'#f3f4f6', color:'#111827'}} onClick={() => alert("Uzman atama işlemi henüz aktifleştirilmedi.")}>
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
