import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper: Gemini AI
async function askGemini(prompt: string, apiKey: string, systemPrompt?: string) {
  const defaultSystemPrompt = "Sen AI Esnaf dijital asistanısın. Esnafın işlerini yönetmesine WhatsApp üzerinden yardımcı oluyorsun. Kısa, net ve samimi cevaplar ver.";
  const activeSystemPrompt = systemPrompt || defaultSystemPrompt;

  const payload = {
    contents: [
      {
        parts: [
          { text: activeSystemPrompt },
          { text: `Kullanıcı mesajı: ${prompt}` }
        ]
      }
    ]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) throw new Error("Gemini API error: " + await response.text());
  
  const result = await response.json();
  return {
    text: result.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt oluşturulamadı.',
    usageMetadata: result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 }
  };
}

// Helper: WAHA ile Yanıt Gönder
async function sendWahaReply(merchantId: string, chatId: string, message: string) {
  const url = `http://31.97.37.208:3000/api/sendText`;
  
  const payload = {
    session: merchantId,
    chatId: chatId,
    text: message
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Api-Key': 'workigom_key_2026',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WAHA reply failed:", errorText);
    throw new Error(`WAHA API error: ${errorText}`);
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const payload = await req.json();

    if (payload.event === 'message') {
      const merchantId = payload.session;
      const from = payload.payload?.from;
      const body = payload.payload?.body;
      const isFromMe = payload.payload?.fromMe;

      // GRUP ve DURUM (Status) Koruması:
      // Eğer mesaj bir gruptan (@g.us) veya durum/hikaye yayınından (@broadcast) geliyorsa KESİNLİKLE yanıtlama!
      const isGroup = from && from.includes('@g.us');
      const isBroadcast = from && from.includes('@broadcast');

      // Sadece dışarıdan gelen (müşteri), grup/durum olmayan, kişisel mesajlarına yanıt ver (@c.us)
      if (!isFromMe && !isGroup && !isBroadcast && merchantId && from && body) {
        console.log(`[WAHA WEBHOOK] Gelen Mesaj: ${from} -> "${body}"`);

        // 1. Bot ayarlarını ve promptu çek
        const { data: botSettings, error: botError } = await supabaseAdmin
          .from('bot_settings')
          .select('is_active, system_prompt')
          .eq('merchant_id', merchantId)
          .limit(1);

        const settings = botSettings && botSettings.length > 0 ? botSettings[0] : null;

        // Bot aktif değilse işlemi sonlandır
        if (!settings || !settings.is_active) {
          console.log(`Bot kapalı veya ayar yok: ${merchantId}. İşlem durduruldu.`);
          return new Response('OK', { status: 200 });
        }

        // 2. Profile ve Kota kontrolü (Eğer kota vs. kullanılıyorsa profile tablosu gerekli)
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, whatsapp_message_count, whatsapp_monthly_quota')
          .eq('id', merchantId)
          .single();

        if (profile) {
          const messageCount = profile.whatsapp_message_count || 0;
          const monthlyQuota = profile.whatsapp_monthly_quota || 1000;

          if (messageCount >= monthlyQuota) {
            console.log(`Kota aşıldı! Esnaf: ${merchantId}`);
            await sendWahaReply(merchantId, from, "Mesajınız için teşekkürler. Bu işletmenin asistan kotası dolduğu için şu an otomatik yanıt verilemiyor.");
            return new Response('OK', { status: 200 });
          }
        }

        // 3. Gemini API Anahtarını Çek
        const apiKey = Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
          console.warn("Gemini API Key bulunamadı!");
          return new Response('OK', { status: 200 });
        }

        // 4. Gemini'ye Sor ve Yanıtı Gönder
        try {
          const { text: reply, usageMetadata } = await askGemini(body, apiKey, settings.system_prompt);
          
          // Müşteriye WhatsApp'tan Yanıtı İlet (WAHA üzerinden)
          await sendWahaReply(merchantId, from, reply);
          console.log(`[WAHA WEBHOOK] Yanıt gönderildi: ${reply}`);

          // Opsiyonel: Kullanım Kotasını ve Maliyet Loglarını Güncelle (whatsapp-webhook gibi)
          if (profile) {
            await supabaseAdmin.from('profiles')
              .update({ whatsapp_message_count: (profile.whatsapp_message_count || 0) + 1 })
              .eq('id', profile.id);

            const promptTokens = usageMetadata.promptTokenCount || 0;
            const completionTokens = usageMetadata.candidatesTokenCount || 0;
            const costTry = ((promptTokens / 1000000) * 0.075 + (completionTokens / 1000000) * 0.30) * 36.0;

            await supabaseAdmin.from('api_usage_logs').insert({
              user_id: profile.id,
              feature: 'whatsapp-waha',
              model_name: 'gemini-2.5-flash',
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              generated_image_count: 0,
              estimated_cost_try: costTry
            });
          }
        } catch (aiError) {
          console.error("AI / WAHA Reply Error:", aiError);
        }
      }
    }

    // WAHA isteklerini hiçbir zaman timeout'a düşürmemek için hemen 200 dönüyoruz
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
