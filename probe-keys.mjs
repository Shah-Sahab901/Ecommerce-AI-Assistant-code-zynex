const NEW_KEY = "sk_6b788d64f2baf1eb20e8a42261afc2730a9f27642a0ac4bb";
const OLD_KEY = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const NEW_AGENT = "agent_3301m2kb6c2yerg8att49drmfd0q";

const probe = async (label, key) => {
  console.log(`\n===== ${label} =====`);
  const headers = { "xi-api-key": key, "Content-Type": "application/json" };
  for (const [m, path] of [["GET", "user"], ["POST", "user"], ["GET", "agents"]]) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/${path}`, {
        method: m,
        headers,
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      const s =
        typeof data === "string"
          ? data
          : JSON.stringify(data).slice(0, 600);
      console.log(`${m} /${path} -> ${res.status}: ${s}`);
    } catch (e) {
      console.log(`${m} /${path} -> ERR ${e.message}`);
    }
  }
};

(async () => {
  await probe("NEW key sk_6b78...", NEW_KEY);
  await probe("OLD key sk_5ec1...", OLD_KEY);
})();