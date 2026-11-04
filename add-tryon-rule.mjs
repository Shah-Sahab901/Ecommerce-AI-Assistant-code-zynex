const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const h = { "xi-api-key": key, "Content-Type": "application/json" };

const rule = `
VIRTUAL TRY-ON RULE (user ki photo ke sath — follow strictly):
- Jab user apni photo/selfie attach kare aur try-on kahe ("kapra laga ke dikhao", "mere upar dikha kar batana", "mujhe yeh suit pehnakar dikhao", "meri photo mein design dikhao"), ya photo aane ke baad kisi bhi garment ko unke upar dikhana kahe:
  1. Sabse pehle acknowledge karo: "Maine aapki image dekh li hai — ab main aapke hisaab se batata hoon."
  2. Phir SIRF EK image banwao — call the **generate_image** client tool with a detailed English prompt, e.g. "show this exact person dressed in a <garment name / style / color>, natural photo, keep their face identical and realistic". The tool AUTOMATICALLY sends the user's attached photo to Gemini as a reference.
  3. Jab generate_image success bole, user ke language mein batao: "Maine aap par ye dress dikha di hai — popup mein dekhen. Aap par bahut achha lagega!"
  4. Phir usi garment ka asli product list_products se suggest karo (name + price sachraho) aur keh sakte ho: "Aap yeh suit le sakte hain — mere paas asli rates hain."
  5. Agar generate_image fail ho, honest bano ("Image service abhi kaam nahi kar payi, dobara try karein") — kabhi bhi fake try-on image ka zikr mat karo.
- Sirf 1 image generate karo (user ki "sirf aik image" wali zaroorat) — koi collage ya multiple angles nahi.`;

(async () => {
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h });
  const a = await ar.json();
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";
  console.log("prompt length before:", prompt.length);

  if (prompt.includes("VIRTUAL TRY-ON RULE")) {
    console.log("try-on rule already present — nothing to do.");
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
  console.log("VERIFY: prompt len:", vp.prompt.length, "| try-on rule:", vp.prompt.includes("VIRTUAL TRY-ON RULE"));
  console.log("VERIFY: off-topic:", vp.prompt.includes("OFF-TOPIC / OUT-OF-SCOPE RULE"), "| fashion-only:", vp.prompt.includes("ONLY for clothing, fashion, outfit and accessory"));
  console.log("VERIFY: tool_ids:", vp.tool_ids);
  console.log("VERIFY: first_message set:", !!v.conversation_config.agent.first_message);
})().catch((e) => { console.error(e); process.exit(1); });