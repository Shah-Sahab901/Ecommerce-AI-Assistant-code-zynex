import { writeFileSync } from "fs";

const OLD_KEY = "sk_ea0b82d57b3b1370f014008c48724b9ad0027559c9b75a09";
const OLD_AGENT = "agent_1701m28qgfvpf5g93snqmsk3cdp0";

const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, {
  headers: { "xi-api-key": OLD_KEY },
})).json();

writeFileSync("elevenlabs-old-agent-backup.json", JSON.stringify(a, null, 2));
console.log("old agent fetched. name:", a.name, "| has conversation_config:", !!a.conversation_config);
console.log("keys:", Object.keys(a).join(", "));
console.log("conversation_config keys:", Object.keys(a.conversation_config || {}).join(", "));
console.log("platform_settings keys:", Object.keys(a.platform_settings || {}).join(", "));
console.log("backup saved to elevenlabs-old-agent-backup.json");