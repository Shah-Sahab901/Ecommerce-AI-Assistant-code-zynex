"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationStatus,
} from "@elevenlabs/react";

type SearchProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number | null;
  style?: string | null;
  productId?: string | null;
};

// ─────────────────────────────────────────────────────────────────────
// NUMBER → URDU WORDS (qeemat ka sahi bolna)
// ─────────────────────────────────────────────────────────────────────
// Pehle number Urdu me bolne ka kaam LLM ko diya gaya tha, aur woh
// jaldi-jaldi number tod kar GALAT price bol deta tha ("7 hazar
// sathso sath") — kuch uss ne 7999 ka example bhi "نو کانوے" likha
// diya tha jo 7992 hai. Is liye ab number CODE me hi lafz me badla
// jaata hai (0 se 99 tak ka poora Urdu table) aur tool result me
// ready lafz chhaye jate hain — assistant ko sirf wohi waise hi
// bolna hai. Isse qeemat kabhi ghalat nahi boli jayegi.

const URDU_0_TO_99: string[] = [
  "صفر", "ایک", "دو", "تین", "چار", "پانچ", "چھ", "سات", "آٹھ", "نو",
  "دس", "گیارہ", "بارہ", "تیرہ", "چودہ", "پندرہ", "سولہ", "سترہ", "اٹھارہ", "انیس",
  "بیس", "اکیس", "بائیس", "تئیس", "چوبیس", "پچیس", "چھ بیس", "سات بیس", "اتھ بیس", "نوبیس",
  "تیس", "ایک تیس", "بینتیس", "تیتیس", "چویتیس", "پینتیس", "چھ تیس", "سات تیس", "اتھ تیس", "انتالیس",
  "چالیس", "اکتالیس", "بیالیس", "تیالیس", "چواریس", "پچالیس", "چھالیس", "ساتالیس", "اتھالیس", "نچالیس",
  "پچاس", "اکپن", "باویس", "تپن", "چوبن", "پچپن", "چھپن", "ستپن", "اتھپن", "نپن",
  "ساٹھ", "اکھترہ", "بہترہ", "تہترہ", "چوبترہ", "پچترہ", "چھترہ", "ساتترہ", "اتھترہ", "اتھنّ",
  "ستتر", "اکہترہ", "بہترہ", "تہترہ", "چوبترہ", "پچترہ", "چھترہ", "ساتترہ", "اتھترہ", "اننّ",
  "اسّی", "اکیسی", "بیاسی", "تیاسی", "چوراسی", "پچاسی", "چھاسی", "ساتاسی", "اتھاسی", "نواسی",
  "نوے", "اکانوے", "بانوے", "تانوے", "چورانوے", "پچانوے", "چھانوے", "ستانوے", "اتھانوے", "نانوے",
];

/** 7790 → "سات ہزار، سات سو، نوے"  (Urdu me sahi hisse-wala bolna) */
const numberToUrduWords = (value: number): string => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return URDU_0_TO_99[0];
  if (n > 99999999) return ""; // itni badi qeemat nahi hoti — LLM se mat pucho
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (crore > 0) parts.push(`${numberToUrduWords(crore)} کروڑ`);
  if (lakh > 0) parts.push(`${URDU_0_TO_99[lakh]} لاکھ`);
  if (thousand > 0) parts.push(`${numberToUrduWords(thousand)} ہزار`);
  if (hundred > 0) parts.push(`${URDU_0_TO_99[hundred]} سو`);
  if (rest > 0) parts.push(URDU_0_TO_99[rest]);
  return parts.join("، ");
};

/** Qeemat ka poora jumla: 7790 → "سات ہزار، سات سو، نوے روپے" */
const rupeesInUrdu = (value: number): string => {
  const words = numberToUrduWords(value);
  return words ? `${words} روپے` : "";
};

// ── Auto try-on ke live progress steps (ChatGPT wala feel) ──
const GEN_STEPS = [
  "Aapki photo AI ko samjhii ja rahi hai…",
  "Aapki skin tone ke hisaab se best suite match ho raha hai…",
  "AI aapke face par suite laga kar image bana raha hai (Gemini)…",
  "Almost ready! Image popup me aane wali hai…",
];

// Tone ke hisaab se suit color keyword (face ka hisaab se matching)
const TONE_KEYWORDS: Record<string, string[]> = {
  LIGHT: ["white", "ivory", "cream", "pastel", "light", "sky", "yellow", "pink", "beige", "gold"],
  MEDIUM: ["blue", "green", "teal", "navy", "purple", "brown", "grey", "gray", "red"],
  MEDIUM_DARK: ["navy", "maroon", "brown", "burgundy", "olive", "teal", "dark", "black"],
  DARK: ["black", "navy", "maroon", "burgundy", "charcoal", "dark", "wine", "midnight"],
};

type ListProductsParams = {
  query?: string;
  category?: string;
  color?: string;
  material?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  open_detail?: boolean;
};

// ─────────────────────────────────────────────────────────────
// PRICE RANGE PARSER (Roman Urdu + English)
// -------------------------------------------------------------
// Voice agent kabhi price ko alag min_price/max_price me nahi
// bhejta (ya "12 hazar" ko ghalat number samajh leta hai) — is liye
// hum khud user ke alfaz (query) se budget nikal lete hain, taake
// "10 hazar ke ander" ka filter har baar theek lage.
//   - "10 hazar / 10 hazaar / 10k / under 5000 / 5000 ke ander" -> max
//   - "8000 se zayada / 8000 se upar / above 8000"               -> min
//   - "5000 se 8000 / 5000 to 8000"                              -> range
// ─────────────────────────────────────────────────────────────
const _PRICE_MULT: Record<string, number> = {
  k: 1000,
  hazar: 1000,
  hazaar: 1000,
  hazr: 1000,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
  laakh: 100000,
};
const _PRICE_UPPER_WORDS = [
  "under", "below", "less", "kam", "tak", "ander", "andar",
  "budget", "bajet", "within", "se kam", "se kum", "k ander",
  "k andar", "ke ander", "ke andar", "ki ander", "ki andar",
];
const _PRICE_LOWER_WORDS = [
  "zayada", "zyada", "zaida", "upper", "upar", "ooper", "above",
  "more than", "se zyada", "se zayada", "se upper", "se upar",
  "minimum", "se ooper", "se ziada",
];

const parsePriceRange = (
  text: string
): { min: number | null; max: number | null } => {
  const t = (text || "").toLowerCase().replace(/,/g, "");
  if (!t) return { min: null, max: null };

  // 1) Explicit range: "5000 se 8000", "5000 to 8000", "5000-8000"
  const range = t.match(
    /(\d+(?:\.\d+)?)\s*(?:(k|hazar|hazaar|hazr|thousand|lakh|lac|laakh)s?\b)?\s*(?:se|to|tak|lekar|the|and|&|-)\s*(\d+(?:\.\d+)?)\s*(?:(k|hazar|hazaar|hazr|thousand|lakh|lac|laakh)s?\b)?/
  );
  if (range) {
    const a = Math.round(
      parseFloat(range[1]) * (range[2] ? _PRICE_MULT[range[2]] : 1)
    );
    const b = Math.round(
      parseFloat(range[3]) * (range[4] ? _PRICE_MULT[range[4]] : 1)
    );
    if (a > 0 && b > 0) return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // 2) Individual amounts with optional Urdu/English multiplier
  const re = /(\d+(?:\.\d+)?)\s*(?:(k|hazar|hazaar|hazr|thousand|lakh|lac|laakh)s?\b)?/g;
  let min: number | null = null;
  let max: number | null = null;
  let biggest = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const mult = m[2] ? _PRICE_MULT[m[2]] : 1;
    const value = Math.round(parseFloat(m[1]) * mult);
    // Multiplier ke bina chhote numbers (jaise "3pc" ka 3) ko price na samjho.
    if (!m[2] && value < 1000) continue;
    biggest = Math.max(biggest, value);
    const seg = t.slice(Math.max(0, m.index - 40), Math.min(t.length, m.index + 45));
    const hasLower = _PRICE_LOWER_WORDS.some((w) => seg.includes(w));
    const hasUpper =
      _PRICE_UPPER_WORDS.some((w) => seg.includes(w)) ||
      /\b(rs|pkr|rupees?|rupaye|rupay)\b/.test(seg);
    if (hasLower) {
      min = value;
    } else if (hasUpper) {
      max = value;
    }
  }
  // Jo bhi amount bolein (chahe sirf number ho), us se KAM wale products —
  // is liye agar koi set na hua to sabse bara number hi budget (max) ho.
  if (min === null && max === null && biggest > 0) max = biggest;
  return { min, max };
};

type AddToCartParams = {
  product_name?: string;
  product_id?: string;
  quantity?: number;
};

type CartItem = {
  product: SearchProduct;
  qty: number;
};

const BAG_KEY = "zynexvision_bag";

const BagIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

type TryOnImage = {
  dataUrl: string;
  caption: string;
  prompt: string;
  status: "loading" | "ready" | "error";
  error?: string;
};

// DataURL (base64) ko wapas File me convert karo — taake camera selfie ko
// attachment ke saath, agent ko bhejne wale flow me daal saken.
const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(",");
  const mime = (arr[0].match(/:(.*?);/) ?? [])[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
};

// ─────────────────────────────────────────────────────────────────────
// LIVE BODY TRACKING (MediaPipe Pose — CDN se, runtime par)
// ─────────────────────────────────────────────────────────────────────
// Isse selected kapra user ke JISM par real-time chipka rehta hai aur
// user jahan bhi/kitna bhi move kare (kisi bhi angle se), kapra uske
// sath move karta hai — static photo nahi. Library CDN se load hoti hai
// (npm install ki zaroorat nahi). Wasteful re-render se bachne ke liye
// hum seedha DOM (img.style) ko har frame update karte hain.
type PosePoint = { x: number; y: number; z?: number; visibility?: number };
type PoseLandmarkerLike = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { landmarks?: PosePoint[][] };
};

let poseLandmarkerPromise: Promise<PoseLandmarkerLike> | null = null;

const loadPoseLandmarker = (): Promise<PoseLandmarkerLike> => {
  if (poseLandmarkerPromise) return poseLandmarkerPromise;
  poseLandmarkerPromise = (async () => {
    const base = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
    // Bundler ko bypass karke seedha CDN ESM module import karo.
    const dynamicImport = new Function("u", "return import(u)") as (
      u: string
    ) => Promise<Record<string, unknown>>;
    const mod = await dynamicImport(base);
    const FilesetResolver = mod.FilesetResolver as {
      forVisionTasks: (p: string) => Promise<unknown>;
    };
    const PoseLandmarker = mod.PoseLandmarker as {
      createFromOptions: (
        fileset: unknown,
        options: Record<string, unknown>
      ) => Promise<PoseLandmarkerLike>;
    };
    const fileset = await FilesetResolver.forVisionTasks(`${base}/wasm`);
    const modelUrl =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
    const optionsBase = {
      modelAssetPath: modelUrl,
      delegate: "GPU",
    };
    try {
      return await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: optionsBase,
        runningMode: "VIDEO",
        numPoses: 1,
      });
    } catch {
      // GPU fail ho to CPU par dobara koshish.
      return await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    }
  })().catch((err) => {
    poseLandmarkerPromise = null;
    throw err;
  });
  return poseLandmarkerPromise;
};

// ─────────────────────────────────────────────────────────────────────
// BACKGROUND NOISE SUPPRESSION (mic → ElevenLabs)
// ─────────────────────────────────────────────────────────────────────
// ElevenLabs SDK apna khud ka getUserMedia call karta hai aur usme
// browser ki built-in suppression (noiseSuppression + echoCancellation +
// autoGainControl + Chrome ka voiceIsolation) already ON hoti hai. Uske
// upar hum ek chhota Web Audio chain add karte hain taake fan/traffic/AC
// ki rumble, dheemi gunguna-hat aur words ke darmiyan ka khamosh shor
// bilkul dab jaye — sirf user ki saaf awaaz hi agent tak pahunche.
//
// 1) high-pass  ~70 Hz  → DC offset, AC hum, fan/traffic rumble
// 2) low-shelf  ~320 Hz → low-mid background gunguna-hat (-8 dB)
// 3) peaking   ~2.6 kHz → awaaz ki "clarity" thori barh jati hai
// 4) low-pass  ~7.5 kHz → hiss / "ssss" aur zyada bandwidth bachata hai
// 5) compressor as EXPANDER → silence ke dauraan background noise -50 dB
//                            se neeche dabata hai (asli noise gate)
// 6) mild leveller + gain  → level consistent, ASR ko saaf signal milta hai
//
// Koi bhi step fail ho jaye to ORIGINAL raw stream wapas chala jata hai —
// yaani ye enhancement kabhi assistant ko toota nahi chhod sakta.
const VOICE_NOISE_GUARD_FLAG = "__zynex_voice_noise_guard__";

const MIC_NOISE_DEFAULTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: { ideal: 1 },
  // Chrome ka "Voice Isolation" (hardware-level noise removal)
  voiceIsolation: true,
};

const buildNoiseSuppressedMic = (raw: MediaStream): MediaStream | null => {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return null;
    if (raw.getAudioTracks().length === 0) return null;

    const ctx = new AudioCtor();
    const source = ctx.createMediaStreamSource(raw);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 85;
    highpass.Q.value = 0.7;

    const lowCut = ctx.createBiquadFilter();
    lowCut.type = "lowshelf";
    lowCut.frequency.value = 320;
    lowCut.gain.value = -10;

    const presence = ctx.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2600;
    presence.Q.value = 0.9;
    presence.gain.value = 3;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 7500;
    lowpass.Q.value = 0.6;

    // Compressor ko expander ki tarah — yahi browser me noise gate ka
    // sab se reliable tareeqa hai. Threshold itna rakha hai ke dheemi awaaz
    // wali user ki baat kabhi cut na ho, sirf khamoshi ka background shor
    // (-50 dB se neeche) dabaya jaye.
    const gate = ctx.createDynamicsCompressor();
    gate.threshold.value = -50;
    gate.knee.value = 0;
    gate.ratio.value = 15;
    gate.attack.value = 0.003;
    gate.release.value = 0.3;

    // Dheemi/halki awaaz ko level up karne ke liye leveller SOFT rakha gaya:
    // threshold -30 (pehle -22 tha — jo dheemi baat ko dabata tha), ratio 2.
    const leveller = ctx.createDynamicsCompressor();
    leveller.threshold.value = -30;
    leveller.knee.value = 14;
    leveller.ratio.value = 2;
    leveller.attack.value = 0.004;
    leveller.release.value = 0.18;

    // Makeup gain — filters + leveller ke baad signal ka level wapas
    // uthata hai taake halki si baat bhi VAD ko clearly sunai de.
    const gain = ctx.createGain();
    gain.gain.value = 3;

    source.connect(highpass);
    highpass.connect(lowCut);
    lowCut.connect(presence);
    presence.connect(lowpass);
    lowpass.connect(gate);
    gate.connect(leveller);
    leveller.connect(gain);

    const out = ctx.createMediaStreamDestination();
    gain.connect(out);

    // Safety: agar browser ne context ko "suspended" chhor diya (autoplay
    // policy) to user ke next tap/par click par wapas chala dete hain —
    // warna agent ko bilkul awaaz nahi milti.
    const tryResume = () => {
      if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    };
    tryResume();
    ctx.addEventListener("statechange", tryResume, { once: true });
    const unlock = () => {
      tryResume();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);

    // Processed track ya raw track — jise bhi pehle band kiya jaye, poora
    // chain (raw mic + filters + context) saaf ho jata hai. Isi liye mic
    // ki red recording light band me nahi jati.
    let closed = false;
    const teardown = () => {
      if (closed) return;
      closed = true;
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
      raw.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* already stopped */
        }
      });
      void ctx.close().catch(() => undefined);
    };
    out.stream.getAudioTracks().forEach((t) => {
      if (t.readyState === "ended") teardown();
      else t.addEventListener("ended", teardown, { once: true });
    });
    raw.getTracks().forEach((t) => {
      if (t.readyState === "ended") teardown();
      else t.addEventListener("ended", teardown, { once: true });
    });

    return out.stream;
  } catch (err) {
    console.warn("Noise guard nahi lag saka, raw mic use ho raha hai:", err);
    return null;
  }
};

// getUserMedia ko ek baar wrap karte hain (idempotent). Sirf AUDIO-only
// requests (mic) filter hote hain — camera (video) bilkul untouched rehta hai.
const installVoiceNoiseGuard = () => {
  if (typeof window === "undefined" || !navigator.mediaDevices) return;
  const md = navigator.mediaDevices as unknown as Record<string, unknown>;
  if (md[VOICE_NOISE_GUARD_FLAG]) return;
  const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = (async (
    constraints?: MediaStreamConstraints
  ) => {
    const audio = constraints?.audio;
    const video = constraints?.video;
    const wantsAudio = audio !== undefined && audio !== false;
    const wantsVideo = video !== undefined && video !== false;
    const audioOnly = wantsAudio && !wantsVideo;

    const merged = audioOnly
      ? ({
          ...constraints,
          audio: {
            ...(typeof audio === "object" ? audio : {}),
            ...MIC_NOISE_DEFAULTS,
          },
        } as MediaStreamConstraints)
      : constraints;

    const raw = await original(merged);
    if (!audioOnly) return raw;
    return buildNoiseSuppressedMic(raw) ?? raw;
  }) as typeof navigator.mediaDevices.getUserMedia;

  md[VOICE_NOISE_GUARD_FLAG] = true;
};

// ASR keywords — sirf shopping words nahi, Urdu NUMBERS/price words bhi,
// taake ASR "sath hazaar nau sau nau kanwe" ko sahi sun kar price
// number theek parche.
const VOICE_ASR_KEYWORDS = [
  // Roman-Urdu phrases jo user "ya batao / qeemat batao" ki shakal me bolta hai
  "ya batao",
  "ya bataye",
  "batao",
  "bataye",
  "bata do",
  "bata den",
  "batanay",
  "qeemat batao",
  "qeemat",
  "qaim",
  "paisa batao",
  "paisa bolo",
  "kitne ka",
  "kitna hai",
  "kya hai",
  "kya he",
  "kahan hai",
  "dikhao",
  "dikha do",
  "lagao",
  "sunao",
  "mujhe batao",
  "mera hai",
  // English / Roman Urdu shopping words
  "shopping",
  "price",
  "discount",
  "brand",
  "size",
  "outfit",
  "styling",
  "suit",
  "fabric",
  "cotton",
  "lawn",
  "kurta",
  "kurti",
  "shalwar",
  "kameez",
  "cotton",
  " rupees",
  "paisay",
  "thora",
  "thoda",
  "sasta",
  "mehnga",
  "sabse",
  "dikhawao",
  "dikhao",
  "chahiye",
  "mangwao",
  // Urdu (script) shopping words
  "شاپنگ",
  "قیمت",
  "روپے",
  "روپے",
  "درست",
  "سستا",
  "مہنگا",
  "سب سے",
  "ڈسکاونٹ",
  "بیٹ",
  "ساکٹ",
  "قیمت",
  "لباس",
  "کپڑا",
  "کپڑے",
  "سوتی",
  "لین",
  "کمبڑک",
  "جوتیاں",
  "جوتا",
  "کرتا",
  "کرتی",
  "شلوار",
  "کمیز",
  "دھاگہ",
  "ڈھاگہ",
  "دکان",
  "آرڈر",
  "چھوٹا",
  "بڑا",
  "نیا",
  "سائز",
  "رنگ",
  "ویلا",
  "سبز",
  "لال",
  "نیلا",
  "کالا",
  "سفید",
  "سنہری",
  // Urdu number words (prices + counts ke liye)
  "ایک",
  "دو",
  "تین",
  "چار",
  "پانچ",
  "چھ",
  "سات",
  "آٹھ",
  "نو",
  "دس",
  "گیارہ",
  "بارہ",
  "تیرہ",
  "چودہ",
  "پندرہ",
  "سولہ",
  "سترہ",
  "اٹھارہ",
  "انیس",
  "بیس",
  "سو",
  "ہزار",
  "لاکھ",
  "کروڑ",
];

function ResultGrid({
  products,
  premiumId,
  onOpen,
  onAdd,
  onRemove,
  inBag,
  tryOnImages,
  onTryOnClick,
  onRetryTryOn,
}: {
  products: SearchProduct[];
  premiumId?: number | null;
  onOpen: (p: SearchProduct) => void;
  onAdd: (p: SearchProduct) => void;
  onRemove: (id: number) => void;
  inBag: (id: number) => boolean;
  tryOnImages: Record<string, TryOnImage>;
  onTryOnClick: (dataUrl: string) => void;
  onRetryTryOn: (p: SearchProduct) => void;
}) {
  const premiumProduct = products.find((p) => p.id === premiumId) ?? null;
  return (
    <div className="p-4">
      <p className="text-[11px] text-gray-400 mb-3">
        {products.length} product{products.length > 1 ? "s" : ""} — click any
        card for details, or press the bag icon to add it
        {premiumProduct !== null && premiumProduct !== undefined
          ? " · ⭐ most premium: " + premiumProduct.name
          : ""}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((p) => {
          const discount =
            p.oldPrice && p.oldPrice > p.price
              ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
              : 0;
          const isPremium = premiumProduct !== null &&
            premiumProduct !== undefined &&
            premiumProduct.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onOpen(p)}
              className="relative group rounded-2xl border border-gray-200 bg-white overflow-hidden cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-[0_10px_30px_rgba(37,99,235,0.18)] hover:-translate-y-0.5"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
                  }}
                />
                {/* ── AI TRY-ON thumb: upper-left corner (har product ka apna) ── */}
                {(() => {
                  const tryOn = tryOnImages[String(p.id)];
                  if (!tryOn) return null;
                  if (tryOn.status === "loading") {
                    return (
                      <div className="absolute top-2 left-2 z-10 h-[70px] w-[52px] rounded-xl bg-black/55 backdrop-blur-sm border-2 border-white shadow-lg flex items-center justify-center">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    );
                  }
                  if (tryOn.status === "error") {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryTryOn(p);
                        }}
                        aria-label={`Retry AI try-on for ${p.name}`}
                        className="absolute top-2 left-2 z-10 h-[70px] w-[52px] rounded-xl bg-red-50/95 border-2 border-red-300 shadow-lg flex items-center justify-center flex-col cursor-pointer transition hover:bg-red-100"
                        title={tryOn.error ?? "AI try-on failed"}
                      >
                        <span className="text-[10px]">🔁</span>
                        <span className="text-[7px] font-bold text-red-600 mt-0.5">
                          RETRY
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTryOnClick(tryOn.dataUrl);
                      }}
                      aria-label={`Enlarge AI try-on for ${p.name}`}
                      className="absolute top-2 left-2 z-10 h-[70px] w-[52px] rounded-xl overflow-hidden border-2 border-white shadow-lg cursor-zoom-in transition hover:scale-105 hover:shadow-xl group/try"
                    >
                      <img
                        src={tryOn.dataUrl}
                        alt={`AI try-on: ${p.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Sirf <img> chhupane se uska white border + "AI
                          // TRY-ON" label wala khaali frame card ke corner me
                          // pada reh jata tha. Poora wrapper hata dete hain
                          // taake khaali area na rahe.
                          const el = e.currentTarget as HTMLImageElement;
                          const frame = el.closest("button");
                          if (frame) frame.style.display = "none";
                          else el.style.display = "none";
                        }}
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[7px] font-bold py-0.5 text-center tracking-wide">
                        AI TRY-ON
                      </span>
                    </button>
                  );
                })()}
                {discount > 0 && (
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
                {isPremium && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                    ⭐ Premium
                  </span>
                )}
                {/* Quick add-to-bag button (toggle: added → remove) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inBag(p.id)) onRemove(p.id);
                    else onAdd(p);
                  }}
                  aria-label={
                    inBag(p.id)
                      ? `Remove ${p.name} from bag`
                      : `Add ${p.name} to bag`
                  }
                  className={
                    "absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-md border flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95 " +
                    (inBag(p.id)
                      ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600"
                      : "bg-white/95 border-gray-200 hover:bg-blue-600 hover:border-blue-600")
                  }
                >
                  {inBag(p.id) ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span className="text-blue-600 hover:text-white transition-colors">
                      <BagIcon size={15} />
                    </span>
                  )}
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] text-gray-800 leading-snug line-clamp-2 min-h-[28px]">
                  {p.name}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[12px] font-bold text-blue-600">
                    Rs{p.price.toLocaleString()}
                  </span>
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      Rs{p.oldPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoiceAssistantWidget() {
  const { startSession, endSession, getInputVolume, getOutputVolume, sendUserMessage } =
    useConversationControls();
  const { status, message } = useConversationStatus();

  const [open, setOpen] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchNote, setSearchNote] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(
    null
  );
  const [bag, setBag] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const rafRef = useRef<number>(0);

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const apiBase = "https://zynex-ecommerce-backend-ai-new.vercel.app";

  // ── AI image + per-product try-on states (pehle declare — async helpers
  //    inhe use kar sakte hain bina stale-closure ke) ──
  const [generatedImage, setGeneratedImage] = useState<{
    dataUrl: string;
    caption: string;
    prompt: string;
  } | null>(null);
  // AI image ko badi size me dekhne ke liye fullscreen overlay
  const [fullImage, setFullImage] = useState<string | null>(null);
  // Agar kisi AI image ka data-URL browser me decode na ho to user ko khaali
  // grey box na dikhe — message dikhaya jaye (image load nahi hui).
  const [brokenImage, setBrokenImage] = useState<Record<string, boolean>>({});
  const [generatingImage, setGeneratingImage] = useState(false);
  const [genStep, setGenStep] = useState(0);
  // ── PER-PRODUCT AI TRY-ON: popup ke HAR product ke card ke corner me
  //    apni AI try-on image dikhti hai (sirf ek mehange ki nahi). ──
  const [tryOnImages, setTryOnImages] = useState<Record<string, TryOnImage>>({});

  // ── CAMERA (real selfie) ──
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Webcam stream ko unmount / popup band hote hi band karo (kabhi na chhute).
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── LIVE TRY-ON (camera ke upar selected kapra live) ──
  // Alag state/stream — existing selfie camera ko chhua nahi jata.
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveProductId, setLiveProductId] = useState<number | null>(null);
  const [liveOverlay, setLiveOverlay] = useState({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 0.92,
  });
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  // ── AI LIVE OUTCOME: selected kapra AI se user ke JISM par laga kar dikhana ──
  const [liveResult, setLiveResult] = useState<string | null>(null);
  const [liveGenerating, setLiveGenerating] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveView, setLiveView] = useState<"ai" | "camera">("ai");
  const liveBusyRef = useRef(false);

  // ── LIVE BODY-TRACKED AR OVERLAY ──
  // selected kapra real-time user ke jism par (pose tracking se) chipka
  // rehta hai. Loop seedha img.style update karta hai (React re-render nahi).
  const liveOverlayImgRef = useRef<HTMLImageElement>(null);
  const liveContainerRef = useRef<HTMLDivElement>(null);
  const poseRafRef = useRef<number>(0);
  const poseLandmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const [liveTracking, setLiveTracking] = useState(false);
  const [liveTrackLoading, setLiveTrackLoading] = useState(false);
  const [liveTrackError, setLiveTrackError] = useState<string | null>(null);
  // Size/Fade sliders ki live values (raf loop ko stale closure na mile).
  const liveAdjustRef = useRef({ scale: 1, opacity: 0.92 });

  // Live camera stream bhi unmount par hamesha band.
  useEffect(() => {
    return () => {
      liveStreamRef.current?.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    };
  }, []);

  // Popup products ka LIVE mirror (ref) — photo attach hote hi wahi list
  // use hoti hai jo popup me dikhi (nayi list nahi chahiye). applyProducts
  // dono ko sync rakhta hai (state + ref).
  const searchProductsRef = useRef<SearchProduct[]>([]);
  // Mehanga (premium) product SABSE UPPER dikhe — price descending sort.
  const applyProducts = (list: SearchProduct[]) => {
    const sorted = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    searchProductsRef.current = sorted;
    setSearchProducts(sorted);
  };
  const clearProducts = () => applyProducts([]);

  // userPhoto ka LIVE mirror (ref) — async try-on generators ko hamesha
  // aakhri photo milti rahe (stale closure ka masla na ho). Jaise hi photo
  // set hoti hai, ref aur state dono update hotay hain.
  const userPhotoRef = useRef<{
    name: string;
    dataUrl: string;
    width: number;
    height: number;
    tone: string;
  } | null>(null);

  const bagCount = bag.reduce((sum, i) => sum + i.qty, 0);

  // Load persisted bag on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BAG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBag(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Persist bag
  useEffect(() => {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    } catch {
      // storage unavailable
    }
  }, [bag]);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const addToBag = useCallback((p: SearchProduct, qty = 1) => {
    setBag((prev) => {
      const existing = prev.find((i) => String(i.product.id) === String(p.id));
      if (existing) {
        return prev.map((i) =>
          String(i.product.id) === String(p.id)
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [...prev, { product: p, qty }];
    });
    setToast(`Added to bag: ${p.name}`);
  }, []);

  const isInBag = useCallback(
    (id: number) => bag.some((i) => String(i.product.id) === String(id)),
    [bag]
  );

  const removeFromBag = useCallback((id: number) => {
    setBag((prev) => {
      const item = prev.find((i) => String(i.product.id) === String(id));
      if (item) setToast(`Removed from bag: ${item.product.name}`);
      return prev.filter((i) => String(i.product.id) !== String(id));
    });
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    setBag((prev) =>
      prev
        .map((i) =>
          String(i.product.id) === String(id)
            ? { ...i, qty: Math.max(1, i.qty + delta) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }, []);

  useEffect(() => {
    if (status !== "connected") {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }
    const tick = () => {
      try {
        const input = getInputVolume?.() ?? 0;
        const output = getOutputVolume?.() ?? 0;
        setInputLevel(Math.min(1, input * 5));
        setOutputLevel(Math.min(1, output * 5));
      } catch {
        // ignore — hooks not ready
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, getInputVolume, getOutputVolume]);

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupOpen(false);
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupOpen]);

  // ── AUTO TRY-ON (photo attach hote hi) ─────────────────────
  // User folder/file se apni image deta hai to popup me uski raw photo
  // ke SATH ye AI-generated try-on image bhi automatically dikhani hai:
  // popup ki list se sabse mehanga product + user ki photo → Gemini.
  const autoTryOnRef = useRef(false);
  // Photo select hote hi auto-run shuru ho chuka — duplicate call ko roko
  const tryOnStartedRef = useRef(false);

  // Tone ke hisaab se best suit: pehle tone-matching colors wale products,
  // warna sabse mehanga. (Sab add — kuch remove nahi)
  const pickBestForTone = (list: SearchProduct[]) => {
    if (list.length === 0) return null;
    const tone = userPhotoRef.current?.tone ?? "MEDIUM";
    const words = TONE_KEYWORDS[tone] ?? [];
    const hay = (s?: string | null) => (s ?? "").toLowerCase();
    const matched = list.filter((p) => {
      const h = `${hay(p.name)} ${hay(p.style)}`;
      return words.some((w) => h.includes(w));
    });
    const pool = matched.length > 0 ? matched : list;
    return pool.reduce((a, b) => (b.price > a.price ? b : a));
  };

  const pickMostExpensive = (list: SearchProduct[]) =>
    list.length > 0
      ? list.reduce((a, b) => (b.price > a.price ? b : a))
      : null;

  // Product images "/images/..." relative aati hain — ye website (Next) ke
  // origin se serve hoti hain, FastAPI backend se NAHI. Is liye relative
  // URL site ke origin (taake backend asli suit ki tasveer download kare)
  // se resolve karo; http se start hi ho to waise hi rahne do.
  const absUrl = (u?: string | null) =>
    !u
      ? ""
      : u.startsWith("http")
        ? u
        : typeof window !== "undefined"
          ? `${window.location.origin}${u}`
          : `${apiBase}${u}`;

  const makeTryOnPrompt = (p: {
    name: string;
    price: number;
    style?: string | null;
  }) => {
    const desc = p.style ? `${p.name} (${p.style})` : p.name;
    return `Virtual try-on from the store popup list: the reference photo of the EXACT garment/suit is attached below — copy precisely its design, color, fabric look, cut and style. Show this EXACT person (reference photo attached) wearing that EXACT same garment "${desc}" (price Rs ${p.price}). Natural, realistic photo. Keep the person's face, hair and skin tone identical to their reference photo. The outfit fits perfectly and looks wonderful on them.`;
  };

// ── HAR PRODUCT ke liye AI TRY-ON (aik sath / parallel) ──
  // Popup ki list me jo bhi product hain — SAB PAR user ki selfie + wohi
  // garment lagakar Gemini se image generate hoti hai. Result har card ke
  // upper corner me chhoti image ke roop me dikhta hai. Sabse mehanga/behtareen
  // product wali image featured "AI Generated Image" bar me sabse upar dikhti hai.
  const generateTryOnImages = async (list: SearchProduct[]): Promise<string> => {
    const photo = userPhotoRef.current;
    if (!photo) return "";
    const snapshot = list.slice(0, 3);
    if (snapshot.length === 0) return "";

    setPopupOpen(true);
    setSelectedProduct(null);
    setGeneratingImage(true);
    setGenStep(0);
    const stepTimer = setInterval(
      () => setGenStep((s) => Math.min(GEN_STEPS.length - 1, s + 1)),
      3000
    );

    // Sab cards par loading thumb dikhao (jo pehle se ready ho wahi choro).
    setTryOnImages((prev) => {
      const next = { ...prev };
      snapshot.forEach((p) => {
        const key = String(p.id);
        if (!next[key] || next[key].status !== "ready") {
          next[key] = { dataUrl: "", caption: "", prompt: "", status: "loading" };
        }
      });
      return next;
    });

    const done: {
      product: SearchProduct;
      dataUrl: string;
      caption: string;
      prompt: string;
    }[] = [];

    // SAARE products par AI try-on — sab cards par loading thumb TURANT dikhti
    // hai. Par Gemini quota burst na ho (6 parallel calls 429 dene lagte hain)
    // isliye ek waqt me 2 se zyada parallel call nahi chalate: har product 2
    // attempts tak try hota hai (beech me 2.5s gap). Kuch remove nahi kiya —
    // bas generaate ko reliable banane ke liye retry + limited concurrency hai.
    let cursor = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const genOne = async (product: SearchProduct) => {
      const prompt = makeTryOnPrompt(product);
      const controller = new AbortController();
      const hangKill = setTimeout(() => controller.abort(), 65000);
      try {
        const res = await fetch(`https://zynex-ecommerce-backend-ai-new.vercel.app/api/image/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            prompt,
            aspect: "1:1",
            user_image: photo.dataUrl,
            // Popup wale suit/garment ki ASLI tasveer — backend is URL se
            // image download karke Gemini ko reference deta hai taake bani
            // image me WOHI suit dikhe jo popup me hai (naam/price nahi).
            product_image_url: absUrl(product.image),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.ok && data.data_url) {
          // Gemini ki raw image multi-MB base64 hoti hai. 3-4 aise bade data-URL
          // ek saath browser ke image memory budget me rakhne se Chrome unhe
          // decode hi nahi kar pata — thumb "gayab" ho kar khaali frame chhorr
          // deta tha. Is liye DISPLAY ke liye 768px JPEG bana lete hain (card ke
          // thumb + poora screen dono ke liye kaafi hai, quality saaf rehti
          // hai). Kuch feature hata nahi — bas size halka.
          const shown = await downscaleImage(data.data_url, 768, 0.9);
          done.push({
            product,
            dataUrl: shown,
            caption: data.caption ?? "",
            prompt,
          });
          setTryOnImages((prev) => ({
            ...prev,
            [String(product.id)]: {
              dataUrl: shown,
              caption: data.caption ?? "",
              prompt,
              status: "ready",
            },
          }));
          return;
        }
        throw new Error(data.error ?? "unknown error");
      } finally {
        clearTimeout(hangKill);
      }
    };

    const worker = async () => {
      while (cursor < snapshot.length) {
        const product = snapshot[cursor++];
        let lastErr: unknown = null;
        let ok = false;
        for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
          try {
            await genOne(product);
            ok = true;
          } catch (err) {
            console.error("try-on error for", product.name, err);
            lastErr = err;
            if (attempt === 1) await sleep(2500);
          }
        }
        if (!ok) {
          // Fail hone ka reason use ko dikhiye — silent fail bilkul nahi.
          const reason =
            lastErr instanceof DOMException && lastErr.name === "AbortError"
              ? "timeout (65s) — Gemini slow hai"
              : lastErr instanceof Error
                ? lastErr.message
                : "backend unreachable";
          setTryOnImages((prev) => ({
            ...prev,
            [String(product.id)]: {
              dataUrl: "",
              caption: "",
              prompt: makeTryOnPrompt(product),
              status: "error",
              error: reason,
            },
          }));
          setToast(`AI try-on failed: ${product.name} — ${reason}`);
        }
      }
    };

    // Saare products ke liye generate shuru (do parallel workers + retry) —
    // sab cards par loading spinner turant dikh jaata hai.
    await Promise.all([worker(), worker()]);

    clearInterval(stepTimer);
    setGeneratingImage(false);

    if (done.length === 0) {
      setSearchNote(
        "AI try-on images generate nahi ho payi (backend image service offline? /api/image/generate deploy hua hai na?). Card ke retry button se dobara koshish karein."
      );
      return "";
    }

    // Featured bar ke liye: tone-based best product ki image upar dikhao.
    const featured =
      done.find(
        (d) => String(d.product.id) === String(pickBestForTone(snapshot)?.id)
      ) ?? done[0];
    setGeneratedImage({
      dataUrl: featured.dataUrl,
      caption: featured.caption,
      prompt: featured.prompt,
    });
    setSearchNote(
      `AI try-on ready: ${done.length} product${
        done.length > 1 ? "s" : ""
      } aapke chehre par laga kar dikhaye gaye. Mehanga: ${featured.product.name} (Rs ${featured.product.price}).`
    );
    setToast(`AI try-on ready: ${featured.product.name} (Rs ${featured.product.price})`);
    return `${featured.product.name} at Rs ${featured.product.price} [URDU PRICE WORDS: ${rupeesInUrdu(featured.product.price)}]`;
  };

  // ── list_products client tool ─────────────────────────────
  // Searches the real catalog via the FastAPI backend, shows the
  // product images in a popup, and hands a short text summary back
  // to the agent so it can speak the result.
  useConversationClientTool<{
    list_products: (params: ListProductsParams) => Promise<string>;
  }>("list_products", async (params) => {
    const openDetail = params.open_detail === true;
    // Budget user ke apne alfaz se nikalo (agent min_price/max_price chhoot
    // sakta hai ya "12 hazar" ko 12 samajh leta hai). Text se parse karo,
    // phir agent ki value fallback rahe.
    const priceText = [
      params.query,
      params.category,
      params.color,
      params.material,
    ]
      .filter(Boolean)
      .join(" ");
    const parsedPrice = parsePriceRange(priceText);
    const min_price = parsedPrice.min ?? params.min_price ?? null;
    const max_price = parsedPrice.max ?? params.max_price ?? null;
    const hasBudget = min_price !== null || max_price !== null;
    setSearchLoading(true);
    setPopupOpen(true);
    try {
      const res = await fetch(`https://zynex-ecommerce-backend-ai-new.vercel.app/api/voice/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: params.query ?? "",
          category: params.category ?? "",
          color: params.color ?? "",
          material: params.material ?? "",
          min_price,
          max_price,
          // Budget ho to zyada candidates mangwao taake filter ke baad bhi
          // kuch products bachein.
          limit: hasBudget ? 100 : 3,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let products: SearchProduct[] = Array.isArray(data.products)
        ? data.products
        : [];
      // EXTRA GUARANTEE: sirf aap ke bataye budget ke andar wale products
      // dikhao (backend ne bhi filter kiya hoga — yeh frontend par bhi
      // pakka karta hai, taake "12 hazar ka ander" ka matlab hamesha lage).
      if (hasBudget) {
        products = products.filter((p) => {
          const price = Number(p.price);
          if (!Number.isFinite(price)) return false;
          if (min_price !== null && price < min_price) return false;
          if (max_price !== null && price > max_price) return false;
          return true;
        });
      }
      products = products.slice(0, 3);
      applyProducts(products);
      setSelectedProduct(
        openDetail && products.length > 0 ? products[0] : null
      );
      setSearchNote(
        hasBudget && products.length === 0
          ? "Is budget ke andar koi product nahi mila — thora budget barha dein."
          : typeof data.note === "string"
          ? data.note
          : ""
      );
      // ── AUTO TRY-ON: agar user ne photo di thi aur ab popup me
      // products aa gaye hain, to sabse mehanga product par user ki
      // photo laga kar AI image automatically generate karo (agent ka
      // "mujhe dikhaao" kaha ka wait nahi karte).
      let autoNote = "";
      if (
        autoTryOnRef.current &&
        !tryOnStartedRef.current &&
        userPhotoRef.current &&
        products.length > 0
      ) {
        autoTryOnRef.current = false;
        const top = pickMostExpensive(products);
        if (top) {
          autoNote = ` Auto try-on is auto-generating: ${top.name} (Rs ${top.price}) with the user's photo. Acknowledge to the user in their language that the AI try-on image is showing in the popup.`;
          void generateTryOnImages(products);
        }
      }
      const top = products
        .slice(0, 10)
        .map(
          (p) =>
            `${p.name} at Rs${p.price} [URDU PRICE WORDS: ${rupeesInUrdu(
              p.price
            )}]`
        )
        .join("; ");
      return products.length > 0
        ? `${products.length} products found. ${top}${autoNote}`
        : `0 products found. ${data.note ?? ""}`;
    } catch (err) {
      console.error("list_products error:", err);
      clearProducts();
      setSelectedProduct(null);
      setSearchNote(
        "Store database is offline — please start the FastAPI backend."
      );
      return "Search failed: the store database is offline right now. Ask the user to start the backend, or try again later.";
    } finally {
      setSearchLoading(false);
    }
  });

  // ── add_to_cart client tool ───────────────────────────────
  // Adds a product to the in-browser bag (persisted to localStorage),
  // shows the count in the popup header, and confirms by voice.
  useConversationClientTool<{
    add_to_cart: (params: AddToCartParams) => Promise<string>;
  }>("add_to_cart", async (params) => {
    const name = (params.product_name ?? "").trim();
    const id = params.product_id ? String(params.product_id) : "";
    const rawQty = Number(params.quantity);
    const qty = Number.isFinite(rawQty)
      ? Math.max(1, Math.min(99, Math.round(rawQty)))
      : 1;

    let product =
      searchProducts.find(
        (p) =>
          (id && String(p.id) === id) ||
          (name && p.name.toLowerCase().includes(name.toLowerCase()))
      ) ?? null;

    if (!product && name) {
      try {
        const res = await fetch(`${apiBase}/api/voice/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: name, limit: 1 }),
        });
        if (res.ok) {
          const d = await res.json();
          const list = Array.isArray(d.products) ? d.products : [];
          if (list.length) product = list[0];
        }
      } catch {
        product = null;
      }
    }

    if (!product) {
      return `I could not find "${name || "that product"}" in the store catalog to add to the bag. Please ask the user to say the product name again.`;
    }

    addToBag(product, qty);
    setPopupOpen(true);
    return `Added to bag: ${product.name} [URDU PRICE WORDS: ${rupeesInUrdu(
      product.price
    )}], quantity ${qty} [URDU: ${numberToUrduWords(qty)}]. The bag now has ${
      bagCount + qty
    } items.`;
  });

  // ── attach_photo client tool (selfie for personalized styling) ──
  const [userPhoto, setUserPhoto] = useState<{
    name: string;
    dataUrl: string;
    width: number;
    height: number;
    tone: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<{ res: (f: File | null) => void } | null>(
    null
  );

  const guessSkinTone = async (dataUrl: string): Promise<string> => {
    try {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      const nw = img.naturalWidth || 220;
      const nh = img.naturalHeight || 220;
      const w = Math.min(220, nw);
      const h = Math.round(nh * (w / nw));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "MEDIUM";
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      const x0 = Math.floor(w * 0.3),
        x1 = Math.floor(w * 0.7),
        y0 = Math.floor(h * 0.15),
        y1 = Math.floor(h * 0.6);
      for (let y = y0; y < y1; y += 4) {
        for (let x = x0; x < x1; x += 4) {
          const i = (y * w + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }
      r /= n;
      g /= n;
      b /= n;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      let tone =
        lum > 0.62 ? "LIGHT" : lum > 0.48 ? "MEDIUM" : lum > 0.34 ? "MEDIUM_DARK" : "DARK";
      if (sat > 0.28 && r > g * 1.12 && r > b * 1.2) {
        if (tone === "LIGHT") tone = "MEDIUM";
        else if (tone === "MEDIUM") tone = "MEDIUM_DARK";
        else if (tone === "MEDIUM_DARK") tone = "DARK";
      }
      return tone;
    } catch {
      return "MEDIUM";
    }
  };

  const readImageFile = (
    file: File
  ): Promise<{ dataUrl: string; width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () =>
          resolve({
            dataUrl: String(fr.result),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        img.onerror = () => reject(new Error("invalid image"));
        img.src = String(fr.result);
      };
      fr.onerror = () => reject(new Error("read error"));
      fr.readAsDataURL(file);
    });

  // ── Image ko chhota/light karo (Gemini ko bhejne se pehle) ──
  // Mobile camera photos bahut bari hoti hain (multi-MB base64) — bina
  // downscale ke Gemini image reject ya slow ho jata hai. 1024px max +
  // JPEG compression se payload chota aur call reliable ban jata hai.
  const downscaleImage = (
    dataUrl: string,
    maxDim = 1024,
    quality = 0.82
  ): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const openPhotoPicker = (): Promise<File | null> =>
    new Promise((resolve) => {
      pendingPhotoRef.current = { res: resolve };
      photoInputRef.current?.click();
    });

  // ── CAMERA: real webcam selfie (desktop/mobile dono) ──
  const openCamera = async () => {
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch (err) {
      console.error("camera error:", err);
      setCameraError(
        "Camera access nahi mili — browser permission dekar dobara koshish karein, ya 'Send My Photo' use karein."
      );
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setCameraError(
        "Camera abhi ready nahi hai — ek second ruk kar dobara try karein."
      );
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const file = dataUrlToFile(dataUrl, "selfie.jpg");
      stopCamera();
      setCameraOpen(false);
      void handleAttachPhoto(file);
    } catch (err) {
      console.error("capture error:", err);
      setCameraError("Selfie capture me error aaya — dobara try karein.");
    }
  };

  // ── LIVE TRY-ON: camera khol kar selected kapra live dikhao ──
  const openLiveTryOn = async (preferredId?: number) => {
    const list = searchProductsRef.current;
    const fallback =
      list.length > 0
        ? list.reduce((a, b) => (b.price > a.price ? b : a)).id
        : null;
    setLiveProductId(preferredId ?? fallback);
    setLiveOverlay({ x: 0, y: 0, scale: 1, opacity: 0.92 });
    liveAdjustRef.current = { scale: 1, opacity: 0.92 };
    setLiveResult(null);
    setLiveError(null);
    setLiveView("ai");
    setCameraError(null);
    setLiveOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      liveStreamRef.current = stream;
      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => undefined);
        }
      });
    } catch (err) {
      console.error("live camera error:", err);
      setCameraError(
        "Camera access nahi mili — browser me camera allow karein, phir Live Try-On dobara kholein."
      );
      setLiveOpen(false);
    }
  };

  const stopLiveTryOn = () => {
    liveStreamRef.current?.getTracks().forEach((t) => t.stop());
    liveStreamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    liveDragRef.current = null;
    liveBusyRef.current = false;
    if (poseRafRef.current) {
      cancelAnimationFrame(poseRafRef.current);
      poseRafRef.current = 0;
    }
    poseLandmarkerRef.current = null;
    setLiveTracking(false);
    setLiveOpen(false);
  };

  // Pose landmarks → garment ko torso par real-time place karo (DOM style).
  const placeLiveOverlay = (
    img: HTMLImageElement,
    video: HTMLVideoElement,
    container: HTMLDivElement,
    pts: PosePoint[]
  ) => {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!cw || !ch || !vw || !vh) return;
    // video element "object-cover" hai → cover transform nikalo.
    const coverScale = Math.max(cw / vw, ch / vh);
    const dispW = vw * coverScale;
    const dispH = vh * coverScale;
    const offX = (cw - dispW) / 2;
    const offY = (ch - dispH) / 2;
    const px = (p: PosePoint) => ({
      x: p.x * dispW + offX,
      y: p.y * dispH + offY,
    });
    const ls = px(pts[11]);
    const rs = px(pts[12]);
    const lh = px(pts[23]);
    const rh = px(pts[24]);
    const sx = (ls.x + rs.x) / 2;
    const sy = (ls.y + rs.y) / 2;
    const hx = (lh.x + rh.x) / 2;
    const hy = (lh.y + rh.y) / 2;
    const shoulderW = Math.hypot(rs.x - ls.x, rs.y - ls.y);
    const torsoH = Math.hypot(hx - sx, hy - sy);
    if (shoulderW < 8 || torsoH < 8) {
      // Person clear nahi mila — overlay chhupa do.
      img.style.opacity = "0";
      return;
    }
    const angle = Math.atan2(rs.y - ls.y, rs.x - ls.x);
    const adj = liveAdjustRef.current;
    const centerX = (sx + hx) / 2;
    img.style.left = `${centerX}px`;
    img.style.top = `${sy - torsoH * 0.12}px`;
    img.style.width = `${shoulderW * 1.7 * adj.scale}px`;
    img.style.height = "auto";
    img.style.opacity = String(adj.opacity);
    img.style.transform = `translate(-50%, -6%) rotate(${angle}rad)`;
  };

  const onLivePointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLImageElement).setPointerCapture?.(e.pointerId);
    liveDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: liveOverlay.x,
      baseY: liveOverlay.y,
    };
  };
  const onLivePointerMove = (e: ReactPointerEvent<HTMLImageElement>) => {
    const d = liveDragRef.current;
    if (!d?.active) return;
    setLiveOverlay((prev) => ({
      ...prev,
      x: d.baseX + (e.clientX - d.startX),
      y: d.baseY + (e.clientY - d.startY),
    }));
  };
  const onLivePointerUp = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (liveDragRef.current) liveDragRef.current.active = false;
    (e.currentTarget as HTMLImageElement).releasePointerCapture?.(e.pointerId);
  };

  // Live frame capture → raw selfie attach → wahi existing AI try-on chal jata hai.
  const captureLive = () => {
    const video = liveVideoRef.current;
    if (!video || video.videoWidth === 0) {
      setCameraError(
        "Camera abhi ready nahi hai — ek second ruk kar dobara try karein."
      );
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const file = dataUrlToFile(dataUrl, "live-tryon.jpg");
      stopLiveTryOn();
      void handleAttachPhoto(file);
    } catch (err) {
      console.error("live capture error:", err);
      setCameraError("Live capture me error aaya — dobara try karein.");
    }
  };

  // ── AI LIVE OUTCOME: current live frame + selected kapra → Gemini ──
  // Ye wahi kapra user ke JISM par laga kar dikhata hai (realistic image).
  // Live camera frame har baar utha kar backend /api/image/generate ko bhejte
  // hain, aur wapas aayi image ko "AI Result" view me dikhate hain.
  const generateLiveTryOn = async (
    product: SearchProduct | null,
    showResult = true
  ) => {
    if (!product) {
      setLiveError("Pehle koi kapra select karein.");
      return;
    }
    const video = liveVideoRef.current;
    if (liveBusyRef.current) return;
    if (!video || video.videoWidth === 0) {
      setLiveError("Camera ready nahi — ek second baad automatically try hoga.");
      return;
    }
    liveBusyRef.current = true;
    setLiveGenerating(true);
    setLiveError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(video, 0, 0);
      const frame = await downscaleImage(
        canvas.toDataURL("image/jpeg", 0.9),
        1024,
        0.82
      );
      const prompt = `Virtual try-on: show this EXACT same person (reference photo attached) wearing the EXACT garment shown in the product reference image (copy its design, color, pattern, fabric, cut and style precisely). Realistic photo of the person from head to waist, natural lighting, the outfit fits perfectly on their body. Keep the person's face, hair, skin tone and body shape identical to their reference photo.`;
      const res = await fetch(`${apiBase}/api/image/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect: "1:1",
          user_image: frame,
          product_image_url: absUrl(product.image),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok && data.data_url) {
        const shown = await downscaleImage(data.data_url, 900, 0.9);
        setLiveResult(shown);
        // Auto (background) generation me user ko Live view par hi rehne do
        // taake movement chalta rahe; result "AI Result" toggle me milega.
        if (showResult) setLiveView("ai");
      } else {
        throw new Error(data.error ?? "unknown error");
      }
    } catch (err) {
      console.error("live AI try-on error:", err);
      setLiveError(
        err instanceof Error
          ? `AI try-on: ${err.message}`
          : "AI try-on fail hui — dobara try karein"
      );
    } finally {
      liveBusyRef.current = false;
      setLiveGenerating(false);
    }
  };

  // Ek product ka AI try-on dobara banawane ke liye (card ke RETRY button se).
  const retryTryOn = (p: SearchProduct) => {
    setToast(`AI try-on dobara bana raha hai: ${p.name}...`);
    void generateTryOnImages([p]);
  };

  // Plain function (useCallback([]) nahi) — takay har render pe nayi closure
  // mile aur try-on sempre latest photo/products use kare (stale-data na ho).
  const handleAttachPhoto = async (file: File | null) => {
    if (!file) return null;
    try {
      const { dataUrl, width, height } = await readImageFile(file);
      const tone = await guessSkinTone(dataUrl);
      const small = await downscaleImage(dataUrl);
      const photoInfo = { name: file.name, dataUrl: small, width, height, tone };
      userPhotoRef.current = photoInfo;
      setUserPhoto(photoInfo);
      setPopupOpen(true);
      setToast(`Photo attached: ${file.name} (${width}\u00d7${height}) — tone ${tone}`);

      // ── SMART AUTO TRY-ON (kuch kehne ki zaroorat nahi) ──
      // Photo milti hi turant: default "suite" products fetch → face
      // ke hisaab se best match → Gemini image generate. Agent ka
      // kahene ka wait nahi hota, aur nazar bhi aata hai kya ho raha.
      tryOnStartedRef.current = true;
      const ensureAndAutoTryOn = async () => {
        // POPUP WALE SUITES: jo abhi popup me dikh rahe hain wahi list use
        // hoti hai — nayi list nahi banate. Sirf agar popup khali ho to
        // default "suite" fetch karte hain.
        let list: SearchProduct[] = searchProductsRef.current.slice(0, 3);
        if (list.length === 0) {
          try {
            const r = await fetch(`${apiBase}/api/voice/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: "suite", limit: 3 }),
            });
            const d = await r.json();
            list = Array.isArray(d.products) ? d.products.slice(0, 3) : [];
            if (list.length > 0) {
              applyProducts(list);
              setSearchNote(
                typeof d.note === "string"
                  ? d.note
                  : "Auto-selected matching suits for your photo."
              );
            }
          } catch {
            /* products fetch fail — agent list_products aayega to use trigger hoga */
          }
        }
        if (list.length > 0) {
          tryOnStartedRef.current = true;
          await generateTryOnImages(list);
        } else {
          // Agar products nahi mile to agent list_products par depend
          // rahega — autoTryOnRef baad me trigger karega.
          tryOnStartedRef.current = false;
        }
      };
      void ensureAndAutoTryOn();

      return { name: file.name, width, height, tone };
    } catch {
      setToast("Could not read that image file. Please try another photo.");
      return null;
    }
  };

  useConversationClientTool<{
    attach_photo: () => Promise<string>;
  }>("attach_photo", async () => {
    const file = await openPhotoPicker();
    if (!file) {
      return "The user cancelled or did not choose a photo. Ask them politely again if they still want to send one.";
    }
    const info = await handleAttachPhoto(file);
    if (!info) {
      return `I could not read the image the user selected. Ask them to choose a clear selfie instead.`;
    }
    // Photo aa gayi — agli list_products ke saath automatic AI try-on
    // bhi chalana hai (mehanga product + user ki photo).
    autoTryOnRef.current = true;
    return `User attached a photo: ${info.name} (${info.width} x ${info.height}). approximate skin_tone_guess=${info.tone}. Now recommend 3-5 real products from list_products that suit this skin tone. The app will AUTO-GENERATE an AI try-on image (most expensive product + this photo) — you will see it mentioned in the tool result; acknowledge it to the user.`;
  });

  // ── generate_image client tool (Gemini via backend) ──
  // Agent is tool ko call karta hai jab user koi nayi tasveer banwana
  // chahe (jaise "kitchen ka design banao", "outfit ka sketch banao").
  // Backend /api/image/generate Gemini se base64 image wapas karta hai,
  // frontend popup ke andar dikhata hai aur string wapas agent ko.
  useConversationClientTool<{
    generate_image: (params: {
      prompt?: string;
      aspect?: string;
    }) => Promise<string>;
  }>("generate_image", async (params) => {
    // AUTO TRY-ON (sabse mehanga product): agar user ki photo attached hai
    // AUR popup ke andar products dikhe hain, to unhi mein se sabse mehanga
    // product choose karke usi par user ki image fit karke nayi image banai
    // jati hai — taake user apne face par dekh sake ke ye outfit acha lagega.
    let prompt = (params.prompt ?? "").trim();
    let tryOnProduct: {
      name: string;
      price: number;
      style?: string;
      image?: string;
    } | null = null;
    const attachedPhoto = userPhotoRef.current;
    if (attachedPhoto && searchProducts.length > 0) {
      const mostExpensive = searchProducts.reduce((a, b) =>
        b.price > a.price ? b : a
      );
      tryOnProduct = {
        name: mostExpensive.name,
        price: mostExpensive.price,
        style: mostExpensive.style ?? undefined,
        image: mostExpensive.image ?? undefined,
      };
    }
    if (tryOnProduct) {
      const productDesc = tryOnProduct.style
        ? `${tryOnProduct.name} (${tryOnProduct.style})`
        : tryOnProduct.name;
      prompt = `Virtual try-on from the store popup list: the reference photo of the EXACT garment/suit is attached below — copy precisely its design, color, fabric look, cut and style. Show this EXACT person (reference photo attached) wearing that EXACT same garment "${productDesc}" (price Rs ${tryOnProduct.price}). Natural, realistic photo. Keep the person's face, hair and skin tone identical to their reference photo. The outfit fits perfectly and looks wonderful on them.`;
    }
    if (!prompt) {
      return "Image generation cancelled: no prompt was given. Ask the user what they want drawn.";
    }
    setGeneratingImage(true);
    setPopupOpen(true);
    setSelectedProduct(null);
    try {
      const res = await fetch(`${apiBase}/api/image/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect: params.aspect ?? "1:1",
          // User ki attached photo (agar ho) Gemini ko reference ke liye —
          // taake try-on jaisi image ban sake (face pe kapra dikhane ko).
          user_image: userPhotoRef.current ? userPhotoRef.current.dataUrl : "",
          // Popup wale suit ki ASLI tasveer — backend URL se download
          // karke Gemini ko reference deta hai taake WOHI suit dikhe.
          product_image_url: absUrl(tryOnProduct?.image ?? ""),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok && data.data_url) {
        setGeneratedImage({
          dataUrl: data.data_url,
          caption: data.caption ?? "",
          prompt,
        });
        setSearchNote(data.caption || "AI try-on image generated");
        const confirm =
          tryOnProduct && userPhoto
            ? ` Try-on complete: the user is now wearing the most expensive product from the popup list (${tryOnProduct.name} at Rs ${tryOnProduct.price} [URDU PRICE WORDS: ${rupeesInUrdu(tryOnProduct.price)}]) in the generated image. Confirm to the user in their language that they look great in it and suggest buying it.`
            : "";
        return `Image generated successfully. ${data.caption ?? ""}${confirm}`;
      }
      setGeneratedImage(null);
      setSearchNote(
        "Image generation failed — backend keh raha hai: " +
          (data.error ?? "unknown error")
      );
      return `Image generation failed: ${data.error ?? "unknown error"}`;
    } catch (err) {
      console.error("generate_image error:", err);
      setGeneratedImage(null);
      const reason =
        err instanceof Error ? err.message : "backend unreachable";
      setSearchNote("Image service is offline right now.");
      setToast(`AI image generation failed: ${reason}. Backend start/redeploy (Vercel) check karein.`);
      return "Image generation failed because the backend image service is offline right now.";
    } finally {
      setGeneratingImage(false);
    }
  });

  const startVoice = useCallback(async () => {
    setError(null);
    if (!agentId) {
      setError(
        "NEXT_PUBLIC_ELEVENLABS_AGENT_ID is missing — add it to my-app/.env and restart the dev server."
      );
      setOpen(true);
      return;
    }
    try {
      // Noise guard pehle install karo — taake SDK ka apna getUserMedia call
      // bhi filtered (high-pass + noise gate) stream se guzre.
      installVoiceNoiseGuard();
      // Permission check wala temporary mic — ise turant band kar dete hain
      // warna do mic ek saath khule rehte hain (extra noise + battery).
      const preflight = await navigator.mediaDevices.getUserMedia({ audio: true });
      preflight.getTracks().forEach((t) => t.stop());
      const overrides = {
        agent: {
          // Wahi pehla message jo pehle tha — koi change nahi.
          firstMessage:
            "Assalam o alaikum! 👋 Main aapka AI shopping assistant hoon. Main aapko products find karne, compare karne aur outfit choose karne mein help kar sakta hoon. Aaj main aapki kis tarah help karun?",
        },
        asr: {
          keywords: VOICE_ASR_KEYWORDS,
        },
      };
      startSession({ agentId, overrides });
      setOpen(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not start voice assistant.";
      console.error("Voice assistant error:", err);
      setError(msg);
      setOpen(true);
    }
  }, [agentId, startSession]);

  const stopVoice = useCallback(() => {
    endSession();
  }, [endSession]);

  const isSpeaking = outputLevel > inputLevel;
  const activeLevel = Math.max(inputLevel, outputLevel);
  const scale = 1 + activeLevel * 0.25;
  const glowOpacity = 0.25 + activeLevel * 0.55;

  const statusLabel =
    status === "connecting"
      ? "Connecting\u2026"
      : status === "connected"
        ? isSpeaking
          ? "Speaking\u2026"
          : "Listening\u2026"
        : status === "error"
          ? message || "Connection error"
          : "Tap to talk";

  const premiumProduct =
    searchProducts.length > 0
      ? searchProducts.reduce((a, b) => (b.price > a.price ? b : a))
      : null;

  const openDetail = (p: SearchProduct) => {
    setSelectedProduct(p);
  };

  // Live try-on me jo kapra currently overlay ho raha hai.
  const liveProduct =
    searchProducts.find((p) => p.id === liveProductId) ??
    searchProducts[0] ??
    null;

  // sliders + view ko refs me mirror karo (RAF loop ko fresh values milein).
  useEffect(() => {
    liveAdjustRef.current = {
      scale: liveOverlay.scale,
      opacity: liveOverlay.opacity,
    };
  }, [liveOverlay.scale, liveOverlay.opacity]);
  const liveViewRef = useRef(liveView);
  useEffect(() => {
    liveViewRef.current = liveView;
  }, [liveView]);

  // ── LIVE POSE TRACKING: selected kapra user ke JISM par real-time ──
  // Har video frame par pose detect hoti hai aur garment (position + size +
  // rotation) body ke sath move karta hai — user kisi bhi angle se move kare.
  // Kapra sirf tab badalta hai jab user neeche se khud select kare (auto nahi).
  useEffect(() => {
    if (!liveOpen) return;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      poseRafRef.current = requestAnimationFrame(loop);
      const video = liveVideoRef.current;
      const img = liveOverlayImgRef.current;
      const container = liveContainerRef.current;
      const landmarker = poseLandmarkerRef.current;
      if (
        !landmarker ||
        !video ||
        !img ||
        !container ||
        liveViewRef.current !== "camera" ||
        video.readyState < 2 ||
        video.videoWidth === 0
      ) {
        return;
      }
      try {
        const res = landmarker.detectForVideo(video, performance.now());
        const pts = res?.landmarks?.[0];
        if (pts && pts.length >= 25) {
          placeLiveOverlay(img, video, container, pts);
        }
      } catch {
        /* ek frame skip — next frame phir try */
      }
    };
    const start = async () => {
      setLiveTrackLoading(true);
      setLiveTrackError(null);
      try {
        const lm = await loadPoseLandmarker();
        if (cancelled) return;
        poseLandmarkerRef.current = lm;
        setLiveTracking(true);
        setLiveTrackLoading(false);
        loop();
      } catch (err) {
        console.warn("pose tracking load failed", err);
        if (cancelled) return;
        setLiveTracking(false);
        setLiveTrackLoading(false);
        setLiveTrackError(
          "Live body tracking load nahi hui — Camera view me kapra manually drag karein."
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      if (poseRafRef.current) {
        cancelAnimationFrame(poseRafRef.current);
        poseRafRef.current = 0;
      }
      setLiveTracking(false);
    };
  }, [liveOpen]);

  // Live me product select karte hi (aur live khulte hi) AI khud realistic
  // image bana kar user ke REAL chehre/jism par dikhaye — camera feed par
  // asli product-image ka box nahi. Auto-refresh NAHI — sirf jab product
  // badle / live khule. Kapra apne aap change nahi hota.
  useEffect(() => {
    if (!liveOpen || !liveProduct) return;
    let cancelled = false;
    let tries = 0;
    const attempt = () => {
      if (cancelled) return;
      const v = liveVideoRef.current;
      if (v && v.videoWidth > 0 && !liveBusyRef.current) {
        const p =
          searchProductsRef.current.find((x) => x.id === liveProductId) ??
          liveProduct;
        void generateLiveTryOn(p, true);
        return;
      }
      tries += 1;
      if (tries < 40) setTimeout(attempt, 250);
    };
    const t = setTimeout(attempt, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOpen, liveProductId]);

  // ── LIVE VIDEO FEEL: har ~4s me selected kapra current pose par AI se dobara
  // banao taake woh user ke jism par "chipka" mehsoos ho (khade/baith/move).
  // Wohi ek kapra rehta hai — sirf user ke move ke sath update hota hai;
  // neeche se doosra select karne tak nahi badalta. Live cutout view me pause.
  useEffect(() => {
    if (!liveOpen || !liveProduct) return;
    const id = setInterval(() => {
      if (liveBusyRef.current) return;
      if (liveViewRef.current !== "ai") return;
      const v = liveVideoRef.current;
      if (!v || v.videoWidth === 0) return;
      const p =
        searchProductsRef.current.find((x) => x.id === liveProductId) ??
        liveProduct;
      void generateLiveTryOn(p, true);
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOpen, liveProductId]);

  return (
    <>
      {/* Animation keyframes */}
      <style>{`
        @keyframes va-rotate { to { transform: rotate(360deg); } }
        @keyframes va-breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.14); opacity: 0.75; }
        }
        @keyframes va-aura {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.22); opacity: 0.55; }
        }
        @keyframes va-pop {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes va-wave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        @keyframes va-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes va-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes va-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Hidden file input for selfie/photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          const p = pendingPhotoRef.current;
          pendingPhotoRef.current = null;
          if (p) p.res(f);
          else if (f) void handleAttachPhoto(f);
        }}
      />

      {/* ── Floating launcher button (matches chatbot icon) ── */}
      {!open && (
        <button
          onClick={startVoice}
          aria-label="Open voice assistant"
          className="group fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-black text-white shadow-[0_12px_35px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_rgba(0,0,0,0.32)] active:scale-95 cursor-pointer"
        >
          {/* Mic icon (matches chat icon line style) */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3" />
          </svg>

          {/* Online dot */}
          <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />

          {/* Hover label */}
          <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/90 text-white text-[11px] font-semibold px-3 py-1.5 shadow-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            Tap to talk
          </span>
        </button>
      )}

      {/* ── Voice assistant panel (matches chatbot window) ── */}
      {open && (
        <div
          className="fixed bottom-40 right-6 z-50 w-[330px] max-w-[calc(100vw-40px)] rounded-[24px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.22)] border border-gray-200 overflow-hidden flex flex-col"
          style={{ animation: "va-pop 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        >
          {/* Header */}
          <div className="relative bg-black text-white px-5 py-4 shrink-0">
            {/* Subtle header shine (matches chatbot) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar (white circle + mic, like chatbot's "AI" badge) */}
                <div className="relative h-11 w-11 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v2" />
                  </svg>
                  {/* Online indicator */}
                  <span
                    className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-black"
                    style={{
                      background:
                        status === "connected"
                          ? "#22c55e"
                          : status === "error"
                            ? "#ef4444"
                            : "#f59e0b",
                    }}
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-[14px] tracking-tight">
                    Voice Shopping Assistant
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background:
                          status === "connected"
                            ? "#22c55e"
                            : status === "error"
                              ? "#ef4444"
                              : "#f59e0b",
                      }}
                    />
                    <span className="text-[11px] text-gray-300">
                      {status === "connected"
                        ? "Listening · 5 languages"
                        : "Tap Talk to start"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                aria-label="Close voice assistant"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Voice orb area */}
          <div className="relative w-full h-[250px] flex items-center justify-center bg-[#f7f7f8] overflow-hidden">
            {/* Ambient soft blobs */}
            <span className="absolute top-10 left-8 h-24 w-24 rounded-full bg-black/[0.045] blur-2xl pointer-events-none" />
            <span className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-black/[0.045] blur-2xl pointer-events-none" />

            {/* Spinning status ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 150,
                height: 150,
                background:
                  status === "connected"
                    ? "conic-gradient(from 0deg, transparent 0deg, rgba(0,0,0,0.28) 95deg, transparent 210deg)"
                    : "conic-gradient(from 0deg, transparent 0deg, rgba(0,0,0,0.14) 100deg, transparent 240deg)",
                animation: "va-rotate 2.8s linear infinite",
              }}
            />

            {/* Voice-reactive rings (only when connected) */}
            {status === "connected" && (
              <>
                <div
                  className="absolute rounded-full bg-black/10 pointer-events-none"
                  style={{
                    width: 182,
                    height: 182,
                    transform: `scale(${scale + 0.25})`,
                    opacity: glowOpacity * 0.45,
                    transition:
                      "transform 0.08s ease-out, opacity 0.08s ease-out",
                  }}
                />
                <div
                  className="absolute rounded-full bg-black/10 pointer-events-none"
                  style={{
                    width: 150,
                    height: 150,
                    transform: `scale(${scale + 0.1})`,
                    opacity: glowOpacity * 0.3,
                    transition:
                      "transform 0.08s ease-out, opacity 0.08s ease-out",
                  }}
                />
              </>
            )}

            {/* Main orb (black, matches chatbot) */}
            <button
              onClick={status === "connected" ? stopVoice : startVoice}
              aria-label={status === "connected" ? "Stop voice" : "Start voice"}
              className="relative z-10 w-[104px] h-[104px] rounded-full bg-black text-white flex items-center justify-center border-[3px] border-white cursor-pointer outline-none"
              style={{
                boxShadow:
                  status === "connected"
                    ? `0 0 ${30 + activeLevel * 50}px rgba(0,0,0,${glowOpacity * 0.6}), 0 14px 35px rgba(0,0,0,0.4)`
                    : "0 14px 35px rgba(0,0,0,0.35)",
                transform: `scale(${status === "connected" ? scale : 1})`,
                transition: "box-shadow 0.1s ease-out, transform 0.1s ease-out",
              }}
            >
              {/* Inner gloss */}
              <span className="absolute top-3.5 left-6 w-9 h-4 rounded-full bg-white/10 blur-[2px] pointer-events-none" />

              {status === "connected" ? (
                /* Stop icon (white square) */
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="relative z-10"
                >
                  <rect x="6" y="6" width="12" height="12" rx="3" />
                </svg>
              ) : (
                /* Mic icon */
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3" />
                </svg>
              )}
            </button>

            {/* Status pill */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/95 border border-gray-200 shadow-sm px-3.5 py-1.5 flex items-center gap-2 backdrop-blur">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    status === "error"
                      ? "#ef4444"
                      : status === "connected"
                        ? "#22c55e"
                        : "#f59e0b",
                }}
              />
              <span
                className="text-[11px] font-medium text-gray-800"
                style={{ color: status === "error" ? "#ef4444" : undefined }}
              >
                {error && status !== "error" ? error : statusLabel}
              </span>
            </div>
          </div>

          {/* Footer / controls (matches chatbot input style) */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-3">
            {status === "connected" ? (
              <button
                onClick={stopVoice}
                className="w-full h-11 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                End conversation
              </button>
            ) : (
              <button
                onClick={startVoice}
                className="w-full h-11 rounded-xl bg-black text-white text-[13px] font-semibold hover:bg-gray-800 active:scale-[0.98] transition cursor-pointer"
              >
                Start speaking
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <p className="text-[9px] text-gray-400 tracking-wide">
                AI Shopping Assistant · Urdu · English · Pashto · Sindhi · Punjabi
              </p>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
            </div>
          </div>
        </div>
      )}

      {/* ── Product results popup (real images, clickable cards) ── */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            selectedProduct ? "Product details" : "Product search results"
          }
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setPopupOpen(false);
              setSelectedProduct(null);
            }}
          />
          <div className="relative z-10 w-full max-w-[680px] max-h-[84vh] rounded-[24px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)] border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {selectedProduct && (
                  <button
                    onClick={() => setSelectedProduct(null)}
                    aria-label="Back to results"
                    className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer shrink-0"
                  >
                    <BackIcon />
                  </button>
                )}
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <BagIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight truncate">
                    {searchLoading
                      ? "Searching products\u2026"
                      : selectedProduct
                        ? "Search Results"
                        : "Search Results"}
                  </p>
                  <p className="text-[10px] text-blue-100 mt-0.5 truncate">
                    {searchNote || "Real products from our store"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Bag button with count → opens bag drawer */}
                <button
                  onClick={() => {
                    if (bagCount === 0) {
                      setToast("Bag is empty — add a product to it");
                      return;
                    }
                    setBagOpen(true);
                  }}
                  aria-label={`Shopping bag: ${bagCount} items`}
                  className="relative h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
                >
                  <BagIcon size={17} />
                  {bagCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {bagCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPopupOpen(false);
                    setSelectedProduct(null);
                  }}
                  aria-label="Close results"
                  className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50/60">
              {/* Photo bar — selfie for personalized styling */}
              <div className="shrink-0 border-b border-gray-200 bg-white/80 px-4 py-2.5">
                {userPhoto ? (
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-12 w-10 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={userPhoto.dataUrl}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">
                        {userPhoto.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {userPhoto.width}
                        {"\u00d7"}
                        {userPhoto.height} · skin tone
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold " +
                        (userPhoto.tone === "LIGHT"
                          ? "bg-sky-100 text-sky-700"
                          : userPhoto.tone === "DARK"
                            ? "bg-gray-800 text-white"
                            : "bg-amber-100 text-amber-800")
                      }
                    >
                      {userPhoto.tone}
                    </span>
                    <button
                      onClick={() => {
                        userPhotoRef.current = null;
                        setUserPhoto(null);
                        setToast("Photo removed.");
                      }}
                      aria-label="Remove photo"
                      className="h-7 w-7 shrink-0 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {/* REAL CAMERA SELFIE button */}
                    <button
                      onClick={() => void openCamera()}
                      className="w-full h-9 rounded-xl bg-black text-white text-[11px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.99] transition cursor-pointer"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      Take Selfie (Camera)
                    </button>
                    <button
                      onClick={() => {
                        void openPhotoPicker().then(async (file) => {
                          const info = await handleAttachPhoto(file);
                          if (info) {
                            // Photo mile to automatic AI try-on ready ho jaye — par
                            // handleAttachPhoto pehle hi auto-run shuru karta hai,
                            // duplicate se bachne ke liye tryOnStartedRef guard hai.
                            autoTryOnRef.current = true;
                            if (
                              !tryOnStartedRef.current &&
                              searchProducts.length > 0
                            ) {
                              autoTryOnRef.current = false;
                              tryOnStartedRef.current = true;
                              void generateTryOnImages(searchProducts);
                            }
                            sendUserMessage(
                              `Main ne abhi ek photo attach ki hai (${info.name}, ${info.width}x${info.height}), approximate skin_tone_guess=${info.tone}. Ab is skin tone ke hisaab se list_products se 3-5 real products recommend karo jo is colour ke saath achhi lagayengi, aur confirm karo ke wo results popup me dikh rahe hain. AI try-on images ab HAR product par auto-generate ho rahi hain (meri photo + wahi garment) — wo cards ke corner me dikh rahi hain, use bhi acknowledge karna.`
                            );
                          }
                        });
                      }}
                      className="w-full h-9 rounded-xl border border-dashed border-blue-300 bg-blue-50 text-blue-600 text-[11px] font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-[0.99] transition cursor-pointer"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      Send My Photo
                      <span className="text-blue-400">· matching with tone</span>
                    </button>
                  </div>
                )}
                {/* LIVE TRY-ON — camera khol kar selected kapra live dikhao */}
                <button
                  onClick={() => void openLiveTryOn()}
                  className="mt-1.5 w-full h-9 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[11px] font-semibold flex items-center justify-center gap-2 hover:from-fuchsia-700 hover:to-purple-700 active:scale-[0.99] transition cursor-pointer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Live Try-On — camera par kapra live
                </button>
              </div>

              {/* AI generated image bar (Gemini) */}
              {generatedImage && (
                <div className="shrink-0 border-b border-gray-200 bg-white/80 px-4 py-2.5">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setFullImage(generatedImage.dataUrl)}
                      className="relative h-40 w-40 shrink-0 cursor-zoom-in rounded-lg overflow-hidden border border-gray-200 bg-gray-100 transition hover:opacity-90"
                      aria-label="Enlarge AI generated image"
                    >
                      <img
                        src={generatedImage.dataUrl}
                        alt="AI generated"
                        onLoad={() =>
                          setBrokenImage((prev) =>
                            prev.bar ? { ...prev, bar: false } : prev
                          )
                        }
                        onError={() =>
                          setBrokenImage((prev) => ({ ...prev, bar: true }))
                        }
                        className={
                          brokenImage.bar
                            ? "hidden"
                            : "w-full h-full object-cover"
                        }
                      />
                      {brokenImage.bar && (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center text-[10px] font-semibold leading-tight text-red-500">
                          <span className="text-base">⚠️</span>
                          Image load nahi hui — ✕ se band karein ya dobara try
                          karein
                        </span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[10px] text-gray-500 line-clamp-2">
                        {generatedImage.caption || generatedImage.prompt}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedImage(null);
                        setSearchNote("AI image removed.");
                      }}
                      aria-label="Remove generated image"
                      className="h-7 w-7 shrink-0 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>
              )}
              {generatingImage && (
                <div className="shrink-0 border-b border-gray-200 bg-amber-50/80 px-4 py-2.5">
                  <div className="flex items-center gap-2.5 text-[11px] text-amber-800">
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {GEN_STEPS[genStep] ?? GEN_STEPS[0]}
                      </p>
                      <p className="text-[10px] text-amber-700">
                        image generate ho gayi hai —
                        har card ke upper corner me dikhti hai, aur mehanga
                        wali sabse upar bar me dikhti hai.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {searchLoading ? (
                <div className="flex items-center justify-center py-14 gap-2 text-sm text-gray-500">
                  <span className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  {"Loading real products\u2026"}
                </div>
              ) : searchProducts.length === 0 ? (
                /* ── Empty state ── */
                <div className="py-14 text-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                    className="mx-auto mb-3"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {searchNote || "No products found."}
                  </p>
                </div>
              ) : (
                /* ── Grid ALWAYS visible + detail beside it ── */
                <div className="flex flex-col md:flex-row">
                  {selectedProduct &&
                    (() => {
                      const p = selectedProduct;
                      const discount =
                        p.oldPrice && p.oldPrice > p.price
                          ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                          : 0;
                      return (
                        <div className="md:w-[340px] md:shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white p-4 md:sticky md:top-0">
                          {/* Details for the opened product */}
                          <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 aspect-[3/4]">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.opacity = "0.15";
                              }}
                            />
                            {discount > 0 && (
                              <span className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow">
                                -{discount}%
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 text-[14px] font-semibold text-gray-900 leading-snug">
                            {p.name}
                          </h3>
                          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                            <span className="text-[22px] font-extrabold text-blue-600">
                              Rs{p.price.toLocaleString()}
                            </span>
                            {p.oldPrice && p.oldPrice > p.price && (
                              <span className="text-[13px] text-gray-400 line-through">
                                Rs{p.oldPrice.toLocaleString()}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                Save {discount}%
                              </span>
                            )}
                          </div>
                          {p.style && (
                            <p className="mt-3 text-[11px] text-gray-600">
                              <span className="font-semibold text-gray-800">
                                Style:
                              </span>{" "}
                              {p.style}
                            </p>
                          )}
                          {p.productId && (
                            <p className="mt-1 text-[10px] text-gray-400">
                              Product ID: {p.productId}
                            </p>
                          )}
                          <div className="mt-4 flex flex-col gap-2">
                            {isInBag(p.id) ? (
                              <button
                                onClick={() => removeFromBag(p.id)}
                                className="h-11 rounded-full bg-emerald-500 border border-emerald-500 text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition cursor-pointer"
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                                In Bag · tap to remove
                              </button>
                            ) : (
                              <button
                                onClick={() => addToBag(p)}
                                className="h-11 rounded-full bg-white border border-blue-600 text-blue-600 text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-[0.98] transition cursor-pointer"
                              >
                                <BagIcon size={15} />
                                Add to Bag
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedProduct(null)}
                              className="h-10 rounded-full bg-gray-200 text-gray-700 text-[12px] font-medium hover:bg-gray-300 active:scale-[0.98] transition cursor-pointer"
                            >
                              ← Back to all results
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  <div className="flex-1 min-w-0">
                    <ResultGrid
                      products={searchProducts}
                      premiumId={premiumProduct?.id}
                      onOpen={openDetail}
                      onAdd={addToBag}
                      onRemove={removeFromBag}
                      inBag={isInBag}
                      tryOnImages={tryOnImages}
                      onTryOnClick={(dataUrl) => setFullImage(dataUrl)}
                      onRetryTryOn={retryTryOn}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE TRY-ON: camera ke upar selected kapra live ── */}
      {liveOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-start justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Live try-on"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={stopLiveTryOn}
          />
          <div className="absolute bottom-0 sm:relative z-10 sm:mx-auto sm:mt-[4vh] w-full max-w-[480px] sm:rounded-[24px] rounded-t-[24px] bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[13px] font-semibold">
                  Live Try-On — AI kapra aap par
                </p>
              </div>
              <button
                onClick={stopLiveTryOn}
                aria-label="Close live try-on"
                className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Live video + tracked garment overlay + AI outcome */}
            <div
              ref={liveContainerRef}
              className="relative bg-black aspect-[3/4] max-h-[58vh] overflow-hidden touch-none"
            >
              <video
                ref={liveVideoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* AI OUTCOME — selected kapra AI se user ke JISM par (real world) */}
              {liveView === "ai" && liveResult && (
                <img
                  src={liveResult}
                  alt="AI live try-on result"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* LIVE TRACKED OVERLAY — pose tracking se kapra jism par chipka,
                  user kisi bhi angle se move kare to sath move karta hai */}
              {liveView === "camera" && liveProduct && liveTracking && (
                <img
                  ref={liveOverlayImgRef}
                  src={liveProduct.image}
                  alt={liveProduct.name}
                  draggable={false}
                  className="absolute left-1/2 top-[16%] w-[62%] -translate-x-1/2 select-none pointer-events-none"
                  style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.45))" }}
                />
              )}

              {/* Manual overlay (agar live body-tracking available na ho) */}
              {liveView === "camera" && liveProduct && !liveTracking && (
                <img
                  src={liveProduct.image}
                  alt={liveProduct.name}
                  draggable={false}
                  onPointerDown={onLivePointerDown}
                  onPointerMove={onLivePointerMove}
                  onPointerUp={onLivePointerUp}
                  onPointerCancel={onLivePointerUp}
                  className="absolute left-1/2 select-none cursor-move touch-none"
                  style={{
                    top: "16%",
                    width: `${64 * liveOverlay.scale}%`,
                    transform: `translate(calc(-50% + ${liveOverlay.x}px), ${liveOverlay.y}px)`,
                    opacity: liveOverlay.opacity,
                    filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.45))",
                  }}
                />
              )}

              {!liveProduct && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="px-5 text-center text-[12px] text-white/85">
                    Pehle popup me koi product search karein — phir yahan kapra
                    live dikhega.
                  </p>
                </div>
              )}

              {/* View toggle: Live (body-tracked) / AI Result */}
              <div className="absolute top-2 left-2 flex rounded-full bg-black/60 p-0.5 backdrop-blur">
                <button
                  onClick={() => setLiveView("camera")}
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer " +
                    (liveView === "camera"
                      ? "bg-blue-600 text-white"
                      : "text-white/80")
                  }
                >
                  Live
                </button>
                <button
                  onClick={() => setLiveView("ai")}
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer " +
                    (liveView === "ai"
                      ? "bg-blue-600 text-white"
                      : "text-white/80")
                  }
                >
                  AI Result
                </button>
              </div>

              {/* Live tracking status */}
              {liveView === "camera" && (liveTrackLoading || liveTracking) && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] text-white backdrop-blur">
                  {liveTrackLoading ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Live tracking on…
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Live · kapra aap par
                    </>
                  )}
                </div>
              )}

              {liveGenerating && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] text-white backdrop-blur">
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  AI image…
                </div>
              )}

              {liveView === "camera" && liveProduct && (
                <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white/90 backdrop-blur">
                  {liveTracking
                    ? "Kapra aapke sath move karega · neeche se badlein"
                    : "Kapre ko drag karein / Size-Fade se set karein"}
                </div>
              )}

              {(cameraError || liveError || liveTrackError) && (
                <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-[11px] px-4 py-2.5 text-center">
                  {cameraError || liveError || liveTrackError}
                </div>
              )}
            </div>

            {/* AI realistic try-on (selected kapra, ek sharp photo) */}
            <div className="bg-white px-4 pt-3">
              <button
                onClick={() => void generateLiveTryOn(liveProduct)}
                disabled={liveGenerating || !liveProduct}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[12px] font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {liveGenerating
                  ? "AI image bana raha hai…"
                  : "AI Photo banao (realistic try-on)"}
              </button>
            </div>

            {/* Manual overlay controls (Camera view) */}
            {liveView === "camera" && (
              <div className="bg-white px-4 pt-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 text-[10px] font-semibold text-gray-600">
                    Size
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={liveOverlay.scale}
                    onChange={(e) =>
                      setLiveOverlay((p) => ({
                        ...p,
                        scale: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="w-10 text-[10px] font-semibold text-gray-600">
                    Fade
                  </span>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.05}
                    value={liveOverlay.opacity}
                    onChange={(e) =>
                      setLiveOverlay((p) => ({
                        ...p,
                        opacity: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Product selector */}
            {searchProducts.length > 0 && (
              <div className="bg-white px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-gray-500 mb-1.5">
                  Kapra select karein
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {searchProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setLiveProductId(p.id)}
                      aria-label={`Show ${p.name}`}
                      className={
                        "relative h-16 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition cursor-pointer " +
                        (liveProduct?.id === p.id
                          ? "border-blue-600 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300")
                      }
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Capture */}
            <div className="bg-white px-4 py-3 flex items-center justify-center">
              <button
                onClick={captureLive}
                className="h-12 px-5 rounded-full bg-black text-white text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition cursor-pointer"
              >
                <span className="h-3 w-3 rounded-full bg-white" />
                Capture &amp; AI Try-On
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMERA: real webcam selfie modal ── */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Take a selfie"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              stopCamera();
              setCameraOpen(false);
            }}
          />
          <div className="absolute bottom-0 sm:relative z-10 sm:mx-auto sm:mt-[6vh] w-full max-w-[480px] sm:rounded-[24px] rounded-t-[24px] bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold">
                Take Selfie — camera on
              </p>
              <button
                onClick={() => {
                  stopCamera();
                  setCameraOpen(false);
                }}
                aria-label="Close camera"
                className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Video preview + face guide */}
            <div className="relative bg-black aspect-[3/4] max-h-[62vh] overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] h-[52%] rounded-[28px] border-2 border-dashed border-white/50" />
              </div>
              {cameraError && (
                <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-[11px] px-4 py-2.5 text-center">
                  {cameraError}
                </div>
              )}
            </div>
            {/* Capture button */}
            <div className="bg-white px-4 py-3.5 flex items-center justify-center">
              <button
                onClick={captureSelfie}
                className="h-14 w-14 rounded-full bg-black text-white border-4 border-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition"
                aria-label="Capture selfie"
              >
                <span className="h-6 w-6 rounded-full bg-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bag drawer (items + quantity + checkout) ── */}
      {bagOpen && (
        <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Your bag">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ animation: "va-fade-in 0.2s ease-out" }}
            onClick={() => setBagOpen(false)}
          />
          <div
            className="absolute top-0 right-0 h-full w-[350px] max-w-[88vw] bg-white shadow-2xl flex flex-col"
            style={{ animation: "va-slide-in 0.28s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Header */}
            <div className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <BagIcon size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-tight">
                    Your Bag {bagCount > 0 && `(${bagCount} item${bagCount > 1 ? "s" : ""})`}
                  </p>
                  <p className="text-[10px] text-blue-100 mt-0.5">
                    {bag.length > 0
                      ? `${bag.length} product${bag.length > 1 ? "s" : ""} in list`
                      : "No products yet"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBagOpen(false)}
                aria-label="Close bag"
                className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto bg-gray-50/60">
              {bag.length === 0 ? (
                <div className="py-14 text-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                    className="mx-auto mb-3"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Your bag is empty. Add products from the popup.
                  </p>
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-2.5">
                  {bag.map((item) => {
                    const p = item.product;
                    return (
                      <div
                        key={p.id}
                        className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-2.5"
                      >
                        <div className="relative h-20 w-16 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className="text-[11px] text-gray-800 leading-snug line-clamp-2">
                            {p.name}
                          </p>
                          <p className="mt-1 text-[12px] font-bold text-blue-600">
                            Rs{p.price.toLocaleString()}
                          </p>
                          {/* qty controls */}
                          <div className="mt-auto pt-1 flex items-center justify-between">
                            <div className="flex items-center gap-1 border border-gray-200 rounded-full px-1">
                              <button
                                onClick={() => updateQty(p.id, -1)}
                                aria-label="Decrease quantity"
                                className="h-6 w-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer transition"
                              >
                                −
                              </button>
                              <span className="text-[11px] font-semibold text-gray-800 min-w-[18px] text-center">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateQty(p.id, 1)}
                                aria-label="Increase quantity"
                                className="h-6 w-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer transition"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromBag(p.id)}
                              className="text-[10px] font-semibold text-red-500 hover:text-red-600 hover:underline cursor-pointer transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: total + checkout */}
            {bag.length > 0 && (
              <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="text-[18px] font-extrabold text-blue-600">
                    Rs
                    {bag
                      .reduce((s, i) => s + i.product.price * i.qty, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const total = bag.reduce(
                      (s, i) => s + i.product.price * i.qty,
                      0
                    );
                    setToast(
                      `Checkout selected — ${bagCount} item${
                        bagCount > 1 ? "s" : ""
                      } · Total Rs${total.toLocaleString()}`
                    );
                    setBagOpen(false);
                  }}
                  className="mt-3 w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[13px] font-bold hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] transition cursor-pointer"
                >
                  Checkout
                </button>
                <button
                  onClick={() => setBagOpen(false)}
                  className="mt-2 w-full h-9 rounded-xl bg-gray-200 text-gray-700 text-[12px] font-medium hover:bg-gray-300 active:scale-[0.98] transition cursor-pointer"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className="fixed bottom-44 right-6 z-[80] max-w-[260px] rounded-full bg-gray-900 text-white text-[11px] font-medium px-4 py-2.5 shadow-lg flex items-center gap-2"
          style={{ animation: "va-toast-in 0.25s ease-out" }}
        >
          <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* ── AI image fullscreen (bigger view) ── */}
      {fullImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullImage(null)}
        >
          <div
            className="max-w-[94vw] max-h-[92vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullImage}
              alt="AI generated fullscreen"
              onLoad={() =>
                setBrokenImage((prev) =>
                  prev.full ? { ...prev, full: false } : prev
                )
              }
              onError={() => setBrokenImage((prev) => ({ ...prev, full: true }))}
              className={
                brokenImage.full
                  ? "hidden"
                  : "max-w-full max-h-[86vh] rounded-xl shadow-2xl object-contain"
              }
            />
            {brokenImage.full && (
              <p className="px-5 py-2 rounded-full bg-white/15 text-white text-[12px] font-semibold backdrop-blur">
                ⚠️ Ye image load nahi hui — dobara generate karein
              </p>
            )}
            <button
              onClick={() => setFullImage(null)}
              className="px-5 py-2 rounded-full bg-white/15 text-white text-[12px] font-semibold backdrop-blur hover:bg-white/25 transition cursor-pointer"
            >
              Close (bada dekhne ke liye click kar ke band karein)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function VoiceAssistant() {
  return (
    <ConversationProvider>
      <VoiceAssistantWidget />
    </ConversationProvider>
  );
}