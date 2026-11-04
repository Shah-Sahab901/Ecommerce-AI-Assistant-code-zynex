const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" };

async function main() {
  const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const cc = a.conversation_config || {};
  console.log("=== conversation section ===");
  console.log(JSON.stringify(cc.conversation ?? {}, null, 1));
  console.log("=== first_message len ===", (cc.agent?.first_message || "").length);

  console.log("\n=== recent conversations ===");
  const c = await (await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=5`, { headers })).json();
  for (const cv of c.conversations || []) {
    console.log("-", cv.conversation_id, "|", cv.status, "|", cv.start_time_unix_secs ? new Date(cv.start_time_unix_secs * 1000).toLocaleString() : "?");
  }
  const last = (c.conversations || [])[0];
  if (last) {
    console.log("\n=== last conversation detail ===");
    const d = await (await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${last.conversation_id}`, { headers })).json();
    const meta = d.metadata || {};
    console.log("conv_id:", d.conversation_id, "| status:", meta.conversation_status || d.status);
    const trans = d.transcript || [];
    for (const t of trans) {
      const by = t.role + (t.origin === "server" ? "" : "@" + t.origin);
      const txt = (t.message || "").replace(/\n/g, " ").slice(0, 220);
      console.log(`[${by}] ${txt}`);
    }
    if (!trans.length) {
      console.log("transcript raw keys:", Object.keys(d).join(", "));
      console.log("transcript:", JSON.stringify(d.transcript).slice(0, 400));
    }
  }
}

main();