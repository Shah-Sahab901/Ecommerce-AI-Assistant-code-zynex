const NEW_KEY =
  process.env.ELEVENLABS_CONFIGURE_API_KEY ||
  "sk_b84c57e2767eb99df08c8239b13386646d5e15ed97d044c8";
const PROMPT_SRC_AGENT = process.env.ELEVENLABS_PROMPT_SRC_AGENT;

const headers = { "xi-api-key": NEW_KEY, "Content-Type": "application/json" };

async function main() {
  // 1) reuse the prompt text + tool ids from the current (broken-clone) agent,
  //    so the new agent has the SAME brain & tools but freshly-created defaults.
  let promptText = "";
  let toolIds = [];
  if (PROMPT_SRC_AGENT) {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${PROMPT_SRC_AGENT}`,
      { headers }
    );
    const a = await r.json();
    promptText = a.conversation_config?.agent?.prompt?.prompt || "";
    toolIds = a.conversation_config?.agent?.prompt?.tool_ids || [];
  }
  if (!promptText) throw new Error("prompt empty — need PROMPT_SRC_AGENT");

  // 2) minimal conversation_config: only the essentials, leave the rest to
  //    platform defaults (no turn/asr/vad/language_presets copied from old clone)
  const lang = process.env.ELEVENLABS_LANG || "ur";
  const firstMsg =
    process.env.ELEVENLABS_FIRST_MSG ||
    "Assalam o alaikum! Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?";
  const cc = {
    agent: {
      first_message: firstMsg,
      language: lang,
      prompt: {
        prompt: promptText,
        tool_ids: toolIds,
      },
    },
    tts: {
      model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_v3_conversational",
      voice_id: "cjVigY5qzO86Huf0OWal",
    },
  };

  // 3) create
  const r = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "TTS-TEST-" + (process.env.ELEVENLABS_LANG || "ur") + "-" + (process.env.ELEVENLABS_TTS_MODEL || "eleven_v3_conversational"), conversation_config: cc }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error("create: " + r.status + " " + JSON.stringify(d).slice(0, 300));
  console.log("CREATED agent_id:", d.agent_id);

  // 4) verify
  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${d.agent_id}`, { headers })).json();
  const c = v.conversation_config || {};
  console.log("name:", v.name);
  console.log("language:", c.agent?.language);
  console.log("first_msg:", (c.agent?.first_message || "").slice(0, 80));
  console.log("prompt len:", c.agent?.prompt?.prompt?.length);
  console.log("prompt has PHOTO rule:", (c.agent?.prompt?.prompt || "").includes("PHOTO / SELFIE FEATURE"));
  console.log("tool_ids:", c.agent?.prompt?.tool_ids);
  console.log("tts:", c.tts?.model_id, "voice:", c.tts?.voice_id);
  console.log("turn (defaulted):", c.turn?.turn_model ?? "platform default");
  console.log("asr (defaulted):", c.asr?.provider ?? "platform default");
  console.log("\nTEST THIS agent_id first — if it speaks, we switch .env to it.");
}

main().catch((e) => { console.error(e); process.exit(1); });