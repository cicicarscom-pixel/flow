# AI-Esnaf Arayüz ve UI/UX Kuralları (Karar Günlüğü)

Bu dosya projede geliştirme yapan ajanlara, UI standartlarını ve kullanıcı talepleriyle alınan önemli mimari kararları dikte eder.

## Ödeme Takvimi ve Liste Tasarımları (Temmuz 2026 Kararı)
1. **Esnek Değil Sabit Kutu Boyutları (Fixed Heights):** Ekranda yer alan gün veya kart listelerinde, içindeki veri boş dahi olsa asimetri oluşmasını engellemek için dış kutulara her zaman makul, sabit bir `height` (Örn: `h-[96px]`) verilmelidir. `min-h` kullanıldığında boş ve dolu kutular yan yana geldiğinde ekranın yapısı (grid) bozulmaktadır.
2. **Çoklu Sütun Kullanımı (Multi-Column Grid):** Listeler ekranda çok fazla beyaz boşluk bırakıyorsa, öğeleri tam genişlik (`w-full`) yerine `w-[50%]` gibi iki sütunlu (flex-row flex-wrap) ızgaralar şeklinde tasarlayın. Bu sayede kullanıcılar aynı ekranda daha fazla öğeyi görebilir.
3. **Taşmaları Yönetmek (Nested Scroll):** Sabit yükseklikli bir kutunun içi veriyle (Örn: satırlar) dolup taştığında kutunun boyutunu bozmak yerine, o veri bölgesine `ScrollView` (nestedScrollEnabled={true}) eklenerek kutu içi kaydırma imkanı tanınmalıdır.
4. **Minimalist Sol-Sağ Ayrımı:** Sol yanda estetik bir metin bloğu (gün, ay isimleri farklı puntolarda/renklerde), ince bir ayırıcı çizgi (separator) ve sağ tarafta daha karanlık bir veri alanı kullanılması modern ajanda tasarımına en iyi örnektir.

### [17.08.2026] Gelen Kutusu Profil Resmi ve Private Reply (Gizli DM) Entegrasyonu
1. **Eksik Profil Resimleri:** Gelen kutusu mesajlarinda Zernio'dan gelen participantPicture verisi edge function (zernio-client) uzerinden dogru sekilde haritalandirildi. Fotograf olmayan kullanicilar icin ui-avatars.com altyapisi ile fallback jenerik bas harf logolari eklendi.
2. **Aninda Silme (Optimistic UI):** Mesaj ve yorumlar silindiginde sayfayi yenilemeye gerek kalmadan arayuzden (UI) aninda kaybolmasini saglayan optimistic state guncellemeleri entegre edildi.
3. **Yorum Yanitlarinda Ciftlesme (Duplicate) Hatasi:** UI uzerinden yoruma yanit verildiginde Zernio API'den donen gercek yorum ID'si optimistic UI insert isleminde kullanilarak Zernio Webhook'un ikinci bir kopya olusturmasi ve yanitlarin akordiyon yapi yerine bagimsiz kart olarak uste dusmesi (gruplanamamasi) sorunu %100 cozuldu.
4. **Yorum uzerinden DM gonderme (Private Reply):** Yorum yapan ve daha once hic mesajlasilmamis kullanicilara Zernio SDK'nin private-reply yetenegi kullanilarak yorum uzerinden dogrudan DM gonderebilme altyapisi kuruldu. Bunun icin ozel bir modal arayuzu kodlandi.
