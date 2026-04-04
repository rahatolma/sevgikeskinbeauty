"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, MoreHorizontal, X, User } from "lucide-react";
import styles from "./SpecialistManager.module.css";

type Service = {
    id: string;
    name: string;
    category_id: string | null;
};

type Category = {
    id: string;
    name: string;
};

type Specialist = {
    id: string;
    full_name: string;
    role_title: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_active: boolean;
    sort_order: number;
    services?: Service[]; 
};

export default function SpecialistManager() {
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    
    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Specialist>>({
        is_active: true,
        sort_order: 0
    });
    // Array of checked service IDs
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch everything
            const { data: specs, error: errSpec } = await supabase.from('specialists').select('*').order('sort_order', {ascending:true});
            const { data: specSrv, error: errSpecSrv } = await supabase.from('specialist_services').select('specialist_id, service_id');
            const { data: srvs, error: errSrv } = await supabase.from('services').select('id, name, category_id');
            const { data: cats, error: errCat } = await supabase.from('service_categories').select('id, name');

            if(errSpec) throw errSpec;

            setAllServices(srvs || []);
            setAllCategories(cats || []);

            // Hydrate specialists with their services
            const hydrated = (specs || []).map(s => {
                const assignedSrvIds = (specSrv || []).filter(ss => ss.specialist_id === s.id).map(ss => ss.service_id);
                const srvObjs = (srvs || []).filter(srv => assignedSrvIds.includes(srv.id));
                return { ...s, services: srvObjs };
            });

            setSpecialists(hydrated);
        } catch(err) {
            console.error("Ops! Veri çekilemedi:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDrawer = () => {
        setFormData({ is_active: true, sort_order: 0 });
        setSelectedServices([]);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (s: Specialist) => {
        setFormData({
            id: s.id,
            full_name: s.full_name,
            role_title: s.role_title,
            bio: s.bio,
            avatar_url: s.avatar_url,
            is_active: s.is_active,
            sort_order: s.sort_order
        });
        setSelectedServices(s.services?.map(srv => srv.id) || []);
        setIsDrawerOpen(true);
    };

    const handleCheckboxChange = (serviceId: string, checked: boolean) => {
        if (checked) {
            setSelectedServices(prev => [...prev, serviceId]);
        } else {
            setSelectedServices(prev => prev.filter(id => id !== serviceId));
        }
    };

    const toggleStatus = async (s: Specialist) => {
        try {
            const { error } = await supabase.from('specialists').update({ is_active: !s.is_active }).eq('id', s.id);
            if(error) throw error;
            fetchData();
        } catch(e) {
            alert("Durum güncellenemedi.");
        }
    };

    const saveSpecialist = async () => {
        if (!formData.full_name) {
            alert("Lütfen uzman adını girin!");
            return;
        }

        setIsSaving(true);
        try {
            let specialistId = formData.id;

            // 1. Upsert Specialist Data
            if (specialistId) {
                const { error } = await supabase.from('specialists').update({
                    full_name: formData.full_name,
                    role_title: formData.role_title,
                    bio: formData.bio,
                    is_active: formData.is_active,
                    sort_order: formData.sort_order
                }).eq('id', specialistId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('specialists').insert([{
                    full_name: formData.full_name,
                    role_title: formData.role_title,
                    bio: formData.bio,
                    is_active: formData.is_active,
                    sort_order: formData.sort_order || 0
                }]).select();
                if (error) throw error;
                specialistId = data[0].id;
            }

            // 2. Manage Service Mappings (Delete all existing -> Insert new ones)
            if (specialistId) {
                await supabase.from('specialist_services').delete().eq('specialist_id', specialistId);
                
                if (selectedServices.length > 0) {
                    const mappings = selectedServices.map(srvId => ({
                        specialist_id: specialistId,
                        service_id: srvId
                    }));
                    await supabase.from('specialist_services').insert(mappings);
                }
            }

            setIsDrawerOpen(false);
            fetchData();

        } catch(err) {
            console.error("Ops! Uzman kaydedilemedi:", err);
            alert("Kaydedilemedi, bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    // Derived Metrics
    const totalCount = specialists.length;
    const activeCount = specialists.filter(s => s.is_active).length;
    
    return (
        <div className={styles.managerContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Uzman Yönetimi</h1>
                <button className={styles.btnNew} onClick={openCreateDrawer}>
                    <PlusCircle size={18} />
                    Yeni Uzman Ekle
                </button>
            </div>

            {/* Top Metrics Row */}
            <div className={styles.overviewRow}>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>Toplam Uzman</span>
                    <span className={styles.overviewValue}>{totalCount}</span>
                </div>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>Aktif Görevde</span>
                    <span className={styles.overviewValue}>{activeCount}</span>
                </div>
            </div>

            {/* Main Cards Grid */}
            {isLoading ? (
                <div style={{color:'#6b7280'}}>Yükleniyor...</div>
            ) : (
                <div className={styles.grid}>
                    {specialists.map(s => (
                        <div key={s.id} className={styles.card}>
                            
                            <div className={styles.cardTop}>
                                <div className={styles.profileSection}>
                                    <div className={styles.avatar}>
                                        <User size={24} />
                                    </div>
                                    <div className={styles.profileInfo}>
                                        <div className={styles.profileName}>{s.full_name}</div>
                                        <div className={styles.profileTitle}>{s.role_title || '-'}</div>
                                    </div>
                                </div>
                                <div className={styles.statusSection}>
                                    <span className={`${styles.badge} ${s.is_active ? styles.badgeActive : styles.badgePassive}`}>
                                        {s.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardMiddle}>
                                <div className={styles.serviceCount}>{s.services?.length || 0} Hizmet Atandı</div>
                                <div className={styles.tagsContainer}>
                                    {(s.services || []).slice(0, 3).map(srv => (
                                        <span key={srv.id} className={styles.tag}>{srv.name}</span>
                                    ))}
                                    {(s.services && s.services.length > 3) && (
                                        <span className={styles.tag}>+{s.services.length - 3} Diğer</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardBottom}>
                                <button className={styles.cardBtn} onClick={() => openEditDrawer(s)}>Düzenle</button>
                                <button className={styles.cardBtn} onClick={() => toggleStatus(s)}>
                                    {s.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* DRAWER FORM */}
            {isDrawerOpen && (
                <div className={styles.drawerOverlay} onClick={(e) => { if(e.target === e.currentTarget) setIsDrawerOpen(false); }}>
                    <div className={styles.drawer}>
                        <div className={styles.drawerHeader}>
                            <h2 className={styles.drawerTitle}>{formData.id ? 'Uzmanı Düzenle' : 'Yeni Uzman'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}><X size={24} /></button>
                        </div>
                        
                        <div className={styles.drawerContent}>
                            {/* Bölüm 1: Temel Bilgiler */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ad Soyad</label>
                                <input type="text" className={styles.formInput} value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Örn: Kardelen Yılmaz" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ünvan</label>
                                <input type="text" className={styles.formInput} value={formData.role_title || ''} onChange={e => setFormData({...formData, role_title: e.target.value})} placeholder="Örn: Cilt Uzmanı" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Kısa Bio</label>
                                <textarea className={styles.formInput} rows={3} value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Kısaca uzmanlık alanları..." />
                            </div>
                            
                            <div className={styles.formGroup} style={{flexDirection:'row', alignItems:'center', gap:'1rem', marginTop:'1rem', paddingBottom:'1rem', borderBottom:'1px solid #e5e7eb'}}>
                                <input type="checkbox" id="activeToggle" style={{width:'18px', height:'18px'}} checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                <label htmlFor="activeToggle" className={styles.formLabel} style={{cursor:'pointer'}}>Personel Aktif Gözüksün</label>
                            </div>

                            {/* Bölüm 2: Hizmet Eşlemesi (CRITICAL) */}
                            <div>
                                <h3 style={{fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:'1rem'}}>Hizmet Yetkileri (Eşleştirme)</h3>
                                <p style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'1.5rem'}}>Uzman sadece aşağıda işaretlediğiniz hizmetlerde randevu alabilir.</p>

                                <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                                    {allCategories.map(cat => {
                                        const catServices = allServices.filter(s => s.category_id === cat.id);
                                        if (catServices.length === 0) return null;

                                        return (
                                            <div key={cat.id} className={styles.hierarchyBlock}>
                                                <div className={styles.catTitle}>{cat.name}</div>
                                                <div className={styles.checkboxList}>
                                                    {catServices.map(srv => (
                                                        <label key={srv.id} className={styles.checkboxRow}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedServices.includes(srv.id)}
                                                                onChange={(e) => handleCheckboxChange(srv.id, e.target.checked)}
                                                            />
                                                            {srv.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerFooter}>
                            <button className={styles.btnPrimary} onClick={saveSpecialist} disabled={isSaving}>
                                {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Eşleştir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
