import { readFileSync } from "fs";

const NEW_KEY = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
const backup = JSON.parse(readFileSync("elevenlabs-old-agent-backup.json", "utf8"));
const conversation_config = JSON.parse(JSON.stringify(backup.conversation_config));

const prompt = conversation_config.agent.prompt;
delete prompt.tool_ids;
if (prompt.mcp_server_ids) prompt.mcp_server_ids = [];
if (prompt.native_mcp_server_ids) prompt.native_mcp_server_ids = [];

const body = { name: "Voice Shopping Assistant", conversation_config };

const r = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
  method: "POST",
  headers: { "xi-api-key": NEW_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const d = await r.json();
console.log("create status:", r.status);
console.log("response:", JSON.stringify(d).slice(0, 300));

if (d.agent_id) {
  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${d.agent_id}`, {
    headers: { "xi-api-key": NEW_KEY },
  })).json();
  const pv = v.conversation_config?.agent?.prompt || {};
  console.log("\n--- new agent verification ---");
  console.log("agent_id:", d.agent_id);
  console.log("first_message len:", (v.conversation_config?.agent?.first_message || "").length);
  console.log("language:", v.conversation_config?.agent?.language);
  console.log("prompt len:", (pv.prompt || "").length);
  console.log("prompt has STORE DATA RULES:", (pv.prompt || "").includes("STORE DATA RULES"));
  console.log("prompt has 5-lang rules:", (pv.prompt || "").includes("FIVE languages"));
  console.log("tools:", JSON.stringify((pv.tools || []).map((t) => t && t.name)));
  console.log("tool_ids:", JSON.stringify(pv.tool_ids ?? null));
  console.log("lang_detect:", JSON.stringify((pv.built_in_tools || {}).language_detection));
  console.log("llm:", pv.llm);
  console.log("tts model:", v.conversation_config?.tts?.model_id, "| voice:", v.conversation_config?.tts?.voice_id);
  console.log("asr provider:", v.conversation_config?.asr?.provider);
  console.log("max_duration:", v.conversation_config?.conversation?.max_duration_seconds);
}