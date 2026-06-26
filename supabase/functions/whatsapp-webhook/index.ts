import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";

// Fallback WhatsApp API Developer Token (if client token is not yet established)
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') || 'DUMMY_TOKEN';
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'aiesnaf_verify';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper to ask Gemini
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

  if (!response.ok) throw new Error("Gemini API error");
  
  const result = await response.json();
  return {
    text: result.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt oluşturulamadı.',
    usageMetadata: result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 }
  };
}

// Helper function to reply reactively via Meta's Graph API (Cloud API v19.0)
async function sendWhatsAppReply(businessPhoneNumberId: string, accessToken: string, to: string, message: string, replyToMessageId: string) {
  const url = `https://graph.facebook.com/v19.0/${businessPhoneNumberId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    context: {
      message_id: replyToMessageId // CRITICAL: strictly flags this as a reactive service message
    },
    text: {
      preview_url: false,
      body: message
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp message reply failed:", errorText);
    throw new Error(`WhatsApp API error: ${errorText}`);
  }
}

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Meta Webhook Verification (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'aiesnaf_verify';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook Verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    console.warn('Webhook Verification failed: token mismatch or invalid mode');
    return new Response('Forbidden', { status: 403 });
  }

  // 2. Incoming Messages (POST)
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      // Check if it's a valid WhatsApp message event
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0]?.value;
        const message = change?.messages?.[0];
        const metadata = change?.metadata;

        if (message && metadata && message.type === 'text') {
          const customerPhone = message.from;
          const businessPhoneNumberId = metadata.phone_number_id;
          const incomingText = message.text?.body;
          const messageId = message.id;

          console.log(`Received message from customer ${customerPhone} to business phone ID ${businessPhoneNumberId}: "${incomingText}"`);

          // 3. Query profiles where whatsapp_phone_number_id === businessPhoneNumberId
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, system_prompt, whatsapp_access_token, whatsapp_message_count, whatsapp_monthly_quota')
            .eq('whatsapp_phone_number_id', businessPhoneNumberId)
            .single();

          if (profileError || !profile) {
            console.error(`Profile not found for WhatsApp Business Phone ID: ${businessPhoneNumberId}`);
            return new Response('OK', { status: 200 });
          }

          // Use user's access token or fallback platform token
          const activeToken = profile.whatsapp_access_token || WHATSAPP_TOKEN;

          // Quota Check: Prevent calling Gemini if monthly limit has been exceeded
          const messageCount = profile.whatsapp_message_count || 0;
          const monthlyQuota = profile.whatsapp_monthly_quota || 1000;

          if (messageCount >= monthlyQuota) {
            console.log(`Quota exceeded for profile ${profile.id}: ${messageCount}/${monthlyQuota}`);
            await sendWhatsAppReply(
              businessPhoneNumberId,
              activeToken,
              customerPhone,
              "Mesajınız için teşekkürler. Bu işletmenin yapay zeka asistanı aylık hizmet kotasını doldurmuştur. Lütfen mesai saatleri içinde işletme ile doğrudan iletişime geçin.",
              messageId
            );
            return new Response('OK', { status: 200 });
          }

          // Fetch user's Gemini API Key
          const { data: apiSettings } = await supabaseAdmin
            .from('user_api_settings')
            .select('gemini_api_key')
            .eq('user_id', profile.id)
            .single();

          const apiKey = apiSettings?.gemini_api_key || Deno.env.get("GEMINI_API_KEY");
          if (!apiKey) {
            console.warn("No Gemini API key configured for user or platform");
            await sendWhatsAppReply(businessPhoneNumberId, activeToken, customerPhone, "Lütfen AI Esnaf uygulamasındaki 'AI Hesap' sekmesinden Gemini API anahtarınızı girin.", messageId);
            return new Response('OK', { status: 200 });
          }

          // 4. Gemini AI processing and Reactive Reply
          try {
            const { text: reply, usageMetadata } = await askGemini(
              incomingText,
              apiKey,
              profile.system_prompt
            );

            // Send reply reactively back to customer
            await sendWhatsAppReply(businessPhoneNumberId, activeToken, customerPhone, reply, messageId);

            // Increment usage counter in database
            const { error: incrementError } = await supabaseAdmin
              .from('profiles')
              .update({ whatsapp_message_count: messageCount + 1 })
              .eq('id', profile.id);

            if (incrementError) {
              console.error("Failed to increment WhatsApp message count:", incrementError);
            }

            // Log Usage to Supabase
            const promptTokens = usageMetadata.promptTokenCount || 0;
            const completionTokens = usageMetadata.candidatesTokenCount || 0;
            const geminiInputCostUSD = (promptTokens / 1000000) * 0.075;
            const geminiOutputCostUSD = (completionTokens / 1000000) * 0.30;
            const estimatedCostTry = (geminiInputCostUSD + geminiOutputCostUSD) * 36.0;

            await supabaseAdmin.from('api_usage_logs').insert({
              user_id: profile.id,
              feature: 'whatsapp',
              model_name: 'gemini-2.5-flash',
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              generated_image_count: 0,
              estimated_cost_try: estimatedCostTry
            });

          } catch (e) {
            console.error("Failed to generate response or send reply:", e.message);
            await sendWhatsAppReply(businessPhoneNumberId, activeToken, customerPhone, "Yapay zeka yanıt verirken veya mesaj gönderilirken bir sorun oluştu.", messageId);
          }
        }
      }
      
      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response(err.message, { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
