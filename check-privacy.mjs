const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const keyOld = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
async function check(key, id) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, { headers: { "xi-api-key": key } });
  if (!r.ok) { console.log(id.slice(0, 16), r.status, (await r.text()).slice(0, 80)); return; }
  const a = await r.json();
  console.log(
    id.slice(0, 16),
    "| name:", a.name,
    "| privacy:", a.privacy,
    "| status:", a.status,
    "| archived:", a.archived,
    "| can be impersonated:", a.can_be_impersonated ?? "?",
    "| is_creator:", a.access_info?.is_creator,
    "| created_at:", (a.created_at_unix_secs ? new Date(a.created_at_unix_secs * 1000).toISOString().slice(0, 10) : a.created_at_unix_secs)
  );
}
(async () => {
  console.log("=== NEW account agents ===");
  await check(keyNew, "agent_0801m2apdajresxtwy6wdk5e9xxz");
  await check(keyNew, "agent_6101m2amnfmzfmhbet60ws1fpdzt");
  await check(keyNew, "agent_8701m2apy0rbf2q8ta0dvf4w2r5j");
  console.log("=== OLD account agent (the one that worked in app) ===");
  await check(keyOld, "agent_0601m29bhxdsf4e8jf9fjm6s4xr8");
})().catch((e) => { console.error(e); process.exit(1); });