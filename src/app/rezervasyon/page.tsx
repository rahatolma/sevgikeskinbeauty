"use client";

import { useState, useEffect } from "react";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";

export default function RezervasyonPage() {
  // Booking State
  const [step, setStep] = useState(1);
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  
  // Selections
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("Bugün"); 
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", note: "" });

  const [dateOptions, setDateOptions] = useState<{label: string, dateStr: string}[]>([]);

  // Live Database State
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [availableSpecialists, setAvailableSpecialists] = useState<any[]>([]);
  
  // Loading & Submission States
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Time slots dummy 
  const mockTimeSlots = [
    { time: "10:00", status: "available" },
    { time: "11:30", status: "available" },
    { time: "13:00", status: "full" },
    { time: "14:30", status: "available" },
    { time: "16:00", status: "available" },
    { time: "17:30", status: "available" }
  ];

  useEffect(() => {
    // Generate next 5 days
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        let label = nextDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
        if (i === 0) label = "Bugün (" + label + ")";
        if (i === 1) label = "Yarın (" + label + ")";
        dates.push({
            label: label,
            dateStr: nextDate.toISOString().split('T')[0] // YYYY-MM-DD
        });
    }
    setDateOptions(dates);
    if(dates.length > 0) setSelectedDate(dates[0].dateStr);

    async function loadData() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) return;

        const { data: cats, error: catError } = await supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        const { data: srvs, error: srvError } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true });

        if (catError || srvError || !cats || !srvs) throw new Error("DB Error");

        // Map relational data
        const mapped = cats.map(c => ({
          id: c.id,
          title: c.name,
          description: c.booking_description || c.short_description || "",
          icon: '✨',
          services: srvs.filter(s => s.category_id === c.id).map(s => ({
            id: s.id,
            name: s.name,
            duration: `${s.duration_minutes || 0} dk`,
            description: s.short_description,
            price: s.price_type === 'custom' ? 'Kişiye Özel Fiyatlandırma' : `₺${s.price || 0}`,
            is_featured: s.is_featured
          }))
        })).filter(c => c.services.length > 0); 

        setDynamicCategories(mapped);
      } catch (err) {
        console.error("Veri çekilemedi", err);
      } finally {
        setIsDataLoaded(true);
      }
    }
    loadData();
  }, []);

  const handleNextStep = () => setStep(s => s + 1);
  const handlePrevStep = () => setStep(s => Math.max(1, s - 1));

  const selectService = async (service: any, categoryId: string) => {
    setSelectedService(service);
    setSelectedCategory(categoryId);
    
    // Fetch Specialists based on service
    try {
        const { data, error } = await supabase
            .from('specialist_services')
            .select(`
                specialist_id,
                specialist:specialists (
                    id, full_name, role_title, bio, avatar_url, is_active
                )
            `)
            .eq('service_id', service.id);
            
        if (!error && data) {
            // Filter out inactive specialists and map
            const advisors = data
                .filter((row: any) => row.specialist?.is_active)
                .map((row: any) => ({
                    id: row.specialist.id,
                    name: row.specialist.full_name,
                    role: row.specialist.role_title,
                    description: row.specialist.bio || 'Hizmetinizde mükemmeliyet',
                    avatar: '👩🏼‍⚕️' // Fallback for avatar mapping later if needed
                }));
            setAvailableSpecialists(advisors);
        } else {
            setAvailableSpecialists([]);
        }
    } catch(err) {
        setAvailableSpecialists([]);
    }

    handleNextStep();
  };

  const selectAdvisor = (advisor: any) => {
    setSelectedAdvisor(advisor);
    handleNextStep();
  };

  const selectTime = (time: string, dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(time);
    handleNextStep();
  };

  const submitBooking = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
        alert("Lütfen adınızı ve telefon numaranızı girin!");
        return;
    }

    setIsSubmitting(true);
    
    try {
        // 1. Insert Booking Request
        const { data: newBooking, error: bookingErr } = await supabase
            .from('booking_requests')
            .insert([{
                category_id: selectedCategory,
                service_id: selectedService.id,
                specialist_id: selectedAdvisor.id === 0 ? null : selectedAdvisor.id, // 0 = Farketmez
                customer_name: customerInfo.name,
                customer_phone: customerInfo.phone,
                customer_email: "",
                requested_date: selectedDate, // YYYY-MM-DD
                requested_time: selectedTime,
                note: customerInfo.note,
                status: 'pending' // Default is pending
            }])
            .select();

        if (bookingErr) throw bookingErr;
        
        const generatedId = newBooking[0].id;
        
        // 2. Insert Timeline Log
        await supabase.from('booking_timeline_logs').insert([{
            booking_id: generatedId,
            action: 'Oluşturuldu',
            note: 'Müşteri web sitesi üzerinden randevu talebi oluşturdu.'
        }]);

        setBookingId(generatedId);
        setStep(5); // Success step!

    } catch (err) {
        console.error("Booking Error:", err);
        alert("Randevunuz oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin veya telefonla ulaşın.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const sendToWhatsapp = () => {
      const message = `Merhaba, web sitenizden randevu talebi oluşturdum.
Hizmet: ${selectedService?.name}
Uzman: ${selectedAdvisor?.name}
Tarih: ${selectedDate} / ${selectedTime}
İsmim: ${customerInfo.name}`;
      window.open(`https://wa.me/905308834774?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <main className={styles.pageContainer}>
      <section className={styles.mainSection}>
        <div className={`container ${styles.splitLayout}`}>
          
          {/* SOL KOLON: SABİT KATEGORİ MENÜSÜ */}
          <aside className={styles.leftColumn}>
            <div className={styles.stickyMenu}>
              <h4 className={styles.mainTitle}>Hizmetlerimiz</h4>
              
              {!isDataLoaded ? (
                 <div style={{color:'var(--color-gray)'}}>Yükleniyor...</div>
              ) : dynamicCategories.length === 0 ? (
                 <div style={{color:'var(--color-gray)'}}>Aktif hizmet bulunamadı.</div>
              ) : (
                 <ul className={styles.adminSidebar}>
                   {dynamicCategories.map((category, index) => (
                     <li key={index}>
                       <button 
                         className={`${styles.adminCategoryBtn} ${openCategory === index || (openCategory === null && index === 0) ? styles.active : ''}`}
                         onClick={() => {
                             setStep(1); 
                             setOpenCategory(index);
                             setShowAllServices(false);
                         }}
                       >
                          <div className={styles.adminCategoryTitleRow}>
                            {/* Icon hidden to perfectly match horizontal left alignment with Hizmetlerimiz: */}
                            <span className={styles.adminCategoryTitle} style={{marginTop: '2px'}}>{category.title}</span>
                          </div>
                          <span className={styles.adminCategoryCount}>{category.services.length} Hizmet</span>
                       </button>
                     </li>
                   ))}
                 </ul>
              )}
            </div>
          </aside>

          {/* SAĞ KOLON: DİNAMİK SÜREÇ ALANI */}
          <div className={styles.rightColumn}>
          
          {step < 5 && (
            <>
                <h1 style={{fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-dark)', marginBottom: '1.5rem', fontWeight: 400}}>
                {step === 1 && "Size en uygun bakımı seçin"}
                {step === 2 && "Uzman Seçimi"}
                {step === 3 && "Randevu Zamanı"}
                {step === 4 && "İletişim Bilgileri"}
                </h1>
                <div className={styles.stepper}>
                <span className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`} onClick={() => { if (step > 1) setStep(1); }}>1. Hizmet Seç</span>
                <span className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`} onClick={() => { if (step > 2) setStep(2); }}>2. Uzman Seç</span>
                <span className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`} onClick={() => { if (step > 3) setStep(3); }}>3. Tarih Belirle</span>
                <span className={`${styles.step} ${step >= 4 ? styles.stepActive : ''}`} onClick={() => { if (step > 4) setStep(4); }}>4. Rezervasyonu Onayla</span>
                </div>
            </>
          )}

          <div>
             {/* ADIM 1: HİZMET (Admin Tablo Stili - Sadece Sağ İçerik) */}
             {step === 1 && (
               <div className="animate-fade-up">
                 {isDataLoaded && dynamicCategories.length > 0 && (
                     <div className={styles.adminServicesList}>
                        {(() => {
                          const activeIndex = openCategory !== null ? openCategory : 0;
                          const activeCategory = dynamicCategories[activeIndex];
                          if (!activeCategory || !activeCategory.services) return null;
                          
                          // UX improvement: Show max 4 initially
                          const visibleServices = showAllServices 
                              ? activeCategory.services 
                              : activeCategory.services.slice(0, 4);
                              
                          const renderPrice = (price: any) => {
                             if (!price) return "";
                             const str = String(price).trim();
                             
                             // ₺ işaretini veya boşlukları temizleyip sadece rakam mı diye bakalım
                             const cleanStr = str.replace(/[₺\s]/g, "");
                             if (/^\d+$/.test(cleanStr)) {
                                return `₺${Number(cleanStr).toLocaleString('tr-TR')}`;
                             }
                             return str;
                          };
                          
                          return (
                            <>
                              {visibleServices.map((service: any, sIndex: number) => (
                                <div key={sIndex} className={`${styles.adminServiceCard} ${service.is_featured ? styles.featuredServiceCard : ''}`}>
                                  <div className={styles.serviceInfo}>
                                    <div className={styles.serviceHeadline}>
                                        <h4 className={styles.serviceName}>{service.name}</h4>
                                        {service.is_featured && <span className={styles.badgeFeatured}>ÖNERİLEN</span>}
                                    </div>
                                    <p className={styles.serviceDesc}>{service.description}</p>
                                    <div className={styles.serviceMeta}>
                                      <span className={styles.metaTag}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        {service.duration}
                                      </span> 
                                      <span className={styles.metaTagPrice}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                        {renderPrice(service.price)}
                                      </span> 
                                    </div>
                                  </div>
                                  <div className={styles.serviceAction}>
                                      <button className={service.is_featured ? styles.buttonSelect : styles.buttonSecondary} onClick={() => selectService(service, activeCategory.id)}>
                                        {service.is_featured ? "Bu Bakımı Seç" : "Seç"}
                                      </button>
                                  </div>
                                </div>
                              ))}
                              
                              {!showAllServices && activeCategory.services.length > 4 && (
                                  <div style={{textAlign:'center', marginTop:'1.5rem', marginBottom:'1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem'}}>
                                      <button 
                                          onClick={() => setShowAllServices(true)}
                                          style={{
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'center', 
                                              gap: '10px', 
                                              width: '100%', 
                                              backgroundColor: '#f7f3ef',
                                              color: 'var(--color-dark)',
                                              padding: '0.9rem 2.5rem',
                                              fontFamily: 'var(--font-primary)',
                                              fontWeight: 600,
                                              fontSize: '0.85rem',
                                              letterSpacing: '3px',
                                              textTransform: 'uppercase',
                                              border: '1px solid rgba(0, 0, 0, 0.06)',
                                              cursor: 'pointer',
                                              transition: 'all 0.3s ease',
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ede7df'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f7f3ef'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
                                      >
                                          Tüm Hizmetleri Gör ({activeCategory.services.length - 4} Diğer Seçenek)
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                      </button>
                                  </div>
                              )}
                            </>
                          );
                        })()}
                     </div>
                 )}
               </div>
             )}

             {/* ADIM 2: UZMAN */}
             {step === 2 && (
               <div className="animate-fade-up">
                  <div className={styles.listItem} style={{cursor: 'default', backgroundColor: '#fdfbf9', borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: '2rem'}}>
                    <div className={styles.serviceInfo}>
                      <div style={{fontSize: '0.8rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600}}>
                        ✔️ Seçilen Hizmet
                      </div>
                      <div className={styles.serviceName}>{selectedService?.name}</div>
                      {selectedService?.description && (
                         <div className={styles.serviceDesc}>{selectedService?.description}</div>
                      )}
                      
                      <div style={{display: 'flex', gap: '15px', marginTop: '1rem', flexWrap: 'wrap'}}>
                          <span className={styles.metaTag}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {selectedService?.duration}
                          </span>
                          {selectedService?.price && (
                              <span className={styles.metaTagPrice}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                {renderPrice(selectedService.price)}
                              </span>
                          )}
                      </div>
                    </div>
                    <div className={styles.serviceAction}>
                      <button className={styles.buttonSecondary} onClick={() => setStep(1)} style={{padding: '0.6rem 1.2rem', fontSize: '0.8rem'}}>
                        Hizmeti Değiştir
                      </button>
                    </div>
                  </div>

                  <h3 className={styles.stepBlockTitle} style={{marginBottom: '0.5rem'}}>Uzman Ataması</h3>
                  <p style={{fontSize: '1rem', color: '#666', marginBottom: '2rem'}}>Sistem sizin için en uygun uzmanı seçecektir</p>

                  {/* Ana Onay Kartı */}
                  <div className={`${styles.listItem} ${styles.listItemHighlight}`} style={{flexDirection: 'column', alignItems: 'stretch', padding: '2rem', gap: '1.5rem', textAlign: 'center'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                      <div className={styles.avatar} style={{width: '60px', height: '60px', fontSize: '1.5rem'}}>✨</div>
                      <div>
                        <div className={styles.serviceName} style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Sistem Uzman Atayacak</div>
                        <div className={styles.serviceDetails} style={{fontSize: '0.95rem'}}>En yakın saat ve uygunluk durumuna göre otomatik olarak en doğru uzmana yönlendirileceksiniz.</div>
                      </div>
                    </div>
                    
                    <button className={styles.buttonSelect} style={{justifyContent: 'center'}} onClick={() => selectAdvisor({ id: 0, name: "Farketmez, Sistem Öner", role: "En erken ve uygun saat" })}>
                      Uzmanı Otomatik Ata
                    </button>
                    
                    <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.5rem'}}>
                      🛡️ Tüm uzmanlarımız MEB onaylı sertifikalı ve kendi alanında deneyimlidir.
                    </div>
                  </div>

                  {/* Psikolojik Güven Bloğu */}
                  <div style={{background: '#f8f9fa', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem'}}>
                    <h4 style={{fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--color-dark)', marginBottom: '1rem'}}>Neden Sistem Öneriyor?</h4>
                    <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                      <li style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#4a4a4a'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Size uygun olan en erken randevuyu bulur
                      </li>
                      <li style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#4a4a4a'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        İşleminize özel en yetkin uzmanı eşleştirir
                      </li>
                      <li style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#4a4a4a'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Gereksiz bekleme sürelerini ortadan kaldırır
                      </li>
                    </ul>
                  </div>

                  {/* Opsiyonel Uzman Listesi (Sadece varsa gösterelim) */}
                  {availableSpecialists.length > 0 && (
                      <div style={{marginTop: '3rem'}}>
                          <div style={{fontSize: '0.9rem', color: '#666', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}>Veya kendi uzmanınızı seçin:</div>
                          {availableSpecialists.map((advisor) => (
                            <div key={advisor.id} className={styles.listItem} onClick={() => selectAdvisor(advisor)}>
                              <div className={styles.avatar}>{advisor.avatar}</div>
                              <div className={styles.serviceInfo}>
                                <div className={styles.serviceName}>{advisor.name}</div>
                                <div className={styles.serviceRole}>{advisor.role}</div>
                                <div className={styles.serviceDetails}>{advisor.description}</div>
                              </div>
                              <div className={styles.serviceAction}>
                                <button className={styles.buttonSecondary}>
                                  Seç
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                  )}
                  
                  <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <button className={styles.buttonBack} onClick={handlePrevStep} style={{fontSize: '1.05rem', fontWeight: 500, padding: '1rem'}}>
                      &larr; Hizmet seçimine dön
                    </button>
                  </div>
               </div>
             )}

             {/* ADIM 3: TARİH & SAAT */}
             {step === 3 && (
               <div className="animate-fade-up">
                  <div className={styles.stickyRecapBar}>
                    <span className={styles.stickyRecapLabel}>Seçilen:</span>
                    <span className={styles.stickyRecapValue}>
                      {selectedService?.name} <span style={{opacity:0.6}}>&bull; {selectedAdvisor?.name}</span>
                    </span>
                  </div>

                  <h3 className={styles.stepBlockTitle}>Hangi zaman sizin için uygun?</h3>
                  
                  {/* Dynamic Days selection */}
                  <div style={{display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'1rem', marginBottom:'1rem'}}>
                    {dateOptions.map(opt => (
                        <button 
                            key={opt.dateStr} 
                            onClick={() => setSelectedDate(opt.dateStr)}
                            style={{
                                padding:'0.75rem 1rem', 
                                border: selectedDate === opt.dateStr ? '2px solid #111827' : '1px solid #e5e7eb',
                                borderRadius:'8px',
                                background: selectedDate === opt.dateStr ? '#111827' : 'white',
                                color: selectedDate === opt.dateStr ? 'white' : '#374151',
                                fontWeight:500,
                                whiteSpace:'nowrap',
                                cursor:'pointer'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                  </div>

                  <div className={styles.timeGrid}>
                     {mockTimeSlots.map((slot, idx) => (
                       <button 
                         key={idx} 
                         className={`${styles.timeSlot} ${slot.status === 'full' ? styles.timeSlotFull : ''} ${slot.status === 'busy' ? styles.timeSlotBusy : ''}`} 
                         onClick={() => slot.status !== 'full' && selectTime(slot.time, selectedDate)}
                         disabled={slot.status === 'full'}
                       >
                         {slot.time}
                         {slot.status === 'busy' && <span className={styles.busyBadge}>Yoğun</span>}
                       </button>
                     ))}
                  </div>
                  <button className={styles.buttonBack} onClick={handlePrevStep}>&larr; Uzman seçimine dön</button>
               </div>
             )}

             {/* ADIM 4: ONAY */}
             {step === 4 && (
               <div className="animate-fade-up">
                 <div className={styles.summaryCard}>
                   <h3 style={{fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)'}}>Seçtiğiniz Randevu:</h3>
                   
                   <div style={{display:'flex', flexDirection:'column', gap:'0.8rem', marginBottom:'1.5rem', color:'var(--color-dark)'}}>
                     <div style={{display:'flex', justifyContent:'space-between'}}>
                       <span style={{color:'var(--color-gray)'}}>Hizmet</span>
                       <span style={{fontWeight:500, textAlign:'right'}}>{selectedService?.name}</span>
                     </div>
                     <div style={{display:'flex', justifyContent:'space-between'}}>
                       <span style={{color:'var(--color-gray)'}}>Uzman</span>
                       <span style={{fontWeight:500, textAlign:'right'}}>{selectedAdvisor?.name}</span>
                     </div>
                     <div style={{display:'flex', justifyContent:'space-between'}}>
                       <span style={{color:'var(--color-gray)'}}>Tarih / Saat</span>
                       <span style={{fontWeight:500, textAlign:'right'}}>{selectedDate} &bull; {selectedTime}</span>
                     </div>
                     <div style={{display:'flex', justifyContent:'space-between'}}>
                       <span style={{color:'var(--color-gray)'}}>Süre</span>
                       <span style={{fontWeight:500, textAlign:'right'}}>{selectedService?.duration}</span>
                     </div>
                   </div>

                   <div style={{borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <span style={{color:'var(--color-dark)', fontWeight:600, fontSize:'1.1rem'}}>Fiyat</span>
                     <span style={{color:'var(--color-gold)', fontWeight:600}}>{selectedService?.price || 'Kişiye özel fiyatlandırma'}</span>
                   </div>
                 </div>

                 <div className={styles.formGroup}>
                   <label>Adınız Soyadınız *</label>
                   <input 
                     type="text" 
                     className={styles.input} 
                     placeholder="Örn: Ayşe Yılmaz" 
                     value={customerInfo.name}
                     onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                   />
                 </div>

                 <div className={styles.formGroup}>
                   <label>Telefon Numaranız *</label>
                   <input 
                     type="tel" 
                     className={styles.input} 
                     placeholder="05..."
                     value={customerInfo.phone}
                     onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                   />
                 </div>

                 <div className={styles.formGroup}>
                   <label>Kısa Notunuz (Opsiyonel)</label>
                   <textarea 
                     className={styles.input} 
                     placeholder="Uzmanınıza iletmek istediğiniz özel bir durum..."
                     rows={2}
                     value={customerInfo.note}
                     onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                   ></textarea>
                 </div>

                 <p style={{fontSize:'0.85rem', color:'var(--color-gray)', textAlign:'center', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
                   ✓ Randevunuzu dilediğiniz zaman değiştirebilirsiniz
                 </p>

                 <button className={styles.buttonSelect} onClick={submitBooking} disabled={isSubmitting} style={{width: '100%', marginTop: '1.5rem'}}>
                   {isSubmitting ? 'Talebiniz İletiliyor...' : 'Randevuyu Onayla'}
                 </button>
                 <div style={{textAlign: 'left', marginTop: '1.5rem'}}>
                    <button className={styles.buttonBack} onClick={handlePrevStep} style={{marginTop:0}}>&larr; Saat seçimine dön</button>
                 </div>
               </div>
             )}

           {/* ADIM 5: BAŞARI MODU */}
             {step === 5 && (
                 <div className="animate-fade-up" style={{textAlign:'center', padding:'3rem 1rem'}}>
                     <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🎉</div>
                     <h2 style={{fontFamily:'var(--font-serif)', fontSize:'2rem', marginBottom:'1rem', color:'#111827'}}>Harika! Talebiniz Alındı.</h2>
                     <p style={{color:'#4b5563', lineHeight:1.6, marginBottom:'2rem', maxWidth:'400px', margin:'0 auto 2rem auto'}}>
                         Randevu kaydınız <strong>{customerInfo.name}</strong> adına sistemlerimize ulaştı. Ekibimiz kısa süre içerisinde sizinle iletişime geçerek detayları onaylayacak.
                     </p>
                     
                     <div style={{background:'#fef3c7', border:'1px solid #fde68a', padding:'1rem', borderRadius:'8px', marginBottom:'2rem'}}>
                        <p style={{color:'#92400e', fontSize:'0.9rem', margin:0}}>
                            Dilerseniz <strong>hızlı onay</strong> için WhatsApp destek hattımıza doğrudan mesaj gönderebilirsiniz.
                        </p>
                     </div>

                     <button 
                        className={styles.buttonPrimary} 
                        style={{background:'#25D366', color:'white', borderColor:'#25D366'}}
                        onClick={sendToWhatsapp}
                     >
                        WhatsApp'tan Hızlı Onay İste
                     </button>
                     
                     <div style={{marginTop:'1.5rem'}}>
                         <a href="/" style={{color:'#6b7280', fontSize:'0.9rem', textDecoration:'underline'}}>Ana Sayfaya Dön</a>
                     </div>
                 </div>
             )}
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}
