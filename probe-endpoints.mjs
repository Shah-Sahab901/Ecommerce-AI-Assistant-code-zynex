const NEW_KEY = "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const NEW_AGENT = "agent_3301m2kb6c2yerg8att49drmfd0q";

const h = { "xi-api-key": NEW_KEY, "Content-Type": "application/json" };
const tryP = async (m, path) => {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/${path}`, {
      method: m,
      headers: h,
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
    console.log(`${m} /v1/${path} -> ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data).slice(0, 400)}`);
  } catch (e) { console.log(`${m} /v1/${path} -> ERR ${e.message}`); }
};

(async () => {
  await tryP("GET", `agents/${NEW_AGENT}`);
  await tryP("GET", "convai/agents");
  await tryP("GET", "conversational/agents");
  await tryP("GET", "agents");
  await tryP("GET", "agents?page_size=20");
  await tryP("GET", "convai/agents?page_size=20");
  await tryP("POST", `agents/${NEW_AGENT}/conversations`);
  await tryP("GET", "shared-voices");
  await tryP("GET", "user/subscription");
})();