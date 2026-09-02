// ==============================================================================
// PERSONA ENGINE — Üslup: web ile birebir veri paritesi (Faz 1)
// ==============================================================================
// Web'in src/components/ai-asistan/AICharacterPanel.tsx içindeki TONES
// sabitiyle BİREBİR aynı `id` değerleri (organization_ai_settings.tone
// kolonuna ham string olarak yazılır). Önemli: mevcut 4 üslubun id'leri
// eskiden küçük harfliydi ('standart', 'komik', 'resmi', 'samimi') — web'de
// ise hep büyük harfle başlıyordu ("Standart", "Komik", "Resmi", "Samimi").
// Bu, iki platform arasında zaten var olan bir uyumsuzluktu (mobilden
// kaydeden bir merchant web'de hiçbir üslup kartının seçili görünmediği bir
// hataydı); burada düzeltildi. "Akademik" (web'de karşılığı yok) kaldırıldı,
// web'in 5 yeni mizacı (Neşeli/Sakin/Dedikoducu/Huysuz/Sinirli) eklendi.
// "Standart" ikonu, kullanıcının web tarafında özellikle istediği robot
// temasıyla (🤖) eşleştirildi.
// ==============================================================================

export interface MoodConfig {
  id: string;
  title: string;
  icon: string;
  prompt: string;
}

export const MOODS: MoodConfig[] = [
  {
    id: 'Standart',
    title: 'Standart',
    icon: '🤖',
    prompt: 'Dengeli, profesyonel ve standart bir ton kullan.'
  },
  {
    id: 'Komik',
    title: 'Komik',
    icon: '😆',
    prompt: 'Müşterilerle konuşurken bolca espri yap, eğlenceli teşbihler kullan ve ortamı hep neşeli tut.'
  },
  {
    id: 'Resmi',
    title: 'Resmi',
    icon: '👔',
    prompt: 'Son derece kurumsal, ciddi, mesafeli ve profesyonel bir şirket dilinde (sizli bizli) hitap et.'
  },
  {
    id: 'Samimi',
    title: 'Samimi',
    icon: '🤗',
    prompt: 'Müşteriye 40 yıllık dostunmuş gibi senli benli, sıcak, içten ve samimi bir dille hitap et.'
  },
  {
    id: 'Neşeli',
    title: 'Neşeli',
    icon: '😄',
    prompt: 'Enerjik, pozitif ve neşeli bir tavırla, gülümseten bir dille müşterilere yardımcı ol.'
  },
  {
    id: 'Sakin',
    title: 'Sakin',
    icon: '😌',
    prompt: 'Sakin, huzurlu ve yumuşak bir tonla, müşteriyi rahatlatan bir dille konuş.'
  },
  {
    id: 'Dedikoducu',
    title: 'Dedikoducu',
    icon: '🗣️',
    prompt: 'Sohbetçi, meraklı ve dedikodu sever bir mahalle esnafı gibi samimi ama gevezelik eden bir dille konuş.'
  },
  {
    id: 'Huysuz',
    title: 'Huysuz',
    icon: '😤',
    prompt: 'Biraz huysuz ve aksi ama işini iyi yapan bir esnaf gibi kısa, ters ama yine de yardımcı bir dille cevap ver.'
  },
  {
    id: 'Sinirli',
    title: 'Sinirli',
    icon: '😠',
    prompt: 'Sinirli ve sabırsız görünen ama yine de doğru bilgiyi veren bir tavırla, kısa ve keskin cümlelerle cevap ver.'
  }
];
