const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: 'dummy', httpOptions: { baseUrl: 'http://127.0.0.1:9999' } });
ai.models.generateContent({
    model: 'gemini-3.1-flash-image',
    contents: 'test',
    config: { aspectRatio: '9:16' }
}).catch(e => console.log('caught'));
