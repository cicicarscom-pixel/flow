const values = ["1:1", "ASPECT_RATIO_1_1", "RATIO_1_1", "IMAGE_ASPECT_RATIO_1_1", "1x1", "1/1", "SQUARE", "square"];

const val = "16:9";

async function test() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=invalid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "test" }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        responseFormat: { image: { aspectRatio: val } }
      }
    })
  });
  const data = await res.json();
  console.log(val, '->', data.error.message.includes('API key not valid') ? 'SUCCESS' : data.error.message);
}
test();
