const h = { "xi-api-key": "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513" };
(async () => {
  const r = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8",
    { headers: h }
  );
  const a = r.ok ? await r.json() : null;
  if (!a) { console.log("ERR", r.status); return; }
  const c = a.conversation_config, ag = c.agent, p = ag.prompt;
  console.log("agent:", a.name, "| lang:", ag.language, "| voice:", c.tts?.voice_id, "| tts:", c.tts?.model_id);
  console.log("prompt len:", (p.prompt || "").length, "| PHOTO rule:", (p.prompt || "").includes("PHOTO / SELFIE FEATURE"));
  console.log("tool_ids:", p.tool_ids);
  const t = await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: h });
  const tj = await t.json();
  console.log("tools count:", (tj.tools || []).length);
  for (const x of tj.tools || []) {
    const ref = (x.api_scheme?.data_schema?.entity || "") || JSON.stringify(x.api_scheme?.data_schema || {}).slice(0, 80);
    console.log(" -", x.name, "|", x.id, "|", x.type, "|", ref);
  }
})().catch((e) => { console.error(e); process.exit(1); });