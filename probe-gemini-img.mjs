const key = process.env.GEMINI_IMAGE_API_KEY || "";
const models = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash-exp",
];
(async () => {
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "a cute cat illustration, minimal" }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );
      const t = await r.text();
      if (r.ok) {
        let hasImage = false;
        let b64len = 0;
        try {
          const d = JSON.parse(t);
          const parts = d.candidates?.[0]?.content?.parts || [];
          parts.forEach((p) => {
            if (p.inlineData?.data) { hasImage = true; b64len = p.inlineData.data.length; }
          });
        } catch {}
        console.log(`OK ${model}: hasImage=${hasImage} b64len=${b64len} | snippet=${t.slice(0, 160)}`);
        if (hasImage) break;
      } else {
        console.log(`FAIL ${model}: ${r.status} ${t.slice(0, 180)}`);
      }
    } catch (e) {
      console.log(`ERR ${model}: ${e.message}`);
    }
  }
})();