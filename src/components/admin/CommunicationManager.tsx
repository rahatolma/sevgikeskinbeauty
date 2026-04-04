"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, Clock, MoveRight, DownloadCloud, Mailbox } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'messages' | 'newsletter'>('messages');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

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
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
               <Mailbox size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
               <p>Henüz gelen bir mesaj bulunmuyor veya veritabanı ayarlanmamış.</p>
            </div>
          ) : (
            <div className={styles.messageList}>
              {messages.map((msg) => (
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

                   <div className={styles.messageActions}>
                      <button 
                        className={styles.btnAction} 
                        onClick={() => markAsRead(msg.id, msg.status)}
                        style={{ borderColor: msg.status === 'new' ? 'var(--color-gold)' : '#d1d5db' }}
                      >
                         {msg.status === 'new' ? 'Okundu İşaretle' : 'Okunmadı İşaretle'}
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

    </div>
  );
}
