# Workigom Flow - Ekranlar ve Backend İşlevleri (README_SCREENS)

Bu dosya, `AI-Esnaf` uygulamasındaki ekranların (UI) ne işe yaradığını, içerisindeki buton ve şalterlerin (switch) görevlerini ve bu bileşenlerin backend (Supabase, Zernio, vb.) ile nasıl haberleştiğini belgelemek için oluşturulmuştur. 

> **Not:** Ekranlarda veya backend bağlantılarında bir değişiklik yapıldığında lütfen bu dosyayı güncelleyin.

---

## 1. Bot Yönetimi Ekranı (`BotYonetimiScreen.js`)

**Amaç:** Kullanıcının AI Asistan'ın (Bot'un) kimliğini (persona), talimatlarını ve entegrasyonlarını yönettiği ana ekrandır.

**UI Bileşenleri ve İşlevleri:**
*   **Sistem Talimatı (AI Karakter Talimatı) Girişi:** Kullanıcının asistanın nasıl davranması gerektiğini belirlediği uzun metin alanıdır.
*   **Hazır Rol Preset Butonları:** "Öfkeli", "Profesyonel", "Eğlenceli" gibi hazır asistan profillerini seçmeye yarar. Tıklandığında Sistem Talimatı alanını günceller.
*   **WhatsApp Şalteri (Toggle):** 
    *   **İşlev:** AI Asistan'ın WhatsApp üzerinden müşterilerle otomatik mesajlaşma yeteneğini açıp kapatır.
    *   **Backend:** Supabase'de bot ayarlarını günceller (aktif/pasif durumu). Etkinleştirildiğinde WAHA (WhatsApp HTTP API) veya benzeri bir altyapı üzerinden WhatsApp webhook'larını tetikler veya durdurur.
*   **Google Drive Senkronizasyon Şalteri/Butonu:** 
    *   **İşlev:** RAG (Retrieval-Augmented Generation) altyapısı için kullanıcının Google Drive'ındaki belgeleri AI Asistan'ın hafızasına senkronize eder.
    *   **Backend:** Supabase'e Drive entegrasyonu komutunu gönderir, seçili klasörlerdeki belgeler indekslenerek (embedding) vektör veritabanına kaydedilir.
*   **Kaydet Butonu:**
    *   **İşlev:** Yapılan tüm persona ve entegrasyon değişikliklerini kaydeder.
    *   **Backend:** `useSavePersona` (veya benzer) custom hook'u aracılığıyla Supabase veritabanında kullanıcının (veya işletmenin) asistan profilini günceller.

---

## 2. Sosyal Medya Ekranı (`SosyalMedyaScreen.js`)

**Amaç:** İşletmenin çeşitli sosyal medya hesaplarını (YouTube, LinkedIn, Instagram, Google Business vb.) tek bir merkezden yönettiği ve istatistiklerini gördüğü ekrandır.

**UI Bileşenleri ve İşlevleri:**
*   **Hesap Bağla Butonları:**
    *   **İşlev:** İlgili sosyal medya platformu için yetkilendirme (OAuth) sürecini başlatır.
    *   **Backend:** Zernio API'si kullanılarak hesap entegrasyonu sağlanır. Zernio Client aracılığıyla Supabase Edge Functions ile iletişim kurulur.
*   **Hesap Ayır (Disconnect) Butonu:**
    *   **İşlev:** Bağlı olan sosyal medya hesabının bağlantısını koparır.
    *   **Backend:** ZernioClient içindeki `disconnect-account` metoduna bağlanır ve backend tarafında oturumu / erişim token'larını temizler.
*   **Analytics (İstatistik) Kartları:**
    *   **İşlev:** Takipçi sayısı, etkileşim gibi verileri gösterir.
    *   **Backend:** Zernio'dan çekilen veriler, optimizasyon için Supabase üzerinde önbelleklenir (analytics cache - `20260705000000_analytics_cache.sql` migration'ı ile desteklenir).

---

## 3. Randevu Ekranı (`RandevuScreen.js`)

**Amaç:** Müşteri randevularının takvim ve saat (timeline) bazında yönetilmesini sağlar.

**UI Bileşenleri ve İşlevleri:**
*   **Takvim Şeridi (Yatay):**
    *   **İşlev:** Günler arasında geçiş yapılmasını sağlar.
    *   **Backend:** `selectedDate` state'ini değiştirerek `useAppointments` hook'u üzerinden o güne ait randevuları çeker (`getAppointmentsByDate`).
*   **Heatmap / Timeline (Saat Slotları):**
    *   **İşlev:** 30 dakikalık periyotlarla randevu doluluk durumunu (Pending, Approved) gösterir.
    *   **Backend:** `isSlotBusy` fonksiyonu ile kontrol edilir. Supabase Realtime ile `appointments` tablosunu dinler, canlı bir güncelleme olduğunda listeyi yeniler.
*   **Randevu Ekle (FAB - Nabız Atan + Butonu):**
    *   **İşlev:** Manuel olarak yeni randevu oluşturma ekranını veya modalını açar.
    *   **Backend:** Supabase `AppointmentRepository.create()` metodunu çağırır.

---

## 4. Yapay Zeka Muhasebe Ekranı (`AiMuhasebeScreen.js`)

**Amaç:** İşletmenin finansal durumunu (gelir, gider) özetleyen ve AI destekli içgörüler sunan ekrandır.

**UI Bileşenleri ve İşlevleri:**
*   **İskelet (Skeleton) Yükleme Ekranı:** Canlı veriler Supabase'den çekilirken, ekranın Premium karanlık temasına uyumlu yanıp sönen animasyonlu iskelet bileşeni çalışır.
*   **Aylık Performans (Gelir/Gider) Kartları:**
    *   **İşlev:** İçinde bulunulan aya ait toplam "Gelir" ve "Gider" miktarını gösterir.
    *   **Backend:** Supabase `transactions` tablosundaki verileri çeker. JavaScript `Date` nesnesi kullanılarak sadece *Mevcut Ay (Current Month)* tarihli kayıtlar toplanır.
*   **Yaklaşan Ödemeler Listesi (Dikey ScrollView):**
    *   **İşlev:** Tarihi bugünden ileri olan ve `type='expense'` olan tüm gider kayıtlarını listeleyerek gün sayısını gösterir. Kutu yüksekliği sabitlenmiş olup içeriği aşağı doğru kaydırılabilir (nested scroll).
    *   **Aciliyet Durumu:** Ödemeye 3 günden az kaldıysa uyarı etiketi turkuazdan kırmızı/turuncu `#ff3131` tonlarına geçer.
*   **Aksiyon Butonları (Gelir/Gider Ekleme):**
    *   **İşlev:** Kullanıcıyı gelir veya gider eklemesi yapabileceği AiChat ekranına yönlendirir.
*   **Backend & Realtime:** Tablodaki veriler `supabase.channel` ile dinlenir, AiChat üzerinden yeni bir finansal kayıt girildiğinde sayfa kendini anlık olarak yeniler.

---

## 5. Hizmet Ayarları Ekranı (`HizmetAyarlariScreen.js`)

**Amaç:** Randevu alınabilecek hizmet türlerinin, sürelerinin ve fiyatlarının tanımlandığı ayar ekranı. (Randevu Modülü altındadır).

**UI Bileşenleri ve İşlevleri:**
*   **İşlev:** Hizmet ekleme, düzenleme ve silme.
*   **Backend:** Supabase'deki `services` (veya benzeri) tablosunu günceller, çoklu dil (i18n) desteği ile `useTranslation` kullanılarak lokalize veriler gösterilir.

---

## 6. Anasayfa (Dashboard) Ekranı (`DashboardScreen.js`)

**Amaç:** İşletme sahibinin genel özet verileri görebildiği, AI asistanının durumunu kontrol edip hızlı aksiyonlar alabildiği ana yönetim panelidir. Tüm veriler Supabase ve Zernio'dan asenkron olarak çekilir ve yükleme anında Skeleton animasyonu ile gösterilir.

**UI Bileşenleri ve İşlevleri:**
*   **Profil Bilgileri:**
    *   **Backend:** `supabase.auth.getSession()` üzerinden kullanıcının metadata'sından (`full_name`, `avatar_url`) isim ve profil fotoğrafını dinamik olarak çeker.
*   **AI Asistan Aktif Şalteri (Switch):**
    *   **İşlev:** AI asistanın (Bot) 7/24 genel çalışma durumunu (aktif/pasif) değiştirir.
    *   **Backend:** Supabase'deki `bot_settings` tablosundan okur ve `update` komutuyla yazar.
*   **Finansal Özet Grid'i:** 
    *   **İşlev:** Gelir ve giderleri ufak bar grafiklerle görselleştirir.
    *   **Backend:** `transactions` tablosundaki `type='income'` ve `type='expense'` verilerinin genel toplamını alıp yerel para formatında ekrana basar.
*   **Sosyal Medya İstatistik Kartı (Canlı Analiz):** 
    *   **İşlev:** Bağlı tüm sosyal medya hesaplarının (Instagram, Google vb.) toplam takipçi kitlesini ve büyüme yüzdesini tek bir rakam halinde gösterir.
    *   **Backend:** `supabase.functions.invoke('zernio-client', { action: 'get-follower-stats' })` çağrısı yaparak edge function üzerinden güncel metrikleri toplar.
*   **Son Aktiviteler / İletişim Raporları:** 
    *   **İşlev:** Uygulamaya gelen en güncel bildirimleri (mesaj ve yorumları) zamana göre sıralayarak listeler.
    *   **Backend:** `messages` ve `comments` tablolarından `created_at` sırasına göre alınan veriler birleştirilip en güncel 3 etkinlik (WhatsApp ve Instagram platformları bazında) renk kodlarıyla basılır.
*   **Yaklaşan Ödemeler Yatay Kaydırma (Scroll):** 
    *   **İşlev:** Yaklaşan kira, fatura gibi ödemeleri günleriyle birlikte yatay listeler.
    *   **Backend:** `transactions` tablosundaki gelecekteki (`date >= today`) gider (`expense`) kayıtlarından beslenir.
*   **FAB (Yıldız / Auto-Awesome Butonu):** Hızlı AI üretimi veya genel aksiyon menüsü için kullanılır.

---

## 7. Analiz Ekranı (`AnalyticsScreen.js`)

**Amaç:** Sosyal medya hesaplarına ait istatistiklerin detaylı ve grafiksel (Pasta grafiği, Çizgi grafiği vb.) olarak incelendiği rapordur. Zernio entegrasyonuyla canlı veriler çekilir.

**UI Bileşenleri ve İşlevleri:**
*   **Sekme (Tab) Geçişi (Gönderi Analizi / Gelen Kutusu Analizi):** İlgili veri kümesinin gösterimini değiştirir.
*   **Platform ve Zaman Aralığı Filtreleri (Dropdown):** Analiz edilecek platform (Tümü, Instagram, TikTok vb.) ve zaman dilimi (7g, 30g vb.) seçimi yapılır.
*   **İstatistik Grafikleri (LineChart, PieChart vb.):** 
    *   **İşlev:** Takipçi büyümesi, demografi, etkileşim (views/likes) trendlerini ekrana basar.
    *   **Backend:** Supabase Edge Functions (`zernio-client`) tetiklenerek Zernio API'den canlı metrikler (`get-daily-metrics`, `get-instagram-demographics` vb.) alınır.
*   **Temel Metrik Kartları:** Toplam gönderi, yorum, değerlendirme, takipçi sayısını ve mesaj hacmini gösterir. 
    *   **Backend:** Kısmen Zernio'dan alınırken; gönderiler, yorumlar, değerlendirmeler ve mesajlar uygulamanın lokal Supabase tablolarından (`posts`, `comments`, `reviews`, `messages`) `supabase.channel` ile Realtime (canlı) dinlenerek anlık sayılır.

---

*Gelecekte yeni ekranlar veya özellikler eklendiğinde bu doküman güncellenmelidir.*
