import React from 'react';
import Image from 'next/image';

export default function BakimModu() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#faf9f6', // Elegant light cream background
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-jost), var(--font-sen), sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      <div style={{ marginBottom: '40px' }}>
        <Image 
          src="/images/logo.png" 
          alt="Sevgi Keskin Beauty" 
          width={220} 
          height={80} 
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      
      <h1 
        style={{
          fontSize: '2rem',
          fontWeight: 400,
          margin: '0 0 16px 0',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#111827' // Dark charcoal for high contrast
        }}
      >
        Çok Yakında
      </h1>
      
      <p 
        style={{
          color: '#4b5563', // Elegant dark gray
          maxWidth: '500px',
          lineHeight: '1.6',
          fontSize: '1.1rem',
          margin: 0
        }}
      >
        Sizlere daha iyi ve kusursuz bir deneyim sunabilmek için sistemlerimizi hazırlıyoruz. Sevgi Keskin Beauty dijital randevu sistemimiz kısa bir süre sonra devrede olacaktır.
      </p>

      <div 
        style={{
          marginTop: '64px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '300px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}
      >
        &copy; {new Date().getFullYear()} Sevgi Keskin Beauty
      </div>
    </div>
  );
}
