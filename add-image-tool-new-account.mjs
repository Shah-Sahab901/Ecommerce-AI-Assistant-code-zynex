const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const h = { "xi-api-key": key, "Content-Type": "application/json" };

const clientTool = {
  type: "client",
  name: "generate_image",
  description:
    "Generate a brand-new AI image (photo/sketch/design) with Gemini. Call this whenever the user asks to CREATE/DRAW/BANAO/SKETCH an image, e.g. \"kamre ka design banao\", \"meri outfit ki tasveer banao\", \"ek kameez ka sketch dikhao\", \"image generate karo\". Provide a rich, specific English prompt. The generated image appears automatically in the app popup; this tool only returns a text confirmation.",
  response_timeout_secs: 90,
  disable_interruptions: false,
  interruption_mode: "allow",
  force_pre_tool_speech: false,
  pre_tool_speech: "auto",
  assignments: [],
  tool_call_sound: null,
  tool_call_sound_behavior: "auto",
  tool_error_handling_mode: "auto",
  parameters: {
    description: "",
    dynamic_variable: "",
    is_omitted: false,
    type: "object",
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        description:
          "The detailed prompt describing what image to draw (subject, colors, style, background).",
      },
      aspect: {
        type: "string",
        description: "Aspect ratio. Allowed: 1:1, 16:9, 9:16, 4:3, 3:4. Default 1:1.",
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
      },
    },
  },
  expects_response: true,
  dynamic_variable_placeholders: {},
  execution_mode: "immediate",
};

(async () => {
  // 0) reuse existing generate_image tool if it already exists (prevents duplicates)
  const lst = await (await fetch("https://api.elevenlabs.io/v1/convai/tools", { headers: h })).json();
  let imgToolId = (lst.tools || []).find((x) => x.name === "generate_image")?.id;
  if (!imgToolId) {
    const tr = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ name: "generate_image", description: clientTool.description, tool_config: clientTool }),
    });
    const td = await tr.json();
    if (!tr.ok) throw new Error("tool create: " + tr.status + " " + JSON.stringify(td).slice(0, 300));
    imgToolId = td.id || td.tool_id;
  }
  console.log("generate_image tool (new account):", imgToolId);

  // 1) read agent, update prompt (replace ONE stale line, append new rule — nothing removed)
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h });
  const a = await ar.json();
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";

  const staleStart = "- If the user asks to see themselves WEARING a product";
  const staleEnd = "NEVER fabricate, pretend, or describe a non-existent generated image.";
  const si = prompt.indexOf(staleStart);
  const ei = prompt.indexOf(staleEnd);
  if (si !== -1 && ei !== -1) {
    const end = ei + staleEnd.length;
    const replacement =
      '- If the user asks for virtual try-on or "kapda laga ke dikhao" / "mere jism pe kaisa lagega" / "image generate karo", call the **generate_image** client tool with a detailed English prompt (include the user\'s skin_tone_guess if known). The tool REALLY creates the image with Gemini and the app shows it in the popup automatically. Acknowledge with: "Maine aapke liye tasveer bana di hai — popup me dekhen." Then offer list_products so they can buy the real product. If the tool reports failure, say honestly: "Image service abhi kaam nahi kar payi, thodi der baad dobara try karein?" -- never claim an image was generated when it was not.';
    prompt = prompt.slice(0, si) + replacement + prompt.slice(end);
    console.log("stale try-on line REPLACED (updated in place, nothing else touched).");
  } else {
    console.log("WARN: stale try-on line not found — leaving prompt untouched.");
  }

  const rule = `
AI IMAGE GENERATION RULE (follow these strictly):
- When the user asks you to GENERATE / CREATE / DRAW / BANAO / SKETCH / TASVEER BANAO an image (e.g. "kamre ka design banao", "meri outfit ki tasveer banao", "ek kameez ka sketch dikhao", "image generate karo"), you MUST call the **generate_image** client tool and NOT just describe the image in words.
- Give a rich, specific English prompt (subject, colors, style, fabric, background). Optionally pass aspect: "16:9" | "9:16" | "4:3" | "3:4".
- The tool returns a text confirmation; the generated image appears automatically in the app popup.
- After success, acknowledge in the user's language and briefly describe what you created. Optionally call list_products afterwards to help them buy the real item.
- If generate_image reports failure, be honest ("Image service abhi kaam nahi kar payi, thodi der baad dobara try karein") and offer a text description instead. Never claim an image exists that was not generated.`;
  if (!prompt.includes("AI IMAGE GENERATION RULE")) prompt = prompt.replace(/\n?$/, "\n\n" + rule.trim() + "\n");
  else console.log("AI IMAGE GENERATION RULE already present.");

  const toolIds = p.tool_ids || [];
  if (!toolIds.includes(imgToolId)) toolIds.push(imgToolId);

  console.log("new prompt length:", prompt.length);
  console.log("tool_ids:", toolIds);

  // 2) PATCH agent (only prompt + tool_ids; keep everything else)
  const pr = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, {
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

  // 3) verify
  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h })).json();
  const vp = v.conversation_config.agent.prompt;
  console.log("VERIFY: prompt len:", vp.prompt.length, "| has img rule:", vp.prompt.includes("AI IMAGE GENERATION RULE"), "| tool attached:", (vp.tool_ids || []).includes(imgToolId));
  console.log("VERIFY: tool_ids:", vp.tool_ids);
  console.log("VERIFY: first_message set:", !!v.conversation_config.agent.first_message);
})().catch((e) => { console.error(e); process.exit(1); });