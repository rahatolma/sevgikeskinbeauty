"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import HeroSlider from "@/components/HeroSlider";
import styles from "./hizmetlerimiz.module.css";

const servicesData = [
  {
    id: "cilt-bakimlari",
    title: "Cilt Bakımları",
    hook: "Cildinizde yorgunluk, matlık veya elastikiyet kaybı mı var?",
    desc: "Cildinizin ihtiyaç duyduğu tüm mineralleri ve vitaminleri hücre düzeyinde onararak, daha canlı ve sıkı bir görünüme kavuşmanızı sağlıyoruz. Özel analiz sonrası tamamen size uygun protokolü başlatıyoruz.",
    image: "/images/about-vertical.jpg",
    subServices: [
      { name: "Anti Aging Cilt Bakımı", duration: "60 dk", description: "Daha sıkı, canlı ve genç bir cilt görünümü sağlar", popular: false },
      { name: "Medikal Cilt Analizi & Bakım", duration: "45 dk", description: "Bariyer onarımı sağlayan temel derinlemesine temizlik", popular: false },
      { name: "Signature Hydrafacial", duration: "75 dk", description: "Dünyaca ünlü sıvı dermabrazyon ile anında ışıltı", popular: true },
    ]
  },
  {
    id: "lazer-epilasyon",
    title: "Lazer Epilasyon",
    hook: "İstenmeyen tüylerle geçen vakti sonsuza dek geride bırakmak ister misiniz?",
    desc: "Yeni jenerasyon, buz başlıklı ve acısız ütüleme teknolojisi ile tüm cilt tiplerinde etkili kalıcı pürüzsüzlük sunuyoruz. Konforunuz maksimum, sonuçlar garantilidir.",
    image: "/images/slider/slide2.jpg",
    subServices: [
      { name: "Tüm Vücut Lazer (Kadın)", duration: "60 dk", description: "Baş boyun hariç, tüm majör bölgelerde kesin çözüm", popular: true },
      { name: "Yarım Vücut Uygulamaları", duration: "40 dk", description: "Sadece ihtiyaç duyduğunuz belirli alanlara yönelik", popular: false },
      { name: "Bölgesel Hassas Lazer", duration: "20 dk", description: "Yüz veya spesifik ufak bölgeler için hızlı sonuç", popular: false },
    ]
  },
  {
    id: "cilt-yenileme",
    title: "Cilt Yenileme & Onarım",
    hook: "Yüzünüzdeki sarkmalar veya geçmişten gelen izler canınızı mı sıkıyor?",
    desc: "Kolajen ve elastin liflerinizi uyararak skar (iz), leke ve ince kırışıklıkları ortadan kaldırıyoruz. Tamamen yenilenmiş, pürüzsüz bir cilt yüzeyi tasarlıyoruz.",
    image: "/images/slider/slide3.jpg",
    subServices: [
      { name: "Dermapen 4 & Medikal Mezoterapi", duration: "50 dk", description: "Hücre üretimini maksimize eden altın iğnesiz teknik", popular: false },
      { name: "Altın İğne (Fraksiyonel RF)", duration: "60 dk", description: "Derin doku onarımı ve anında lifting efekti", popular: true },
      { name: "Leke Silme Protokolü", duration: "45 dk", description: "Güneş ve yaşlılık lekelerinde klinik aydınlatma", popular: false },
    ]
  },
  {
    id: "yuz-masaji",
    title: "Lifting Yüz Masajları",
    hook: "Yerçekiminin yüzünüzde bıraktığı yorgun ifadeyi silmeye hazır mısınız?",
    desc: "Cerrahi bir işleme gerek kalmadan, sadece lenfatik masaj ve doğru manipülasyonlarla yüz hatlarınızı keskinleştiriyor, ödemleri anında uzaklaştırıyoruz.",
    image: "/images/massage.png",
    subServices: [
      { name: "Gua Sha Face Lift Masajı", duration: "45 dk", description: "Doğal taşlar yardımıyla çene ve elmacık kemiği belirginleştirme", popular: true },
      { name: "Lenfatik Drenaj Yüz Masajı", duration: "30 dk", description: "Göz altı morlukları ve sabah ödemleri için birebir", popular: false },
      { name: "Anti-Stres Baş ve Boyun", duration: "30 dk", description: "Migren ve kas gerginliği hafifletme odaklı manuel terapi", popular: false },
    ]
  },
  {
    id: "vucut-bakimi",
    title: "Vücut Bakımları",
    hook: "Aynadaki silüetinizde daha pürüzsüz ve sıkı kıvrımlar görmek ister misiniz?",
    desc: "Selülit protokolleri ve yoğun sıkılaştırıcı killerle bedeninizi baştan yaratıyoruz. Fazlalıklardan arının, elastikiyeti geri kazanın ve ruhunuzu dinlendirin.",
    image: "/images/about-vertical.jpg",
    subServices: [
      { name: "G5 Sarkma & Selülit Protokolü", duration: "50 dk", description: "Dirençli yağ hücrelerinde mekanik parçalanma", popular: true },
      { name: "Deniz Tuzu Tam Vücut Peeling", duration: "40 dk", description: "Ölü derilerden arındırma ve nem dengesi", popular: false },
      { name: "Aromaterapi Gevşeme Terapisi", duration: "60 dk", description: "Özel esansiyel yağlar eşliğinde stresten arınma", popular: false },
    ]
  }
];

export default function HizmetlerimizPage() {
  const [activeSection, setActiveSection] = useState(servicesData[0].id);

  // Focus directly on the single active service layout
  const activeData = servicesData.find(s => s.id === activeSection) || servicesData[0];

  return (
    <main className={styles.pageWrapper}>

      <HeroSlider 
        title={<>Size Özel Güzellik <br/>Protokolleri</>}
        subtitle={<>İhtiyacınıza yönelik en doğru profesyonel uygulamalarla, <br/>cildinizi ve bedeninizi en iyi haline kavuşturuyoruz.</>}
        imageSrc="/images/slider/services_1.png"
        ctaLink="/iletisim"
        ctaText="RANDEVU AL"
        ctaNote=""
        alignment="center"
      />
      
      <section className={styles.mainSection}>
        <div className={`container ${styles.layoutGrid}`}>
          
          {/* Left Column: Focused Tab Menu */}
          <aside className={styles.sidebar}>
            <div className={styles.stickyMenu}>
              <h4 className={styles.menuTitle}>Hizmetlerimiz</h4>
              <ul className={styles.menuList}>
                {servicesData.map((service) => (
                  <li key={service.id}>
                    <button 
                      className={`${styles.menuLink} ${activeSection === service.id ? styles.active : ""}`}
                      onClick={() => setActiveSection(service.id)}
                    >
                      {service.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right Column: Isolated Single Focus Block */}
          <div className={styles.contentArea}>
            <div className={styles.serviceBlock}>
              
              <h2 className={styles.serviceTitle}>{activeData.title}</h2>
              
              <div className={styles.textContent}>
                
                {/* HEADLINE HOOK (BÜYÜTÜLDÜ VE ANA BAŞLIK YAPILDI) */}
                <div className={styles.hookWrapper}>
                  <h3 className={styles.hookHeadline}>{activeData.hook}</h3>
                  <p className={styles.serviceDesc}>{activeData.desc}</p>
                </div>
                
                {/* DYNAMIC SALES ROW GENERATOR (SubServices) */}
                <div className={styles.subServicesContainer}>
                   <h3 className={styles.subServicesHeader}>Bu Kategorideki Uygulamalar</h3>
                   
                   <div className={styles.subServicesList}>
                      {activeData.subServices.map((sub, idx) => (
                         <div key={idx} className={`${styles.subServiceRow} ${sub.popular ? styles.highlightCard : ""}`}>
                            
                            {/* ABSOLUTE BADGE */}
                            {sub.popular && <span className={styles.highlightBadge}>⭐ ÖNE ÇIKAN DENEYİM</span>}

                            <div className={styles.subServiceInfo}>
                               <div className={styles.subServiceTitleFlex}>
                                  <h4 className={styles.subServiceName}>{sub.name}</h4>
                               </div>
                               <p className={styles.subServiceMicroDesc}>{sub.description}</p>
                               <span className={styles.subServiceDuration}>⏱ {sub.duration}</span>
                            </div>
                            <div className={styles.subServiceAction}>
                              <Link href="/iletisim" className={styles.subServiceBtn}>
                                 Randevu Al <span className={styles.btnArrow}>→</span>
                              </Link>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
                
              </div>
              
            </div>
          </div>
          
        </div>
      </section>

    </main>
  );
}
