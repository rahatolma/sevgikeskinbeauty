"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Star, ListTree, X, Award, ChevronRight } from 'lucide-react';
import styles from './ServiceManager.module.css';
import { supabase } from '@/lib/supabase';

// EXHAUSTIVE CATEGORY SCHEMA
type Category = {
  id: string;
  slug: string;
  name: string;
  marketing_title: string | null;
  services_page_intro: string | null;
  short_description: string | null;
  booking_description: string | null;
  cover_image_url: string | null;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
};

// EXHAUSTIVE SERVICE SCHEMA
type Service = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  short_description: string;
  long_description: string | null;
  price_type: 'fixed' | 'custom';
  price: string | null; 
  is_active: boolean;
  is_featured: boolean;
  is_hero: boolean;
  sort_order: number;
};

// Simple slug generator helper
const generateSlug = (text: string) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export default function ServiceManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modal States
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [srvModalOpen, setSrvModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [editingSrv, setEditingSrv] = useState<Partial<Service> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        setError("Supabase bağlantısı kurulamadı. Gerçek veritabanına bağlanılamadı.");
      } else {
        const { data: cats, error: catError } = await supabase.from('service_categories').select('*').order('sort_order', { ascending: true });
        if (catError) throw catError;
        
        const { data: srvs, error: srvError } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
        if (srvError) throw srvError;

        setCategories(cats || []);
        setServices(srvs || []);
        
        if (cats && cats.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(cats[0].id);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Veri çekilirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DRAG AND DROP ---
  const onDragEndCategory = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({ ...item, sort_order: index }));
    setCategories(updatedItems);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        for (const item of updatedItems) {
           await supabase.from('service_categories').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      }
    } catch (err) {
      console.error("Sıralama güncellenirken hata oluştu");
    }
  };

  const onDragEndService = async (result: DropResult) => {
    if (!result.destination) return;
    
    // Sort local slice before mapping properly
    const categoryServices = services.filter(s => s.category_id === selectedCategoryId).sort((a,b) => a.sort_order - b.sort_order);
    const [reorderedItem] = categoryServices.splice(result.source.index, 1);
    categoryServices.splice(result.destination.index, 0, reorderedItem);

    const updatedCategoryServices = categoryServices.map((item, index) => ({ ...item, sort_order: index }));
    
    const newServices = services.map(s => {
      if (s.category_id === selectedCategoryId) {
        return updatedCategoryServices.find(u => u.id === s.id) || s;
      }
      return s;
    });
    setServices(newServices);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        // Send bulk individual requests for sort order updates
        for (const item of updatedCategoryServices) {
           await supabase.from('services').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      }
    } catch (err) {
      console.error("Servis sıralaması güncellenirken hata");
    }
  };

  // --- CATEGORY CRUD ---
  const openNewCategoryModal = () => {
    setEditingCat({ 
        name: '', 
        slug: '',
        marketing_title: '',
        services_page_intro: '',
        short_description: '',
        booking_description: '',
        icon_name: '✨', 
        cover_image_url: '',
        is_active: true
    });
    setCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCat(cat);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCat?.name) return;
    setIsSubmitting(true);
    
    const isEditing = !!editingCat.id;
    const finalSlug = editingCat.slug || generateSlug(editingCat.name);
    
    const payload = {
      name: editingCat.name,
      slug: finalSlug,
      marketing_title: editingCat.marketing_title || null,
      services_page_intro: editingCat.services_page_intro || null,
      short_description: editingCat.short_description || null,
      booking_description: editingCat.booking_description || null,
      icon_name: editingCat.icon_name || '✨',
      cover_image_url: editingCat.cover_image_url || null,
      is_active: editingCat.is_active ?? true,
      sort_order: isEditing ? editingCat.sort_order : categories.length
    };

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        if (isEditing) {
          const { data, error } = await supabase.from('service_categories').update(payload).eq('id', editingCat.id).select();
          if (error) throw error;
          if (data) {
            setCategories(cats => cats.map(c => c.id === data[0].id ? data[0] : c));
          }
        } else {
          const { data, error } = await supabase.from('service_categories').insert([payload]).select();
          if (error) throw error;
          if (data) {
            setCategories([...categories, data[0]]);
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Hata oluştu.");
    } finally {
      setIsSubmitting(false);
      setCatModalOpen(false);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz? (İçindeki servisler de silinir)")) return;
    
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        const { error } = await supabase.from('service_categories').delete().eq('id', id);
        if (error) throw error;
      }
      setCategories(cats => cats.filter(c => c.id !== id));
      if (selectedCategoryId === id) setSelectedCategoryId(null);
    } catch (e: any) {
      alert(e.message || "Silinirken hata oluştu.");
    }
  };

  // --- SERVICE CRUD ---
  const openNewServiceModal = () => {
    setEditingSrv({ 
      name: '', 
      slug: '',
      category_id: selectedCategoryId!,
      duration_minutes: 60,
      price_type: 'custom',
      price: '',
      short_description: '',
      long_description: '',
      is_active: true,
      is_featured: false,
      is_hero: false,
      sort_order: services.filter(s => s.category_id === selectedCategoryId).length
    });
    setSrvModalOpen(true);
  };

  const openEditServiceModal = (srv: Service, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSrv(srv);
    setSrvModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!editingSrv?.name || !editingSrv.category_id) return;
    setIsSubmitting(true);
    
    const isEditing = !!editingSrv.id;
    const finalSlug = editingSrv.slug || generateSlug(editingSrv.name);
    
    const payload = {
      name: editingSrv.name,
      slug: finalSlug,
      category_id: editingSrv.category_id,
      duration_minutes: Number(editingSrv.duration_minutes),
      price_type: editingSrv.price_type || 'custom',
      price: editingSrv.price_type === 'custom' ? null : Number(editingSrv.price || 0),
      short_description: editingSrv.short_description || '',
      long_description: editingSrv.long_description || null,
      is_active: editingSrv.is_active ?? true,
      is_featured: editingSrv.is_featured ?? false,
      is_hero: editingSrv.is_hero ?? false,
      sort_order: editingSrv.sort_order ?? 0
    };

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        if (isEditing) {
          const { data, error } = await supabase.from('services').update(payload).eq('id', editingSrv.id).select();
          if (error) throw error;
          if (data) {
            setServices(srvs => srvs.map(s => s.id === data[0].id ? data[0] : s));
          }
        } else {
          const { data, error } = await supabase.from('services').insert([payload]).select();
          if (error) throw error;
          if (data) {
            setServices([...services, data[0]]);
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Hata oluştu.");
    } finally {
      setIsSubmitting(false);
      setSrvModalOpen(false);
    }
  };

  const handleDeleteService = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bu servisi silmek istediğinizden emin misiniz?")) return;
    
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
      }
      setServices(srvs => srvs.filter(s => s.id !== id));
    } catch (e: any) {
      alert(e.message || "Silinirken hata oluştu.");
    }
  };


  if (isLoading) return <div className={styles.loading}>Sistem Yükleniyor...</div>;

  const currentServices = services.filter(s => s.category_id === selectedCategoryId).sort((a,b) => a.sort_order - b.sort_order);

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorAlert}>{error}</div>}
      
      <div className={styles.splitGrid}>
        {/* Sol Panel: Kategoriler */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Hizmet Kategorileri</h3>
            <button className={styles.btnPrimary} onClick={openNewCategoryModal}><Plus size={16} /> Yeni</button>
          </div>
          
          <DragDropContext onDragEnd={onDragEndCategory}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.list}>
                  {categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${styles.listItem} ${selectedCategoryId === cat.id ? styles.listItemSelected : ''} ${snapshot.isDragging ? styles.dragging : ''}`}
                          onClick={() => setSelectedCategoryId(cat.id)}
                        >
                          <div {...provided.dragHandleProps} className={styles.dragHandle}>
                            <GripVertical size={16} />
                          </div>
                          <div className={styles.itemContent}>
                            <span className={styles.itemIcon}>{cat.icon_name}</span>
                            <div className={styles.itemText}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <strong>{cat.name}</strong>
                                {!cat.is_active && <span className={styles.badgePassive}>Gizli</span>}
                              </div>
                              <small>{services.filter(s => s.category_id === cat.id).length} Hizmet</small>
                            </div>
                          </div>
                          <div className={styles.itemActions}>
                            <button className={styles.iconBtn} onClick={(e) => openEditCategoryModal(cat, e)}><Edit2 size={14} /></button>
                            <button className={styles.iconBtnDanger} onClick={(e) => handleDeleteCategory(cat.id, e)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Sağ Panel: Alt Servisler */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>
              {selectedCategoryId 
                ? <>{categories.find(c => c.id === selectedCategoryId)?.name || ''} <ChevronRight size={16} className={styles.breadcrumbSrv}/> <span className={styles.breadcrumbSrv}> Alt Servisler</span></>
                : 'Kategori Seçin'}
            </h3>
            {selectedCategoryId && (
              <button className={styles.btnPrimary} onClick={openNewServiceModal}><Plus size={16} /> Yeni Servis</button>
            )}
          </div>

          {!selectedCategoryId ? (
            <div className={styles.emptyState}>
              <ListTree size={48} className={styles.emptyIcon} />
              <p>Servislerini yönetmek için soldan bir kategori seçin.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEndService}>
              <Droppable droppableId="services">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className={styles.list}>
                    {currentServices.length === 0 && (
                      <div className={styles.emptyStateSimple}>Bu kategoride henüz servis yok.</div>
                    )}
                    {currentServices.map((srv, index) => (
                      <Draggable key={srv.id} draggableId={srv.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${styles.listItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                            style={{ opacity: srv.is_active ? 1 : 0.6 }}
                          >
                            <div {...provided.dragHandleProps} className={styles.dragHandle}>
                              <GripVertical size={16} />
                            </div>
                            <div className={styles.itemContent}>
                              <div className={styles.itemText}>
                                <div className={styles.titleRow}>
                                  <strong>{srv.name}</strong>
                                  {srv.is_hero && <span className={styles.badgeHero}><Award size={10} /> Hero</span>}
                                  {srv.is_featured && <span className={styles.badgeFeature}><Star size={10} /> Önerilen</span>}
                                  {!srv.is_active && <span className={styles.badgePassive}>Pasif</span>}
                                </div>
                                <div className={styles.metaRow}>
                                  <span>{srv.duration_minutes} dk</span>
                                  <span className={styles.dot}>•</span>
                                  <span>{srv.price_type === 'custom' ? 'Kişiye Özel' : `₺${srv.price}`}</span>
                                  {srv.sort_order !== undefined && (
                                    <>
                                        <span className={styles.dot}>•</span>
                                        <span>Sıra: {srv.sort_order}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={styles.itemActions} style={{ opacity: snapshot.isDragging ? 0 : 1 }}>
                              <button className={styles.iconBtn} onClick={(e) => openEditServiceModal(srv, e)}><Edit2 size={14} /></button>
                              <button className={styles.iconBtnDanger} onClick={(e) => handleDeleteService(srv.id, e)}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* EXTENDED CATEGORY MODAL WITH PREVIEW */}
      {catModalOpen && editingCat && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCat.id ? 'Kategoriyi Düzenle' : 'Yeni Kategori '}</h2>
              <button className={styles.closeBtn} onClick={() => setCatModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBodySplit}>
              {/* Sol: Form */}
              <div className={styles.formColumn}>
                
                <div className={styles.checkboxGroup}>
                    <input 
                      type="checkbox" 
                      id="catIsActive" 
                      checked={editingCat.is_active ?? true} 
                      onChange={e => setEditingCat({...editingCat, is_active: e.target.checked})}
                    />
                    <label htmlFor="catIsActive">Kategori Aktif (Rezervasyon Ekranında Gözükür)</label>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 60px', gap: '1rem'}}>
                    <div className={styles.formGroup}>
                        <label>Kategori Ana İsmi *</label>
                        <input 
                            type="text" 
                            className={styles.formInput} 
                            placeholder="Örn: Fraksiyonel Lazer" 
                            value={editingCat.name || ''} 
                            onChange={e => setEditingCat({...editingCat, name: e.target.value, slug: generateSlug(e.target.value)})}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>İkon</label>
                        <input 
                            type="text" 
                            className={styles.formInput} 
                            placeholder="✨" 
                            style={{ textAlign: 'center' }}
                            value={editingCat.icon_name || ''} 
                            onChange={e => setEditingCat({...editingCat, icon_name: e.target.value})}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                  <label>SEO URL (Slug)</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    style={{ backgroundColor: '#f9fafb' }}
                    value={editingCat.slug || ''} 
                    onChange={e => setEditingCat({...editingCat, slug: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Pazarlama Başlığı (Marketing Title)</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="Anasayfa veya Üst Menüler İçin Kısa Alt Başlık" 
                    value={editingCat.marketing_title || ''} 
                    onChange={e => setEditingCat({...editingCat, marketing_title: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Hizmetler Sayfası Giriş Metni (Intro / Hook)</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="Örn: Cildinizde yorgunluk, matlık veya elastikiyet kaybı mı var?" 
                    value={editingCat.services_page_intro || ''} 
                    onChange={e => setEditingCat({...editingCat, services_page_intro: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Randevu Ekranı Kategori Açıklaması</label>
                  <textarea 
                    className={styles.formTextarea} 
                    style={{ minHeight: '60px' }}
                    placeholder="Rezervasyon ekranında kategori isminin altında gözükecek ikna edici açıklama." 
                    value={editingCat.booking_description || ''} 
                    onChange={e => setEditingCat({...editingCat, booking_description: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Kapak Görseli URL (Opsiyonel)</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="/images/kategori-kapak.jpg" 
                    value={editingCat.cover_image_url || ''} 
                    onChange={e => setEditingCat({...editingCat, cover_image_url: e.target.value})}
                  />
                </div>

              </div>

              {/* Sağ: Canlı Önizleme */}
              <div className={styles.previewColumn}>
                <div className={styles.previewLabel}>Canlı Önizleme (Randevu UI)</div>
                <div style={{
                    padding: '1rem', 
                    background: 'white', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderLeft: '4px solid #111827'
                }}>
                   <div style={{ fontSize: '2rem' }}>{editingCat.icon_name || '✨'}</div>
                   <div>
                       <div style={{ fontWeight: 600, color: '#111827' }}>{editingCat.name || 'Yeni Kategori'}</div>
                       <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', lineHeight: 1.4 }}>
                           {editingCat.booking_description || 'Açıklama girilmediğinde boş görünecek.'}
                       </div>
                   </div>
                </div>

                <div className={styles.previewLabel} style={{ marginTop: '1rem' }}>Sistem Kontrolü</div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.6 }}>
                    <div><strong>Durum:</strong> {editingCat.is_active ? 'Görünür 🟢' : 'Görünmez 🔴'}</div>
                    <div><strong>URL Yolu:</strong> /hizmet/{editingCat.slug || 'slug'}</div>
                    <div><strong>Pazarlama:</strong> {editingCat.marketing_title || '-'}</div>
                    <div><strong>Site İçi Giriş:</strong> {editingCat.services_page_intro || '-'}</div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setCatModalOpen(false)}>İptal</button>
              <button className={styles.btnSubmit} disabled={isSubmitting || !editingCat.name} onClick={handleSaveCategory}>
                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTENDED SERVICE MODAL WITH PREVIEW */}
      {srvModalOpen && editingSrv && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingSrv.id ? 'Servisi Düzenle' : 'Yeni Servis Ekle'}</h2>
              <button className={styles.closeBtn} onClick={() => setSrvModalOpen(false)}><X size={20} /></button>
            </div>

            <div className={styles.modalBodySplit}>
              {/* Sol: Form */}
              <div className={styles.formColumn}>

                <div className={styles.checkboxGroup}>
                    <input 
                      type="checkbox" 
                      id="srvIsActive" 
                      checked={editingSrv.is_active ?? true} 
                      onChange={e => setEditingSrv({...editingSrv, is_active: e.target.checked})}
                    />
                    <label htmlFor="srvIsActive">Servis Aktif (Listelerde Göster)</label>
                </div>

                <div className={styles.formGroup}>
                  <label>Servis İsmi *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="Örn: Anti-Aging Cilt Bakımı"
                    value={editingSrv.name || ''} 
                    onChange={e => setEditingSrv({...editingSrv, name: e.target.value, slug: generateSlug(e.target.value)})}
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className={styles.formGroup}>
                    <label>Süre (Dakika)</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      value={editingSrv.duration_minutes || ''} 
                      onChange={e => setEditingSrv({...editingSrv, duration_minutes: Number(e.target.value)})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Sıralama Priority (Manuel)</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      value={editingSrv.sort_order ?? 0} 
                      onChange={e => setEditingSrv({...editingSrv, sort_order: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: editingSrv.price_type === 'fixed' ? '1fr 1fr' : '1fr', gap: '1rem', background: '#f3f4f6', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
                  <div className={styles.formGroup}>
                    <label>Fiyatlandırma Stratejisi</label>
                    <select 
                      className={styles.formSelect}
                      style={{ borderColor: '#6b7280' }}
                      value={editingSrv.price_type || 'custom'}
                      onChange={e => setEditingSrv({...editingSrv, price_type: e.target.value as 'fixed' | 'custom'})}
                    >
                      <option value="custom">Kişiye Özel Fiyat (Fiyat Gizlenir)</option>
                      <option value="fixed">Sabit Fiyat (₺ Rakam Göster)</option>
                    </select>
                  </div>
                  {editingSrv.price_type === 'fixed' && (
                    <div className={styles.formGroup}>
                      <label>Fiyat (₺)</label>
                      <input 
                        type="number" 
                        className={styles.formInput} 
                        placeholder="Örn: 2500"
                        style={{ fontWeight: 'bold' }}
                        value={editingSrv.price || ''} 
                        onChange={e => setEditingSrv({...editingSrv, price: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Kısa Açıklama (Kart Gövdesi)</label>
                  <textarea 
                    className={styles.formTextarea} 
                    style={{ minHeight: '60px' }}
                    value={editingSrv.short_description || ''} 
                    onChange={e => setEditingSrv({...editingSrv, short_description: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Detaylı Açıklama (Gelecekte Detay Sayfası için)</label>
                  <textarea 
                    className={styles.formTextarea} 
                    placeholder="Blog yazısı gibi detaylı işlem anatomisi..."
                    value={editingSrv.long_description || ''} 
                    onChange={e => setEditingSrv({...editingSrv, long_description: e.target.value})}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', background: '#fefce8', padding: '1rem', borderRadius: '8px', border: '1px solid #fef08a' }}>
                    <div className={styles.checkboxGroup}>
                        <input 
                        type="checkbox" 
                        id="isFeatured" 
                        checked={editingSrv.is_featured || false} 
                        onChange={e => setEditingSrv({...editingSrv, is_featured: e.target.checked})}
                        />
                        <label htmlFor="isFeatured">⭐ Önerilen Hizmet</label>
                    </div>
                    <div className={styles.checkboxGroup}>
                        <input 
                        type="checkbox" 
                        id="isHero" 
                        checked={editingSrv.is_hero || false} 
                        onChange={e => setEditingSrv({...editingSrv, is_hero: e.target.checked})}
                        />
                        <label htmlFor="isHero">🏆 Hero / Vitrin</label>
                    </div>
                </div>

              </div>

              {/* Sağ: Canlı Önizleme */}
              <div className={styles.previewColumn}>
                <div className={styles.previewLabel}>Canlı Önizleme (Randevu Satırı)</div>
                <div style={{
                    padding: '1rem', 
                    background: 'white', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{editingSrv.name || 'Servis İsmi'}</span>
                                {editingSrv.is_hero && <span className={styles.badgeHero}><Award size={10} /> Hero</span>}
                                {editingSrv.is_featured && <span className={styles.badgeFeature}><Star size={10} /> Önerilen</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>{editingSrv.duration_minutes || 0} dk. İşlem Süresi</div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                            {editingSrv.price_type === 'custom' ? 'Kişiye Özel' : `₺${editingSrv.price || 0}`}
                        </div>
                   </div>
                   <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.5rem', lineHeight: 1.5 }}>
                       {editingSrv.short_description || 'Randevu seçeneklerinde görünecek olan kısa servis açıklaması...'}
                   </div>
                   <button style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                       + Ekle
                   </button>
                </div>
              </div>

            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setSrvModalOpen(false)}>İptal</button>
              <button className={styles.btnSubmit} disabled={isSubmitting || !editingSrv.name} onClick={handleSaveService}>
                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
