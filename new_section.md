## 📞 8. Adım: WAHA Plus (WhatsApp HTTP API) Mimarisi ve Kurulumu

Projenin WhatsApp botu altyapısı, resmi Meta API kısıtlamalarını (24 saat penceresi vb.) aşmak ve esnafların kendi numaralarını saniyeler içinde bağlayabilmesini sağlamak için **WAHA (WhatsApp HTTP API) Plus** üzerine kurulmuştur.

### 8.1 Özel Sunucu (VPS) ve Global Webhook Deployment
WAHA Plus, ayrı bir Docker konteyneri olarak Ubuntu VPS (Örn: `31.97.37.208`) üzerinde çalışır. Gelen WhatsApp mesajlarının Supabase'e düşmesi için **Global Webhook** yapılandırmasının Docker ayağa kalkarken çevre değişkeni (Environment Variable) olarak verilmesi hayati önem taşır.

**Sıfırdan Kurulum Komutu:**
```bash
docker login -u devlikeapro -p <DOCKER_HUB_PAT>
docker run -it -d --name waha --restart unless-stopped -p 3000:3000 \
  -e WAHA_API_KEY=workigom_key_2026 \
  -e WAHA_DASHBOARD_USERNAME=admin \
  -e WAHA_DASHBOARD_PASSWORD=workigom \
  -e WAHA_WEBHOOK_URL=https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/waha-webhook \
  -e WAHA_WEBHOOK_EVENTS=message \
  devlikeapro/waha-plus
```
*(Not: `WAHA_WEBHOOK_URL` parametresi verilmezse, bot gelen mesajlara sağır kalır).*

### 8.2 Frontend Entegrasyonu ve Kritik Zamanlama (`wahaService.js`)
React Native tarafında Bot Yönetimi ekranı, WAHA sunucusuyla iletişim kurar. 
- `startSession(merchantId)`: Her esnafın kendi ID'si (UUID) ile izole (multi-tenant) bir WhatsApp oturumu başlatılır.
- **Kritik "Auto-Heal" ve 4 Saniye Kuralı:** Eğer session zaten açıksa, WAHA `422 Unprocessable Entity` hatası verir. Bu durumda sistem eski oturumu silip (`stopSession`) yenisini başlatır. Yeni oturum (Chromium/Puppeteer motoru) başlarken **kesinlikle 3-4 saniye beklenmelidir.** Eğer beklenmeden hemen `getPairingCode` çağrılırsa WAHA `500 Internal Server Error (Cannot read properties of null (reading 'evaluate'))` hatası fırlatır.
- **Çifte Mesaj (Double Message) Tuzağı:** Webhook ayarı `docker run` ile global olarak yapıldığı için, `startSession` isteğinin içine ekstra olarak `config: { webhooks: [...] }` parametresi **EKLENMEMELİDİR**. Eğer eklenirse WAHA aynı mesajı Supabase'e iki kere yollar ve bot müşteriye iki kere aynı cevabı verir.

### 8.3 Supabase Webhook Güvenliği (Kritik RLS ve JWT Ayarları)
WAHA'dan gelen anlık (POST) webhook isteklerini karşılayan mikroservis `waha-webhook` fonksiyonudur.
- WAHA, Supabase'in beklediği yetkilendirme (Authorization: Bearer Token) başlıklarına sahip olmadığı için Supabase API Gateway bu isteklere anında `401 Unauthorized` hatası verir.
- **Bunu aşmak için webhook fonksiyonu KESİNLİKLE `--no-verify-jwt` bayrağı ile deploy edilmelidir:**
  ```bash
  npx supabase functions deploy waha-webhook --no-verify-jwt
  ```
- Fonksiyon JWT doğrulaması yapmadığı için, veritabanına yazma işlemini (`api_usage_logs` tablosuna) yapabilmesi adına içeride `supabaseAdmin` (Service Role Key kullanılarak) yetkisiyle işlem yapmalıdır. 

### 8.4 Gelen Mesajları Dinleme ve Gemini Yanıtı
- Payload içinden `session` (merchantId), `from` (müşteri numarası) ve `body` (mesaj metni) ayrıştırılır. Kendi gönderdiğimiz mesajların (isFromMe) sonsuz döngüye girmesi engellenerek 200 OK yanıtı dönülür.
- Kullanıcının `bot_settings` tablosundaki `system_prompt` yönergesi çekilerek Gemini'ye sorulur. Çıkan sonuç WAHA `/api/sendText` endpoint'i üzerinden WhatsApp'a iletilir.
