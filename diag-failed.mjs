const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" };

async function main() {
  const ids = [
    "conv_4601m291sr3ned49j8tckcyxcz21",
    "conv_1101m291sah9f6zbwk8er8ar62py",
    "conv_6001m290rf51f8da1fb2n8db66z4",
  ];
  for (const id of ids) {
    console.log("\n\n========== " + id + " ==========");
    const d = await (await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, { headers })).json();
    const m = d.metadata || {};
    console.log("status:", d.status, "| hiding_reason:", d.hiding_reason);
    console.log("initiation_client_data:", JSON.stringify(d.conversation_initiation_client_data ?? null));
    console.log("agent_name:", d.agent_name, "| version_id:", d.version_id, "| generation:", d.environment);
    console.log("metadata keys:", Object.keys(m).join(","));
    console.log("metadata.error:", JSON.stringify(m.error ?? null));
    console.log("metadata.error_reviewed:", JSON.stringify(m.error_reviewed ?? null));
    if (m.widget_metadata) console.log("widget_metadata:", JSON.stringify(m.widget_metadata));
    if (m.smb_metadata) console.log("smb_metadata:", JSON.stringify(m.smb_metadata));
    const snap = d.realtime_config_snapshots || [];
    console.log("realtime snapshots count:", snap.length);
    if (snap.length) {
      const s = snap[0];
      console.log("snap ok:", s.conversation_generation);
    }
  }
}

main();