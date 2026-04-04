"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Star, ListTree, X } from 'lucide-react';
import styles from './ServiceManager.module.css';
import { supabase } from '@/lib/supabase';

type Category = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  icon_name: string | null;
  sort_order: number;
};

type Service = {
  id: string;
  category_id: string;
  name: string;
  duration_minutes: number;
  short_description: string;
  long_description: string | null;
  price_type: 'fixed' | 'custom';
  price: string | null; 
  is_active: boolean;
  is_featured: boolean;
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
        setCategories([
          { id: 'cat-1', name: 'Cilt Bakımı & Yenileyici Ritüeller', description: 'Özel uygulamalar', cover_image_url: null, icon_name: '✨', sort_order: 0 },
          { id: 'cat-2', name: 'Yüz Masajları', description: 'Rahatlatıcı masajlar', cover_image_url: null, icon_name: '💆‍♀️', sort_order: 1 }
        ]);
        setServices([
          { id: 'srv-1', category_id: 'cat-1', name: 'Anti-Aging Cilt Bakımı', duration_minutes: 60, short_description: 'Kırışıklık azaltır', long_description: '', price_type: 'custom', price: null, is_active: true, is_featured: true, sort_order: 0 },
          { id: 'srv-2', category_id: 'cat-1', name: 'Oxy Hydrafacial', duration_minutes: 75, short_description: 'Nemlendirir', long_description: '', price_type: 'fixed', price: '1500', is_active: true, is_featured: false, sort_order: 1 }
        ]);
        setError("Supabase bağlantısı kurulamadı. Örnek veri gösteriliyor.");
      } else {
        const { data: cats, error: catError } = await supabase.from('service_categories').select('*').order('sort_order', { ascending: true });
        if (catError) throw catError;
        
        const { data: srvs, error: srvError } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
        if (srvError) throw srvError;

        setCategories(cats || []);
        setServices(srvs || []);
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
    setEditingCat({ name: '', icon_name: '✨', description: '' });
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
    const slug = generateSlug(editingCat.name);
    
    const payload = {
      name: editingCat.name,
      slug: slug,
      icon_name: editingCat.icon_name || '✨',
      short_description: editingCat.description || '',
      booking_description: editingCat.description || '',
      is_active: true,
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
      } else {
        // Mock fallback update
        if (isEditing) {
          setCategories(cats => cats.map(c => c.id === editingCat.id ? { ...c, ...editingCat } as Category : c));
        } else {
          setCategories([...categories, { ...editingCat, id: 'cat-' + Date.now(), sort_order: categories.length } as Category]);
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
      category_id: selectedCategoryId!,
      duration_minutes: 60,
      price_type: 'custom',
      price: '',
      short_description: '',
      is_active: true,
      is_featured: false
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
    const slug = generateSlug(editingSrv.name);
    
    const payload = {
      name: editingSrv.name,
      slug: slug,
      category_id: editingSrv.category_id,
      duration_minutes: Number(editingSrv.duration_minutes),
      price_type: editingSrv.price_type || 'custom',
      price: editingSrv.price_type === 'custom' ? null : Number(editingSrv.price || 0),
      short_description: editingSrv.short_description || '',
      is_active: editingSrv.is_active ?? true,
      is_featured: editingSrv.is_featured ?? false,
      sort_order: isEditing ? editingSrv.sort_order : services.filter(s => s.category_id === editingSrv.category_id).length
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
      } else {
        // Mock fallback update
        if (isEditing) {
          setServices(srvs => srvs.map(s => s.id === editingSrv.id ? { ...s, ...editingSrv } as Service : s));
        } else {
          setServices([...services, { ...editingSrv, id: 'srv-' + Date.now(), sort_order: 99 } as Service]);
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


  if (isLoading) return <div className={styles.loading}>Yükleniyor...</div>;

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
                              <strong>{cat.name}</strong>
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
                ? `${categories.find(c => c.id === selectedCategoryId)?.name || ''} Servisleri` 
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
                          >
                            <div {...provided.dragHandleProps} className={styles.dragHandle}>
                              <GripVertical size={16} />
                            </div>
                            <div className={styles.itemContent}>
                              <div className={styles.itemText}>
                                <div className={styles.titleRow}>
                                  <strong>{srv.name}</strong>
                                  {srv.is_featured && <span className={styles.badgeFeature}><Star size={10} /> Önerilen</span>}
                                  {!srv.is_active && <span className={styles.badgePassive}>Pasif</span>}
                                </div>
                                <div className={styles.metaRow}>
                                  <span>{srv.duration_minutes} dk</span>
                                  <span className={styles.dot}>•</span>
                                  <span>{srv.price_type === 'custom' ? 'Kişiye Özel' : `₺${srv.price}`}</span>
                                </div>
                              </div>
                            </div>
                            <div className={styles.itemActions}>
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

      {/* CATEGORY MODAL */}
      {catModalOpen && editingCat && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCat.id ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h2>
              <button className={styles.closeBtn} onClick={() => setCatModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Kategori İsmi</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="Örn: Fraksiyonel Lazer" 
                  value={editingCat.name || ''} 
                  onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>İkon (Emoji vb.)</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="✨" 
                  value={editingCat.icon_name || ''} 
                  onChange={e => setEditingCat({...editingCat, icon_name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Açıklama</label>
                <textarea 
                  className={styles.formTextarea} 
                  placeholder="Kategori hakkında kısa bilgi..." 
                  value={editingCat.description || ''} 
                  onChange={e => setEditingCat({...editingCat, description: e.target.value})}
                />
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

      {/* SERVICE MODAL */}
      {srvModalOpen && editingSrv && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingSrv.id ? 'Servisi Düzenle' : 'Yeni Servis Ekle'}</h2>
              <button className={styles.closeBtn} onClick={() => setSrvModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Servis İsmi</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={editingSrv.name || ''} 
                  onChange={e => setEditingSrv({...editingSrv, name: e.target.value})}
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
                  <label>Fiyat Tipi</label>
                  <select 
                    className={styles.formSelect}
                    value={editingSrv.price_type || 'custom'}
                    onChange={e => setEditingSrv({...editingSrv, price_type: e.target.value as 'fixed' | 'custom'})}
                  >
                    <option value="custom">Kişiye Özel Fiyatlandırma</option>
                    <option value="fixed">Sabit Fiyat</option>
                  </select>
                </div>
              </div>

              {editingSrv.price_type === 'fixed' && (
                <div className={styles.formGroup}>
                  <label>Fiyat (₺)</label>
                  <input 
                    type="number" 
                    className={styles.formInput} 
                    value={editingSrv.price || ''} 
                    onChange={e => setEditingSrv({...editingSrv, price: e.target.value})}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Kısa Açıklama</label>
                <textarea 
                  className={styles.formTextarea} 
                  value={editingSrv.short_description || ''} 
                  onChange={e => setEditingSrv({...editingSrv, short_description: e.target.value})}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="isFeatured" 
                  checked={editingSrv.is_featured || false} 
                  onChange={e => setEditingSrv({...editingSrv, is_featured: e.target.checked})}
                />
                <label htmlFor="isFeatured">⭐ Önerilen Hizmet (Ön planda gösterilir)</label>
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
