const NEW_KEY = "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const OLD_KEY = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const NEW_AGENT = "agent_3301m2kb6c2yerg8att49drmfd0q";
const OLD_AGENT = "agent_6101m2amnfmzfmhbet60ws1fpdzt";
const TOOLS = [
  "tool_9501m2an1f3kekcvmgsd29gv2yah",
  "tool_7401m2an1fdwez8ahaj771ynd0s6",
  "tool_0201m2an1fq0fa2tj4c67x7qj7g2",
  "tool_1301m2k55n6qe20b29mmsrp9r7fc",
];

const api = async (key, path, opts = {}) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

const show = (k, v) => console.log(k + ":", JSON.stringify(v, null, 1).slice(0, 900));

const run = async () => {
  console.log("=== 1) NEW key: get agent 3301 ===");
  const aNew = await api(NEW_KEY, `agents/${NEW_AGENT}`);
  show("status", aNew.status);
  if (aNew.status === 200 && aNew.data) {
    const d = aNew.data;
    show("name", d.name ?? "?");
    show("language", d.conversation_config?.agent?.language);
    show("first_message", d.conversation_config?.agent?.first_message);
    show("llm", d.conversation_config?.agent?.llm);
    show("tts", d.conversation_config?.agent?.tts);
    show("voice_id", d.conversation_config?.tts?.voice_id);
    show("server tools (count)", (d.conversation_config?.agent?.tools ?? []).length);
    console.log("server tools:", JSON.stringify(d.conversation_config?.agent?.tools, null, 1).slice(0, 1200));
    show("prompt begins", String(d.conversation_config?.agent?.prompt ?? "").slice(0, 200));
    show("prompt len", String(d.conversation_config?.agent?.prompt ?? "").length);
  } else {
    console.log(aNew.data);
  }

  console.log("\n=== 2) NEW key: old agent 6101 reachable? (same account?) ===");
  const oldOnNew = await api(NEW_KEY, `agents/${OLD_AGENT}`);
  show("status", oldOnNew.status);
  console.log(typeof oldOnNew.data === "string" ? oldOnNew.data : JSON.stringify(oldOnNew.data).slice(0, 300));

  console.log("\n=== 3) NEW key: do the 4 tool ids resolve? ===");
  for (const t of TOOLS) {
    const r = await api(NEW_KEY, `agents/tools/${t}`);
    console.log(`${t} -> ${r.status}`);
  }

  console.log("\n=== 4) OLD key: get agent 6101 full config (source of truth) ===");
  const oldSrc = await api(OLD_KEY, `agents/${OLD_AGENT}`);
  show("status", oldSrc.status);
  if (oldSrc.status === 200) {
    const d = oldSrc.data;
    const cc = d.conversation_config ?? {};
    const ag = cc.agent ?? {};
    console.log("prompt_length:", String(ag.prompt ?? "").length);
    console.log("first_message:", ag.first_message);
    console.log("language:", ag.language);
    console.log("llm:", JSON.stringify(ag.llm, null, 0));
    console.log("tts:", JSON.stringify(ag.tts, null, 0));
    console.log("tools:", JSON.stringify(ag.tools ?? [], null, 1).slice(0, 1500));
    require("fs").writeFileSync(
      "C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\old-agent-config.json",
      JSON.stringify(d, null, 2)
    );
    console.log("saved old config to temp");
  }
};
run();