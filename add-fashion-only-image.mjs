const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const h = { "xi-api-key": key, "Content-Type": "application/json" };

(async () => {
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h });
  const a = await ar.json();
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";
  console.log("prompt length before:", prompt.length);

  const tail = "- If generate_image reports failure, be honest (\"Image service abhi kaam nahi kar payi, thodi der baad dobara try karein\") and offer a text description instead. Never claim an image exists that was not generated.";
  const addon = tail + "\n- generate_image is ONLY for clothing, fashion, outfit and accessory design IMAGES related to this store (e.g. a kurta/suit/lehenga sketch, an outfit color combination, a design print idea). NEVER use it for unrelated images (room interiors, landscapes, cars, animals, people portraits, food, world places). If the user asks to generate an unrelated image, politely decline in the user's language and offer to create a clothing/outfit design instead.";

  if (prompt.includes("ONLY for clothing, fashion, outfit and accessory")) {
    console.log("fashion-only image rule already present — nothing to do.");
    process.exit(0);
  }

  if (prompt.includes(tail)) {
    prompt = prompt.replace(tail, addon);
    console.log("fashion-only image bullet ADDED.");
  } else {
    console.error("tail not found — prompt may have changed, aborting without changes.");
    process.exit(1);
  }

  const toolIds = p.tool_ids || [];

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

  const v = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h })).json();
  const vp = v.conversation_config.agent.prompt;
  console.log("VERIFY: prompt len:", vp.prompt.length, "| fashion-only:", vp.prompt.includes("ONLY for clothing, fashion, outfit and accessory"));
  console.log("VERIFY: off-topic rule:", vp.prompt.includes("OFF-TOPIC / OUT-OF-SCOPE RULE"));
  console.log("VERIFY: tool_ids:", vp.tool_ids.length, vp.tool_ids);
  console.log("VERIFY: first_message set:", !!v.conversation_config.agent.first_message);
})().catch((e) => { console.error(e); process.exit(1); });