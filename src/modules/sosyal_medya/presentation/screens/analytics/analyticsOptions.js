// Let's replace PLATFORMS and TIME_RANGES inside the component so they can be translated
export const getPlatforms = (t) => [
  { id: 'all', name: t('sosyalMedya.analytics.platforms.all'), icon: 'apps-outline', color: '#A79E96' },
  { id: 'tiktok', name: t('sosyalMedya.analytics.platforms.tiktok'), icon: 'musical-notes', color: '#ff0050' },
  { id: 'instagram', name: t('sosyalMedya.analytics.platforms.instagram'), icon: 'logo-instagram', color: '#E8A8CD' },
  { id: 'facebook', name: t('sosyalMedya.analytics.platforms.facebook'), icon: 'logo-facebook', color: '#22B573' },
  { id: 'youtube', name: t('sosyalMedya.analytics.platforms.youtube'), icon: 'logo-youtube', color: '#ff0000' },
  { id: 'linkedin', name: t('sosyalMedya.analytics.platforms.linkedin'), icon: 'logo-linkedin', color: '#0077b5' },
  { id: 'googlebusiness', name: t('sosyalMedya.analytics.platforms.googlebusiness'), icon: 'business', color: '#34a853' }
];

export const getTimeRanges = (t) => [
  { id: '7d', name: t('sosyalMedya.analytics.timeRanges.7d'), days: 7 },
  { id: '30d', name: t('sosyalMedya.analytics.timeRanges.30d'), days: 30 },
  { id: '90d', name: t('sosyalMedya.analytics.timeRanges.90d'), days: 90 },
  { id: '1y', name: t('sosyalMedya.analytics.timeRanges.1y'), days: 365 }
];
