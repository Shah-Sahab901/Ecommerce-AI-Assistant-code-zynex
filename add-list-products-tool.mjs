const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8";
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
- If you do not fully understand a word, ask a short clarification question in the language the user is using.

STORE DATA RULES (follow these strictly):
- You are the official voice assistant of THIS store, and you answer ONLY from THIS store's real catalog.
- Whenever the user asks for any product, price, discount, color, fabric, category, or "sab dikhao / show all", you MUST call the list_products client tool with the filters you understood from what the user said (query, category, color, material, min_price, max_price, limit). If the user asks for everything/all/complete/sab/poori list, pass limit=100; otherwise pass limit=8.
- Only talk about products that list_products actually returns. NEVER invent products, prices, discounts, availability, sizes, colors, or image links that are not in the tool result.
- After list_products returns, the real product images automatically appear in a popup on the user's screen. In your spoken reply, briefly say in the user's language how many products you found (for example: "Mujhe 5 products mile hain") and that their images are showing on the screen ("Images/screens aapki screen pe aa rahi hain"), then describe the top 1-2 matches (name + price) using ONLY the returned data.
- If list_products returns nothing, say you could not find an exact match in this language (in the user's language) and offer to search differently. Never fabricate data.`;

async function main() {
  const g = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers });
  const a = await g.json();
  const cc = a.conversation_config || {};
  cc.agent = cc.agent || {};
  cc.agent.prompt = cc.agent.prompt || {};

  cc.agent.prompt.tools = (cc.agent.prompt.tools || []).filter((t) => t && t.name !== "list_products");

  const clientTool = {
    type: "client",
    name: "list_products",
    description:
      "Search THIS store's real product catalog and return real products (name, price, oldPrice, image). The returned products' real images appear in a popup on the user's screen automatically. Call this for ANY product request in any language, e.g. 'kala 3pc suit', 'lawn kurta', 'co ord set under 5000', 'sab dikhao'. Pass the filters you understood from the user; when the user asks for everything/all/sab/complete, set limit=100, otherwise limit=8.",
    params: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Free-text of what the user asked, exactly as they said it, including any Roman Urdu words (e.g. 'kala 3pc suit', 'lawn kurta', 'co ord set'). Pass min_price/max_price separately whenever you can.",
        },
        category: {
          type: "string",
          description: "Clothing category if clearly mentioned: shirt, top, blouse, kurta, kurti, suit, dress, co-ord set, 2pc, 3pc, unstitched, stitched. Empty string if unknown.",
        },
        color: { type: "string", description: "Color if mentioned (black, white, blue, red, pink, green, yellow, brown, purple, maroon, beige, teal, multicolor...). Empty string if unknown." },
        material: { type: "string", description: "Fabric if mentioned (lawn, cambric, silk, cotton, chiffon, net, dobby, jacquard). Empty string if unknown." },
        min_price: { type: "integer", description: "Minimum price (PKR) if the user wants products above a price, e.g. '8000 se zayada'. Omit if unknown." },
        max_price: { type: "integer", description: "Maximum price (PKR) if the user wants products under a budget, e.g. '5000 ke ander', 'under 3000'. Omit if unknown." },
        limit: { type: "integer", description: "Number of products to return. 8 normally; 100 when the user asks for all/complete/sab/poori list.", minimum: 1, maximum: 100 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  };
  cc.agent.prompt.tools.push(clientTool);

  cc.agent.prompt.prompt = PROMPT_TEXT;

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  console.log("PATCH:", p.status);
  if (!p.ok) return console.log(await p.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  console.log("tools:", JSON.stringify((pv.tools || []).map((t) => t && t.name)));
  const lp = (pv.tools || []).find((t) => t && t.name === "list_products");
  console.log("list_products type:", lp && lp.type);
  const promptTxt = pv.prompt || "";
  console.log("prompt has STORE DATA RULES:", promptTxt.includes("STORE DATA RULES"));
  console.log("prompt len:", promptTxt.length, "| lang rules intact:", promptTxt.includes("FIVE languages"), "| never-sorry:", promptTxt.includes("NEVER say"));
  console.log("language:", v.conversation_config.agent.language, "| TTS:", v.conversation_config.tts && v.conversation_config.tts.model_id);
}

main();