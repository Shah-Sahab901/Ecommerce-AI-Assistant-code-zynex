const AGENT_ID = (process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8").trim();
const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" };

async function main() {
  const c = await (await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=5`, { headers })).json();
  if (!(c.conversations || []).length) { console.log("no conversations"); return; }
  for (const cv of c.conversations || []) {
    console.log("-", cv.conversation_id, "|", cv.status, "|", cv.start_time_unix_secs ? new Date(cv.start_time_unix_secs * 1000).toLocaleString() : "?");
  }
  const last = c.conversations[0];
  console.log("\n=== last conversation detail ===");
  const d = await (await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${last.conversation_id}`, { headers })).json();
  console.log("status:", d.status || d.metadata?.conversation_status);

  console.log("\n=== transcript ===");
  for (const t of d.transcript || []) {
    console.log(`[${t.role}@${t.origin}] ${(t.message || "").replace(/\n/g, " ").slice(0, 160)}`);
  }

  console.log("\n=== tool_calls ===");
  const calls = d.tool_calls || [];
  if (!calls.length) console.log("no tool_calls field");
  for (const tc of calls) {
    console.log("\n---", tc.type || tc.name, tc.name || tc.type);
    console.log("params:", JSON.stringify(tc.params ?? tc.input ?? tc.request ?? null));
    if (tc.request_body) console.log("request_body:", JSON.stringify(tc.request_body).slice(0, 500));
    if (tc.response_json) console.log("response_json:", JSON.stringify(tc.response_json).slice(0, 1200));
    if (tc.output || tc.response || tc.result) console.log("output:", JSON.stringify(tc.output ?? tc.response ?? tc.result).slice(0, 1200));
    console.log("state:", tc.state, tc.error ? "ERR=" + JSON.stringify(tc.error).slice(0, 300) : "");
  }
}

main();