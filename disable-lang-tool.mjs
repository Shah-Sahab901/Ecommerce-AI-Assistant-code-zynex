const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};

  // Explicitly set to null = disabled (same representation as other disabled built-ins)
  cc.agent.prompt.built_in_tools = cc.agent.prompt.built_in_tools || {};
  cc.agent.prompt.built_in_tools.language_detection = null;

  // Ensure no language_detection in the tools array
  cc.agent.prompt.tools = (cc.agent.prompt.tools || []).filter(
    (t) => !t || t.name !== "language_detection"
  );

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  console.log("PATCH:", p.status);
  if (!p.ok) return console.log(await p.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  console.log("built_in_tools.language_detection:", JSON.stringify(pv.built_in_tools && pv.built_in_tools.language_detection));
  console.log("tools array:", JSON.stringify((pv.tools || []).map((t) => t && t.name)));
  console.log("prompt has no-tool line:", /Do NOT call, use, or rely on any language-switching tool/.test(pv.prompt || ""));
  console.log("TTS:", v.conversation_config.tts && v.conversation_config.tts.model_id);
}

main();