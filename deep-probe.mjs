const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const agentId = "agent_0801m2apdajresxtwy6wdk5e9xxz";
const h = { "xi-api-key": key };

async function probeREST() {
  const endpoints = [
    "/v1/user",
    "/v1/user/subscription",
    "/v1/usage",
    "/v1/usage/character-stats",
    "/v1/convai/usage",
    "/v1/workspace/api-keys",
    "/v1/convai/agent-settings",
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch("https://api.elevenlabs.io" + ep, { headers: h });
      const txt = (await r.text()).slice(0, 200);
      console.log(ep, "->", r.status, txt);
    } catch (e) {
      console.log(ep, "-> ERR", e.message);
    }
  }
}

function probeWS() {
  return new Promise((resolve) => {
    const url =
      "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=" +
      agentId +
      "&source=probe&version=0";
    const ws = new WebSocket(url, ["convai", "bearer." + key]);
    const seen = [];
    const done = (tag, extra) => {
      try { ws.close(); } catch {}
      console.log("WS [" + tag + "]", extra || "");
      resolve(seen);
    };
    const t = setTimeout(() => done("TIMEOUT-20s", ""), 20000);
    ws.onopen = () => console.log("WS OPEN");
    ws.onerror = (e) => { clearTimeout(t); done("ERROR", e.message || ""); };
    ws.onmessage = (ev) => {
      let parsed;
      try { parsed = JSON.parse(ev.data) || {}; } catch { parsed = { raw: String(ev.data).slice(0, 120) }; }
      seen.push(parsed);
      console.log("EVENT type:", parsed.type, JSON.stringify(parsed).slice(0, 260));
      if (parsed.type === "ping") { try { ws.send("pong"); } catch {} }
    };
    ws.onclose = (ev) => { clearTimeout(t); done("CLOSE", "code=" + ev.code + " reason=" + ev.reason); };
  });
}

(async () => {
  console.log("=== REST probes ===");
  await probeREST();
  console.log("\n=== WS session (agent " + agentId.slice(0, 16) + "...) ===");
  const seq = await probeWS();
  console.log("\n=== Summary: first 5 events ===");
  for (const ev of seq.slice(0, 5)) console.log(JSON.stringify(ev).slice(0, 300));
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });