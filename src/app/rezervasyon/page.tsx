"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";

const serviceCategories = [
  {
    title: "Cilt Bakımı & Yenileyici Ritüeller",
    description: "Daha sağlıklı, dengeli ve canlı bir cilt için özel uygulamalar",
    icon: "✨",
    services: [
      { id: 1, name: "Anti-Aging Cilt Bakımı", duration: "60 dk", description: "İnce kırışıklık görünümünü azaltır", price: "Kişiye özel fiyatlandırma" },
      { id: 2, name: "Derinlemesine Cilt Temizliği", duration: "45 dk", description: "Gözenekleri arındırarak cildi nefes aldırır", price: "Kişiye özel fiyatlandırma" },
      { id: 3, name: "Oxy Hydrafacial Bakımı", duration: "75 dk", description: "Cildi neme doyurur ve tam ışıltı katar", price: "Kişiye özel fiyatlandırma" },
    ]
  },
  {
    title: "Yüz Masajları",
    description: "Yorgunluk izlerini silen, sıkılaştırıcı özel masaj teknikleri",
    icon: "💆‍♀️",
    services: [
      { id: 4, name: "Lifting Yüz Masajı", duration: "40 dk", description: "Yüz kaslarını forma sokar ve toparlar", price: "Kişiye özel fiyatlandırma" },
      { id: 5, name: "Bambu Yüz Modelajı", duration: "50 dk", description: "Doğal bambu çubuklarıyla kırışıklık açma", price: "Kişiye özel fiyatlandırma" },
    ]
  }
];

const mockAdvisors = [
  { id: 1, name: "Sevgi Keskin", role: "Kurucu / Baş Uzman Estetisyen", avatar: "👩🏼‍⚕️", description: "15 yıllık master klinik tecrübesiyle premium protokoller kurar." },
  { id: 2, name: "Buse Yılmaz", role: "Uzman Estetisyen", avatar: "👩🏻‍⚕️", description: "İleri düzey cihazlı cilt bakımı ve yenileyici masaj uzmanı." },
];

const mockTimeSlots = [
  { time: "10:00", status: "available" },
  { time: "11:30", status: "busy" },
  { time: "13:00", status: "full" },
  { time: "14:30", status: "available" },
  { time: "16:00", status: "available" },
  { time: "17:30", status: "busy" }
];

export default function RezervasyonPage() {
  // Booking State
  const [step, setStep] = useState(1);
  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("Bugün"); 
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  const [infoTab, setInfoTab] = useState<'randevu' | 'iptal'>('randevu');

  // Live Database State
  const [dynamicCategories, setDynamicCategories] = useState<any[]>(serviceCategories);

  useEffect(() => {
    async function loadData() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) return;

        const { data: cats, error: catError } = await supabase.from('service_categories').select('*').order('sort_order', { ascending: true });
        const { data: srvs, error: srvError } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true });

        if (catError || srvError || !cats || !srvs) throw new Error("DB Error");

        // Map relational data into nested structure expected by the UI
        const mapped = cats.map(c => ({
          title: c.name,
          description: c.booking_description || c.short_description,
          icon: c.icon_name || '✨',
          services: srvs.filter(s => s.category_id === c.id).map(s => ({
            id: s.id,
            name: s.name,
            duration: `${s.duration_minutes || 0} dk`,
            description: s.short_description,
            price: s.price_type === 'custom' ? 'Kişiye özel fiyatlandırma' : `₺${s.price || 0}`,
            is_featured: s.is_featured
          }))
        }));

        if (mapped.length > 0) {
          setDynamicCategories(mapped);
        }
      } catch (err) {
        console.error("Veri bağlanırken hata oluştu, mock veri kullanılıyor.", err);
      }
    }
    loadData();
  }, []);

  const handleNextStep = () => setStep(s => s + 1);
  const handlePrevStep = () => setStep(s => Math.max(1, s - 1));

  const selectService = (service: any) => {
    setSelectedService(service);
    handleNextStep();
  };

  const selectAdvisor = (advisor: any) => {
    setSelectedAdvisor(advisor);
    handleNextStep();
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    handleNextStep();
  };

  const submitBooking = () => {
    const message = `Merhaba, ${selectedService.name} işlemi için ${selectedAdvisor.name} hanımdan randevu talebi oluşturuyorum. Tarih: ${selectedDate} - ${selectedTime}. İsmim: ${customerInfo.name}`;
    window.open(`https://wa.me/905308834774?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className={styles.pageContainer}>
      {/* 2-Column Layout */}
      <div className={styles.splitLayout}>
        
        {/* Sol Sütun: Bilgilendirme */}
        <section className={styles.infoColumn}>
          <div className={styles.stickyInfo}>
            <h1 className={styles.mainTitle}>Randevunuzu<br/>oluşturun</h1>
            <p className={styles.subTitle}>Sadece 3 adımda size en uygun bakımı planlayın</p>
            
            <ul className={styles.stepsList}>
              <li className={`${styles.stepItem} ${step >= 1 ? styles.stepItemActive : ''}`}>
                <span className={styles.stepIcon}>✔</span>
                Hizmeti seç
              </li>
              <li className={`${styles.stepItem} ${step >= 2 ? styles.stepItemActive : ''}`}>
                <span className={styles.stepIcon}>✔</span>
                Tarih & saat belirle
              </li>
              <li className={`${styles.stepItem} ${step >= 4 ? styles.stepItemActive : ''}`}>
                <span className={styles.stepIcon}>✔</span>
                Onayla
              </li>
            </ul>
          </div>
        </section>

        {/* Sağ Sütun: Form Akışı */}
        <section className={styles.bookingColumn}>
          <h1 style={{fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '2rem'}}>
            {step === 1 && "Hizmet Kategorileri"}
            {step === 2 && "Uzman Seçimi"}
            {step === 3 && "Randevu Zamanı"}
            {step === 4 && "İletişim Bilgileri"}
          </h1>

          <div className={styles.stepper}>
            <span className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1. Hizmet</span>
            <span className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2. Uzman</span>
            <span className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>3. Tarih</span>
            <span className={`${styles.step} ${step >= 4 ? styles.stepActive : ''}`}>4. Onay</span>
          </div>

          <div>
             {/* ADIM 1 */}
             {step === 1 && (
               <div className="animate-fade-up">
                 {dynamicCategories.map((category, index) => (
                   <div key={index} className={styles.categoryGroup}>
                     <button 
                       className={styles.categoryHeader} 
                       onClick={() => setOpenCategory(openCategory === index ? null : index)}
                     >
                       <div className={styles.categoryHeaderLeft}>
                         <div className={styles.categoryTitleRow}>
                           <span className={styles.categoryIcon}>{category.icon}</span>
                           <span className={styles.categoryTitleName}>{category.title}</span>
                         </div>
                         <p className={styles.categoryDesc}>{category.description}</p>
                       </div>
                       <span className={`${styles.chevron} ${openCategory === index ? styles.open : ''}`}>▼</span>
                     </button>
                     <div className={`${styles.serviceList} ${openCategory === index ? styles.open : ''}`}>
                       {category.services.map((service: any, sIndex: number) => (
                         <div key={sIndex} className={styles.serviceItem}>
                           <div className={styles.serviceInfo}>
                             <h4 className={styles.serviceName}>
                               {service.name}
                               {service.is_featured && <span style={{marginLeft:'8px', backgroundColor:'#fef3c7', color:'#92400e', fontSize:'0.7rem', padding:'2px 6px', borderRadius:'12px'}}>⭐ Önerilen</span>}
                             </h4>
                             <div className={styles.serviceDetails}>
                               <span style={{fontWeight:500, color:'var(--color-dark)'}}>{service.duration}</span> &bull; {service.description}
                             </div>
                           </div>
                           <button className={styles.buttonSelect} onClick={() => selectService(service)}>
                             Devam Et
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* ADIM 2 */}
             {step === 2 && (
               <div className="animate-fade-up">
                  {/* Sticky Recap Bar */}
                  <div className={styles.stickyRecapBar}>
                    <span className={styles.stickyRecapLabel}>Seçilen Hizmet:</span>
                    <span className={styles.stickyRecapValue}>{selectedService?.name} <span style={{opacity:0.6}}>&bull; {selectedService?.duration}</span></span>
                  </div>

                  <h3 className={styles.stepBlockTitle}>Size en uygun uzmanı seçin</h3>

                  {/* Farketmez Butonu - Karar Yukunu Azaltir */}
                  <div className={`${styles.listItem} ${styles.listItemHighlight}`} onClick={() => selectAdvisor({ id: 0, name: "Farketmez, Sistem Öner", role: "En erken ve uygun saat" })}>
                    <div className={styles.avatar}>✨</div>
                    <div className={styles.serviceInfo}>
                      <div className={styles.serviceName}>Farketmez, Sistem Öner</div>
                      <div className={styles.serviceDetails}>Bana en uygun, en yakın saatteki uzman atansın</div>
                    </div>
                    <span className={styles.selectActionText}>Devam Et <span style={{fontSize:'1.1rem'}}>&rarr;</span></span>
                  </div>

                  {/* Uzman Listesi */}
                  {mockAdvisors.map((advisor) => (
                    <div key={advisor.id} className={styles.listItem} onClick={() => selectAdvisor(advisor)}>
                      <div className={styles.avatar}>{advisor.avatar}</div>
                      <div className={styles.serviceInfo}>
                        <div className={styles.serviceName}>{advisor.name}</div>
                        <div className={styles.serviceRole}>{advisor.role}</div>
                        <div className={styles.serviceDetails}>{advisor.description}</div>
                      </div>
                      <span className={styles.selectActionText}>Devam Et</span>
                    </div>
                  ))}
                  
                  <button className={styles.buttonBack} onClick={handlePrevStep}>&larr; Hizmet seçimine dön</button>
               </div>
             )}

             {/* ADIM 3 */}
             {step === 3 && (
               <div className="animate-fade-up">
                  {/* Sticky Recap Bar */}
                  <div className={styles.stickyRecapBar}>
                    <span className={styles.stickyRecapLabel}>Seçilen:</span>
                    <span className={styles.stickyRecapValue}>
                      {selectedService?.name} <span style={{opacity:0.6}}>&bull; {selectedAdvisor?.name}</span>
                    </span>
                  </div>

                  <h3 className={styles.stepBlockTitle}>Hangi zaman sizin için uygun?</h3>

                  <div className={styles.timeGrid}>
                     {mockTimeSlots.map((slot, idx) => (
                       <button 
                         key={idx} 
                         className={`${styles.timeSlot} ${slot.status === 'full' ? styles.timeSlotFull : ''} ${slot.status === 'busy' ? styles.timeSlotBusy : ''}`} 
                         onClick={() => slot.status !== 'full' && selectTime(slot.time)}
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

             {/* ADIM 4 */}
             {step === 4 && (
               <div className="animate-fade-up">
                 {/* Premium Summary Card */}
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
                   <label>Adınız Soyadınız</label>
                   <input 
                     type="text" 
                     className={styles.input} 
                     placeholder="Örn: Ayşe Yılmaz" 
                     value={customerInfo.name}
                     onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                   />
                 </div>

                 <div className={styles.formGroup}>
                   <label>Telefon Numaranız</label>
                   <input 
                     type="tel" 
                     className={styles.input} 
                     placeholder="05..."
                     value={customerInfo.phone}
                     onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                   />
                 </div>

                 <p style={{fontSize:'0.85rem', color:'var(--color-gray)', textAlign:'center', marginTop:'1.5rem', marginBottom:'1.5rem'}}>
                   ✓ Randevunuzu dilediğiniz zaman değiştirebilirsiniz
                 </p>

                 <button className={styles.buttonPrimary} onClick={submitBooking}>
                   Randevuyu Onayla
                 </button>
                 <div style={{textAlign: 'left', marginTop: '1.5rem'}}>
                    <button className={styles.buttonBack} onClick={handlePrevStep} style={{marginTop:0}}>&larr; Saat seçimine dön</button>
                 </div>
               </div>
             )}
          </div>
        </section>

      </div>
    </div>
  );
}
