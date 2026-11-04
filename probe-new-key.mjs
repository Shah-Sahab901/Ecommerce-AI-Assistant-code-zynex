const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
(async () => {
  const h = { "xi-api-key": key };
  for (const agent of [
    "agent_0601m29bhxdsf4e8jf9fjm6s4xr8",
    "agent_0801m2apdajresxtwy6wdk5e9xxz",
    "agent_6101m2amnfmzfmhbet60ws1fpdzt",
  ]) {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent}`, { headers: h });
    const body = r.ok ? await r.json() : null;
    console.log(agent.slice(0, 16) + ":", r.status, r.ok ? ("-> " + body.name) : (await r.text()).slice(0, 100));
  }
  const t = await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: h });
  if (t.ok) {
    const tj = await t.json();
    console.log("tools count:", (tj.tools || []).length);
    for (const x of tj.tools || []) console.log("  -", x.id, "|", x.name);
  } else {
    console.log("tools:", t.status, (await t.text()).slice(0, 120));
  }
})().catch((e) => { console.error(e); process.exit(1); });