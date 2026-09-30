## ğŸ“ 8. AdÄ±m: WAHA Plus (WhatsApp HTTP API) Mimarisi ve Kurulumu

Projenin WhatsApp botu altyapÄ±sÄ±, resmi Meta API kÄ±sÄ±tlamalarÄ±nÄ± (24 saat penceresi vb.) aÅŸmak ve esnaflarÄ±n kendi numaralarÄ±nÄ± saniyeler iÃ§inde baÄŸlayabilmesini saÄŸlamak iÃ§in **WAHA (WhatsApp HTTP API) Plus** Ã¼zerine kurulmuÅŸtur.

### 8.1 Ã–zel Sunucu (VPS) ve Global Webhook Deployment
WAHA Plus, ayrÄ± bir Docker konteyneri olarak Ubuntu VPS (Ã–rn: `31.97.37.208`) Ã¼zerinde Ã§alÄ±ÅŸÄ±r. Gelen WhatsApp mesajlarÄ±nÄ±n Supabase'e dÃ¼ÅŸmesi iÃ§in **Global Webhook** yapÄ±landÄ±rmasÄ±nÄ±n Docker ayaÄŸa kalkarken Ã§evre deÄŸiÅŸkeni (Environment Variable) olarak verilmesi hayati Ã¶nem taÅŸÄ±r.

**SÄ±fÄ±rdan Kurulum Komutu:**
```bash
docker login -u devlikeapro -p <DOCKER_HUB_PAT>
docker run -it -d --name waha --restart unless-stopped -p 3000:3000 \
  -e WAHA_API_KEY=<GİZLENDİ> \
  -e WAHA_DASHBOARD_USERNAME=admin \
  -e WAHA_DASHBOARD_PASSWORD=workigom \
  -e WAHA_WEBHOOK_URL=https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/waha-webhook \
  -e WAHA_WEBHOOK_EVENTS=message \
  devlikeapro/waha-plus
```
*(Not: `WAHA_WEBHOOK_URL` parametresi verilmezse, bot gelen mesajlara saÄŸÄ±r kalÄ±r).*

### 8.2 Frontend Entegrasyonu ve Kritik Zamanlama (`wahaService.js`)
React Native tarafÄ±nda Bot YÃ¶netimi ekranÄ±, WAHA sunucusuyla iletiÅŸim kurar. 
- `startSession(merchantId)`: Her esnafÄ±n kendi ID'si (UUID) ile izole (multi-tenant) bir WhatsApp oturumu baÅŸlatÄ±lÄ±r.
- **Kritik "Auto-Heal" ve 4 Saniye KuralÄ±:** EÄŸer session zaten aÃ§Ä±ksa, WAHA `422 Unprocessable Entity` hatasÄ± verir. Bu durumda sistem eski oturumu silip (`stopSession`) yenisini baÅŸlatÄ±r. Yeni oturum (Chromium/Puppeteer motoru) baÅŸlarken **kesinlikle 3-4 saniye beklenmelidir.** EÄŸer beklenmeden hemen `getPairingCode` Ã§aÄŸrÄ±lÄ±rsa WAHA `500 Internal Server Error (Cannot read properties of null (reading 'evaluate'))` hatasÄ± fÄ±rlatÄ±r.
- **Ã‡ifte Mesaj (Double Message) TuzaÄŸÄ±:** Webhook ayarÄ± `docker run` ile global olarak yapÄ±ldÄ±ÄŸÄ± iÃ§in, `startSession` isteÄŸinin iÃ§ine ekstra olarak `config: { webhooks: [...] }` parametresi **EKLENMEMELÄ°DÄ°R**. EÄŸer eklenirse WAHA aynÄ± mesajÄ± Supabase'e iki kere yollar ve bot mÃ¼ÅŸteriye iki kere aynÄ± cevabÄ± verir.

### 8.3 Supabase Webhook GÃ¼venliÄŸi (Kritik RLS ve JWT AyarlarÄ±)
WAHA'dan gelen anlÄ±k (POST) webhook isteklerini karÅŸÄ±layan mikroservis `waha-webhook` fonksiyonudur.
- WAHA, Supabase'in beklediÄŸi yetkilendirme (Authorization: Bearer Token) baÅŸlÄ±klarÄ±na sahip olmadÄ±ÄŸÄ± iÃ§in Supabase API Gateway bu isteklere anÄ±nda `401 Unauthorized` hatasÄ± verir.
- **Bunu aÅŸmak iÃ§in webhook fonksiyonu KESÄ°NLÄ°KLE `--no-verify-jwt` bayraÄŸÄ± ile deploy edilmelidir:**
  ```bash
  npx supabase functions deploy waha-webhook --no-verify-jwt
  ```
- Fonksiyon JWT doÄŸrulamasÄ± yapmadÄ±ÄŸÄ± iÃ§in, veritabanÄ±na yazma iÅŸlemini (`api_usage_logs` tablosuna) yapabilmesi adÄ±na iÃ§eride `supabaseAdmin` (Service Role Key kullanÄ±larak) yetkisiyle iÅŸlem yapmalÄ±dÄ±r. 

### 8.4 Gelen MesajlarÄ± Dinleme ve Gemini YanÄ±tÄ±
- Payload iÃ§inden `session` (merchantId), `from` (mÃ¼ÅŸteri numarasÄ±) ve `body` (mesaj metni) ayrÄ±ÅŸtÄ±rÄ±lÄ±r. Kendi gÃ¶nderdiÄŸimiz mesajlarÄ±n (isFromMe) sonsuz dÃ¶ngÃ¼ye girmesi engellenerek 200 OK yanÄ±tÄ± dÃ¶nÃ¼lÃ¼r.
- KullanÄ±cÄ±nÄ±n `bot_settings` tablosundaki `system_prompt` yÃ¶nergesi Ã§ekilerek Gemini'ye sorulur. Ã‡Ä±kan sonuÃ§ WAHA `/api/sendText` endpoint'i Ã¼zerinden WhatsApp'a iletilir.

