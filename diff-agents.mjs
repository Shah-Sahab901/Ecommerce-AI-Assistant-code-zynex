function flatten(obj, prefix = "", out = {}) {
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v === null || v === undefined) { out[prefix + k] = String(v); continue; }
      if (typeof v === "object") flatten(v, prefix + k + ".", out);
      else out[prefix + k] = v;
    }
  }
  return out;
}
const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const keyOld = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
(async () => {
  const aN = await (await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0801m2apdajresxtwy6wdk5e9xxz", { headers: { "xi-api-key": keyNew } })).json();
  const aO = await (await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8", { headers: { "xi-api-key": keyOld } })).json();
  const fN = flatten(aN);
  const fO = flatten(aO);
  const keys = [...new Set([...Object.keys(fN), ...Object.keys(fO)])].sort();
  const diffs = [];
  for (const k of keys) {
    const vN = JSON.stringify(fN[k]);
    const vO = JSON.stringify(fO[k]);
    if (vN !== vO) {
      // ignore noisy fields
      if (/prompt\.prompt$/.test(k)) { diffs.push({ k, n: "(" + (vN?.length || 0) + " chars)", o: "(" + (vO?.length || 0) + " chars)" }); continue; }
      if (/created_at|token|id$|tool_ids/.test(k)) continue;
      diffs.push({ k, o: (vO || "").slice(0, 120), n: (vN || "").slice(0, 120) });
    }
  }
  console.log("=== DIFFS (old 0601 vs new 0801), excluding ids/created/prompt text/tool_ids ===");
  for (const d of diffs) {
    console.log("* " + d.k + "\n    old: " + d.o + "\n    new: " + d.n);
  }
  console.log("\ntotal differing fields:", diffs.length);
})().catch((e) => { console.error(e); process.exit(1); });