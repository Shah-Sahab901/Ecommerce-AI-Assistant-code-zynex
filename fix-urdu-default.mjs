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
- The conversation starts in URDU, so continue every reply in Urdu by default, unless the user speaks or requests another language. Do not switch to English on your own.
- You must NEVER say "sorry, I can only speak English and Urdu". You can speak all five languages fluently. Never say you cannot speak Pashto, Sindhi, Punjabi, or Urdu.
- IMPORTANT: Do NOT call, use, or rely on any language-switching tool. Language switching happens directly in your reply text. Simply write your response in the language the user wants.
- If you do not fully understand a word, ask a short clarification question in the language the user is using.`;

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.language = "ur";
  cc.agent.prompt = cc.agent.prompt || {};
  cc.agent.prompt.prompt = PROMPT_TEXT;

  let p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  let status = p.status;
  let bodyText = await p.text();
  console.log("PATCH(ur):", status);
  if (!p.ok) {
    console.log("response:", bodyText.slice(0, 500));
    console.log("Retrying with agent.language=en ...");
    cc.agent.language = "en";
    p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ conversation_config: cc }),
    });
    console.log("PATCH(en):", p.status);
  }

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  console.log("final agent.language:", JSON.stringify(v.conversation_config.agent.language));
  console.log("prompt starts-in-urdu line:", /continues? in URDU by default/.test(pv.prompt || ""));
  console.log("prompt len:", (pv.prompt || "").length);
  console.log("tools:", JSON.stringify((pv.tools || []).map((t) => t && t.name)));
  console.log("lang_detect:", JSON.stringify(pv.built_in_tools && pv.built_in_tools.language_detection));
  console.log("TTS:", v.conversation_config.tts && v.conversation_config.tts.model_id);
}

main();