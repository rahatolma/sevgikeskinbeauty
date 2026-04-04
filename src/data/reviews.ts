export interface Review {
  id: string;
  name: string;
  text: string;
  category: "Cilt Bakımı" | "Leke Tedavisi" | "Vücut Şekillendirme" | "Lazer Epilasyon" | "Genel";
  isHighlight?: boolean;
}

export const reviews: Review[] = [
  {
    id: "r1",
    category: "Leke Tedavisi",
    name: "Zeynep Y.",
    text: "Açıkçası başta tereddüt etmiştim ama sonuçtan çok memnun kaldım. Uzun zamandır geçmeyen güneş lekelerim açılmaya başladı.",
    isHighlight: false
  },
  {
    id: "r2",
    category: "Genel",
    name: "Ayşe K.",
    text: "Daha içeri girer girmez hijyen ve profesyonellik hissediliyor. İlk kez bu kadar rahat hissettim ve sonuçlar mükemmel.",
    isHighlight: true /* Ana sayfa merkez kartı */
  },
  {
    id: "r3",
    category: "Cilt Bakımı",
    name: "Elif T.",
    text: "Uyguladıkları analiz sonrası yapılan profesyonel bakım tam ihtiyacım olan şeymiş. Cildimdeki o yorgun ifade tamamen gitti.",
    isHighlight: false
  },
  {
    id: "r4",
    category: "Lazer Epilasyon",
    name: "Selin M.",
    text: "Lazer konusunda çok tereddütlerim vardı ama uzman yaklaşımlarıyla acısız ve inanılmaz hızlı sonuç aldım. Çok rahat ettim.",
    isHighlight: false
  },
  {
    id: "r5",
    category: "Vücut Şekillendirme",
    name: "Burcu A.",
    text: "Bölgesel incelme paketine başladım. Daha 3. seansta kıyafetlerimde farkı bariz hissetmeye başladım, herkese öneriyorum.",
    isHighlight: false
  },
  {
    id: "r6",
    category: "Cilt Bakımı",
    name: "Cemre G.",
    text: "Medikal cilt bakımı ve temizlik sonrası cildimdeki o nefes alma hissini tarif edemem. Pırıl pırıl ve temiz bir ciltle ayrıldım.",
    isHighlight: false
  },
  {
    id: "r7",
    category: "Leke Tedavisi",
    name: "Duygu H.",
    text: "Çok yanlış ürünler kullanarak cildimi yormuştum. Burada bana özel hazırlanan protokolle cildim eski sağlığına kavuştu.",
    isHighlight: false
  },
  {
    id: "r8",
    category: "Genel",
    name: "Merve D.",
    text: "Güler yüzlü karşılama ve her adımda ne yapıldığını detaylıca anlatmaları bana çok güven verdi. Gözü kapalı gelebilirsiniz.",
    isHighlight: false
  },
  {
    id: "r9",
    category: "Vücut Şekillendirme",
    name: "Tuğçe S.",
    text: "Doğum sonrası toparlanma sürecimde vücut sıkılaştırma desteği aldım. Etkisi beni ilk andan itibaren gerçekten şaşırttı.",
    isHighlight: false
  },
  {
    id: "r10",
    category: "Lazer Epilasyon",
    name: "Gizem R.",
    text: "Son derece titiz çalışıyorlar. Odalarının steril olması ve cihazların premium kalitesi işlemlerin sonuçlarına direkt yansıyor.",
    isHighlight: false
  }
];
