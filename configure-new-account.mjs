const OLD_KEY =
  process.env.ELEVENLABS_NEW_API_KEY ||
  "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
const NEW_KEY = process.env.ELEVENLABS_CONFIGURE_API_KEY;           // set via env
const NEW_AGENT_ID = process.env.ELEVENLABS_CONFIGURE_AGENT_ID;     // set via env

if (!NEW_KEY) throw new Error("Set ELEVENLABS_CONFIGURE_API_KEY env var first");
if (!NEW_AGENT_ID) throw new Error("Set ELEVENLABS_CONFIGURE_AGENT_ID env var first");

const OLD_HEADERS = { "xi-api-key": OLD_KEY };
const NEW_HEADERS = { "xi-api-key": NEW_KEY, "Content-Type": "application/json" };

const PHOTO_ADDITION = `

PHOTO / SELFIE FEATURE (follow these strictly):
- The user may ask to send a selfie/photo so you can match products to their face/body/skin tone, e.g. "main apni pic bhajta hoon", "kya tum meri photo dekh sakte ho", "selfie bhejoon?".
- When the user agrees to send a photo OR asks you to open their folder/picture, call the **attach_photo** client tool. It will open a file picker for the user. The tool result contains { image_name, image_width, image_height, skin_tone_guess } where skin_tone_guess is LIGHT, MEDIUM, MEDIUM_DARK, or DARK.
- Acknowledge the photo in the user's language, e.g. "Maine aapki picture dekh li hai — aapki skin tone <tone> lag rahi hai."
- Then immediately call list_products with filters you think will suit that skin tone. For example: bright/cool colors (white, mint, light blue, lavender) for LIGHT; warm/earthy tones (mustard, terracotta, teal, rust) for MEDIUM/MEDIUM_DARK; bold/jewel tones (maroon, emerald, gold, royal blue) for DARK. Limit=8, open_detail=false.
- After list_products returns, say in the user's language: "Aapki skin tone ke hisaab se ye products suit karenge" and describe the top 2-3 picks (name + price only from the result).
- If the user asks to see themselves WEARING a product (virtual try-on / "kapda laga ke dikhao", "mere jism pe kaisa lagega", "image generate karo"), reply honestly in their language: "Abhi main sirf product suggest kar sakta hoon — asli photo par kapda dikhane ke liye mujhe ek image generation API chahiye jo is store mein abhi integrate nahi hai. Aap product choose karein, main aapke liye sahi color aur size suggest karunga." NEVER fabricate, pretend, or describe a non-existent generated image.
- NEVER attach or send any image yourself. You can only react to the user's attached photo and to the product images shown automatically by list_products.
- After showing product list, if the conversation continues and the user seems undecided, offer: "Agar aap chahein, apni selfie bhejein — main aapki skin tone ke hisaab se sahi colors suggest karunga."
`;

async function createTool(toolDef, label) {
  const r = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
    method: "POST",
    headers: NEW_HEADERS,
    body: JSON.stringify(toolDef),
  });
  const t = await r.json();
  if (!r.ok) throw new Error(`Create tool ${label}: ${r.status} ${JSON.stringify(t).slice(0, 200)}`);
  console.log(`  created ${label}: ${t.id}`);
  return t.id;
}

async function main() {
  console.log("=== Step 1: Fetch old agent config ===");
  const oldAgentR = await fetch("https://api.elevenlabs.io/v1/convai/agents/agent_0601m29bhxdsf4e8jf9fjm6s4xr8", { headers: OLD_HEADERS });
  if (!oldAgentR.ok) throw new Error("GET old agent: " + oldAgentR.status);
  const oldAgent = await oldAgentR.json();
  const oldCC = oldAgent.conversation_config;
  console.log("  old prompt len:", (oldCC.agent.prompt.prompt || "").length);

  console.log("\n=== Step 2: Fetch old tool configs ===");
  const oldToolIds = oldCC.agent.prompt.tool_ids || [];
  const oldTools = [];
  for (const id of oldToolIds) {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${id}`, { headers: OLD_HEADERS });
    if (!r.ok) { console.log("  skip", id, r.status); continue; }
    const t = await r.json();
    oldTools.push(t);
    console.log("  fetched tool:", t.tool_config.name, t.id);
  }

  console.log("\n=== Step 3: Create tools on new account ===");
  const newToolIds = [];
  for (const t of oldTools) {
    const tc = JSON.parse(JSON.stringify(t.tool_config));
    tc.expects_response = true;
    const newId = await createTool({ tool_config: tc }, t.tool_config.name);
    newToolIds.push(newId);
  }

  // create attach_photo tool
  const attachPhotoConfig = {
    type: "client",
    name: "attach_photo",
    description: "Open the user's file/folder picker so they can select a selfie or photo of themselves. The tool returns { image_name, image_width, image_height, skin_tone_guess } where skin_tone_guess is LIGHT, MEDIUM, MEDIUM_DARK, or DARK (computed client-side). Call this when the user agrees to send a selfie or photo for personalized recommendations.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    expects_response: true,
    response_timeout_secs: 60,
    disable_interruptions: false,
    interruption_mode: "allow",
    execution_mode: "immediate",
  };
  const attachPhotoId = await createTool({ tool_config: attachPhotoConfig }, "attach_photo");
  newToolIds.push(attachPhotoId);

  console.log("\nnew tool_ids:", newToolIds);

  console.log("\n=== Step 4: Build new conversation_config ===");
  const cc = JSON.parse(JSON.stringify(oldCC));
  cc.agent.language = "ur";
  cc.agent.first_message = "Assalam o alaikum! Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?";
  cc.agent.prompt.prompt = (cc.agent.prompt.prompt || "") + PHOTO_ADDITION;
  cc.agent.prompt.tool_ids = newToolIds;
  delete cc.agent.prompt.tools;
  cc.asr.keywords = [];

  console.log("  final prompt len:", cc.agent.prompt.prompt.length);
  console.log("  language:", cc.agent.language);

  console.log("\n=== Step 5: PATCH new agent config ===");
  const patchR = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${NEW_AGENT_ID}`, {
    method: "PATCH",
    headers: NEW_HEADERS,
    body: JSON.stringify({ conversation_config: cc }),
  });
  const patchBody = await patchR.json();
  if (!patchR.ok) throw new Error("PATCH agent: " + patchR.status + " " + JSON.stringify(patchBody).slice(0, 400));
  console.log("  PATCH ok:", patchR.status);

  console.log("\n=== Step 6: Verify ===");
  const vR = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${NEW_AGENT_ID}`, { headers: NEW_HEADERS });
  const v = await vR.json();
  const vac = v.conversation_config;
  console.log("agent name:", v.name);
  console.log("language:", vac.agent.language);
  console.log("first_message:", vac.agent.first_message);
  console.log("prompt len:", vac.agent.prompt.prompt.length);
  console.log("prompt has PHOTO rule:", vac.agent.prompt.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("prompt has TRUTH rule:", vac.agent.prompt.prompt.includes("TOOL RESULT TRUTH RULE"));
  console.log("prompt has 5-lang:", vac.agent.prompt.prompt.includes("FIVE languages"));
  console.log("tool_ids:", vac.agent.prompt.tool_ids);
  console.log("tools (prompt.tools):", JSON.stringify((vac.agent.prompt.tools || []).map(t => t && t.name)));
  console.log("tts:", vac.tts.model_id, "voice:", vac.tts.voice_id);
  console.log("asr:", vac.asr.provider, "quality:", vac.asr.quality);
  console.log("conversation.max_duration:", vac.conversation.max_duration_seconds);
  console.log("conversation.client_events:", JSON.stringify(vac.conversation.client_events));
  console.log("conversation.file_input:", JSON.stringify(vac.conversation.file_input));
  console.log("\nDONE ✓ new agent ready at agent_id:", v.agent_id);
}

main().catch(e => { console.error(e); process.exit(1); });
