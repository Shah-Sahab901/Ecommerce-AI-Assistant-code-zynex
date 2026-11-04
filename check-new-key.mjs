const key = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
(async () => {
  const u = await fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": key } });
  if (u.ok) { const uj = await u.json(); console.log("/v1/user OK:", uj.email, "|", uj.name); }
  else console.log("/v1/user:", u.status, (await u.text()).slice(0, 150));

  const s = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": key } });
  if (s.ok) {
    const sj = await s.json();
    console.log("subscription: tier=", sj.tier, "status=", sj.status, "currency=", sj.currency, "characters_left=", sj.character_count, sj.character_limit, "| next_invoice_charges=", JSON.stringify(sj.next_invoice_charges || null));
    console.log("billing:", JSON.stringify(sj.billing || null).slice(0, 300));
  } else console.log("/v1/user/subscription:", s.status, (await s.text()).slice(0, 150));
})().catch((e) => { console.error(e); process.exit(1); });