const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};
  cc.agent.prompt.built_in_tools = cc.agent.prompt.built_in_tools || {};

  cc.agent.prompt.built_in_tools.language_detection = {
    type: "system",
    name: "language_detection",
    description:
      "Detect which language the user is speaking (Urdu, Roman Urdu, Pashto, Punjabi, Sindhi, English, Hindi, or any other language) and switch your reply to that same language. Also call this tool when the user explicitly asks you to speak in a specific language, for example: kia tum Sindhi mein baat kar sakte ho, can you speak in Urdu, Pashto mein jawaab do, Hindi mein bolo, etc. Always match the user's requested or detected language.",
    params: {
      system_tool_type: "language_detection",
      only_at_conversation_start: false,
    },
  };

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  console.log("PATCH:", p.status);
  if (p.ok) console.log("Smart language detection updated.");
  else console.log(await p.text());
}

main();