const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
function probeWS(agentId, tag, protocols) {
  return new Promise((resolve) => {
    const url = "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=" + agentId + "&source=probe&version=0";
    let ws;
    try {
      ws = new WebSocket(url, protocols);
    } catch (e) {
      console.log("[" + tag + "] constructor ERR:", e.message);
      resolve();
      return;
    }
    const seen = [];
    let openedAt = null;
    const finish = (label, extra) => {
      clearTimeout(t);
      try { ws.close(); } catch {}
      console.log("[" + tag + "] " + label + (extra ? " " + extra : ""));
      resolve(seen);
    };
    const t = setTimeout(() => finish("TIMEOUT-25s", ""), 25000);
    ws.onopen = () => { openedAt = Date.now(); console.log("[" + tag + "] OPEN"); };
    ws.onerror = (e) => console.log("[" + tag + "] ws error:", e.message || "");
    ws.onmessage = (ev) => {
      let p;
      try { p = JSON.parse(ev.data); } catch { p = { raw: String(ev.data).slice(0, 80) }; }
      seen.push(p);
      console.log("[" + tag + "] EVENT", (p.type || "?"), JSON.stringify(p).slice(0, 200));
      if (p.type === "ping") { try { ws.send("pong"); } catch {} }
    };
    ws.onclose = (ev) => finish("CLOSE code=" + ev.code + " reason='" + ev.reason + "'", "events=" + seen.length);
  });
}
(async () => {
  const t0 = Math.floor(Date.now() / 1000) - 90 * 86400;
  const t1 = Math.floor(Date.now() / 1000);
  const u = await fetch(
    "https://api.elevenlabs.io/v1/usage/character-stats?start_unix=" + t0 + "&end_unix=" + t1,
    { headers: { "xi-api-key": key } }
  );
  console.log("new-key character-stats:", u.status, (await u.text()).slice(0, 400));

  console.log("\n--- OLD account agent 0601 (bare, no key) ---");
  const a = await probeWS("agent_0601m29bhxdsf4e8jf9fjm6s4xr8", "OLD-0601", ["convai"]);
  console.log("old events:", a.length);
  console.log("\n--- NEW account agent 0801 (bare, no key) ---");
  const b = await probeWS("agent_0801m2apdajresxtwy6wdk5e9xxz", "NEW-0801", ["convai"]);
  console.log("new events:", b.length);
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });