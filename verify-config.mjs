const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY };

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config;
  const ag = cc.agent;
  const p = ag.prompt || {};
  const promptText = p.prompt || "";

  console.log("first_message:", JSON.stringify(ag.first_message));
  console.log("agent.language:", JSON.stringify(ag.language));
  console.log("prompt len:", promptText.length);
  console.log("5-lang rules:", /FIVE languages/.test(promptText));
  console.log("no-tool line:", /language-switching tool/.test(promptText));
  console.log("never-sorry line:", /NEVER say/.test(promptText));
  console.log("tools:", JSON.stringify((p.tools || []).map((t) => t && t.name)));
  console.log(
    "lang_detect:",
    JSON.stringify(p.built_in_tools && p.built_in_tools.language_detection)
  );
  console.log("TTS model:", cc.tts && cc.tts.model_id);
}

main();