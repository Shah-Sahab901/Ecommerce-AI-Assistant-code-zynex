const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key, "Content-Type": "application/json" };
const agentId = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
(async () => {
  const fm = "Assalam o alaikum! 👋 Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?";
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "PATCH", headers: h,
    body: JSON.stringify({ conversation_config: { agent: { first_message: fm } } }),
  });
  console.log("PATCH agent.first_message:", r.status);
  if (!r.ok) console.log((await r.text()).slice(0, 300));
  const v = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, { headers: h }).then(r => r.json());
  const cc = v.conversation_config || {};
  console.log("verify agent.first_message:", JSON.stringify(cc.agent && cc.agent.first_message).slice(0, 80));
  const p = cc.agent && cc.agent.prompt;
  console.log("prompt len:", p && p.prompt.length, "| PHOTO:", p.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("tools:", JSON.stringify(p && p.tool_ids));
  console.log("language:", JSON.stringify(cc.agent && cc.agent.language));
  console.log("llm:", p && p.llm);
  console.log("tts:", cc.tts && cc.tts.model_id, "| voice:", cc.tts && cc.tts.voice_id);
})().catch(e => { console.error(e); process.exit(1); });