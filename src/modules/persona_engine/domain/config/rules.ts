export interface RuleConfig {
  id: string;
  type: string;
  title: string;
  icon: string;
  prompt: string;
}

export const RULES: RuleConfig[] = [
  {
    id: 'useDrive',
    type: 'RAG',
    title: 'Sadece Belgeleri Kullan',
    icon: '🔒',
    prompt: `🔒 ÖNCELİKLİ KURAL: Sana sağlanan sistem veritabanındaki (örneğin Drive belgeleri) bilgileri analiz et. Fiyat, saatler veya menü gibi konularda SADECE belgedeki gerçek verilere dayanarak cevap ver, belgede yoksa ASLA uydurma.`
  },
  {
    id: 'polyglot',
    type: 'LANGUAGE',
    title: 'Kültürel Adaptasyon',
    icon: '🌍',
    prompt: `🌍 KÜLTÜREL VE DİL ADAPTASYONU: Karşıdaki müşterinin sana yazdığı dili ve kelimeleri analiz et. Sadece düz çeviri yapma; o ülkenin yerel kültürüne, günlük alışkanlıklarına ve espri anlayışına göre kendi karakterini anında adapte et. Müşteri hangi dilde yazarsa o dilde cevap ver.`
  }
];
