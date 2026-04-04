"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ContactFormProps {
  formClass?: string;
  inputGroupClass?: string;
  submitBtnClass?: string;
}

export default function ContactForm({ formClass, inputGroupClass, submitBtnClass }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus("loading");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          { 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone, 
            message: formData.message,
            status: "new"
          }
        ]);

      if (error) throw error;

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", message: "" });
      
    } catch (err) {
      console.error(err);
      setStatus("error");
    }

    setTimeout(() => {
      setStatus("idle");
    }, 5000);
  };

  if (status === "success") {
    return (
      <div className={formClass} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '1rem'}}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3 style={{ color: 'var(--color-light)', fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Mesajınız İletildi</h3>
        <p style={{ color: '#a39e99', fontSize: '0.95rem' }}>Size en kısa sürede dönüş yapacağız. İlginiz için teşekkür ederiz.</p>
        <button onClick={() => setStatus("idle")} className={submitBtnClass} style={{ marginTop: '2rem' }}>Yeni Mesaj Gönder</button>
      </div>
    );
  }

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <div className={inputGroupClass}>
        <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder=" " required disabled={status === "loading"} />
        <label htmlFor="name">TAM ADINIZ</label>
      </div>
      <div className={inputGroupClass}>
        <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder=" " required disabled={status === "loading"} />
        <label htmlFor="email">E-POSTA ADRESİNİZ</label>
      </div>
      <div className={inputGroupClass}>
        <input type="tel" id="phone" value={formData.phone} onChange={handleChange} placeholder=" " disabled={status === "loading"} />
        <label htmlFor="phone">TELEFON NUMARANIZ</label>
      </div>
      <div className={inputGroupClass}>
        <textarea id="message" rows={5} value={formData.message} onChange={handleChange} placeholder=" " required disabled={status === "loading"}></textarea>
        <label htmlFor="message">MESAJINIZ (CİLT TİPİNİZ VEYA BEKLENTİNİZ)</label>
      </div>
      
      {status === "error" && (
        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>Mesajınız iletilemedi. Lütfen daha sonra tekrar deneyiniz.</p>
      )}

      <button type="submit" className={submitBtnClass} disabled={status === "loading"}>
        {status === "loading" ? "Gönderiliyor..." : "Gönder"}
      </button>
    </form>
  );
}
