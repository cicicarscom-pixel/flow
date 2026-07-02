export interface MoodConfig {
  id: string;
  title: string;
  icon: string;
  prompt: string;
}

export const MOODS: MoodConfig[] = [
  {
    id: 'standart',
    title: 'Standart',
    icon: '🙂',
    prompt: 'Dengeli, profesyonel ve standart bir ton kullan.'
  },
  {
    id: 'komik',
    title: 'Komik',
    icon: '😂',
    prompt: 'Müşterilerle konuşurken bolca espri yap, eğlenceli teşbihler kullan ve ortamı hep neşeli tut.'
  },
  {
    id: 'resmi',
    title: 'Resmi',
    icon: '👔',
    prompt: 'Son derece kurumsal, ciddi, mesafeli ve profesyonel bir şirket dilinde (sizli bizli) hitap et.'
  },
  {
    id: 'samimi',
    title: 'Samimi',
    icon: '🤗',
    prompt: 'Müşteriye 40 yıllık dostunmuş gibi senli benli, sıcak, içten ve samimi bir dille hitap et.'
  },
  {
    id: 'akademik',
    title: 'Akademik',
    icon: '🎓',
    prompt: 'Cevaplarını resmi, detaylı, bilgi ağırlıklı ve akademik bir makale diliyle sun.'
  }
];
