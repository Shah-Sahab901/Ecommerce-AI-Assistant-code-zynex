const h = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
const a = await (await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8", { headers: h })).json();
const p = a.conversation_config.agent.prompt || {};
for (const x of p.tools || []) {
  const schemas = [x.parameters, x.params];
  console.log("name:", x.name);
  console.log("parameters:", JSON.stringify(x.parameters));
  console.log("params(legacy):", JSON.stringify(x.params));
  console.log("---");
}