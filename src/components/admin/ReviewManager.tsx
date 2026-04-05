"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, X, MessageCircle, Star } from "lucide-react";
import styles from "./ReviewManager.module.css"; // Reuse SpecialistManager styles since we copied them it works perfectly. Wait, I should make sure classes match.

type Review = {
    id: string;
    name: string;
    text: string;
    category: string;
    rating: number;
    is_highlight: boolean;
    sort_order: number;
    is_active: boolean;
    service_id: string | null;
};

export default function ReviewManager() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
    const [services, setServices] = useState<{id: string, name: string, category_id: string, is_featured: boolean}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Review>>({
        is_active: true,
        sort_order: 0,
        is_highlight: false,
        category: "Genel",
        rating: 5,
        service_id: null
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('reviews').select('*').order('created_at', {ascending: false});
            if(error) throw error;
            setReviews(data || []);

            const { data: catData } = await supabase.from('service_categories').select('id, name');
            setCategories(catData || []);

            const { data: srvData } = await supabase.from('services').select('id, name, category_id, is_featured').order('sort_order', {ascending: true});
            setServices(srvData || []);
        } catch(err) {
            console.error("Ops! Veri çekilemedi:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDrawer = () => {
        setFormData({ is_active: true, sort_order: 0, is_highlight: false, category: "Genel", name: "", text: "", rating: 5, service_id: null });
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (r: Review) => {
        setFormData({ ...r });
        setIsDrawerOpen(true);
    };

    const toggleStatus = async (r: Review) => {
        try {
            const { error } = await supabase.from('reviews').update({ is_active: !r.is_active }).eq('id', r.id);
            if(error) throw error;
            fetchData();
        } catch(e) {
            alert("Durum güncellenemedi.");
        }
    };

    const deleteReview = async (id: string) => {
        if (!confirm("Bu yorumu tamamen silmek istediğinize emin misiniz?")) return;
        try {
            const { error } = await supabase.from('reviews').delete().eq('id', id);
            if(error) throw error;
            fetchData();
        } catch(e) {
            alert("Silinemedi.");
        }
    }

    const saveReview = async () => {
        if (!formData.name || !formData.text) {
            alert("Lütfen isim ve yorum içeriğini girin!");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Upsert Data
            if (formData.id) {
                const { error } = await supabase.from('reviews').update({
                    name: formData.name,
                    text: formData.text,
                    category: formData.category,
                    rating: formData.rating,
                    is_active: formData.is_active,
                    sort_order: formData.sort_order,
                    is_highlight: formData.is_highlight,
                    service_id: formData.service_id || null
                }).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('reviews').insert([{
                    name: formData.name,
                    text: formData.text,
                    category: formData.category,
                    rating: formData.rating || 5,
                    is_active: formData.is_active,
                    sort_order: formData.sort_order || 0,
                    is_highlight: formData.is_highlight || false,
                    service_id: formData.service_id || null
                }]);
                if (error) throw error;
            }

            setIsDrawerOpen(false);
            fetchData();

        } catch(err) {
            console.error("Ops! Kaydedilemedi:", err);
            alert("Kaydedilemedi, bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const totalCount = reviews.length;
    const activeCount = reviews.filter(r => r.is_active).length;
    const averageScore = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '5.0';
    const badReviews = reviews.filter(r => r.rating <= 3);
    
    return (
        <div className={styles.managerContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Müşteri Yorumları</h1>
                <button className={styles.btnNew} onClick={openCreateDrawer}>
                    <PlusCircle size={18} />
                    Yeni Yorum Ekle
                </button>
            </div>

            {/* KPI Dashboard */}
            <div className={styles.overviewRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel} style={{ color: '#d97706' }}>İşletme Ortalaması</span>
                    <span className={styles.overviewValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star fill="#d97706" color="#d97706" size={20} /> {averageScore}
                    </span>
                </div>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>Toplam Yorum</span>
                    <span className={styles.overviewValue}>{totalCount}</span>
                </div>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>Anasayfa Öne Çıkanlar</span>
                    <span className={styles.overviewValue}>{reviews.filter(r => r.is_highlight).length}</span>
                </div>
            </div>

            {badReviews.length > 0 && (
                <div style={{ background: '#fef2f2', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #fecaca', marginBottom: '2rem' }}>
                    <div style={{ background: '#ef4444', color: 'white', padding: '0.75rem', borderRadius: '50%' }}>
                        <Star size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#991b1b', lineHeight: 1 }}>Dikkat: {badReviews.length} Düşük Puanlı Yorum Var</div>
                        <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                            3 Yıldız ve altında puan alan yorumlar tespit edildi. Sayfada yayında kalmamasını / gizlemeyi düşünebilirsiniz.
                        </div>
                    </div>
                </div>
            )}

            {/* Main Cards Grid */}
            {isLoading ? (
                <div style={{color:'#6b7280'}}>Yükleniyor...</div>
            ) : (
                <div className={styles.grid}>
                    {reviews.map(r => (
                        <div key={r.id} className={styles.card}>
                            
                            <div className={styles.cardTop}>
                                <div className={styles.profileSection}>
                                    <div className={styles.avatar}>
                                        <MessageCircle size={24} />
                                    </div>
                                    <div className={styles.profileInfo}>
                                        <div className={styles.profileName}>{r.name}</div>
                                        <div className={styles.profileTitle} style={{color: '#d4af37'}}>{r.category}</div>
                                    </div>
                                </div>
                                <div className={styles.statusSection} style={{display:'flex', flexDirection:'column', gap:'0.5rem', alignItems:'flex-end'}}>
                                    <span className={`${styles.badge} ${r.is_active ? styles.badgeActive : styles.badgePassive}`}>
                                        {r.is_active ? 'Yayında' : 'Gizli'}
                                    </span>
                                    {r.is_highlight && (
                                        <span className={styles.badge} style={{backgroundColor: 'var(--color-gold)', color:'white'}}>
                                            Anasayfada
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardMiddle}>
                                <div style={{display:'flex', gap:'2px', marginBottom:'0.5rem', color:'#F4B400'}}>
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={14} fill={star <= r.rating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <p style={{fontSize: '0.9rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{r.text}</p>
                            </div>

                            <div className={styles.cardBottom} style={{ flexWrap: 'wrap', gap: '8px' }}>
                                <button className={styles.cardBtn} onClick={() => openEditDrawer(r)}>Düzenle</button>
                                <button className={styles.cardBtn} onClick={() => toggleStatus(r)}>
                                    {r.is_active ? 'Gizle' : 'Yayınla'}
                                </button>
                                <button className={styles.cardBtn} style={{color:'red'}} onClick={() => deleteReview(r.id)}>Sil</button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* DRAWER FORM */}
            {isDrawerOpen && (
                <div className={styles.drawerOverlay} onMouseDown={(e) => { if(e.target === e.currentTarget) setIsDrawerOpen(false); }}>
                    <div className={styles.drawer} onMouseDown={e => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <h2 className={styles.drawerTitle}>{formData.id ? 'Yorumu Düzenle' : 'Yeni Yorum'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}><X size={24} /></button>
                        </div>
                        
                        <div className={styles.drawerContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Müşteri Adı</label>
                                <input type="text" className={styles.formInput} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: Kardelen Y." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Hizmet Kategorisi</label>
                                <select className={styles.formInput} value={formData.category || ''} onChange={e => {
                                    setFormData({...formData, category: e.target.value, service_id: null});
                                }}>
                                    <option value="">Lütfen kategori seçin...</option>
                                    <option value="Genel">Genel Değerlendirme</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.category && formData.category !== "Genel" && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Hangi Servis? (Opsiyonel)</label>
                                    <select className={styles.formInput} value={formData.service_id || ''} onChange={e => {
                                        setFormData({...formData, service_id: e.target.value || null});
                                    }}>
                                        <option value="">Spesifik bir servis belirtmek istemiyorum...</option>
                                        {services
                                            .filter(s => {
                                                const cat = categories.find(c => c.name === formData.category);
                                                return cat && s.category_id === cat.id;
                                            })
                                            .map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} {s.is_featured ? ' (⭐ Önerilen)' : ''}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Puan (Yıldız)</label>
                                <div style={{display:'flex', gap:'0.5rem'}}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={24} 
                                            fill={star <= (formData.rating || 5) ? "#F4B400" : "none"} 
                                            color={star <= (formData.rating || 5) ? "#F4B400" : "#d1d5db"} 
                                            cursor="pointer"
                                            onClick={() => setFormData({...formData, rating: star})}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Yorum (Deneyim)</label>
                                <textarea className={styles.formInput} rows={5} value={formData.text || ''} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="Harika bir deneyimdi..." />
                            </div>

                            <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1.5rem', padding:'1rem', backgroundColor:'#f9fafb', borderRadius:'8px', border:'1px solid #e5e7eb'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'0.8rem'}}>
                                    <input type="checkbox" id="activeToggle" style={{width:'18px', height:'18px'}} checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                    <label htmlFor="activeToggle" className={styles.formLabel} style={{cursor:'pointer', margin:0}}>Yorum Yayında Görünsün</label>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'0.8rem'}}>
                                    <input type="checkbox" id="highlightToggle" style={{width:'18px', height:'18px'}} checked={formData.is_highlight} onChange={e => setFormData({...formData, is_highlight: e.target.checked})} />
                                    <label htmlFor="highlightToggle" className={styles.formLabel} style={{cursor:'pointer', margin:0}}>Anasayfa "Sizden Gelenler" Bandında Çıksın</label>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerFooter}>
                            <button className={styles.btnDanger} onClick={() => setIsDrawerOpen(false)} style={{background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db'}}>İptal</button>
                            <button className={styles.btnPrimary} onClick={saveReview} disabled={isSaving}>
                                {isSaving ? 'Kaydediliyor...' : 'Yorumu Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
