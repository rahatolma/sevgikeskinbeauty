"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import HeroSlider from "@/components/HeroSlider";
import Testimonials from "@/components/Testimonials";
import WhyUs from "@/components/WhyUs";
import BakimSureci from "@/components/BakimSureci";
import CiltAnaliziModal from "@/components/CiltAnaliziModal";
import { useState, useRef } from "react";

const services = [
  {
    title: "Cilt Yenileme & Gençleştirme",
    description: "Daha parlak, canlı ve genç görünen bir cilt",
    image: "/images/services/1-cilt-yenileme-v2.png", 
    link: "/hizmetlerimiz?kat=cilt-yenileme-genclestirme",
    objectPosition: "center top", // Kadının kafasının kesilmesini önlemek için focusu yukarı çektik
  },
  {
    title: "Leke & Ton Eşitleme",
    description: "Cilt tonunu eşitleyen ve lekeleri azaltan bakım",
    image: "/images/services/2-leke-ton.png",
    link: "/hizmetlerimiz?kat=leke-ton-esitleme",
  },
  {
    title: "Vücut Şekillendirme & Sıkılaşma",
    description: "Daha sıkı ve formda bir vücut görünümü",
    image: "/images/services/3-vucut-sikilasma.png",
    link: "/hizmetlerimiz?kat=vucut-sekillendirme-sikilasma",
  },
  {
    title: "Lazer Epilasyon",
    description: "Kalıcı pürüzsüzlük ve konfor",
    image: "/images/services/4-lazer-epilasyon.png",
    link: "/hizmetlerimiz?kat=lazer-epilasyon",
  },
  {
    title: "Masaj & Rahatlama Terapileri",
    description: "Stresi azaltan ve bedeni yenileyen terapiler",
    image: "/images/services/5-masaj-spa.png",
    link: "/hizmetlerimiz?kat=masaj-terapiler",
  },
  {
    title: "Size Özel Bakım Programı",
    description: "Cilt analizi ile sizin için en doğru bakım planını birlikte oluşturuyoruz",
    image: "/images/services/6-ozel-bakim.png", /* Özel kampanya/highlight kartı */
    isModalTarget: true,
    ctaText: "ÜCRETSİZ CİLT ANALİZİ AL",
    label: "KİŞİYE ÖZEL DANIŞMANLIK"
  }
];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main>
      <CiltAnaliziModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Glowish Style Hero Slider */}
      <HeroSlider
        imageSrc="/images/slider/hero-home-yeni.png"
        alignment="fullbleed-left"
        title={<>Sizin için en doğru <br/>bakım deneyimi...</>}
        subtitle="Cilt, vücut ve bakım ihtiyaçlarınıza özel profesyonel çözümler sunuyoruz."
      />

      {/* Services Section */}
      <section id="hizmetler" className={styles.servicesSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Size Özel Güzellik Protokolleri</h2>
            <p className={styles.sectionSubtitleLarge}>Uzman dokunuşlarla size özel bakım protokolleri</p>
          </div>

          <div className={styles.servicesGrid}>
            {services.map((service, index) => {
              // 1. kart (index 0) ve 6. kart (index 5) "büyük" bento kartları olacak
              const isLarge = index === 0 || index === 5;
              const isCampaign = index === 5;

              const cardBody = (
                  <div className={styles.serviceImageWrapper}>
                    <Image 
                      src={service.image} 
                      alt={service.title} 
                      fill 
                      className={styles.serviceImage}
                      style={service.objectPosition ? { objectPosition: service.objectPosition } : undefined}
                    />
                    <div className={styles.serviceAlwaysOnOverlay}>
                      <div className={styles.serviceContent}>
                        {service.label && (
                          <span className={styles.campaignLabel}>{service.label}</span>
                        )}
                        <h3 className={styles.serviceTitle}>{service.title}</h3>
                        <p className={styles.serviceDesc}>{service.description}</p>
                        
                        <div className={styles.btnContainer}>
                          <span className={styles.serviceBtn}>
                            {service.ctaText || "Detayları Gör"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
              );

              if (service.isModalTarget) {
                 return (
                    <div 
                       key={index} 
                       className={`${styles.serviceCard} ${isLarge ? styles.serviceCardLarge : ''} ${isCampaign ? styles.serviceCardCampaign : ''}`}
                       onClick={() => setIsModalOpen(true)}
                       style={{ cursor: 'pointer' }}
                    >
                       {cardBody}
                    </div>
                 );
              }

              return (
                <Link 
                  href={service.link || "#"} 
                  key={index} 
                  className={`${styles.serviceCard} ${isLarge ? styles.serviceCardLarge : ''} ${isCampaign ? styles.serviceCardCampaign : ''}`}
                >
                  {cardBody}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY US (Neden Biz) - TRUST/AUTHORITY BLOCK */}
      <WhyUs />

      {/* Müşteri Yorumları Modülü */}
      <Testimonials />

      {/* HOW IT WORKS (Bakım Süreci) - CONVERSION BLOCK */}
      <BakimSureci />

    </main>
  );
}
