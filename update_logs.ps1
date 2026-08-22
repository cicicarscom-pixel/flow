$log = @"

### [15.08.2026] Çapraz Platform Veritabanı Senkronizasyonu & Hata Giderimleri
1. **Ai Randevu (Web):** Ai Randevu Yönetimi ekranındaki takvim günleri yana kaydırılabilir (drag-to-scroll) hale getirildi.
2. **Ortak Veritabanı Uyumsuzluğu (406 Hatası):** Dashboard ve AI Muhasebe (Web) ekranlarında, organizasyon üyelerini çeken `.single()` metotları boş sonuç dönebileceği için 406 Not Acceptable hatası veriyordu. Bunlar güvenli olan `.maybeSingle()` ile değiştirildi ve sıfır hata (No errors) durumuna ulaşıldı.
3. **Sosyal Medya Entegrasyonu (Web):** Web versiyonundaki "Hesap Bağla" uyarı mesajı kaldırılarak, mobil versiyondaki Supabase Edge Function (`zernio-client`) tabanlı güvenli Instagram/Zernio yetkilendirme linki alma ve yönlendirme sistemi web versiyonuna entegre edildi.
4. **Gelen Kutusu (Web):** Gelen Kutusu (`/gelen-kutusu`) ekranındaki `comments` tablosu sorgusunda yer alan geçersiz `posts` ilişkisi (`posts(media_urls, title)`) kaldırılarak sadece `.select('*')` bırakıldı ve "400 Bad Request" hatası giderildi. Tüm iletişim raporları sıfır hata ile yüklenebilir hale geldi.
5. **Agent Kuralları:** Web ve Mobil projelerin kalıcı hafızasına (`AGENTS.md`) çapraz veritabanı etkileşimi hakkında yeni "🚨 Kritik Kural: Ortak Veritabanı Etkileşimi" kuralı işlendi.
"@

Add-Content -Path "C:\Flow\AGENTS.md" -Value $log -Encoding UTF8
Add-Content -Path "C:\flowweb\AGENTS.md" -Value $log -Encoding UTF8
Add-Content -Path "C:\Flow\README.md" -Value $log -Encoding UTF8
Add-Content -Path "C:\flowweb\README.md" -Value $log -Encoding UTF8
