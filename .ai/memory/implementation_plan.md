# Zernio API Analitik Entegrasyonu Planı

Mevcut `AnalyticsScreen` sayfamız sadece kendi veritabanımızdaki (Supabase) toplam gönderi/mesaj sayılarını gösteriyordu. Gönderdiğiniz tüm dokümanlara göre, doğrudan Zernio API üzerinden **YouTube, TikTok, LinkedIn, Instagram, Google Business Profile (GBP) ve Facebook** gibi platformlara ait detaylı analitik verilerini uygulamaya entegre edeceğiz. Ayrıca **Genel Gönderi Metrikleri, Takipçi İstatistikleri (Follower Stats), Günlük Özetler (Daily Metrics) ve İçerik Performans Düşüşü (Content Decay)** gibi ileri düzey analizleri de göstereceğiz.

## Open Questions
> [!IMPORTANT]
> 1. **Zernio Account ID:** Zernio'dan analiz çekmek için her platformun `accountId` değerine ihtiyacımız var. Bu `accountId`'leri şu anda veritabanındaki `social_accounts` tablosundan alabiliriz. Tüm testleri bu tablodaki mevcut bağlantılı hesaplar üzerinden mi yapalım?
> 2. **Grafik Kütüphanesi:** React Native'de bu karmaşık demografi ve retention (elde tutma) grafiklerini çizmek için `react-native-chart-kit` veya `react-native-gifted-charts` kütüphanesini projeye dahil edebilir miyim?

## Proposed Changes

### 1. Backend: Supabase Edge Function (`zernio-client`)
Zernio Node SDK kullanarak analiz uç noktalarını (endpoints) mevcut `zernio-client` servisimize ekleyeceğiz.

#### [MODIFY] [zernio-client/index.ts](file:///c:/Users/roman/AI-Esnaf/supabase/functions/zernio-client/index.ts)
- `action` bloklarına yenilerini ekleyeceğiz:
  - `get-youtube-insights`: `zernio.analytics.getYoutubeChannelInsights()`
  - `get-youtube-demographics`: `zernio.analytics.getYoutubeDemographics()`
  - `get-tiktok-insights`: `zernio.analytics.getTiktokAccountInsights()`
  - `get-youtube-daily-views`: `zernio.analytics.getYoutubeDailyViews()`
  - `get-linkedin-page-analytics`: `zernio.analytics.getLinkedinOrganizationPageAggregateAnalytics()`
  - `get-linkedin-post-stats`: `zernio.analytics.getLinkedinPostStats()`
  - `get-linkedin-aggregate-stats`: `zernio.analytics.getLinkedinAggregateStats()`
  - `get-instagram-insights`: `zernio.analytics.getInstagramInsights()`
  - `get-instagram-demographics`: `zernio.analytics.getInstagramDemographics()`
  - `get-instagram-follower-history`: `zernio.analytics.getInstagramFollowerHistory()`
  - `get-gbp-search-keywords`: `zernio.analytics.getGbpSearchKeywords()`
  - `get-gbp-performance`: `zernio.analytics.getGbpPerformanceMetrics()`
  - `get-facebook-insights`: `zernio.analytics.getFacebookPageInsights()`
  - `get-follower-stats`: `zernio.accounts.getFollowerStats()`
  - `get-daily-metrics`: `zernio.analytics.getDailyAggregatedMetrics()`
  - `get-content-decay`: `zernio.analytics.getContentPerformanceDecay()`
  - `get-post-timeline`: `zernio.analytics.getPostAnalyticsTimeline()`
  - `get-posting-frequency`: `zernio.analytics.getPostingFrequency()`
  - `get-best-times`: `zernio.analytics.getBestTimesToPost()`
  - `get-post-analytics`: `zernio.analytics.getPostAnalytics()`

### 2. Frontend: `AnalyticsScreen.js`
Şu anki sahte grafikleri (DummyBarChart) kaldırıp, Zernio'dan dönen gerçek verilerle dinamik yapılar oluşturacağız.

#### [MODIFY] [AnalyticsScreen.js](file:///c:/Users/roman/AI-Esnaf/src/screens/AnalyticsScreen.js)
- **Veri Çekme (Fetch) Mantığı:** `handleSelectPlatform` fonksiyonu çalıştığında, seçilen platforma göre Edge Function üzerinden Zernio API'sine uygun analitik istekleri atılacak. "Tüm Platformlar" seçildiğinde genel metrikler (Gönderi sıklığı, Follower Stats, Daily Aggregated Metrics, Content Decay) çekilecek.
- **Dinamik Render:**
  - YouTube seçildiğinde: Kanal metrikleri (views, subscribersGained) ve Demografi (yaş/cinsiyet) verileri render edilecek.
  - TikTok seçildiğinde: Hesap istatistikleri (followers_count, likes_count, video_views) gösterilecek.
  - LinkedIn seçildiğinde: Organizasyon sayfası etkileşimleri ve post analizleri gösterilecek.
  - Instagram seçildiğinde: Takipçi geçmişi, Demografi pastası (age/gender) ve Insight metrikleri listelenecek.
  - Google Business (GBP) seçildiğinde: Arama anahtar kelimeleri ve Performans Metrikleri (Website Clicks vb.) basılacak.
  - Facebook seçildiğinde: Sayfa içgörüleri (Page Insights, reach, impressions) grafikleştirilecek.
  - "Tüm Platformlar" (Genel Bakış) görünümünde ise `post-timeline`, `follower-stats`, `daily-metrics` ve `content-decay` ile genel büyüme ve etkileşim zaman çizelgeleri çizdirilecek.
- Gelen veriler, `react-native-chart-kit` yardımıyla (çizgi grafikleri, bar grafikleri) ve mevcut `AnimatedBorderCard` bileşenlerimizle ekrana basılacak.

## Verification Plan
1. Edge fonksiyonlarını yeniden deploy edip Zernio SDK fonksiyonlarını test edeceğiz.
2. Analytics sekmesinden "YouTube" ve "TikTok" seçildiğinde Zernio'dan gelen verilerin (HTTP 200) doğru işlenip arayüzde bozulma olmadan listelendiğini teyit edeceğiz.
