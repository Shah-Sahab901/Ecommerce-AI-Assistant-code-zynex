import fs from "node:fs";
const OLD_KEY = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const OLD_AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";

const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, {
  headers: { "xi-api-key": OLD_KEY },
});
const text = await res.text();
let data; try { data = JSON.parse(text); } catch { data = text; }
console.log("status:", res.status);
if (res.status === 200) {
  const cc = data.conversation_config;
  const ag = cc?.agent;
  console.log("name:", data.name);
  console.log("prompt len:", String(ag?.prompt?.prompt ?? "").length);
  console.log("first_message:", ag?.first_message);
  console.log("language:", ag?.language);
  console.log("llm:", String(ag?.llm ?? ""));
  console.log("tools:", JSON.stringify(ag?.tools ?? [], null, 1).slice(0, 2000));
  console.log("tts model:", cc?.tts?.model_id, "| voice:", cc?.tts?.voice_id);
  fs.writeFileSync("C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\old-agent-6101.json", JSON.stringify(data, null, 2));
  console.log("saved to temp/old-agent-6101.json");
} else {
  console.log(JSON.stringify(data));
}

const bk = JSON.parse(fs.readFileSync("elevenlabs-old-agent-backup.json", "utf8"));
const bkAg = bk.conversation_config?.agent;
console.log("\n--- backup (1701) prompt len:", String(bkAg?.prompt?.prompt ?? "").length);