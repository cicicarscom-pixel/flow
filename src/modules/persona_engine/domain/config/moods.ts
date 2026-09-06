// ==============================================================================
// PERSONA ENGINE — Üslup: web ile birebir veri paritesi (Faz 1 + Faz 2)
// ==============================================================================
// Faz 1: web'in src/components/ai-asistan/AICharacterPanel.tsx içindeki TONES
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
//
// Faz 2: web'deki gibi sadece bu 5 yeni mizacın görseli var — mevcut 4 üslup
// (Standart/Komik/Resmi/Samimi) kasıtlı olarak avatarUrl'siz, sadece emoji
// ile kalıyor (web'de de tam olarak öyle, bkz. AICharacterPanel.tsx). Görsel
// URL'leri flowweb'in kendi barındırdığı statik dosyalara işaret ediyor
// (kullanıcının "web'den URL ile çek" kararı — mobil bundle'a gömme yok).
// ==============================================================================
const TONE_AVATAR_BASE = 'https://flow.workigom.com/ai-asistan/tones';

export interface MoodConfig {
  id: string;
  title: string;
  icon: string;
  prompt: string;
  avatarUrl?: string;
}

// i18n Faz 2 (Eylül 2026): `id`/`title` DEĞİŞTİRİLEMEZ (bkz. dosya başındaki
// not — organization_ai_settings.tone'a ham string yazılır, web'in
// TONE_KEY_BY_ID'siyle birebir aynı `id` kümesi). Ekranda gösterilen etiket
// artık `title` değil, bu eşlemeyle `personas.tones.*` çeviri anahtarından
// üretilir (bkz. BotYonetimiScreen.js).
export const MOOD_I18N_KEY_BY_ID: Record<string, string> = {
  'Standart': 'standart',
  'Komik': 'komik',
  'Resmi': 'resmi',
  'Samimi': 'samimi',
  'Neşeli': 'neseli',
  'Sakin': 'sakin',
  'Dedikoducu': 'dedikoducu',
  'Huysuz': 'huysuz',
  'Sinirli': 'sinirli',
};

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
    prompt: 'Enerjik, pozitif ve neşeli bir tavırla, gülümseten bir dille müşterilere yardımcı ol.',
    avatarUrl: `${TONE_AVATAR_BASE}/neseli.png`
  },
  {
    id: 'Sakin',
    title: 'Sakin',
    icon: '😌',
    prompt: 'Sakin, huzurlu ve yumuşak bir tonla, müşteriyi rahatlatan bir dille konuş.',
    avatarUrl: `${TONE_AVATAR_BASE}/sakin.png`
  },
  {
    id: 'Dedikoducu',
    title: 'Dedikoducu',
    icon: '🗣️',
    prompt: 'Sohbetçi, meraklı ve dedikodu sever bir mahalle esnafı gibi samimi ama gevezelik eden bir dille konuş.',
    avatarUrl: `${TONE_AVATAR_BASE}/dedikoducu.png`
  },
  {
    id: 'Huysuz',
    title: 'Huysuz',
    icon: '😤',
    prompt: 'Biraz huysuz ve aksi ama işini iyi yapan bir esnaf gibi kısa, ters ama yine de yardımcı bir dille cevap ver.',
    avatarUrl: `${TONE_AVATAR_BASE}/huysuz.png`
  },
  {
    id: 'Sinirli',
    title: 'Sinirli',
    icon: '😠',
    prompt: 'Sinirli ve sabırsız görünen ama yine de doğru bilgiyi veren bir tavırla, kısa ve keskin cümlelerle cevap ver.',
    avatarUrl: `${TONE_AVATAR_BASE}/sinirli.png`
  }
];
