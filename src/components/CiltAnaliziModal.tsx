"use client";

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './CiltAnaliziModal.module.css';

type CiltAnaliziModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const skinTypes = ["Kuru", "Yağlı", "Karma", "Hassas", "Emin değilim"];
const skinProblems = ["Leke & Ton Eşitsizliği", "Sivilce / Akne", "Kırışıklık / Sarkma", "Matlık / Cansız Görünüm", "Geniş Gözenek / Siyah Nokta", "Diğer"];

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
    if (ciltTipi && problem) {
      setStep(2);
      setTimeout(() => setAnimatingStep(2), 50); // slight delay to trigger transition
    }
  };

  const handleBack = () => {
    setStep(1);
    setTimeout(() => setAnimatingStep(1), 50);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamları al
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    // TR format 10 hane (5 ile başlayan kısım)
    // Eğer başa 0 koyduysa ya da 90 yazdıysa çıkartıp temizleyelim
    let cleaned = raw;
    if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    
    // Max 10 digits
    cleaned = cleaned.substring(0, 10);
    
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, 3); // 5XX
    }
    if (cleaned.length > 3) {
      formatted += ' ' + cleaned.substring(3, 6); // XXX
    }
    if (cleaned.length > 6) {
      formatted += ' ' + cleaned.substring(6, 8); // XX
    }
    if (cleaned.length > 8) {
      formatted += ' ' + cleaned.substring(8, 10); // XX
    }
    
    setPhone(formatted);
  };

  const handleSubmit = async () => {
    if (!name || phone.replace(/\s/g, '').length < 10) {
      return;
    }

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
              Cildiniz İçin En Doğru Bakımı Belirleyelim
              <span className={styles.headerSub}>Ücretsiz analiz ile başlayın</span>
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
            <h2 className={styles.successTitle}>Talebiniz Alındı!</h2>
            <p className={styles.successDesc}>
              Cilt analiz talebiniz uzmanlarımıza ulaştı. Sizinle en kısa sürede iletişime geçip, detaylı bir analiz ve sana özel bakım planı için randevumuzu planlayacağız.
            </p>
            <button 
              className={styles.btnPrimary} 
              style={{ width: '100%', padding: '1.2rem', flex: 'none', marginTop: '1rem' }}
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
                <div className={`${styles.stepItem} ${step === 2 ? styles.stepActive : ''}`}>
                  <span className={styles.stepLabel}>2. Bilgiler</span>
                  <div className={styles.stepDot}></div>
                </div>
              </div>

              {/* SLIDING STEPS WRAPPER */}
              <div className={styles.stepsWrapper}>
                
                {/* STEP 1: ANALYSIS */}
                <div className={`${styles.stepBox} ${animatingStep === 1 ? styles.stepVisible : (step === 2 ? styles.stepSlideLeft : styles.stepSlideRight)}`}>
                  <p className={styles.subtitleNote}>Sizin için en doğru bakımı belirleyebilmemiz için birkaç kısa soru:</p>
                  
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
                </div>

                {/* STEP 2: CONTACT INFO */}
                <div className={`${styles.stepBox} ${animatingStep === 2 ? styles.stepVisible : styles.stepSlideRight}`}>
                  <p className={styles.subtitleNote}>Uzmanımız size özel analiz ve bakım planı için sizinle iletişime geçecek.</p>
                  
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
              {/* TRUST LINE MOVED ABOVE THE CTA */}
              {step === 2 && (
                <div className={styles.trustBox}>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Uzmanlarımız tarafından değerlendirilir
                   </div>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Size özel bakım protokolü sunulur
                   </div>
                   <div className={styles.trustItem}>
                     <Check size={16} /> Karar verme süreci tamamen ücretsizdir
                   </div>
                </div>
              )}

              <div className={styles.btnActions}>
                {step === 2 && (
                  <button className={styles.btnSecondary} onClick={handleBack}>
                    Geri
                  </button>
                )}
                
                {step === 1 ? (
                  <button 
                      className={`${styles.btnPrimary} ${(!ciltTipi || !problem) ? '' : styles.btnActive}`} 
                      onClick={handleNext}
                      disabled={!ciltTipi || !problem}
                  >
                    Devam Et
                  </button>
                ) : (
                  <button 
                    className={`${styles.btnPrimary} ${styles.btnSubmitActive}`} 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !name || phone.replace(/\s/g, '').length < 10}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Ücretsiz Analizimi Başlat'}
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
