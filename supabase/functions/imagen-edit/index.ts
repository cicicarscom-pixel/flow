import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, image, mimeType, aspectRatio } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required.');
    }

    if (!image) {
      throw new Error('Base64 image is required for editing.');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.')
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const imageMimeType = mimeType || 'image/jpeg'

    let enhancedPrompt = `Act as an elite luxury editorial product photographer and world-class art director. Seamlessly integrate the attached product into the following concept: [${prompt}]. 

CRITICAL AESTHETIC RULES: 
1. Use intense controlled studio lighting (specular highlight) to enhance the product's luster, materials, and textures. 
2. The environment must feature minimalist, high-end textured backgrounds (e.g., velvet, silk, marble, or dark stone) complementing the concept. 
3. Apply a luxury editorial style, 8k high resolution, professional depth of field (bokeh), and extremely sharp focus on the main subject. 
4. DO NOT add any hallucinated text, typography, logos, or placeholders unless explicitly asked.`;

    if (aspectRatio && aspectRatio !== 'Orijinal') {
      enhancedPrompt += `\n\nÖNEMLİ: Çıktı görselinin en-boy oranı kesinlikle ${aspectRatio} olmalıdır. Resmi bu boyuta uyacak şekilde yeniden boyutlandırın, genişletin veya kırpın.`;
    }

    // Construct payload for gemini-3.1-flash-image generateContent API
    const payload: any = {
      contents: [{
        parts: [
          { text: enhancedPrompt },
          { 
            inlineData: { 
              mimeType: imageMimeType, 
              data: base64Data
            } 
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    }

    console.log("Calling Google gemini-3.1-flash-image API for editing...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Image API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    // Parse base64 from the new response format
    const generatedImageBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!generatedImageBase64) {
       throw new Error("Could not find generated image in Gemini response. Raw output: " + JSON.stringify(result));
    }

    return new Response(
      JSON.stringify({ 
        generatedImage: generatedImageBase64,
        text: "Görsel başarıyla düzenlendi.",
        debug_response: result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Imagen Edit Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
