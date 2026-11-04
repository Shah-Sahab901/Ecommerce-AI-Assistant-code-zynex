const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error("API key missing.");
  process.exit(1);
}

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
You are a shopping assistant, so stay focused on the customer's shopping needs.`;

const FIRST_MESSAGE =
  "Assalam o alaikum! 👋 Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?";

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

  // 1) Remove the duplicate language_detection from the tools ARRAY
  if (Array.isArray(cc.agent.prompt.tools)) {
    cc.agent.prompt.tools = cc.agent.prompt.tools.filter(
      (t) => !t || t.name !== "language_detection"
    );
  }

  // 2) Keep language_detection ONLY in built_in_tools (clean map entry)
  cc.agent.prompt.built_in_tools = cc.agent.prompt.built_in_tools || {};
  cc.agent.prompt.built_in_tools.language_detection = {
    type: "system",
    name: "language_detection",
    description:
      "Switch the reply language to the language the user is speaking. Call it whenever the user speaks Urdu, Pashto, Punjabi, Sindhi, or English.",
    params: { system_tool_type: "language_detection", only_at_conversation_start: true },
  };

  // 3) Restore system prompt + Urdu first message
  cc.agent.prompt.prompt = PROMPT_TEXT;
  cc.agent.first_message = FIRST_MESSAGE;

  const patch = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
    { method: "PATCH", headers, body: JSON.stringify({ conversation_config: cc }) }
  );
  console.log("PATCH status:", patch.status);
  const text = await patch.text();
  if (patch.ok) {
    console.log("Fixed:");
    console.log(" - tools array cleaned");
    console.log(" - language_detection kept in built_in_tools with a description");
    console.log(" - system prompt restored");
    console.log(" - first message restored (Urdu)");
  } else {
    console.error(text.slice(0, 800));
  }
}

main();