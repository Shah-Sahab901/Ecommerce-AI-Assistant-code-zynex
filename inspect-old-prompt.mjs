const oldKey = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
(async () => {
  const r = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8",
    { headers: { "xi-api-key": oldKey } }
  );
  const a = await r.json();
  const p = a.conversation_config.agent.prompt;
  console.log("prompt keys:", Object.keys(p));
  console.log("has tools array:", Array.isArray(p.tools), p.tools?.length);
  console.log("has tool_ids:", Array.isArray(p.tool_ids), p.tool_ids);
  console.log("association:", JSON.stringify(p.association ?? null));
  console.log("context:", p.context ?? null);
  // full JSON of a small slice to inspect structure
  const clone = { ...p, prompt: p.prompt.slice(0, 200) };
  console.log(JSON.stringify(clone, null, 1).slice(0, 1500));
})().catch((e) => { console.error(e); process.exit(1); });