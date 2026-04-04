"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./hizmetlerimiz.module.css";

// DB TYPES
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

type Service = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  short_description: string;
  price_type: 'fixed' | 'custom';
  price: string | null; 
  is_active: boolean;
  is_featured: boolean;
  is_hero: boolean;
  sort_order: number;
};

export default function HizmetlerimizPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
        // FALLBACK MOCK DATA IF DB IS ABSENT
        setCategories([
          { 
            id: 'cilt-bakimlari', name: 'Cilt Bakımları', slug: 'cilt-bakimlari', 
            marketing_title: 'Cilt Yenileme & Gençleştirme',
            services_page_intro: 'Cildinizde yorgunluk, matlık veya elastikiyet kaybı mı var?', 
            booking_description: 'Cildinizin ihtiyaç duyduğu tüm mineralleri ve vitaminleri hücre düzeyinde onararak...', 
            short_description: null, cover_image_url: null, icon_name: '✨', sort_order: 0, is_active: true 
          },
          { 
            id: 'vucut-bakimi', name: 'Vücut Bakımları', slug: 'vucut-bakimi', 
            marketing_title: 'Sıkı & Pürüzsüz',
            services_page_intro: 'Aynadaki silüetinizde daha pürüzsüz ve sıkı kıvrımlar görmek ister misiniz?', 
            booking_description: 'Selülit protokolleri ve yoğun sıkılaştırıcı killerle bedeninizi baştan yaratıyoruz.', 
            short_description: null, cover_image_url: null, icon_name: '🧘‍♀️', sort_order: 1, is_active: true 
          }
        ]);
        setServices([
          { id: '1', category_id: 'cilt-bakimlari', slug: '', name: 'Anti Aging Cilt Bakımı', duration_minutes: 60, short_description: 'Daha sıkı, canlı ve genç bir cilt görünümü sağlar', price_type: 'custom', price: null, is_active: true, is_featured: false, is_hero: false, sort_order: 0 },
          { id: '2', category_id: 'cilt-bakimlari', slug: '', name: 'Medikal Cilt Analizi & Bakım', duration_minutes: 45, short_description: 'Bariyer onarımı sağlayan temel derinlemesine temizlik', price_type: 'fixed', price: '1500', is_active: true, is_featured: false, is_hero: false, sort_order: 1 },
          { id: '3', category_id: 'cilt-bakimlari', slug: '', name: 'Signature Hydrafacial', duration_minutes: 75, short_description: 'Dünyaca ünlü sıvı dermabrazyon ile anında ışıltı', price_type: 'custom', price: null, is_active: true, is_featured: true, is_hero: true, sort_order: 2 },
          { id: '4', category_id: 'vucut-bakimi', slug: '', name: 'G5 Sarkma & Selülit Protokolü', duration_minutes: 50, short_description: 'Dirençli yağ hücrelerinde mekanik parçalanma', price_type: 'custom', price: null, is_active: true, is_featured: true, is_hero: false, sort_order: 0 }
        ]);
        setActiveSectionId('cilt-bakimlari');
      } else {
        const { data: cats, error: catError } = await supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (catError) throw catError;
        
        const { data: srvs, error: srvError } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (srvError) throw srvError;

        const activeCats = cats.filter(c => {
            const hasServices = srvs.some(s => s.category_id === c.id);
            return hasServices;
        });

        setCategories(activeCats || []);
        setServices(srvs || []);

        if (activeCats && activeCats.length > 0) {
            setActiveSectionId(activeCats[0].id);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCategory = categories.find(c => c.id === activeSectionId) || categories[0];
  const activeServices = services.filter(s => s.category_id === activeCategory?.id).sort((a,b) => a.sort_order - b.sort_order);

  return (
    <main className={styles.pageWrapper}>
      
      <section className={styles.mainSection}>
        <div className={`container ${styles.layoutGrid}`}>
          
          {/* Left Column: Focused Tab Menu */}
          <aside className={styles.sidebar}>
            <div className={styles.stickyMenu}>
              <h4 className={styles.menuTitle}>Hizmetlerimiz</h4>
              {isLoading ? (
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Yükleniyor...</div>
              ) : (
                  <ul className={styles.menuList}>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button 
                          className={`${styles.menuLink} ${activeSectionId === cat.id ? styles.active : ""}`}
                          onClick={() => setActiveSectionId(cat.id)}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
              )}
            </div>
          </aside>

          {/* Right Column: Isolated Single Focus Block */}
          <div className={styles.contentArea}>
            <div className={styles.serviceBlock}>
              
              {!isLoading && activeCategory && (
                  <>
                      <h2 className={styles.serviceTitle}>{activeCategory.name}</h2>
                      
                      <div className={styles.textContent}>
                        
                        {/* HEADLINE HOOK (BÜYÜTÜLDÜ VE ANA BAŞLIK YAPILDI) */}
                        <div className={styles.hookWrapper}>
                          <h3 className={styles.hookHeadline}>{activeCategory.services_page_intro || activeCategory.marketing_title || activeCategory.name}</h3>
                          <p className={styles.serviceDesc}>{activeCategory.booking_description || activeCategory.short_description || ''}</p>
                        </div>
                        
                        {/* DYNAMIC SALES ROW GENERATOR (SubServices) */}
                        <div className={styles.subServicesContainer}>
                           <h3 className={styles.subServicesHeader}>Bu Kategorideki Uygulamalar</h3>
                           
                           {activeServices.length === 0 ? (
                               <p style={{ color: '#9ca3af' }}>Bu kategoride henüz aktif hizmet bulunmamaktadır.</p>
                           ) : (
                               <div className={styles.subServicesList}>
                                  {activeServices.map((sub) => {
                                      // Fiyat Düzeltici Regex Mantığı
                                      const renderPrice = (priceVal: any) => {
                                         if (!priceVal) return "";
                                         const str = String(priceVal).trim();
                                         const cleanStr = str.replace(/[₺\s]/g, "");
                                         if (/^\d+$/.test(cleanStr)) {
                                            return `₺${Number(cleanStr).toLocaleString('tr-TR')}`;
                                         }
                                         return str;
                                      };
                                      
                                      return (
                                     <div key={sub.id} className={`${styles.subServiceRow} ${sub.is_featured ? styles.highlightCard : ""}`}>
                                        
                                        {/* ABSOLUTE BADGE (Only Featured logic explicitly displayed here) */}
                                        {sub.is_featured && (
                                            <span className={styles.highlightBadge}>
                                                ⭐ ÖNE ÇIKAN DENEYİM
                                            </span>
                                        )}
            
                                        <div className={styles.subServiceInfo}>
                                           <div className={styles.subServiceTitleFlex}>
                                              <h4 className={styles.subServiceName}>{sub.name}</h4>
                                           </div>
                                           <p className={styles.subServiceMicroDesc}>{sub.short_description}</p>
                                           <div style={{display: 'flex', gap: '15px', marginTop: 'auto', flexWrap: 'wrap'}}>
                                               <span className={styles.metaTag}>
                                                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                 {sub.duration_minutes} dk
                                               </span>
                                               {sub.price && (
                                                   <span className={styles.metaTagPrice}>
                                                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                                     {renderPrice(sub.price)}
                                                   </span>
                                               )}
                                           </div>
                                        </div>
                                        <div className={styles.subServiceAction}>
                                          <Link href="/rezervasyon" className={styles.subServiceBtn}>
                                             Randevu Al <span className={styles.btnArrow}>→</span>
                                          </Link>
                                        </div>
                                     </div>
                                  )})}
                               </div>
                           )}

                        </div>
                        
                      </div>
                  </>
              )}
              
            </div>
          </div>
          
        </div>
      </section>

    </main>
  );
}
