const keyNew = "sk_b84c57e2767eb99df08c8239b13386646d5e15ed97d044c8";
const oldKey = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
(async () => {
  // 1) get attach_photo tool definition from NEW account
  const r = await fetch(
    "https://api.elevenlabs.io/v1/convai/tools/tool_0201m2an1fq0fa2tj4c67x7qj7g2",
    { headers: { "xi-api-key": keyNew } }
  );
  const t = await r.json();
  console.log("=== ATTACH_PHOTO TOOL (new) ===");
  console.log(JSON.stringify(t, null, 2));

  // 2) extract PHOTO rule text from NEW agent 0801 prompt
  const ar = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/agent_0801m2apdajresxtwy6wdk5e9xxz",
    { headers: { "xi-api-key": keyNew } }
  );
  const ag = await ar.json();
  const prompt = ag.conversation_config.agent.prompt.prompt || "";
  const idx = prompt.indexOf("PHOTO / SELFIE FEATURE");
  const idxEnd = prompt.indexOf("END PHOTO / SELFIE FEATURE");
  console.log("=== PHOTO RULE TEXT ===");
  console.log(prompt.slice(idx < 0 ? 0 : idx, idxEnd < 0 ? prompt.length : idxEnd + "END PHOTO / SELFIE FEATURE".length));
})().catch((e) => { console.error(e); process.exit(1); });