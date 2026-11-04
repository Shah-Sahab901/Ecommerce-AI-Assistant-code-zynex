const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
const keyOld = "sk_9c61ca4a626cb7214ce6b3d1dcc0990cee43e2b96b73c513";
async function toolDetail(key, id) {
  const r = await fetch(`https://api.elevenlabs.io/v1/convai/tools/${id}`, { headers: { "xi-api-key": key } });
  if (!r.ok) return `  ${id} -> ${r.status} ${(await r.text()).slice(0, 80)}`;
  const t = await r.json();
  const cfg = t.tool_config || {};
  const scheme = cfg.api_scheme ? JSON.stringify(cfg.api_scheme) : "no-scheme";
  const params = cfg.parameters ? JSON.stringify({ required: cfg.parameters.required, props: Object.keys(cfg.parameters.properties || {}), dynamic: cfg.parameters.dynamic_variable }) : "no-params";
  return `  ${id} | type=${cfg.type} | name=${cfg.name} | expects=${cfg.expects_response} | url=${cfg.api_scheme?.http?.url ?? "n/a"} | params=${params} | scheme=${scheme.slice(0, 120)}`;
}
(async () => {
  console.log("=== NEW account tools ===");
  console.log(await toolDetail(keyNew, "tool_9501m2an1f3kekcvmgsd29gv2yah")); // list_products
  console.log(await toolDetail(keyNew, "tool_7401m2an1fdwez8ahaj771ynd0s6")); // add_to_cart
  console.log(await toolDetail(keyNew, "tool_0201m2an1fq0fa2tj4c67x7qj7g2")); // attach_photo
  console.log("=== OLD account tools ===");
  console.log(await toolDetail(keyOld, "tool_9701m29cmb30ea9arr3b1ppvh5qr")); // list_products
  console.log(await toolDetail(keyOld, "tool_3801m29cmb31eknahh8b2pwrggm6")); // add_to_cart
})().catch((e) => { console.error(e); process.exit(1); });