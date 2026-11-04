const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const h = { "xi-api-key": key, "Content-Type": "application/json" };
const agentId = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
(async () => {
  const a = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, { headers: h }).then(r => r.json());
  const cc = a.conversation_config || {};
  const beforeFm = cc.agent && cc.agent.prompt && cc.agent.prompt.first_message;
  const beforeKw = cc.asr && cc.asr.keywords;
  console.log("before first_message:", JSON.stringify(beforeFm));
  console.log("before asr.keywords:", beforeKw === undefined ? "(unset)" : JSON.stringify(beforeKw).slice(0, 120));
  const fm = {
    agent: {
      prompt: {
        first_message: "Assalam o alaikum! 👋 Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?",
      },
    },
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "PATCH", headers: h, body: JSON.stringify({ conversation_config: fm }),
  });
  console.log("PATCH first_message:", r.status, r.status === 200 ? "OK" : (await r.text()).slice(0, 300));
  const v = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, { headers: h }).then(r => r.json());
  const p = v.conversation_config && v.conversation_config.agent && v.conversation_config.agent.prompt;
  console.log("verify first_message set:", JSON.stringify(p && p.first_message).slice(0, 90));
  console.log("verify prompt len still:", p && p.prompt && p.prompt.length);
  console.log("verify PHOTO rule still:", p && p.prompt && p.prompt.includes("PHOTO / SELFIE FEATURE"));
  console.log("verify tools still:", JSON.stringify(p && p.tool_ids).slice(0, 200));
})().catch(e => { console.error(e); process.exit(1); });