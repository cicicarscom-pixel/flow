export class GeminiClient {
  private apiKey = Deno.env.get('GEMINI_API_KEY') || '';

  async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
    const payload = {
      contents: [
        {
          parts: [
            { text: `SİSTEM TALİMATI:\n${systemPrompt}` },
            { text: `KULLANICI MESAJI:\n${userMessage}` }
          ]
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error("Gemini API error: " + errorText);
    }
    
    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Attempt to parse JSON if generationConfig forced JSON
    try {
        const parsed = JSON.parse(rawText);
        if (parsed.adCopy) return parsed.adCopy;
        return rawText;
    } catch (e) {
        return rawText;
    }
  }
}
