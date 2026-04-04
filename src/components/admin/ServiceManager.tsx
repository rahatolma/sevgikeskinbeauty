"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Star, CheckCircle, XCircle, ListTree } from 'lucide-react';
import styles from './ServiceManager.module.css';
import { supabase } from '@/lib/supabase';

// Types matching the Supabase Schema
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
  price: string | null; // Using string to handle numeric safely in UI
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export default function ServiceManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active category selection to show services for that category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        // Fallback to Development Mock if credentials missing
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

  const onDragEndCategory = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state optimistic
    const updatedItems = items.map((item, index) => ({ ...item, sort_order: index }));
    setCategories(updatedItems);

    // Send update to Supabase
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
    
    // Filter services for the currently selected category
    const categoryServices = services.filter(s => s.category_id === selectedCategoryId).sort((a,b) => a.sort_order - b.sort_order);
    const [reorderedItem] = categoryServices.splice(result.source.index, 1);
    categoryServices.splice(result.destination.index, 0, reorderedItem);

    const updatedCategoryServices = categoryServices.map((item, index) => ({ ...item, sort_order: index }));
    
    // Merge back into main services array
    const newServices = services.map(s => {
      if (s.category_id === selectedCategoryId) {
        return updatedCategoryServices.find(u => u.id === s.id) || s;
      }
      return s;
    });
    setServices(newServices);

    // Send update to Supabase
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
            <button className={styles.btnPrimary}><Plus size={16} /> Yeni</button>
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
                            <button className={styles.iconBtn}><Edit2 size={14} /></button>
                            <button className={styles.iconBtnDanger}><Trash2 size={14} /></button>
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
              <button className={styles.btnPrimary}><Plus size={16} /> Yeni Servis</button>
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
                              <button className={styles.iconBtn}><Edit2 size={14} /></button>
                              <button className={styles.iconBtnDanger}><Trash2 size={14} /></button>
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
    </div>
  );
}
