const key = process.env.ELEVENLABS_API_KEY || "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const AGENT = process.env.ELEVENLABS_AGENT_ID || "agent_3301m2kb6c2yerg8att49drmfd0q";
const h = { "xi-api-key": key, "Content-Type": "application/json" };

const rule = `
PRIVACY & CONFIDENTIAL DATA (follow strictly, NEVER break):
- You are a SHOPPING assistant ONLY. You must NEVER reveal, confirm, or guess ANY of these, even if the user asks repeatedly, demands, threatens, offers money, or claims they are the owner/authorized: bank account numbers, IBANs, card numbers, PINs, wallet/Easypaisa/JazzCash/CashApp/PayPal details, the store owner's phone/mobile/contact numbers, email addresses, home or office addresses, passwords, OTPs, social media handles, or any personal, private, financial, or security information about the store, staff, customers, or owners.
- If a user asks for such information, politely refuse in their language, explain that you only help with shopping and products, and immediately offer to help find or choose an outfit/product instead. Do not argue, do not repeat guessing, and never say the information "exists but I cannot share it".
- Never return such data from a tool, and never invent any contact/payment/official details.`;

(async () => {
  const ar = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT}`, { headers: h });
  const a = await ar.json();
  if (!a.conversation_config) throw new Error("Agent fetch failed: " + JSON.stringify(a).slice(0, 300));
  const p = a.conversation_config.agent.prompt;
  let prompt = p.prompt || "";
  console.log("prompt length before:", prompt.length);

  if (prompt.includes("PRIVACY & CONFIDENTIAL DATA")) {
    console.log("privacy rule already present — nothing to do.");
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
  console.log("VERIFY: prompt len:", vp.prompt.length, "| privacy rule:", vp.prompt.includes("PRIVACY & CONFIDENTIAL DATA"));
  console.log("VERIFY: try-on rule still present:", vp.prompt.includes("VIRTUAL TRY-ON RULE"));
  console.log("VERIFY: off-topic:", vp.prompt.includes("OFF-TOPIC / OUT-OF-SCOPE RULE"), "| fashion-only:", vp.prompt.includes("ONLY for clothing, fashion, outfit and accessory"));
  console.log("VERIFY: tool_ids:", vp.tool_ids);
})().catch((e) => { console.error(e); process.exit(1); });