const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error(
    "API key missing. Run: $env:ELEVENLABS_API_KEY = '<your secret key from elevenlabs.io/app/settings>'\nthen run this script again."
  );
  process.exit(1);
}

const headers = {
  "xi-api-key": API_KEY,
  "Content-Type": "application/json",
};

async function main() {
  const get = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
    { headers }
  );
  if (!get.ok) {
    console.error("GET failed", get.status, await get.text());
    process.exit(1);
  }
  const agent = await get.json();
  const cc = agent.conversation_config || {};

  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};
  cc.agent.prompt.built_in_tools = cc.agent.prompt.built_in_tools || {};

  cc.agent.prompt.built_in_tools.language_detection = {
    type: "system",
    name: "language_detection",
    params: { system_tool_type: "language_detection" },
  };

  const patch = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ conversation_config: cc }),
    }
  );
  console.log("PATCH status:", patch.status);
  const text = await patch.text();
  console.log(text.slice(0, 500));

  if (patch.ok) {
    console.log("Done. Language detection tool added. Agent config preserved.");
  } else {
    console.error("PATCH failed:", text);
  }
}

main();