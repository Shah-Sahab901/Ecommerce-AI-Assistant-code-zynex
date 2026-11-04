const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": keyNew, "Content-Type": "application/json" };
async function getAgent(id) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, { headers: h });
  if (!r.ok) throw new Error(id + " GET " + r.status + " " + (await r.text()).slice(0, 120));
  return r.json();
}
(async () => {
  const master = await getAgent("agent_6101m2amnfmzfmhbet60ws1fpdzt"); // dashboard-proven
  const target = await getAgent("agent_0801m2apdajresxtwy6wdk5e9xxz"); // app agent
  const cfg = JSON.parse(JSON.stringify(master.conversation_config));
  // strip tools arrays (keep tool_ids only) to avoid the 400/500
  if (cfg.agent?.prompt) {
    delete cfg.agent.prompt.tools;
    cfg.agent.prompt.tool_ids = [...(cfg.agent.prompt.tool_ids || [])];
  }
  const before = JSON.stringify(target.conversation_config);
  const after = JSON.stringify(cfg);
  // safety: never wipe prompt text accidentally
  const p1 = target.conversation_config?.agent?.prompt?.prompt || "";
  if (!cfg.agent.prompt.prompt || cfg.agent.prompt.prompt.length < 500) {
    throw new Error("master prompt too short — aborting");
  }
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${target.agent_id}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ conversation_config: cfg }),
  });
  console.log("PATCH status:", r.status);
  if (!r.ok) { console.log((await r.text()).slice(0, 400)); return; }
  const v = await getAgent(target.agent_id);
  const vn = JSON.stringify(v.conversation_config);
  console.log("before-len:", before.length, "-> after-len:", after.length, "| verify-len:", vn.length);
  console.log("verify llm:", v.conversation_config?.agent?.prompt?.llm);
  console.log("verify tts:", v.conversation_config?.tts?.model_id, "voice:", v.conversation_config?.tts?.voice_id);
  console.log("verify turn:", v.conversation_config?.turn?.turn_model, "| speculative:", v.conversation_config?.turn?.speculative_turn);
  console.log("verify expressive:", v.conversation_config?.tts?.expressive_mode);
  console.log("verify source_attribution:", v.conversation_config?.conversation?.source_attribution);
  console.log("verify prompt len:", v.conversation_config?.agent?.prompt?.prompt?.length, "| photo:", v.conversation_config?.agent?.prompt?.prompt?.includes("PHOTO / SELFIE FEATURE"));
  console.log("verify tool_ids:", (v.conversation_config?.agent?.prompt?.tool_ids || []).length);
})().catch((e) => { console.error(e); process.exit(1); });