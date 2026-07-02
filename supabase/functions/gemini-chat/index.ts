import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { decode, encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, image, mimeType, referenceImage, mode, aspectRatio, customInstruction } = await req.json()

    // 1. Authenticate user via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized: Invalid JWT')

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.')
    }

    const hasImage = !!image;
    const hasRefImage = !!referenceImage;
    // Social modunda, kullanıcı resim yüklese de yüklemese de her zaman çift kanalı (dual pipeline) aktif et
    // Böylece sadece metin yazarak da görsel ürettirebilirler.
    const runDualPipeline = mode !== 'finance';

    let imagenBase64 = null;
    let imagenMimeType = 'image/jpeg';

    // 2. Prepare content parts for Gemini API
    const parts = []

    // A. Add user's raw image (if provided)
    if (hasImage) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/\w+;base64,/, '')
      const imageMimeType = mimeType || 'image/jpeg'
      imagenBase64 = base64Data;
      imagenMimeType = imageMimeType;
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: base64Data
        }
      })
    }

    // B. Add reference style image (if provided)
    if (hasRefImage) {
      try {
        console.log("Downloading reference image:", referenceImage);
        const refResponse = await fetch(referenceImage);
        if (refResponse.ok) {
          const refBuffer = await refResponse.arrayBuffer();
          const refBase64 = encode(refBuffer);
          const refMime = refResponse.headers.get('content-type') || 'image/png';
          
          if (!imagenBase64) {
            imagenBase64 = refBase64;
            imagenMimeType = refMime;
          }

          parts.push({
            inlineData: {
              mimeType: refMime,
              data: refBase64
            }
          });
          console.log("Reference image successfully added to parts.");
        } else {
          console.error(`Failed to download reference image: ${refResponse.statusText}`);
        }
      } catch (err) {
        console.error("Error downloading reference image:", err.message);
      }
    }

    // 3. Choose system instruction based on the pipeline type
    let systemInstruction = "";
    if (mode === 'finance') {
       systemInstruction = `You are an elite financial data extractor. The user is uploading a receipt/invoice for an INCOME or EXPENSE. Extract the following: 1. Total Amount (number), 2. Due Date / Payment Date (ISO format), 3. Title/Vendor Name, 4. Description. Return ONLY a valid JSON object matching this schema: { "amount": number, "date": "YYYY-MM-DD", "title": "string", "type": "income" | "expense" }.`;
    } else if (mode === 'playground') {
       systemInstruction = `Aşağıdaki SİSTEM TALİMATI, senin rolünü, karakterini ve kurallarını belirler. Kullanıcıdan gelen mesaja, TAMAMEN bu talimattaki role bürünerek yanıt vermelisin.

--- SİSTEM TALİMATI (KİMLİĞİN) ---
${customInstruction}
----------------------------------

Yanıtını WhatsApp üzerinden veriyormuş gibi doğal, role uygun ve kısa tut. 
SADECE aşağıdaki JSON formatında yanıt dön, başka hiçbir ekstra açıklama yazma:
{
  "adCopy": "[Role bürünerek yazdığın yanıt]"
}`;
    } else {
       systemInstruction = runDualPipeline 
         ? `Sen AI Esnaf paketinin görsel üretim sistemindeki 'Yönetmen' ve analiz motorusun. Kullanıcı senden sosyal medya veya reklam için bir görsel, afiş veya resim oluşturmanı istediğinde ASLA 'Ben metin tabanlı bir yapay zekayım, görsel oluşturamam' veya 'Üzgünüm' gibi cevaplar verme! Bu kesinlikle yasaktır. 

Senin görevin resmi bizzat çizmek değil, resmi çizecek olan Imagen modeline kusursuz bir İngilizce tarif (prompt) yazmaktır. 

Eğer kullanıcının isteği sadece sohbet etmek veya metin istemekse (örneğin "selam", "nasılsın", "bana bir yazı yaz"), imagePrompt alanını tamamen BOŞ ("") bırak ve adCopy alanına cevabını yaz.
Eğer kullanıcının isteği bir görsel oluşturmayı gerektiriyorsa (örneğin "bana kırmızı ayakkabı resmi çiz", "bir post hazırla"), o zaman adCopy alanını tamamen BOŞ bırak ve sadece imagePrompt alanını en detaylı, kusursuz şekilde doldurmaya odaklan. Görsel üretilirken metin üretilmesi istenmiyor.

Kullanıcının talebini analiz et ve doğrudan şu JSON formatında yanıt dön:
{
  "adCopy": "[Sadece metin isteniyorsa Türkçe cevap. Görsel isteniyorsa BOŞ bırak \"\"]",
  "imagePrompt": "[Eğer görsel gerekiyorsa Imagen 4 için detaylı, İngilizce görsel üretim metni. Gerekmiyorsa boş bırak \"\"]"
}`
         : `Sen profesyonel, doğrudan ve net bir AI asistanısın.

Yanıtını SADECE aşağıdaki JSON formatında vermelisin. Başka hiçbir açıklama yazma:
{
  "adCopy": "kullanıcının sorusuna doğrudan ve net metin cevabı"
}`;
    }

    // Add instructions and prompt to finalParts
    const finalParts = [...parts]
    if (prompt) {
       finalParts.unshift({ text: `SİSTEM TALİMATI:\n${systemInstruction}\n\nKULLANICI TALEBİ:\n${prompt}` })
    } else {
       finalParts.unshift({ text: `SİSTEM TALİMATI:\n${systemInstruction}\n\nKULLANICI TALEBİ:\nLütfen sağlanan girdilere uygun metin ve (varsa) görsel üretim promptunu üret.` })
    }

    const payload = {
      contents: [
        {
          parts: finalParts
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    }

    // 4. Send request to Gemini API (Stage 1)
    console.log("Calling Gemini Flash...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    let parsedResult = { adCopy: "İçerik oluşturulamadı.", imagePrompt: "" }
    try {
       parsedResult = JSON.parse(generatedText)
    } catch(e) {
       console.error("Failed to parse Gemini JSON output:", generatedText)
       parsedResult.adCopy = generatedText
    }

    let generatedImageBase64 = null;
    let imagenStatus = 'skipped';
    let imagenError = null;

    // 5. Send request to Image Generator (Stage 2) only if we have image inputs (Dual-Pipeline)
    if (runDualPipeline && parsedResult.imagePrompt) {
      try {
        if (!imagenBase64) {
          // TEXT-TO-IMAGE: Use Imagen 4
          console.log("Calling Imagen 4 with prompt:", parsedResult.imagePrompt);
          
          const instance: any = {
            prompt: parsedResult.imagePrompt
          };
          
          const parameters: any = {
            sampleCount: 1,
            aspectRatio: aspectRatio || "1:1"
          };

          const imagenPayload = {
            instances: [instance],
            parameters: parameters
          };

          const imagenResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(imagenPayload)
            }
          );

          imagenStatus = imagenResponse.status;

          if (imagenResponse.ok) {
            const imagenResult = await imagenResponse.json();
            const base64Image = imagenResult.predictions?.[0]?.bytesBase64Encoded;
            if (base64Image) {
              generatedImageBase64 = base64Image;
              console.log("Successfully generated image with Imagen 4!");
            } else {
              imagenError = "No predictions found in response: " + JSON.stringify(imagenResult);
              console.error("Imagen 4 Response Error:", imagenError);
              parsedResult.adCopy = "Imagen 4 Hatası: " + imagenError;
            }
          } else {
            imagenError = await imagenResponse.text();
            console.error("Imagen 4 API Error:", imagenError);
            parsedResult.adCopy = "Imagen 4 API Hatası: " + imagenError;
          }
        } else {
          // IMAGE-TO-IMAGE: Use gemini-3.1-flash-image
          let modifiedPrompt = parsedResult.imagePrompt;
          if (aspectRatio) {
            modifiedPrompt += `\n\nÖNEMLİ: Çıktı görselinin en-boy oranı kesinlikle ${aspectRatio} olmalıdır. Resmi bu boyuta uyacak şekilde yeniden boyutlandırın, genişletin veya kırpın.`;
          }
          console.log("Calling gemini-3.1-flash-image with prompt:", modifiedPrompt);
          
          const parts: any[] = [
            { text: modifiedPrompt },
            {
              inlineData: {
                mimeType: imagenMimeType || "image/jpeg",
                data: imagenBase64
              }
            }
          ];

          const geminiPayload = {
            contents: [{ parts }],
            generationConfig: {
              responseModalities: ["IMAGE"]
            }
          };

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(geminiPayload)
            }
          );

          imagenStatus = geminiResponse.status;

          if (geminiResponse.ok) {
            const geminiResult = await geminiResponse.json();
            const base64Image = geminiResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Image) {
              generatedImageBase64 = base64Image;
              console.log("Successfully generated image with gemini-3.1-flash-image!");
            } else {
              imagenError = "No image found in response: " + JSON.stringify(geminiResult);
              console.error("Gemini Image Response Error:", imagenError);
              parsedResult.adCopy = "Gemini Image Hatası: " + imagenError;
            }
          } else {
            imagenError = await geminiResponse.text();
            console.error("Gemini Image API Error:", imagenError);
            parsedResult.adCopy = "Gemini Image API Hatası: " + imagenError;
          }
        }
      } catch (err) {
        imagenError = err.message;
        console.error("Image generation process failed:", err);
        parsedResult.adCopy = "Görsel Üretim Hatası: " + imagenError;
      }
    } else if (runDualPipeline) {
      imagenError = "No imagePrompt returned from Gemini Flash.";
      console.warn(imagenError);
    }

    // 6. Calculate Cost and Log Usage
    const promptTokens = result.usageMetadata?.promptTokenCount || 0;
    const completionTokens = result.usageMetadata?.candidatesTokenCount || 0;
    const generatedImageCount = generatedImageBase64 ? 1 : 0;

    const geminiInputCostUSD = (promptTokens / 1000000) * 0.075;
    const geminiOutputCostUSD = (completionTokens / 1000000) * 0.30;
    const imagenCostUSD = generatedImageCount * 0.03;
    const totalCostUSD = geminiInputCostUSD + geminiOutputCostUSD + imagenCostUSD;
    const estimatedCostTry = totalCostUSD * 36.0;

    const featureName = mode === 'finance' ? 'finance' : 'social_image';
    const usedModel = generatedImageCount > 0 
      ? (!imagenBase64 ? 'imagen-4.0-generate-001' : 'gemini-3.1-flash-image') 
      : 'gemini-2.5-flash';

    const { error: logError } = await supabaseClient
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        feature: featureName,
        model_name: usedModel,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        generated_image_count: generatedImageCount,
        estimated_cost_try: estimatedCostTry
      });

    if (logError) {
      console.error("Usage logging failed:", logError);
    }

    return new Response(
      JSON.stringify({ 
        text: parsedResult.adCopy || "",
        generatedImage: generatedImageBase64,
        debug_generatedText: generatedText,
        debug_parsedResult: parsedResult,
        debug_imagenStatus: imagenStatus,
        debug_imagenError: imagenError
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
