const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const agentId = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
(async () => {
  const r = await fetch(
    "https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=" + agentId + "&source=js_sdk&version=0",
    { headers: { "xi-api-key": key } }
  );
  const txt = await r.text();
  console.log("token endpoint:", r.status);
  if (r.ok) {
    const d = JSON.parse(txt);
    console.log("token present:", typeof d.token === "string" && d.token.length > 20, "| len:", (d.token || "").length);
    if (d.token) console.log("token prefix:", d.token.slice(0, 24), "...");
    console.log("extra fields:", Object.keys(d).join(", "));
  } else {
    console.log(txt.slice(0, 300));
  }
})().catch((e) => { console.error(e); process.exit(1); });