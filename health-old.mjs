const oldKey = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
(async () => {
  const h = { "xi-api-key": oldKey };
  const r = await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8", { headers: h });
  console.log("agent 0601 fetch:", r.status);
  if (!r.ok) { console.log((await r.text()).slice(0, 200)); return; }
  const a = await r.json();
  const c = a.conversation_config, p = c.agent.prompt;
  console.log("name:", a.name, "| lang:", c.agent.language, "| tts:", c.tts?.model_id, "| voice:", c.tts?.voice_id);
  console.log("prompt len:", p.prompt.length, "| photo rule:", p.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("tool_ids:", p.tool_ids.length, JSON.stringify(p.tool_ids));
  console.log("max_duration:", c.conversation?.max_duration_seconds, "| first_msg set:", (c.agent.first_message || "").length > 0);

  const tr = await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: h });
  if (tr.ok) {
    const tj = await tr.json();
    console.log("tools on old account:", (tj.tools || []).length);
    for (const x of tj.tools || []) {
      const cfg = x.tool_config || {};
      console.log("  -", x.id, "|", cfg.type, "|", cfg.name, "| url:", (cfg.api_scheme?.http?.url || "n/a"));
    }
  } else console.log("tools:", tr.status, (await tr.text()).slice(0, 120));
})().catch((e) => { console.error(e); process.exit(1); });