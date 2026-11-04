const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

const LANG_TOOL = {
  type: "system",
  name: "language_detection",
  description:
    "Detect the language the user is speaking and switch your reply to that same language. Also call this tool when the user explicitly asks to switch languages at any point, for example: kia tum Sindhi mein baat kar sakte ho, Pashto mein bolo, can you speak Punjabi, urdu mein jawaab do. The assistant speaks FIVE languages: English, Urdu, Pashto, Sindhi, Punjabi.",
  params: { system_tool_type: "language_detection", only_at_conversation_start: false },
};

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};

  cc.agent.prompt.tools = (cc.agent.prompt.tools || []).filter(
    (t) => !t || t.name !== "language_detection"
  );
  cc.agent.prompt.tools.push(LANG_TOOL);

  cc.agent.prompt.built_in_tools = cc.agent.prompt.built_in_tools || {};
  cc.agent.prompt.built_in_tools.language_detection = LANG_TOOL;

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  console.log("PATCH:", p.status);
  if (!p.ok) return console.log(await p.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  console.log("last verified verbose: only_at_conversation_start =",
    JSON.stringify(pv.built_in_tools && pv.built_in_tools.language_detection &&
      pv.built_in_tools.language_detection.params && pv.built_in_tools.language_detection.params.only_at_conversation_start));
  console.log("tool in tools[]:", JSON.stringify((pv.tools || []).map((t) => t && t.name && t.params)));
  console.log("TTS model:", v.conversation_config.tts && v.conversation_config.tts.model_id);
}

main();