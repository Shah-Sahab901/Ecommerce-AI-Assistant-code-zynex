const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8";
const API_KEY = process.env.ELEVENLABS_API_KEY || "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
const headers = { "xi-api-key": API_KEY, "Content-Type": "application/json" };

const list_products = {
  type: "client",
  name: "list_products",
  description:
    "Search THIS store's real product catalog and return real products (name, price, oldPrice, image). The returned products' real images appear in a popup on the user's screen automatically. Call this for ANY product request in any language, e.g. 'kala 3pc suit', 'lawn kurta', 'co ord set under 5000', 'sab dikhao'. Pass the filters you understood from the user; when the user asks for everything/all/sab/complete, set limit=100, otherwise limit=8. Set open_detail=true only when the user names ONE specific product they want to open.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Free-text of what the user asked, exactly as they said it, including any Roman Urdu words (e.g. 'kala 3pc suit', 'lawn kurta', 'co ord set'). Pass min_price/max_price separately whenever you can.",
      },
      category: {
        type: "string",
        description:
          "Clothing category if clearly mentioned: shirt, top, blouse, kurta, kurti, suit, dress, co-ord set, 2pc, 3pc, unstitched, stitched. Empty string if unknown.",
      },
      color: {
        type: "string",
        description:
          "Color if mentioned (black, white, blue, red, pink, green, yellow, brown, purple, maroon, beige, teal, multicolor...). Empty string if unknown.",
      },
      material: {
        type: "string",
        description:
          "Fabric if mentioned (lawn, cambric, silk, cotton, chiffon, net, dobby, jacquard). Empty string if unknown.",
      },
      min_price: {
        type: "integer",
        description: "Minimum price (PKR) if the user wants products above a price, e.g. '8000 se zayada'. Omit if unknown.",
      },
      max_price: {
        type: "integer",
        description:
          "Maximum price (PKR) if the user wants products under a budget, e.g. '5000 ke ander', 'under 3000'. Omit if unknown.",
      },
      limit: {
        type: "integer",
        description: "Number of products to return. 8 normally; 100 when the user asks for all/complete/sab/poori list.",
        minimum: 1,
        maximum: 100,
      },
      open_detail: {
        type: "boolean",
        description:
          "Set to true ONLY when the user names one specific product they want to open or see (e.g. 'woh black lawn kurta kholo'). The popup then auto-opens that product's detail page. Default false.",
      },
    },
    required: ["query"],
  },
};

const add_to_cart = {
  type: "client",
  name: "add_to_cart",
  description:
    "Add a product to the customer's shopping bag/cart in the browser (an icon in the popup shows the bag count). Call this whenever the user says 'add to cart', 'add to bag', 'bag mein daalo', 'cart mein daalo', 'iska order karo', or wants to buy that product.",
  parameters: {
    type: "object",
    properties: {
      product_name: {
        type: "string",
        description: "Exact product name as returned by list_products.",
      },
      product_id: {
        type: "string",
        description: "The product's numeric id as returned by list_products, if known.",
      },
      quantity: {
        type: "integer",
        description: "How many to add; 1 if the user does not say a number.",
        minimum: 1,
        maximum: 99,
      },
    },
    required: ["product_name"],
  },
};

const patch = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    conversation_config: {
      agent: {
        prompt: { tools: [list_products, add_to_cart] },
      },
    },
  }),
});
console.log("PATCH:", patch.status);
if (!patch.ok) { console.log(await patch.text()); process.exit(1); }

const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
const pv = v.conversation_config.agent.prompt || {};
for (const x of pv.tools || []) {
  console.log("name:", x.name, "| parameters:", JSON.stringify(x.parameters).slice(0, 120));
  if (x.name === "list_products" && x.parameters && x.parameters.properties) {
    console.log("  open_detail present:", !!x.parameters.properties.open_detail);
    console.log("  props count:", Object.keys(x.parameters.properties).length);
  }
}
const t = pv.prompt || "";
console.log("prompt len:", t.length, "| extra rules:", t.includes("EXTRA SHOPPING BEHAVIOR"), "| store rules:", t.includes("STORE DATA RULES"), "| 5-lang:", t.includes("FIVE languages"));