const keyNew = "sk_5ec1d9ecbcae2fdbdd523ee914517587b6151f97ffa9fd5f";
(async () => {
  for (const id of ["agent_6101m2amnfmzfmhbet60ws1fpdzt", "agent_8701m2apy0rbf2q8ta0dvf4w2r5j"]) {
    const a = await (await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, { headers: { "xi-api-key": keyNew } })).json();
    const cc = a.conversation_config || {};
    console.log(
      id.slice(0, 16),
      "| llm:", cc.agent?.prompt?.llm,
      "| tts:", cc.tts?.model_id,
      "| turn:", cc.turn?.turn_model,
      "| lang:", cc.agent?.language
    );
  }
})().catch((e) => { console.error(e); process.exit(1); });