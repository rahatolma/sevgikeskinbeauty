"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface NewsletterFormProps {
  containerClass?: string;
  inputClass?: string;
  btnClass?: string;
}

export default function NewsletterForm({ containerClass, inputClass, btnClass }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email }]);
        
      if (error) {
        // Unique constraint violation (already subscribed)
        if (error.code === '23505') {
          setMessage("Bu e-posta adresi zaten bültenimize kayıtlı.");
        } else {
          setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
        setStatus("error");
      } else {
        setMessage("Bültenimize başarıyla abone oldunuz!");
        setStatus("success");
        setEmail("");
      }
    } catch (err) {
      setMessage("Bir hata oluştu. Lütfen tekrar deneyin.");
      setStatus("error");
    }
    
    // 4 saniye sonra mesajı temizle
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 4000);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={containerClass}>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-POSTA ADRESİNİZ" 
          className={inputClass} 
          required
          disabled={status === "loading" || status === "success"}
        />
        <button 
          type="submit" 
          className={btnClass}
          disabled={status === "loading" || status === "success"}
          style={{ cursor: status === "loading" || status === "success" ? "not-allowed" : "pointer", opacity: status === "loading" || status === "success" ? 0.7 : 1 }}
        >
          {status === "loading" ? "..." : status === "success" ? "✓" : "ABONE OL"}
        </button>
      </form>
      {message && (
        <p style={{ 
          color: status === "success" ? "#d4af37" : "#ef4444", 
          fontSize: "0.85rem", 
          marginTop: "0.5rem",
          fontWeight: 500 
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
