const h = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
const r = await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8", { headers: h });
const a = await r.json();
const p = a.conversation_config.agent.prompt || {};
for (const x of p.tools || []) {
  console.log("name:", x.name, "| type:", x.type);
  console.log("keys:", Object.keys(x).join(","));
  console.log("params json:", JSON.stringify(x.params).slice(0, 400));
  if (x.name === "list_products") {
    console.log("has open_detail:", !!(x.params && x.params.properties && x.params.properties.open_detail));
  }
  console.log("---");
}