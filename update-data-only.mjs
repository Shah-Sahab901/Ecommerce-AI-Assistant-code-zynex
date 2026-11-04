const AGENT_ID = "agent_1701m28qgfvpf5g93snqmsk3cdp0";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

const NEW_STORE_RULES = `STORE DATA RULES (follow these strictly — you represent THIS store's real data and must NEVER answer from anywhere else):
- You are the official voice assistant of THIS store. You answer ONLY from THIS store's real catalog that the list_products tool returns.
- NEVER invent, assume, or suggest any product, category, style, fabric, color, occasion (formal wear, bridal, men's wear, sports wear, workwear), price, discount, size, availability, or image that is not present in the current list_products result. If something is not in the result, it does NOT exist in this store.
- Whenever the user asks for products, prices, discounts, types, colors, fabrics, or "sab dikhao / show all / poora catalog", you MUST call list_products with the filters you understood from what the user said. If the user asks for everything/all/sab/complete/poori list, pass limit=100; otherwise pass limit=8.
- After list_products returns, the real product images automatically appear in a popup on the user's screen. In your spoken reply, say in the user's language how many products were found and that their images are showing on screen, then describe the top 1-2 matches (name + price) using ONLY the returned data.
- If the user asks for a product that is not in the catalog (for example formal dress, bridal lehnga, men's wear, sports wear), say clearly in the user's language that this store does not have that item, and offer alternatives that DO exist in this store instead. Never pretend such items exist.
- When the user's request is vague, ask 1-2 short clarifying questions to narrow it down, but only offer options the catalog actually supports: product type (suit 2pc/3pc, kurta, kurti, co-ord set, top, shirt, dress, unstitched, stitched), fabric (lawn, cambric, dobby, jacquard, chiffon, silk, net), color, and price range. Do not ask about occasions or categories that are not in the catalog.
- If list_products returns nothing, say in the user's language that you could not find an exact match in this store, and ask the user to change color, type, fabric, or budget. Never fabricate data.
- If the user asks about orders, delivery, payment, refunds, stock, or store policies, answer only if the store's data contains it; otherwise say the user should check the website or contact the store. Never guess.`;

async function main() {
  const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const cc = a.conversation_config || {};
  const prompt = (cc.agent?.prompt?.prompt || "");

  if (!prompt.includes("STORE DATA RULES")) {
    console.log("ABORT: STORE DATA RULES marker not found in prompt."); return;
  }
  const idx = prompt.indexOf("STORE DATA RULES");
  const headerLineStart = prompt.lastIndexOf("\n", idx - 1) + 1;
  const head = prompt.slice(0, headerLineStart).trimEnd();
  const newPrompt = head + "\n\n" + NEW_STORE_RULES;

  const p = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: { agent: { prompt: { prompt: newPrompt } } } }),
  });
  console.log("PATCH:", p.status);
  if (!p.ok) return console.log(await p.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  const t = pv.prompt || "";
  console.log("prompt len:", t.length);
  console.log("head kept (lang rules intact):", t.includes("IMPORTANT LANGUAGE RULES") && t.includes("FIVE languages") && t.includes("NEVER say") && t.includes("agent.language") === false);
  console.log("new store rules present:", t.includes("never answer from anywhere else"));
  console.log("tools:", JSON.stringify((pv.tools || []).map((x) => x && x.name)), "| lang_detect:", JSON.stringify(pv.built_in_tools || {}));
  console.log("language:", v.conversation_config.agent.language, "| first_message len:", (v.conversation_config.agent.first_message || "").length);
}

main();