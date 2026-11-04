import fs from "node:fs";
import path from "node:path";
const base = "node_modules/@elevenlabs/client/dist";
function walk(dir, depth = 0, out = []) {
  if (depth > 2) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, depth + 1, out);
    else if (/\.(js|mjs)$/.test(f.name)) out.push(p);
  }
  return out;
}
const pats = [/elevenlabs\.io\/v1[^"'\s]*/g, /convai[^"'\s]*/g, /api[_-]?key[^,;}]{0,40}/gi, /signed[^"'\s]{0,30}/gi];
const hits = [];
for (const f of walk(base)) {
  let s = fs.readFileSync(f, "utf8");
  for (const agg of ["api.elevenlabs.io", "conversation_signing", "authorization", "xi-api-key", "getSigned", "signedUrl", "kV1", "v1/convai"]) {
    if (s.includes(agg)) hits.push(f + "  ->  " + agg);
  }
}
console.log([...new Set(hits)].slice(0, 60).join("\n"));