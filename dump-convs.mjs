const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key };
const fs = await import("node:fs");
const out = "C:/Users/DELL/AppData/Local/Temp/opencode/";
async function get(id) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, { headers: h });
  return r.json();
}
(async () => {
  const failed = await get("conv_3901m2aw50t3fejrbrezrhjwms9p");
  const done = await get("conv_3901m2at94m3eg98y9qyzdndz7km");
  fs.writeFileSync(out + "failed_conv.json", JSON.stringify(failed, null, 2));
  fs.writeFileSync(out + "done_conv.json", JSON.stringify(done, null, 2));

  function findErrors(o, path, acc) {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (/error|fail|reason|status|exception/i.test(k) && v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)) {
        acc.push(path + "." + k + " = " + (typeof v === "string" ? v : JSON.stringify(v).slice(0, 300)));
      }
      findErrors(v, path + "." + k, acc);
    }
  }
  const fe = [], de = [];
  findErrors(failed, "failed", fe);
  findErrors(done, "done", de);
  console.log("=== FAILED error-ish fields ===");
  fe.forEach(e => console.log(" ", e));
  console.log("\n=== DONE error-ish fields (none expected) ===");
  de.splice(0, 12).forEach(e => console.log(" ", e));

  console.log("\n=== llm_usage (failed) ===");
  console.log(JSON.stringify(failed.metadata?.charging?.llm_usage, null, 1).slice(0, 900));
  console.log("\n=== llm_usage (done) ===");
  console.log(JSON.stringify(done.metadata?.charging?.llm_usage, null, 1).slice(0, 900));
  console.log("\n=== source_info ===");
  console.log("failed:", JSON.stringify(failed.conversation_initiation_client_data?.source_info));
  console.log("done:", JSON.stringify(done.conversation_initiation_client_data?.source_info));
  console.log("failed user_id:", JSON.stringify(failed.user_id));
  console.log("done user_id:", JSON.stringify(done.user_id));
  console.log("\n=== DONE transcript ===");
  (done.transcript || []).slice(0, 20).forEach(t => console.log(" -", t.role, ":", (t.message || "").toString().slice(0, 200)));
  console.log("\n=== DONE analysis transcipt+call ===");
  console.log("call_successful:", done.analysis?.call_successful, "| score:", done.analysis?.call_success_score);
  console.log("summary:", done.analysis?.transcript_summary && String(done.analysis.transcript_summary).slice(0, 300));
})().catch(e => { console.error(e); process.exit(1); });