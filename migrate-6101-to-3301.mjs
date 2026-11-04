import fs from "node:fs";

const OLD_KEY = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const NEW_KEY = "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const OLD_AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const NEW_AGENT = "agent_3301m2kb6c2yerg8att49drmfd0q";

const OH = { "xi-api-key": OLD_KEY };
const NH = { "xi-api-key": NEW_KEY, "Content-Type": "application/json" };

const j = async (r) => {
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
};

console.log("=== 1) GET old agent 6101 ===");
const oldR = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, { headers: OH });
const oldAgent = await j(oldR);
if (!oldR.ok) throw new Error("GET old: " + oldR.status + " " + JSON.stringify(oldAgent).slice(0, 200));
const cc = oldAgent.conversation_config;
const prompt = cc.agent.prompt;
const oldPromptText = prompt.prompt || "";
console.log("prompt len:", oldPromptText.length);

console.log("\n=== 2) Create 4 client tools on NEW account ===\n");
const listR = await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: NH });
const listD = await j(listR);
const existing = (listD.tools || []).reduce((m, x) => { m[x.tool_config?.name] = x.id; return m; }, {});
const newToolIds = [];
for (const t of prompt.tools || []) {
  if (existing[t.name]) {
    newToolIds.push(existing[t.name]);
    console.log("  reused:", t.name, existing[t.name]);
    continue;
  }
  const tc = {
    type: t.type ?? "client",
    name: t.name,
    description: t.description,
    parameters: t.parameters ?? { type: "object", properties: {}, required: [] },
    expects_response: t.expects_response ?? true,
    response_timeout_secs: t.response_timeout_secs ?? 60,
    disable_interruptions: t.disable_interruptions ?? false,
    interruption_mode: t.interruption_mode ?? "allow",
    execution_mode: "immediate",
  };
  const r = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
    method: "POST",
    headers: NH,
    body: JSON.stringify({ tool_config: tc }),
  });
  const d = await j(r);
  if (!r.ok) throw new Error("create tool " + t.name + ": " + r.status + " " + JSON.stringify(d).slice(0, 250));
  newToolIds.push(d.id);
  console.log("  created:", t.name, d.id);
}

console.log("\nnew tool_ids:", newToolIds);

console.log("\n=== 3) PATCH new agent 3301 ===");
const newCC = JSON.parse(JSON.stringify(cc));
newCC.agent.language = "ur";
newCC.agent.first_message =
  "Assalam o alaikum! \ud83d\udc4b Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?";
newCC.agent.prompt.prompt = oldPromptText;
newCC.agent.prompt.tool_ids = newToolIds;
delete newCC.agent.prompt.tools;
newCC.asr.keywords = [];

const patchR = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${NEW_AGENT}`, {
  method: "PATCH",
  headers: NH,
  body: JSON.stringify({ conversation_config: newCC }),
});
const patchD = await j(patchR);
if (!patchR.ok) throw new Error("PATCH: " + patchR.status + " " + JSON.stringify(patchD).slice(0, 400));
console.log("PATCH ok:", patchR.status);

console.log("\n=== 4) VERIFY ===");
const vR = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${NEW_AGENT}`, { headers: NH });
const v = await j(vR);
if (!vR.ok) throw new Error("GET verify: " + vR.status);
const vp = v.conversation_config.agent.prompt;
console.log("name:", v.name);
console.log("language:", v.conversation_config.agent.language);
console.log("first_message:", (v.conversation_config.agent.first_message || "").slice(0, 60));
console.log("prompt len:", (vp.prompt || "").length);
console.log("prompt has STORE DATA:", (vp.prompt || "").includes("STORE DATA"));
console.log("prompt has OFF-TOPIC:", (vp.prompt || "").includes("OFF-TOPIC"));
console.log("prompt has TRY-ON:", (vp.prompt || "").includes("TRY-ON"));
console.log("prompt has MEHANGA:", (vp.prompt || "").includes("MEHANGA"));
console.log("tool_ids:", vp.tool_ids);
console.log("tools inline:", (vp.tools || []).map((t) => t && t.name));
console.log("tts:", v.conversation_config.tts.model_id, v.conversation_config.tts.voice_id);

fs.writeFileSync("C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\migrated-3301.json", JSON.stringify(v, null, 2));
console.log("\nDONE. saved migrated config to temp.");