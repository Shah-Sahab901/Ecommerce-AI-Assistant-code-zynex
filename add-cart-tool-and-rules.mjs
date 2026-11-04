const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8";
const API_KEY = process.env.ELEVENLABS_API_KEY || "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

const EXTRA_RULES = `EXTRA SHOPPING BEHAVIOR (follow these too):
- When list_products returns multiple products, you may suggest the most expensive (premium) one among the returned items as a best/featured pick, and say its name + price. All suggestions must still come only from the returned list.
- If the user asks to see a product picture or says they will look at the picture to decide (for example "picture dikhao", "image dekh kar bataoonga", "pics dekh ke bataunga"), tell them their screen popup is showing the real images and invite them to look and tell you which one they like.
- If the user names ONE specific product they want to open or see, call list_products with that name and set open_detail=true. When it returns one product, its full detail page opens automatically in the same popup — tell the user it opened (e.g. "Aapki product khul gayi hai popup mein").
- If the user says "add to cart", "add to bag", "bag mein daalo", "cart mein daalo", "iska order karo", "yeh le raha hoon", or similar, call the add_to_cart client tool with the exact product name (and product_id if known). After it succeeds, confirm in the user's language, for example: "Add kar diya hai, aapke bag mein ab X items hain."`;

async function main() {
  const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const p = a.conversation_config.agent.prompt || {};
  const tools = (p.tools || []).filter((t) => t && t.name !== "add_to_cart");

  let lp = tools.find((t) => t && t.name === "list_products");
  if (!lp) {
    console.log("ABORT: list_products tool not found"); return;
  }
  lp.params = lp.params || {};
  lp.params.properties = lp.params.properties || {};
  lp.params.properties.open_detail = {
    type: "boolean",
    description:
      "Set to true ONLY when the user names one specific product they want to open or see (e.g. 'woh black lawn kurta kholo'). The popup then auto-opens that product's detail page. Otherwise false.",
  };

  tools.push({
    type: "client",
    name: "add_to_cart",
    description:
      "Add a product to the customer's shopping bag/cart in the browser (an icon in the popup shows the bag). Call this whenever the user says 'add to cart', 'add to bag', 'bag mein daalo', 'cart mein daalo', 'iska order karo', or wants to buy that product.",
    params: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Exact product name as returned by list_products." },
        product_id: { type: "string", description: "The product's numeric id as returned by list_products, if known." },
        quantity: { type: "integer", description: "How many to add; 1 if the user does not say a number.", minimum: 1, maximum: 99 },
      },
      required: ["product_name"],
      additionalProperties: false,
    },
  });

  const promptTxt = (p.prompt || "").trim();
  let newPrompt;
  if (!promptTxt.includes("EXTRA SHOPPING BEHAVIOR")) {
    newPrompt = promptTxt + "\n\n" + EXTRA_RULES;
  } else {
    newPrompt = promptTxt;
  }

  const patch = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: { agent: { prompt: { prompt: newPrompt, tools } } } }),
  });
  console.log("PATCH:", patch.status);
  if (!patch.ok) return console.log(await patch.text());

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const pv = v.conversation_config.agent.prompt || {};
  const t = pv.prompt || "";
  console.log("prompt len:", t.length);
  console.log("tools:", JSON.stringify((pv.tools || []).map((x) => x && x.name)));
  const lpd = (pv.tools || []).find((x) => x && x.name === "list_products");
  console.log("list_products has open_detail:", !!lpd && !!lpd.params.properties.open_detail);
  const atc = (pv.tools || []).find((x) => x && x.name === "add_to_cart");
  console.log("add_to_cart type:", atc && atc.type);
  console.log("extra rules present:", t.includes("EXTRA SHOPPING BEHAVIOR"));
  console.log("store rules intact:", t.includes("STORE DATA RULES"), "| 5-lang:", t.includes("FIVE languages"));
  console.log("language:", v.conversation_config.agent.language, "| tts:", v.conversation_config.tts.model_id);
}

main();