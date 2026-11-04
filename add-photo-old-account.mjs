const oldKey = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
const OLD_AGENT = "agent_0601m29bhxdsf4e8jf9fjm6s4xr8";
const h = { "xi-api-key": oldKey, "Content-Type": "application/json" };

const clientTool = {
  type: "client",
  name: "attach_photo",
  description:
    "Open the user's file/folder picker so they can select a selfie or photo of themselves. The tool returns { image_name, image_width, image_height, skin_tone_guess } where skin_tone_guess is LIGHT, MEDIUM, MEDIUM_DARK, or DARK (computed client-side). Call this when the user agrees to send a selfie or photo for personalized recommendations.",
  response_timeout_secs: 60,
  disable_interruptions: false,
  interruption_mode: "allow",
  force_pre_tool_speech: false,
  pre_tool_speech: "auto",
  assignments: [],
  tool_call_sound: null,
  tool_call_sound_behavior: "auto",
  tool_error_handling_mode: "auto",
  parameters: { description: "", dynamic_variable: "", is_omitted: false, type: "object", required: [], properties: {} },
  expects_response: true,
  dynamic_variable_placeholders: {},
  execution_mode: "immediate",
};

(async () => {
  // 0) reuse existing attach_photo tool if it already exists (prevents duplicates)
  const lst = await (await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: h })).json();
  let photoToolId = (lst.tools || []).find((x) => x.name === "attach_photo")?.id;
  if (!photoToolId) {
    // 1) create attach_photo tool on OLD account
    const tr = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ name: "attach_photo", description: clientTool.description, tool_config: clientTool }),
    });
    const td = await tr.json();
    if (!tr.ok) throw new Error("tool create: " + tr.status + " " + JSON.stringify(td).slice(0, 300));
    photoToolId = td.id || td.tool_id;
  }
  console.log("attach_photo tool (old account):", photoToolId);

  // 2) read old agent, append photo rule, keep tool ids + add new one
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, { headers: h });
  const a = await ar.json();
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";
  const rule = `
PHOTO / SELFIE FEATURE (follow these strictly):
- The user may ask to send a selfie/photo so you can match products to their face/body/skin tone, e.g. "main apni pic bhajta hoon", "kya tum meri photo dekh sakte ho", "selfie bhejoon?".
- When the user agrees to send a photo OR asks you to open their folder/picture, call the **attach_photo** client tool. It will open a file picker for the user. The tool result contains { image_name, image_width, image_height, skin_tone_guess } where skin_tone_guess is LIGHT, MEDIUM, MEDIUM_DARK, or DARK.
- Acknowledge the photo in the user's language, e.g. "Maine aapki picture dekh li hai — aapki skin tone <tone> lag rahi hai."
- Then immediately call list_products with filters you think will suit that skin tone. For example: bright/cool colors (white, mint, light blue, lavender) for LIGHT; warm/earthy tones (mustard, terracotta, teal, rust) for MEDIUM/MEDIUM_DARK; bold/jewel tones (maroon, emerald, gold, royal blue) for DARK. Limit=8, open_detail=false.
- After list_products returns, say in the user's language: "Aapki skin tone ke hisaab se ye products suit karenge" and describe the top 2-3 picks (name + price only from the result).
- If the user asks to see themselves WEARING a product (virtual try-on / "kapda laga ke dikhao", "mere jism pe kaisa lagega", "image generate karo"), reply honestly in their language: "Abhi main sirf product suggest kar sakta hoon — asli photo par kapda dikhane ke liye mujhe ek image generation API chahiye jo is store mein abhi integrate nahi hai. Aap product choose karein, main aapke liye sahi color aur size suggest karunga." NEVER fabricate, pretend, or describe a non-existent generated image.
- NEVER attach or send any image yourself. You can only react to the user's attached photo and to the product images shown automatically by list_products.
- After showing product list, if the conversation continues and the user seems undecided, offer: "Agar aap chahein, apni selfie bhejein — main aapki skin tone ke hisaab se sahi colors suggest karunga."`;
  if (prompt.includes("PHOTO / SELFIE FEATURE")) prompt = prompt.replace(/PHOTO \/ SELFIE FEATURE[\s\S]*?\n- After showing product list[^\n]*\n$/m, rule.trim() + "\n");
  else prompt = prompt.replace(/\n?$/,"\n\n" + rule.trim() + "\n");

  const toolIds = p.tool_ids || [];
  if (!toolIds.includes(photoToolId)) toolIds.push(photoToolId);

  console.log("appending photo rule... new prompt length:", prompt.length);
  console.log("tool_ids:", toolIds);

  // 3) PATCH agent (only prompt + tool_ids; no tools array -> avoids 400)
  const pr = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: { prompt: prompt, tool_ids: toolIds, tools: [] },
        },
      },
    }),
  });
  console.log("PATCH status:", pr.status);
  const pd = await pr.text();
  if (!pr.ok) throw new Error("PATCH: " + pr.status + " " + pd.slice(0, 400));

  // 4) verify
  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${OLD_AGENT}`, { headers: h })).json();
  const vp = v.conversation_config.agent.prompt;
  console.log("VERIFY: prompt len:", vp.prompt.length, "| photo rule:", vp.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("VERIFY: tools array:", Array.isArray(vp.tools) ? vp.tools.length : vp.tools, "| tool_ids:", vp.tool_ids);
})().catch((e) => { console.error(e); process.exit(1); });