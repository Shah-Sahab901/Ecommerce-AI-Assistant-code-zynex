const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const id = "agent_0801m2apdajresxtwy6wdk5e9xxz";
(async () => {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
    method: "PATCH",
    headers: { "xi-api-key": keyNew, "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: { llm: "qwen35-397b-a17b", timezone: "Europe/London" },
        },
      },
    }),
  });
  console.log("PATCH status:", r.status);
  if (!r.ok) { console.log((await r.text()).slice(0, 300)); return; }
  const a = await r.json();
  const cc = a.conversation_config || {};
  console.log("VERIFY llm:", cc.agent?.prompt?.llm, "| timezone:", cc.agent?.prompt?.timezone);
  console.log("language:", cc.agent?.language, "| prompt len:", cc.agent?.prompt?.prompt?.length, "| photo rule:", cc.agent?.prompt?.prompt?.includes("PHOTO / SELFIE FEATURE"));
  console.log("tool_ids:", (cc.agent?.prompt?.tool_ids || []).length);
  console.log("tts:", cc.tts?.model_id, cc.tts?.voice_id);
})().catch((e) => { console.error(e); process.exit(1); });