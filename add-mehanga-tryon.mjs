const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const h = { "xi-api-key": key, "Content-Type": "application/json" };

const rule = `
AUTO MEHANGA TRY-ON (popup list ke andar se sabse mehanga product — follow strictly):
- Jab list_products ne popup ke andar product list de di ho AUR user apni photo attach kar ke try-on kahe ("jo popup me ha wo sabse mehanga pakad, mere upar pehna ke dikhao", "suite pehna kar dekhao", "meri image us par lagao", "aap hi batao kaunsa mehanga hai aur us par meri image lagao"):
  1. HAMESHA sabse pehle acknowledge karo: "Maine aapki image dekh li hai — ab main popup ki sabse mehanga product par aapki image laga ke dikhata hoon."
  2. Call the **generate_image** tool (koi bhi chhota sa prompt pass karo, jaise "try on", "dress the user"). The tool AUTOMATICALLY picks the most expensive product from the current popup list and uses the user's attached photo. Aap ko product ka naam/price wali detailing karne ki zaroorat nahi — tool khud kar leta hai.
  3. Jab generate_image success bole, tool ke confirmation me product ka naam aur Rs price aa chuka hoga — wahi use karke user ke language mein bolo: "Ye sabse mehanga product <name> hai (Rs <price>) — maine is par aapki image laga di hai, popup mein dekhen. Aap par bahut achha lag raha hai! Chahiye to main is ka order/add-to-cart karwa sakta hoon." Then offer add_to_cart.
  4. Agar generate_image fail ho, honest bano ("Image service abhi kaam nahi kar payi, dobara try karein") — fake try-on image ka kabhi zikr mat karo.`;

(async () => {
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h });
  const a = await ar.json();
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";
  console.log("prompt length before:", prompt.length);

  if (prompt.includes("AUTO MEHANGA TRY-ON")) {
    console.log("already present — nothing to do.");
    process.exit(0);
  }
  prompt = prompt.replace(/\n?$/, "\n\n" + rule.trim() + "\n");

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
  console.log("VERIFY: prompt len:", vp.prompt.length, "| mehanga rule:", vp.prompt.includes("AUTO MEHANGA TRY-ON"));
  console.log("VERIFY: try-on rule:", vp.prompt.includes("VIRTUAL TRY-ON RULE"), "| off-topic:", vp.prompt.includes("OFF-TOPIC / OUT-OF-SCOPE RULE"));
  console.log("VERIFY: tool_ids:", vp.tool_ids);
  console.log("VERIFY: first_message set:", !!v.conversation_config.agent.first_message);
})().catch((e) => { console.error(e); process.exit(1); });