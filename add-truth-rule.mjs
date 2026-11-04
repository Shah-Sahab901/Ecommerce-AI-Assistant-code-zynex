const AGENT_ID = (process.env.ELEVENLABS_AGENT_ID || "agent_0601m29bhxdsf4e8jf9fjm6s4xr8").trim();
const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" };

const RULE = `
TOOL RESULT TRUTH RULE (STRICT - SAB SE UPAR):
1. JAB BHI <list_products> tool call ho jaye, us tool ka RESULT STRING sab se pehle turn ki context mein agent ko milta hai — woh pehle exact COUNT batata hai (jaise "3 products found." ya "1 products found."), phir har product ka NAAM aur PICE. Tumhe SIRF usi result string se bat karni hai.
2. Apne dumag se COUNT, PRICES, COLORS, FABRICS ya product names KABHI MAT GADDHO. Agar result mein nahi hai, to bolo nahi. Agar result "1 products found" kehta hai to tum SIRF 1 product ki bat karo — 8 ya koi aur number KABHI mat bolo, chahe limit 8 hi kyun na di gayi ho. Limit = zyada se zyada candidates, count = sirf jo result mein aa gaye.
3. Popup puri asli list dikhata hai (jo result mein aayi). Tumhara jawab popup ke SAATH match hona chahiye. Agar popup 1 product dikha raha hai aur result "1 products found" kehta hai, to tum bolo "mujhe sirf 1 kurta mila: [naam], Rs [price]". Agar 0 products ho to bolo koi match nahi mila aur kisi aur filter (rang/fabric/budget) se poocho.
4. Jab tum result ki 3-4 top products ke naam/prices batao, to wahi spell kar jaise result mein likha hai — qwen/tarjuma mat karo.
5. <add_to_cart> ke result mein bhi jo product/qty likha ho wahi confirm karo; apne dimag se extra items ka zikr mat karo.`;

async function main() {
  const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const cc = a.conversation_config || {};
  const prompt = cc.agent?.prompt || {};
  const cur = typeof prompt.prompt === "string" ? prompt.prompt : "";
  const MARKER = "TOOL RESULT TRUTH RULE (STRICT";
  if (cur.includes(MARKER)) { console.log("rule already present, len =", cur.length); return; }
  const next = cur + RULE;
  prompt.prompt = next;
  delete prompt.tools;
  cc.agent.prompt = prompt;
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversation_config: cc }),
  });
  if (!r.ok) throw new Error("PATCH " + r.status + " " + (await r.text()).slice(0, 400));
  const check = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, { headers })).json();
  const p2 = check.conversation_config?.agent?.prompt?.prompt || "";
  console.log("prompt length:", cur.length, "->", p2.length);
  console.log("rule appended:", p2.includes(MARKER));
}

main().catch((e) => { console.error(e); process.exit(1); });