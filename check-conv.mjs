const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key };
const convId = "conv_3901m2aw50t3fejrbrezrhjwms9p";
(async () => {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${convId}`, { headers: h });
  console.log("conv detail:", r.status);
  if (r.ok) {
    const d = await r.json();
    console.log("status:", d.status);
    console.log("conversation_id:", d.conversation_id);
    console.log("agent_id:", d.agent_id);
    console.log("keys:", Object.keys(d).join(", "));
    if (d.error) console.log("error:", JSON.stringify(d.error));
    if (d.result && d.result.error) console.log("result.error:", JSON.stringify(d.result.error));
    if (d.status_description) console.log("status_description:", d.status_description);
    if (d.transcript) {
      console.log("transcript msg count:", d.transcript.length);
      d.transcript.slice(0, 12).forEach(t => console.log(" -", t.role, ":", (t.message || "").toString().slice(0, 120)));
    }
  } else {
    console.log((await r.text()).slice(0, 300));
  }
  const r2 = await fetch("https://api.elevenlabs.io/v1/convai/conversations", { headers: h });
  console.log("\nlist conversations:", r2.status);
  if (r2.ok) {
    const l = await r2.json();
    const convs = l.conversations || l;
    console.log("total:", Array.isArray(convs) ? convs.length : "(obj)");
    (Array.isArray(convs) ? convs.slice(0, 12) : []).forEach(c =>
      console.log(" -", c.conversation_id, "| status:", c.status, "| agent:", c.agent_id, "| started:", c.started_at_unix_secs)
    );
  } else console.log((await r2.text()).slice(0, 300));
})().catch(e => { console.error(e); process.exit(1); });