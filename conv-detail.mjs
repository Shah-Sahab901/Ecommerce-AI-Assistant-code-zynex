const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key };
async function dump(id, label) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, { headers: h });
  const d = await r.json();
  console.log("\n=== " + label + " (" + id + ") status=" + d.status + " ===");
  console.log("conversation_product:", d.conversation_product);
  console.log("environment:", d.environment);
  console.log("user_id:", d.user_id);
  console.log("version_id:", d.version_id, "| branch_id:", d.branch_id);
  console.log("has_response_audio:", d.has_response_audio);
  const an = d.analysis;
  if (an) {
    console.log("analysis keys:", Object.keys(an).join(", "));
    const errField = an.error || an.failure_reason;
    if (errField) console.log("analysis.error:", typeof errField === "string" ? errField : JSON.stringify(errField));
    console.log("analysis.callerReference:", an.callerReference, "| requestedAt:", an.requestedAt, "| duration:", an.durationSec, an.duration, an.ElapsedTime);
  }
  const meta = d.metadata;
  if (meta) console.log("metadata:", JSON.stringify(meta).slice(0, 600));
  const init = d.conversation_initiation_client_data;
  if (init) {
    console.log("init keys:", Object.keys(init).join(", "));
    const cfg = init.conversation_config_override;
    if (cfg) console.log("init override (llm/lang/tts):", JSON.stringify({ llm: cfg.agent && cfg.agent.prompt && cfg.agent.prompt.llm, lang: cfg.agent && cfg.agent.language, tts: cfg.tts }).slice(0, 400));
  }
  const snaps = d.realtime_config_snapshots;
  if (Array.isArray(snaps) && snaps.length) {
    const s = snaps[0];
    console.log("snapshot keys:", Object.keys(s).join(", "));
    console.log("snapshot status:", s.validation_status, "| errors:", JSON.stringify(s.validation_errors || s.errors).slice(0, 500));
  }
  return d;
}
(async () => {
  await dump("conv_3901m2aw50t3fejrbrezrhjwms9p", "FAILED app/token");
  await dump("conv_3901m2at94m3eg98y9qyzdndz7km", "DONE dashboard");
})().catch(e => { console.error(e); process.exit(1); });