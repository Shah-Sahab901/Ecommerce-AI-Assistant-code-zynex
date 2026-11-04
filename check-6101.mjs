const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key };
(async () => {
  const a = await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_6101m2amnfmzfmhbet60ws1fpdzt", { headers: h }).then(r => r.json());
  const c = a.conversation_config || {};
  const p = c.agent && c.agent.prompt;
  console.log("name:", a.name);
  console.log("agent.language:", JSON.stringify((c.agent || {}).language));
  console.log("prompt.lang:", JSON.stringify((p || {}).lang));
  console.log("llm:", (p || {}).llm);
  console.log("prompt len:", (p || {}).prompt && p.prompt.length);
  console.log("PHOTO rule:", (p || {}).prompt && p.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("tool_ids:", JSON.stringify((p || {}).tool_ids));
  console.log("tools arr present:", Array.isArray((p || {}).tools));
  console.log("tts:", c.tts && c.tts.model_id, "| voice:", c.tts && c.tts.voice_id);
  console.log("turn:", c.turn && c.turn.turn_model);
})().catch(e => { console.error(e); process.exit(1); });