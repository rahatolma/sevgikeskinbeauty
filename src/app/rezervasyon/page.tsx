"use client";

import { useState, useEffect } from "react";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Sparkles, UserRound, ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";

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
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", email: "", note: "" });

  const [dateOptions, setDateOptions] = useState<{label: string, dateStr: string}[]>([]);

  // Live Database State
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [availableSpecialists, setAvailableSpecialists] = useState<any[]>([]);
  
  // Loading & Submission States
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Dynamic Time Slots
  const [timeSlots, setTimeSlots] = useState<{time: string, status: 'available'|'full'|'busy'}[]>([]);

  useEffect(() => {
    // Generate next 7 days
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
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

  // Fetch Availability Logic for Step 3
  useEffect(() => {
    if (step < 3) return;
    
    async function fetchAvailability() {
      const BASE_TIMES = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];
      
      try {
        const { data: bookings, error } = await supabase
           .from('booking_requests')
           .select('requested_time, specialist_id, status')
           .eq('requested_date', selectedDate)
           .in('status', ['pending', 'confirmed', 'completed']);

        if (error) throw error;
        
        const capacity = availableSpecialists.length > 0 ? availableSpecialists.length : 1;

        const evaluatedSlots = BASE_TIMES.map(timeStr => {
           let isBlocked = false;
           
           if (bookings && bookings.length > 0) {
              const timeBookings = bookings.filter(b => b.requested_time && b.requested_time.startsWith(timeStr));
              
              if (selectedAdvisor && selectedAdvisor.id === 0) {
                  // Auto Assign: O saat için tüm uzmanlar doluysa kilitli
                  if (timeBookings.length >= capacity) {
                      isBlocked = true;
                  }
              } else if (selectedAdvisor && selectedAdvisor.id !== 0) {
                  // Specific Specialist
                  const isDirectlyBooked = timeBookings.some(b => b.specialist_id === selectedAdvisor.id);
                  if (isDirectlyBooked) {
                      isBlocked = true;
                  } else {
                      const explicitlyBookedCount = timeBookings.filter(b => b.specialist_id !== null).length;
                      const autoAssignCount = timeBookings.length - explicitlyBookedCount;
                      const freeSpecialists = capacity - explicitlyBookedCount;
                      
                      if (autoAssignCount >= freeSpecialists) {
                          isBlocked = true;
                      }
                  }
              }
           }

           return {
               time: timeStr,
               status: isBlocked ? 'full' as const : 'available' as const
           };
        });

        setTimeSlots(evaluatedSlots);
        
        // Eğer seçili olan saat dolu hale geldiyse seçimi sıfırla
        if (selectedTime) {
            const currentSlot = evaluatedSlots.find(s => s.time === selectedTime);
            if (currentSlot && currentSlot.status === 'full') {
                setSelectedTime(null);
            }
        }
      } catch (err) {
        console.error("Availability Check Error:", err);
        setTimeSlots(BASE_TIMES.map(t => ({time: t, status: 'available'})));
      }
    }

    fetchAvailability();
  }, [step, selectedDate, selectedAdvisor, availableSpecialists, selectedTime]);

  const handleNextStep = () => {
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handlePrevStep = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectService = async (service: any, categoryId: string) => {
    setSelectedService(service);
    setSelectedCategory(categoryId);
    
    // Fetch all active Specialists
    try {
        const { data: allActive, error: allErr } = await supabase
            .from('specialists')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
            
        if (!allErr && allActive) {
            const advisors = allActive.map((s: any) => ({
                id: s.id,
                name: s.full_name,
                role: s.role_title,
                description: s.bio || 'Hizmetinizde mükemmeliyet',
                avatar: '👩🏼‍⚕️'
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

  const renderPrice = (price: any) => {
    if (!price) return "";
    const str = String(price).trim();
    
    // ₺ işaretini veya boşlukları temizleyip sadece rakam mı diye bakalım
    const cleanStr = str.replace(/[₺\s]/g, "");
    if (/^\d+$/.test(cleanStr)) {
        // Tamamen rakamsa, sayı olarak formatlayalım
        const num = parseInt(cleanStr, 10);
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(num);
    }
    
    return str; // Kişiye Özel Fiyatlandırma gibi düz metinse aynen döndür
  };

  const selectTime = (time: string, dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(time);
    handleNextStep();
  };

  const submitBooking = async () => {
    if (!customerInfo.name || customerInfo.name.trim().length < 3) {
        alert("Lütfen geçerli bir ad ve soyad girin (En az 3 karakter).");
        return;
    }

    const cleanPhone = customerInfo.phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(?:\+90|0)?5\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
        alert("Lütfen geçerli bir cep telefonu numarası girin (Örn: 05XX XXX XX XX).");
        return;
    }
    
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
        alert("Lütfen geçerli bir e-posta adresi girin.");
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
                customer_phone: cleanPhone,
                customer_email: customerInfo.email,
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
      const timeStr = selectedTime ? selectedTime : 'Saat seçilmedi';
      const message = `Merhaba, web sitenizden randevu talebi oluşturdum. Randevumu teyit edebilir misiniz?
Hizmet: ${selectedService?.name || 'Belirtilmedi'}
Uzman: ${selectedAdvisor?.name || 'Farketmez'}
Tarih: ${selectedDate} / ${timeStr}
İsmim: ${customerInfo.name || 'Belirtilmedi'}`;
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
                             setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 50);
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
                {step === 1 && "Size en uygun hizmeti seçin"}
                {step === 2 && "Uzman Seçimi"}
                {step === 3 && "Randevu Zamanı"}
                {step === 4 && "İletişim Bilgileri"}
                </h1>

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
                          
                          const visibleServices = activeCategory.services;
                              
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
                                <div key={sIndex} className={styles.adminServiceCard}>
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
                                        {service.is_featured ? "Bu Hizmeti Seç" : "Seç"}
                                      </button>
                                  </div>
                                </div>
                              ))}
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
                  <div className={`${styles.adminServiceCard} ${styles.featuredServiceCard}`} style={{cursor: 'default', backgroundColor: '#fdfbf9', borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: '2rem'}}>
                    <div className={styles.serviceInfo}>
                      <div style={{fontSize: '0.8rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                        <CheckCircle2 size={16} strokeWidth={2.5} /> SEÇİLEN HİZMET
                      </div>
                      <div className={styles.serviceName}>{selectedService?.name}</div>
                      {selectedService?.description && (
                         <div className={styles.serviceDesc} style={{marginTop:'0.4rem'}}>{selectedService?.description}</div>
                      )}
                      
                      <div style={{display: 'flex', gap: '15px', marginTop: '1rem', flexWrap: 'wrap'}}>
                          <span className={styles.metaTag}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {selectedService?.duration}
                          </span>
                          {selectedService?.price && (
                              <span className={styles.metaTagPrice}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                {selectedService.price}
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

                  {/* Spacer between selected service and the auto assign card */}

                  {/* Ana Onay Kartı */}
                  <div className={styles.adminServiceCard} onClick={() => selectAdvisor({ id: 0, name: "Farketmez, Sistem Öner", role: "En erken ve uygun saat", avatar: '✨' })} style={{cursor:'pointer', padding: '1.5rem'}}>
                    <div className={styles.serviceInfo}>
                        <div className={styles.serviceHeadline}>
                            <div className={styles.avatar} style={{fontSize: '1.5rem', marginRight:'0.5rem', display: 'flex', alignItems: 'center'}}><Sparkles size={26} color="var(--color-gold)" strokeWidth={1} /></div>
                            <h4 className={styles.serviceName} style={{fontSize: '1.25rem'}}>Sistem Uzman Atayacak</h4>
                            <span className={styles.badgeFeatured}>ÖNERİLEN</span>
                        </div>
                        <p className={styles.serviceDesc} style={{marginTop:'0.5rem'}}>En yakın saat ve uygunluk durumuna göre otomatik olarak en doğru uzmana yönlendirileceksiniz.</p>
                        <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <ShieldCheck size={16} style={{minWidth: '16px', color: 'var(--color-gold)'}} /> Tüm uzmanlarımız MEB onaylı sertifikalı ve kendi alanında deneyimlidir.
                        </div>
                    </div>
                    <div className={styles.serviceAction}>
                        <button className={styles.buttonSelect} onClick={(e) => { e.stopPropagation(); selectAdvisor({ id: 0, name: "Farketmez, Sistem Öner", role: "En erken ve uygun saat", avatar: '✨' }); }}>
                            Uzmanı Otomatik Ata
                        </button>
                    </div>
                  </div>

                  {/* Divider separating auto assign and direct specialist selection */}
                  {/* Opsiyonel Uzman Listesi */}
                  {availableSpecialists.length > 0 && (
                      <div style={{marginTop: '1.5rem'}}>
                          {availableSpecialists.map((advisor) => (
                            <div key={advisor.id} className={styles.adminServiceCard} onClick={() => selectAdvisor(advisor)} style={{cursor: 'pointer'}}>
                              <div className={styles.serviceInfo} style={{flexDirection: 'row', alignItems: 'center', gap: '1.5rem'}}>
                                <div className={styles.avatar} style={{fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center'}}><UserRound size={32} color="var(--color-gold)" strokeWidth={1.2} /></div>
                                <div>
                                    <div className={styles.serviceName}>{advisor.name}</div>
                                    <div className={styles.serviceRole} style={{fontSize: '0.95rem', color: '#926b15', fontWeight: 600, marginBottom: '0.2rem'}}>{advisor.role}</div>
                                    {advisor.description && <div className={styles.serviceDesc}>{advisor.description}</div>}
                                </div>
                              </div>
                              <div className={styles.serviceAction}>
                                <button className={styles.buttonSecondary} onClick={(e) => { e.stopPropagation(); selectAdvisor(advisor); }}>
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
                  {/* RECAP CARD */}
                  <div className={`${styles.adminServiceCard} ${styles.featuredServiceCard}`} style={{cursor: 'default', backgroundColor: '#fdfbf9', borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: '2.5rem'}}>
                    <div className={styles.serviceInfo}>
                      <div style={{fontSize: '0.8rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                        <CheckCircle2 size={16} strokeWidth={2.5} /> SEÇİMİ TAMAMLANANLAR
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem'}}>
                         <div className={styles.serviceName} style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{fontSize: '0.9rem', color: 'var(--color-gold)', fontWeight: 600, marginRight: '0.8rem'}}>Hizmet:</span> 
                            {selectedService?.name}
                         </div>
                         <div className={styles.serviceName} style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{fontSize: '0.9rem', color: 'var(--color-gold)', fontWeight: 600, marginRight: '0.8rem'}}>Uzman:</span> 
                            <span style={{marginRight: '0.5rem', display: 'flex', alignItems: 'center'}}>{selectedAdvisor?.id === 0 ? <Sparkles size={20} color="var(--color-gold)" strokeWidth={1.5} /> : <UserRound size={20} color="var(--color-gold)" strokeWidth={1.7} />}</span>
                            {selectedAdvisor?.name}
                         </div>

                         <div style={{display: 'flex', gap: '15px', marginTop: '1rem', flexWrap: 'wrap'}}>
                            {selectedService?.duration && (
                                <span className={styles.metaTag}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  {selectedService?.duration}
                                </span>
                            )}
                            {selectedService?.price && (
                                <span className={styles.metaTagPrice}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                                  {selectedService?.price}
                                </span>
                            )}
                         </div>
                      </div>
                    </div>
                    <div className={styles.serviceAction}>
                      <button className={styles.buttonSecondary} onClick={() => setStep(2)} style={{padding: '0.6rem 1.2rem', fontSize: '0.8rem'}}>
                        Değiştir
                      </button>
                    </div>
                  </div>

                  {/* DATE & TIME SELECTION BOX */}
                  <div className={styles.adminServiceCard} style={{cursor: 'default', flexDirection: 'column', alignItems: 'stretch', padding: '2rem'}}>
                      <h3 className={styles.stepBlockTitle} style={{marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '1.3rem'}}>Hangi zaman sizin için uygun?</h3>
                      
                      {/* Dynamic Days selection */}
                      <div style={{display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'1.5rem', marginBottom:'1.5rem'}}>
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
                                    cursor:'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                      </div>

                      <div className={styles.timeGrid}>
                         {timeSlots.length === 0 ? (
                           <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: '#6b7280'}}>Saatler hesaplanıyor...</div>
                         ) : timeSlots.map((slot, idx) => (
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
                  </div>
                  
                  <div style={{textAlign: 'center', marginTop: '2rem'}}>
                     <button className={styles.buttonBack} onClick={handlePrevStep} style={{fontSize: '1.05rem', fontWeight: 500, padding: '1rem'}}>&larr; Uzman seçimine dön</button>
                  </div>
               </div>
             )}

             {/* ADIM 4: ONAY */}
             {step === 4 && (
               <div className="animate-fade-up">
                  {/* RECAP CARD */}
                  <div className={`${styles.adminServiceCard} ${styles.featuredServiceCard}`} style={{cursor: 'default', backgroundColor: '#fdfbf9', borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: '2.5rem', padding: '2rem'}}>
                    <div className={styles.serviceInfo}>
                      <div style={{fontSize: '0.8rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                        <CheckCircle2 size={16} strokeWidth={2.5} /> SEÇİMİ TAMAMLANANLAR
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                         <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem'}}>
                            <span style={{color: '#666', fontWeight: 500}}>Hizmet</span>
                            <span style={{fontWeight: 600, color: '#111'}}>{selectedService?.name}</span>
                         </div>
                         <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem'}}>
                            <span style={{color: '#666', fontWeight: 500}}>Uzman</span>
                            <span style={{fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                               {selectedAdvisor?.id === 0 ? <Sparkles size={16} color="var(--color-gold)" strokeWidth={1.5} /> : <UserRound size={16} color="var(--color-gold)" strokeWidth={1.5} />}
                               {selectedAdvisor?.name}
                            </span>
                         </div>
                         <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem'}}>
                            <span style={{color: '#666', fontWeight: 500}}>Tarih / Saat</span>
                            <span style={{fontWeight: 600, color: '#111'}}>{selectedDate} &bull; {selectedTime}</span>
                         </div>
                         <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem'}}>
                            <span style={{color: '#666', fontWeight: 500}}>Süre</span>
                            <span style={{fontWeight: 600, color: '#111'}}>{selectedService?.duration}</span>
                         </div>
                         <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', alignItems: 'center'}}>
                            <span style={{color: 'var(--color-dark)', fontWeight: 700, fontSize: '1.1rem'}}>Fiyat</span>
                            <span style={{color: 'var(--color-gold)', fontWeight: 700, fontSize: '1.1rem'}}>{selectedService?.price || 'Kişiye özel fiyatlandırma'}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.adminServiceCard} style={{flexDirection: 'column', alignItems: 'stretch', padding: '2rem'}}>
                      <h3 className={styles.stepBlockTitle} style={{marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '1.3rem'}}>İletişim Bilgileri</h3>
                      
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem'}}>
                        <div className={styles.formGroup}>
                          <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.9rem'}}>Adınız Soyadınız *</label>
                          <input 
                            type="text" 
                            className={styles.input} 
                            placeholder="Örn: Ayşe Yılmaz" 
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                            style={{border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.85rem', width: '100%', fontSize: '1rem'}}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.9rem'}}>Telefon Numaranız *</label>
                          <input 
                            type="tel" 
                            className={styles.input} 
                            placeholder="Örn: 0532 123 45 67"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                            style={{border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.85rem', width: '100%', fontSize: '1rem'}}
                          />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.9rem'}}>E-Posta (Opsiyonel)</label>
                          <input 
                            type="email" 
                            className={styles.input} 
                            placeholder="Örn: ayse@ornek.com"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                            style={{border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.85rem', width: '100%', fontSize: '1rem'}}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{marginBottom: '1.5rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151', fontSize: '0.9rem'}}>Kısa Notunuz (Opsiyonel)</label>
                        <textarea 
                          className={styles.input} 
                          placeholder="Uzmanınıza iletmek istediğiniz özel bir durum..."
                          rows={3}
                          value={customerInfo.note}
                          onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                          style={{border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.85rem', width: '100%', fontSize: '1rem', resize: 'vertical'}}
                        ></textarea>
                      </div>



                      <button className={styles.buttonSelect} onClick={submitBooking} disabled={isSubmitting} style={{width: '100%', marginTop: '0.5rem', padding: '1rem', fontSize: '1.1rem'}}>
                        {isSubmitting ? 'Talebiniz İletiliyor...' : 'Randevuyu Onayla'} 
                      </button>
                      <div style={{textAlign: 'center', marginTop: '2rem'}}>
                         <button className={styles.buttonBack} onClick={handlePrevStep} style={{marginTop:0, fontSize: '1.05rem'}}>&larr; Saat seçimine dön</button>
                      </div>
                  </div>
               </div>
             )}

            {/* ADIM 5: BAŞARI MODU */}
             {step === 5 && (
                 <div className="animate-fade-up" style={{textAlign:'center', padding:'4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                     <div style={{marginBottom:'1.5rem', display: 'flex', justifyContent: 'center'}}>
                         <CheckCircle2 size={90} color="var(--color-gold)" strokeWidth={1} />
                     </div>
                     <h2 style={{fontFamily:'var(--font-serif)', fontSize:'2.2rem', marginBottom:'1rem', color:'#111827'}}>Harika! Talebiniz Alındı.</h2>
                     <p style={{color:'#4b5563', lineHeight:1.6, marginBottom:'2rem', maxWidth:'450px', margin:'0 auto 2.5rem auto', fontSize: '1.1rem'}}>
                         Randevu kaydınız <strong>{customerInfo.name}</strong> adına sistemlerimize ulaştı. Ekibimiz kısa süre içerisinde sizinle iletişime geçerek detayları onaylayacak.
                     </p>
                     
                     <div style={{background:'#fdfbf9', border:'1px solid rgba(212, 175, 55, 0.3)', padding:'1.5rem', borderRadius:'12px', marginBottom:'2.5rem', maxWidth:'500px', margin:'0 auto 2rem auto'}}>
                        <p style={{color:'#666', fontSize:'0.95rem', margin:0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                            <MessageCircle size={18} color="var(--color-gold)" /> Dilerseniz hızlı onay için WhatsApp destek hattımıza doğrudan mesaj gönderebilirsiniz.
                        </p>
                     </div>

                     <button 
                        className={styles.buttonSelect} 
                        style={{padding: '1rem 2rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', margin: '0 auto', minWidth: '280px'}}
                        onClick={sendToWhatsapp}
                     >
                        WhatsApp'tan Hızlı Onay İste
                     </button>
                     
                     <div style={{marginTop:'2rem'}}>
                         <a href="/" style={{color:'#6b7280', fontSize:'1rem', textDecoration:'underline', cursor: 'pointer'}}>Ana Sayfaya Dön</a>
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
