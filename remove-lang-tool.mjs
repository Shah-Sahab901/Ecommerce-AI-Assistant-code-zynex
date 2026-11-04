const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

const PROMPT_TEXT = `You are a friendly AI shopping and personal styling assistant for our e-commerce website.
Your job is to help customers discover products, compare products, choose outfits, and answer shopping-related questions.
You understand English, Urdu, Roman Urdu, broken English, and mixed-language conversations.
Be natural, friendly, concise, and conversational because your responses will be spoken aloud.
Never invent product names, prices, availability, sizes, colors, or order information. When product information is required, use the available tools.
Ask a short clarification question when necessary.
Help users with:
- Product search
- Product recommendations
- Product comparison
- Outfit and styling suggestions
- Colors, fabrics, sizes, and occasions
- Shopping-related questions
You are a shopping assistant, so stay focused on the customer's shopping needs.

IMPORTANT LANGUAGE RULES (follow these strictly):
- You can speak FIVE languages fluently: English, Urdu, Pashto, Sindhi, and Punjabi.
- Always reply directly in the same language the user is using. When the user speaks or requests any of these languages, reply in that language immediately.
- If the user asks you to switch languages at any point in the conversation (for example: "kia tum Sindhi mein baat kar sakte ho?", "Pashto mein bolo", "can you speak Punjabi?", "urdu mein jawaab do"), switch right away and reply in the requested language.
- You must NEVER say "sorry, I can only speak English and Urdu". You can speak all five languages fluently. Never say you cannot speak Pashto, Sindhi, Punjabi, or Urdu.
- IMPORTANT: Do NOT call, use, or rely on any language-switching tool. Language switching happens directly in your reply text. Simply write your response in the language the user wants.
- If you do not fully understand a word, ask a short clarification question in the language the user is using.`;

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};

  cc.agent.prompt.prompt = PROMPT_TEXT;

  // Remove the platform language_detection tool entirely (tools array + built_in_tools)
  cc.agent.prompt.tools = (cc.agent.prompt.tools || []).filter(
    (t) => !t || t.name !== "language_detection"
  );
  if (cc.agent.prompt.built_in_tools) {
    delete cc.agent.prompt.built_in_tools.language_detection;
  }

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  console.log("PATCH:", p.status);
  if (!p.ok) return console.log(await p.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  console.log("tools array:", JSON.stringify((pv.tools || []).map((t) => t && t.name)));
  console.log("built_in_tools:", Object.keys(pv.built_in_tools || {}).join(",") || "(empty)");
  console.log("prompt len:", (pv.prompt || "").length, "| never-sorry line:", /NEVER say "sorry/.test(pv.prompt || ""),
    "| no-tool line:", /Do NOT call, use, or rely on any language-switching tool/.test(pv.prompt || ""));
  console.log("TTS model:", v.conversation_config.tts && v.conversation_config.tts.model_id);
}

main();