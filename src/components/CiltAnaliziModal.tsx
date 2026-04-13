"use client";

import { useState, useEffect } from 'react';
import { X, Check, Clock, ShieldCheck, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './CiltAnaliziModal.module.css';

type CiltAnaliziModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const skinTypes = ["Kuru", "Yağlı", "Karma", "Hassas", "Emin değilim"];
const skinProblems = ["Leke & Ton Eşitsizliği", "Sivilce / Akne", "Kırışıklık / Sarkma", "Matlık / Cansız Görünüm", "Geniş Gözenek / Siyah Nokta", "Diğer"];

// Mapping Logic
const getRecommendations = (problem: string) => {
  switch (problem) {
    case "Leke & Ton Eşitsizliği": return ["Leke Karşıtı Cilt Bakımı", "Hydrafacial Cilt Yenileme"];
    case "Sivilce / Akne": return ["Akne İzi & Cilt Doku Düzeltme", "Derinlemesine Cilt Temizliği"];
    case "Kırışıklık / Sarkma": return ["Anti-Aging Cilt Bakımı", "Kolajen İp Germanlift Yüz Bakımı"];
    case "Matlık / Cansız Görünüm": return ["Hydrafacial Cilt Yenileme", "Mikro Cilt Yenileme"];
    case "Geniş Gözenek / Siyah Nokta": return ["Derinlemesine Cilt Temizliği", "Hydrafacial Cilt Yenileme"];
    default: return ["Ücretsiz Uzman Cilt Analizi", "Size Özel Bakım Planı"];
  }
}

const getSkinTypeNote = (type: string) => {
  switch (type) {
    case "Kuru": return "nemlendirme ve bariyer güçlendirme";
    case "Yağlı": return "arındırma ve sebum dengeleme";
    case "Hassas": return "nazik yaklaşım ve kişiye özel onarım";
    case "Karma": return "kısmi arındırma ve dengeleme";
    default: return "uzman analizi ile birebir doğru tespit";
  }
}

export default function CiltAnaliziModal({ isOpen, onClose }: CiltAnaliziModalProps) {
  const [step, setStep] = useState(1);
  const [animatingStep, setAnimatingStep] = useState(1); // For slide transitions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [ciltTipi, setCiltTipi] = useState('');
  const [problem, setProblem] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setAnimatingStep(1);
        setIsSuccess(false);
        setCiltTipi('');
        setProblem('');
        setName('');
        setPhone('');
        setNote('');
      }, 400); // Wait for slide out animation
    } else {
        // Prevent body scroll when open
        document.body.style.overflow = 'hidden';
    }
    
    return () => {
        document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const handleNext = () => {
    if (step === 1 && ciltTipi && problem) {
      setStep(2);
      setTimeout(() => setAnimatingStep(2), 50);
    } else if (step === 2) {
      setStep(3);
      setTimeout(() => setAnimatingStep(3), 50);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setTimeout(() => setAnimatingStep(2), 50);
    } else if (step === 2) {
      setStep(1);
      setTimeout(() => setAnimatingStep(1), 50);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = '';
    let cleaned = raw;
    if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    cleaned = cleaned.substring(0, 10);
    
    if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
    if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 6);
    if (cleaned.length > 6) formatted += ' ' + cleaned.substring(6, 8);
    if (cleaned.length > 8) formatted += ' ' + cleaned.substring(8, 10);
    
    setPhone(formatted);
  };

  const handleSubmit = async () => {
    if (!name || phone.replace(/\s/g, '').length < 10) return;

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: name,
        customer_phone: "+90 " + phone,
        note: `ÜCRETSİZ CİLT ANALİZİ TALEBİ\nCilt Tipi: ${ciltTipi}\nEn Büyük Problem: ${problem}\nEk Not: ${note}`,
        status: 'pending'
      };

      const { error } = await supabase.from('booking_requests').insert([payload]);

      if (error) throw error;
      
      setIsSuccess(true);
    } catch (err) {
      console.error("Talep gönderilemedi:", err);
      alert("Bir hata oluştu, lütfen daha sonra tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestions = getRecommendations(problem);
  const skinTypeNote = getSkinTypeNote(ciltTipi);

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={onClose}>
      <div 
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        onClick={e => e.stopPropagation()} 
      >
        {/* Header */}
        <div className={styles.header}>
          {!isSuccess && (
            <div className={styles.headerTitle}>
              {step === 3 ? "Size özel bakım planınızı birlikte oluşturalım" : "Cildiniz İçin En Doğru Bakımı Belirleyelim"}
              <span className={styles.headerSub}>
                {step === 3 ? "" : "Ücretsiz analiz ile başlayın"}
              </span>
            </div>
          )}
          {isSuccess && <div></div>}
          {!isSuccess && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">
              <X size={24} />
            </button>
          )}
        </div>

        {isSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <Check size={40} />
            </div>
            <h2 className={styles.successTitle}>Harika! İlk adımı tamamladınız</h2>
            <p className={styles.successDesc}>
              Cilt analiz talebiniz uzmanlarımıza ulaştı. Sizi en kısa sürede arayarak size özel bakım planınızı birlikte oluşturacağız.
            </p>
            <div style={{ marginBottom: '2rem', padding: '0.8rem 1.2rem', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#059669', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} /> Ortalama dönüş süresi: 15-30 dakika
            </div>
            <button 
              className={styles.btnPrimary} 
              style={{ width: '100%', padding: '1.2rem', flex: 'none' }}
              onClick={onClose}
            >
              Kapat
            </button>
          </div>
        ) : (
          <div className={styles.formContainer}>
            {/* Scrollable Content */}
            <div className={styles.content}>
              
              {/* STEP INDICATOR */}
              <div className={styles.stepIndicator}>
                <div className={`${styles.stepItem} ${step === 1 ? styles.stepActive : styles.stepDone}`}>
                  <span className={styles.stepLabel}>1. Analiz</span>
                  <div className={styles.stepDot}></div>
                </div>
                <div className={`${styles.stepItem} ${step === 2 ? styles.stepActive : (step > 2 ? styles.stepDone : '')}`}>
                  <span className={styles.stepLabel}>2. Sonuç</span>
                  <div className={styles.stepDot}></div>
                </div>
                <div className={`${styles.stepItem} ${step === 3 ? styles.stepActive : ''}`}>
                  <span className={styles.stepLabel}>3. Bilgiler</span>
                  <div className={styles.stepDot}></div>
                </div>
              </div>

              {/* SLIDING STEPS WRAPPER */}
              <div className={styles.stepsWrapper}>
                
                {/* STEP 1: ANALYSIS */}
                <div className={`${styles.stepBox} ${animatingStep === 1 ? styles.stepVisible : (step > 1 ? styles.stepSlideLeft : styles.stepSlideRight)}`}>
                  <div className={styles.psychologicalTrigger}>
                    <p className={styles.triggerText}>Cildinizin gerçekten neye ihtiyacı olduğunu öğrenin</p>
                    <p style={{fontFamily: 'var(--font-primary)', fontSize: '0.9rem', color: '#6b7280', margin: '0 0 1rem 0'}}>Sadece 30 saniye sürer</p>
                    <div className={styles.triggerBadges}>
                      <span className={styles.badge}><Clock size={14}/> 30 saniye</span>
                      <span className={styles.badge}><ShieldCheck size={14}/> Ücretsiz</span>
                      <span className={styles.badge}><UserCheck size={14}/> Uzman analizi</span>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cilt tipiniz nedir?</label>
                    <div className={styles.chipGroup}>
                      {skinTypes.map((type) => (
                        <button
                          key={type}
                          className={`${styles.chip} ${ciltTipi === type ? styles.chipActive : ''}`}
                          onClick={() => setCiltTipi(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>En büyük probleminiz nedir?</label>
                    <div className={styles.chipGroup}>
                      {skinProblems.map((prob) => (
                        <button
                          key={prob}
                          className={`${styles.chip} ${problem === prob ? styles.chipActive : ''}`}
                          onClick={() => setProblem(prob)}
                        >
                          {prob}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.previewNoteBox}>
                    <p className={styles.previewNoteText}>
                      Sonuçta size özel bakım planı ve önerilen hizmetleri anında göreceksiniz.
                    </p>
                  </div>
                </div>

                {/* STEP 2: RESULTS (GAME CHANGER) */}
                <div className={`${styles.stepBox} ${animatingStep === 2 ? styles.stepVisible : (step > 2 ? styles.stepSlideLeft : styles.stepSlideRight)}`}>
                  <div className={styles.resultHeader}>
                    <h3 className={styles.resultTitle}>Sizin için en uygun bakım önerisi hazır</h3>
                  </div>

                  <div className={styles.resultSummaryBox}>
                    <div className={styles.resultSummaryItem}>
                      <span className={styles.summaryLabel}>Cilt Tipiniz:</span>
                      <span className={styles.summaryValue}>{ciltTipi || "-"}</span>
                    </div>
                    <div className={styles.resultSummaryItem}>
                      <span className={styles.summaryLabel}>Ana Probleminiz:</span>
                      <span className={styles.summaryValue}>{problem || "-"}</span>
                    </div>
                    <p className={styles.resultExplanation}>
                      Cildinizin ihtiyaçlarını analiz ettiğimizde, <strong>{skinTypeNote}</strong> odaklı bir bakımın sizin için daha uygun olduğunu görüyoruz.
                    </p>
                  </div>

                  <div className={styles.suggestionsContainer}>
                    <div style={{marginBottom: '1.2rem'}}>
                      <p className={styles.suggestionsTitle} style={{marginBottom: '0.2rem'}}>Önerilen Uygun Bakımlar:</p>
                      <p style={{fontFamily: 'var(--font-primary)', fontSize: '0.85rem', color: '#6b7280', margin: 0}}>Bu bakımlar sizin için en uygun başlangıç noktasıdır</p>
                    </div>
                    <div className={styles.suggestionList}>
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} className={styles.suggestionCard}>
                          <div className={styles.suggestionIconWrapper}>
                            <Check size={18} strokeWidth={3} />
                          </div>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                    <p className={styles.suggestionFootnote}>
                      Uzmanımız bu ön değerlendirmeyi görüşme sırasında cildinize göre netleştirecektir.
                    </p>
                  </div>
                </div>

                {/* STEP 3: CONTACT INFO */}
                <div className={`${styles.stepBox} ${animatingStep === 3 ? styles.stepVisible : styles.stepSlideRight}`}>
                  <p className={styles.subtitleNote}>Uzmanımız analiz sonuçlarınıza göre sizi arayarak en doğru bakım planını sizinle birlikte belirleyecek.</p>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>İsim Soyisim</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="Adınız Soyadınız"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefon Numarası (Zorunlu)</label>
                    <div className={styles.phoneInputWrapper}>
                      <span className={styles.phonePrefix}>🇹🇷 +90</span>
                      <input 
                        type="tel" 
                        className={`${styles.input} ${styles.phoneInput}`} 
                        placeholder="5XX XXX XX XX"
                        value={phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Özel İstek veya Notunuz (Opsiyonel)</label>
                    <textarea 
                      className={styles.textarea} 
                      placeholder="Özel bir durumunuz, kullandığınız ilaçlar vs. varsa belirtebilirsiniz."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>

              </div>
            </div>

            {/* Fixed Footer */}
            <div className={styles.footer}>
              {/* TRUST LINE MOVED TO STEP 3 AND STEP 2 */}
              {step === 3 && (
                <div className={styles.trustBox}>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Uzman tarafından değerlendirilir
                   </div>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Size özel bakım protokolü oluşturulur
                   </div>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Karar tamamen size aittir, baskı yok
                   </div>
                </div>
              )}

              <div className={styles.btnActions}>
                {step > 1 && (
                  <button className={styles.btnSecondary} onClick={handleBack}>
                    Geri
                  </button>
                )}
                
                {step === 1 && (
                  <button 
                      className={`${styles.btnPrimary} ${(!ciltTipi || !problem) ? '' : styles.btnActive}`} 
                      onClick={handleNext}
                      disabled={!ciltTipi || !problem}
                  >
                    Analizi Tamamla
                  </button>
                )}

                {step === 2 && (
                  <button 
                      className={`${styles.btnPrimary} ${styles.btnActive}`} 
                      onClick={handleNext}
                  >
                    Bana özel bakım planını oluştur
                  </button>
                )}

                {step === 3 && (
                  <button 
                    className={`${styles.btnPrimary} ${styles.btnSubmitActive}`} 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !name || phone.replace(/\s/g, '').length < 10}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Ücretsiz bakım planımı oluştur'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
