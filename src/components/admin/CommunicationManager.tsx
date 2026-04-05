"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, Clock, MoveRight, DownloadCloud, Mailbox, User, History, StickyNote, X } from 'lucide-react';
import styles from './CommunicationManager.module.css';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export default function CommunicationManager() {
  const [activeTab, setActiveTab] = useState<'messages' | 'newsletter' | 'archived'>('messages');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  // CRM States
  const [selectedCRM, setSelectedCRM] = useState<ContactMessage | null>(null);
  const [crmHistory, setCrmHistory] = useState<any[]>([]);
  const [crmNote, setCrmNote] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { 
        console.error('Mesajlar çekilemedi:', error);
        setDebugError(JSON.stringify(error));
      } else if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        console.error('Aboneler çekilemedi:', error);
      } else if (data) {
        setSubscribers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchSubscribers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const markAsRead = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'new' ? 'read' : 'new';
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, status: newStatus } : msg
        ));
      }
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  };

  const openCRM = async (msg: ContactMessage) => {
    setSelectedCRM(msg);
    setCrmNote('');
    
    try {
      let query = supabase.from('booking_requests').select('*');
      if (msg.phone) {
         query = query.or(`customer_phone.ilike.%${msg.phone.slice(-10)}%,customer_email.eq.${msg.email}`);
      } else {
         query = query.eq('customer_email', msg.email);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
         setCrmHistory(data);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const saveCRMNote = async () => {
    if (!selectedCRM || !crmNote.trim()) return;
    setIsNoteSaving(true);
    try {
       const newNoteText = `\n\n--- İÇ NOT (${new Date().toLocaleDateString('tr-TR')}) ---\n${crmNote}`;
       const { error } = await supabase.from('contact_messages').update({ message: selectedCRM.message + newNoteText }).eq('id', selectedCRM.id);
       
       if (!error) {
           setMessages(messages.map(m => m.id === selectedCRM.id ? { ...m, message: selectedCRM.message + newNoteText } : m));
           setSelectedCRM({ ...selectedCRM, message: selectedCRM.message + newNoteText });
           setCrmNote('');
       } else {
           alert("Not eklenirken hata oluştu!");
       }
    } finally {
       setIsNoteSaving(false);
    }
  };

  const exportToCSV = () => {
    if (subscribers.length === 0) return;
    
    // Gerekli başlıklar
    const headers = ["ID", "E-Posta Adresi", "Kayıt Tarihi"];
    const rows = subscribers.map(sub => [
      sub.id,
      sub.email,
      new Date(sub.created_at).toLocaleString('tr-TR')
    ]);
    
    let csvContent = headers.join(",") + "\n";
    rows.forEach(rowArray => {
       csvContent += rowArray.join(",") + "\n";
    });
    
    // Blob yöntemiyle oluştur (Tarayıcı güvenlik kısıtlamalarına takılmamak için)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "abone_listesi.csv");
    document.body.appendChild(link);
    link.click();
    
    // Temizle
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles.managerContainer}>
         <div className={styles.emptyState}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>İletişim & Aboneler</h1>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'messages' ? styles.active : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Gelen Mesajlar ({messages.filter(m => m.status === 'new').length} Yeni)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.active : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Cevaplananlar / Geçmiş
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'newsletter' ? styles.active : ''}`}
          onClick={() => setActiveTab('newsletter')}
        >
          Bülten Aboneleri ({subscribers.length})
        </button>
      </div>

      {debugError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'monospace' }}>
           <strong>Supabase Error:</strong> {debugError}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className={styles.tabContent}>
          {messages.filter(m => m.status === 'new').length === 0 ? (
            <div className={styles.emptyState}>
               <Mailbox size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
               <p>Henüz okunmamış/cevaplanmamış mesajınız bulunmuyor.</p>
            </div>
          ) : (
            <div className={styles.messageList}>
              {messages.filter(m => m.status === 'new').map((msg) => (
                <div key={msg.id} className={`${styles.messageCard} ${msg.status === 'new' ? styles.unread : ''}`}>
                   <div className={styles.messageHeader}>
                      <div className={styles.senderInfo}>
                         <h4>{msg.name}</h4>
                         <div className={styles.contactDetails}>
                            <span><Mail size={14}/> {msg.email}</span>
                            {msg.phone && <span><Phone size={14}/> {msg.phone}</span>}
                         </div>
                      </div>
                      <div className={styles.messageDate}>
                         <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                         {new Date(msg.created_at).toLocaleDateString('tr-TR')} {new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                   </div>
                   
                   <div className={styles.messageBody}>
                      {msg.message}
                   </div>

                   <div className={styles.messageActions} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                      <button 
                        className={styles.btnAction} 
                         onClick={() => markAsRead(msg.id, msg.status)}
                        style={{ borderColor: msg.status === 'new' ? 'var(--color-gold)' : '#d1d5db', flex: 1 }}
                      >
                         {msg.status === 'new' ? 'Arşivle (Cevaplandı)' : 'Geri Al (Yeni)'}
                      </button>

                      {msg.phone && (
                         <>
                            <a 
                               href={`tel:+90${msg.phone.replace(/[^0-9]/g, '')}`} 
                               style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f9fafb', color: '#111827', border: '1px solid #d1d5db', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                            >
                               <Phone size={16} /> Ara
                            </a>
                            <a 
                               href={`https://wa.me/90${msg.phone.replace(/[^0-9]/g, '')}?text=Merhaba%20${encodeURIComponent(msg.name)},%20talebini%20görmüş%20durumdayız.`}
                               target="_blank"
                               rel="noopener noreferrer"
                               style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#25D366', color: 'white', border: '1px solid #25D366', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                            >
                               <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                               </svg>
                               WhatsApp
                             </a>
                          </>
                       )}
                    </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}

      {activeTab === 'archived' && (
        <div className={styles.tabContent}>
          {messages.filter(m => m.status !== 'new').length === 0 ? (
            <div className={styles.emptyState}>
               <History size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
               <p>Arşivlenmiş veya cevaplanmış mesajınız bulunmuyor.</p>
            </div>
          ) : (
            <div className={styles.messageList}>
              {messages.filter(m => m.status !== 'new').map((msg) => (
                <div key={msg.id} className={styles.messageCard}>
                   <div className={styles.messageHeader}>
                      <div className={styles.senderInfo}>
                         <h4>{msg.name}</h4>
                         <div className={styles.contactDetails}>
                            <span><Mail size={14}/> {msg.email}</span>
                            {msg.phone && <span><Phone size={14}/> {msg.phone}</span>}
                         </div>
                      </div>
                      <div className={styles.messageDate} style={{ color: '#6b7280' }}>
                         <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                         {new Date(msg.created_at).toLocaleDateString('tr-TR')} {new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                         <span style={{ marginLeft: '1rem', background: '#d1d5db', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', textTransform: 'uppercase' }}>Cevaplandı</span>
                      </div>
                   </div>
                   
                   <div className={styles.messageBody} style={{ color: '#6b7280' }}>
                      {msg.message}
                   </div>

                   <div className={styles.messageActions} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
                      <button 
                        className={styles.btnAction} 
                         onClick={() => markAsRead(msg.id, msg.status)}
                        style={{ borderColor: '#d1d5db', flex: 1, color: '#4b5563' }}
                      >
                         Geri Al (Yeni)
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'newsletter' && (
        <div className={styles.tabContent}>
          {subscribers.length === 0 ? (
            <div className={styles.emptyState}>
               <Mail size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
               <p>Henüz bültene abone olan bir ziyaretçi bulunmuyor.</p>
            </div>
          ) : (
             <>
               <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                 <button 
                    className={styles.btnAction} 
                    onClick={exportToCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                 >
                    <DownloadCloud size={16} /> Dışa Aktar (CSV)
                 </button>
               </div>
               <div className={styles.subscriberGrid}>
                  {subscribers.map((sub) => (
                    <div key={sub.id} className={styles.subscriberCard}>
                      <div className={styles.subscriberIcon}>
                         <Mail size={18} />
                      </div>
                      <div className={styles.subscriberDetails}>
                         <h5>{sub.email}</h5>
                         <p>{new Date(sub.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
               </div>
             </>
          )}
        </div>
      )}

      {/* CRM DRAWER */}
      {selectedCRM && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedCRM(null); }}>
           <div style={{ background: 'white', width: '500px', maxWidth: '100vw', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', color: 'white' }}>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} /> Müşteri 360</h2>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#9ca3af' }}>{selectedCRM.name}</p>
                 </div>
                 <button onClick={() => setSelectedCRM(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 
                 {/* İletişim Bilgileri */}
                 <div>
                    <h3 style={{ fontSize: '1rem', color: '#111827', margin: '0 0 1rem 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>İletişim Bilgileri</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Email</span> <strong style={{ color: '#111827' }}>{selectedCRM.email}</strong></div>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Telefon</span> <strong style={{ color: '#111827' }}>{selectedCRM.phone || '-'}</strong></div>
                    </div>
                 </div>

                 {/* Geçmiş Randevular */}
                 <div>
                    <h3 style={{ fontSize: '1rem', color: '#111827', margin: '0 0 1rem 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={16} /> Randevu Geçmişi</h3>
                    {crmHistory.length === 0 ? (
                       <div style={{ fontSize: '0.85rem', color: '#6b7280', background: '#f9fafb', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>Sistemde kayıtlı geçmiş randevu bulunamadı.</div>
                    ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {crmHistory.slice(0, 5).map(hist => (
                             <div key={hist.id} style={{ fontSize: '0.85rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                   <strong style={{ color: '#111827' }}>{new Date(hist.created_at).toLocaleDateString('tr-TR')}</strong>
                                   <span style={{ color: hist.status === 'confirmed' ? '#10b981' : hist.status === 'pending' ? '#f59e0b' : '#6b7280' }}>{hist.status}</span>
                                </div>
                                <div style={{ color: '#4b5563' }}>Hizmet Referansı: {hist.service_id || 'Seçilmemiş'}</div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

              </div>
           </div>
        </div>
      )}

    </div>
  );
}
