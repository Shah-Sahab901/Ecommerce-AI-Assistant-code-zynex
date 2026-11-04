import fs from "node:fs";
const NEW_KEY = "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const NEW_AGENT = "agent_3301m2kb6c2yerg8att49drmfd0q";

const h = { "xi-api-key": NEW_KEY, "Content-Type": "application/json" };
const fp = (p) => `https://api.elevenlabs.io/v1/${p}`;

const tryP = async (m, path, body) => {
  const res = await fetch(fp(path), {
    method: m,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

(async () => {
  const a = await tryP("GET", `convai/agents/${NEW_AGENT}`);
  console.log("agent status:", a.status);
  if (a.status === 200) {
    const d = a.data;
    fs.writeFileSync(
      "C:\\Users\\DELL\\AppData\\Local\\Temp\\opencode\\new-agent-config.json",
      JSON.stringify(d, null, 2)
    );
    const strip = (o) => JSON.stringify(o, null, 1).slice(0, 1500);
    console.log("KEYS:", Object.keys(d));
    console.log("conversation_config:", strip(d.conversation_config));
  } else {
    console.log(JSON.stringify(a.data));
  }

  const t = await tryP("GET", "convai/tools");
  console.log("\ntools list status:", t.status);
  if (t.status === 200) {
    console.log("tools:", JSON.stringify(t.data, null, 1).slice(0, 2500));
  } else {
    console.log(JSON.stringify(t.data));
  }
})();