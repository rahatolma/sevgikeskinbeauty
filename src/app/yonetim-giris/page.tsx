'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import { Lock, LogIn } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      style={{
        width: '100%',
        padding: '12px',
        background: 'var(--color-primary, #111)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: pending ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.2s'
      }}
    >
      {pending ? 'Giriş yapılıyor...' : (
        <>
          <LogIn size={18} />
          <span>Sisteme Gir</span>
        </>
      )}
    </button>
  );
}

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);

  async function clientAction(formData: FormData) {
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'var(--font-jost), var(--font-sen), sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: '#f1f3f5', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <Lock size={32} color="#333" />
        </div>
        
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111' }}>Yönetici Girişi</h1>
        <p style={{ margin: '0 0 32px 0', color: '#666', fontSize: '15px' }}>Sevgi Keskin Admin Paneli</p>

        <form action={clientAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              type="password" 
              name="password"
              placeholder="Admin Şifresi"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {error && (
            <div style={{ color: '#e03131', fontSize: '14px', background: '#fff5f5', padding: '10px', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <SubmitButton />
        </form>
        
        <div style={{ marginTop: '32px', fontSize: '13px', color: '#adb5bd' }}>
          Güvenli Bölge &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
