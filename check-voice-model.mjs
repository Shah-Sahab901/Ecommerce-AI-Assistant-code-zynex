const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
(async () => {
  const v = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
  if (v.ok) {
    const vj = await v.json();
    const vc = (vj.voices || []).map((x) => ({ id: x.voice_id, name: x.name, cat: x.category }));
    console.log("voices list OK count:", vc.length);
    const has = vc.find((x) => x.id === "cjVigY5qzO86Huf0OWal");
    console.log("agent voice cjVigY5qzO86Huf0OWal present on new account:", !!has, has ? has.name : "");
    console.log("sample voices:", vc.slice(0, 8).map((x) => x.id + ":" + x.name).join(", "));
  } else {
    console.log("voices:", v.status, (await v.text()).slice(0, 150));
  }
  const m = await fetch("https://api.elevenlabs.io/v1/models", { headers: { "xi-api-key": key } });
  if (m.ok) {
    const mj = await m.json();
    const conv = (mj || []).filter((x) => /convers|v3|turbo|flash|multilingual/i.test(x.model_id)).map((x) => ({ id: x.model_id, langs: (x.languages || []).filter((l) => l.language_id === "ur" || l.name === "Urdu") }));
    console.log("models OK; conv-related models:", conv.map((x) => x.id + (x.langs.length ? " (has urdu)" : "")).join(", "));
  } else {
    console.log("models:", m.status, (await m.text()).slice(0, 150));
  }
})().catch((e) => { console.error(e); process.exit(1); });