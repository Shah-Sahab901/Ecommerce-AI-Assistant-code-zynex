const AGENT_ID = (process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8").trim();
const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" };

async function getAgent() {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  if (!r.ok) throw new Error("GET agent " + r.status + " " + (await r.text()).slice(0, 200));
  return r.json();
}

async function updateTool(toolId) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${toolId}`, { headers });
  if (!r.ok) throw new Error("GET tool " + r.status + " " + (await r.text()).slice(0, 300));
  const t = await r.json();
  console.log("BEFORE:", toolId, "| type:", t.tool_config?.type, "| expects_response:", JSON.stringify(t.tool_config?.expects_response));

  const tc = t.tool_config || {};
  if (tc.type !== "client") {
    console.log("  skip (not client tool)");
    return;
  }
  tc.expects_response = true;

  const r2 = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${toolId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ tool_config: tc }),
  });
  if (!r2.ok) {
    // fallback: PUT
    const r3 = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${toolId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ tool_config: tc }),
    });
    if (!r3.ok) throw new Error("PATCH+PUT tool " + r3.status + " " + (await r3.text()).slice(0, 300));
    console.log("  updated via PUT");
  } else {
    console.log("  updated via PATCH");
  }

  const check = await (await fetch(`https://api.elevenlabs.io/v1/convai/tools/${toolId}`, { headers })).json();
  console.log("AFTER: ", toolId, "| expects_response:", JSON.stringify(check.tool_config?.expects_response));
}

async function main() {
  const a = await getAgent();
  const toolIds = a.conversation_config?.agent?.prompt?.tool_ids || [];
  console.log("tool_ids:", toolIds);
  for (const id of toolIds) await updateTool(id);
}

main().catch((e) => { console.error(e); process.exit(1); });