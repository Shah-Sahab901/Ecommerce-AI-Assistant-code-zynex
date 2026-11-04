"use client";

import { useEffect, useRef, useState } from "react";

type Product = {
  id: number | string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  style?: string;
};

type Attachment = {
  id: string;
  file: File;
  preview?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  attachments?: Attachment[];
};

const CHAT_API = "https://zynex-ecommerce-backend-ai-new.vercel.app";

const BATCH_SIZE = 4;

const GREETING: Message[] = [
  {
    role: "assistant",
    content:
      "Hi! 👋 I'm your shopping assistant. Ask me about products, prices, discounts, or availability.",
  },
];

const HISTORY_KEY = "noya_chat_history_v1";

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
};

function hasUserMessage(list: Message[]): boolean {
  return list.some((message) => message.role === "user");
}

function sanitizeForHistory(list: Message[]): Message[] {
  return list.map((message) =>
    message.attachments
      ? { ...message, attachments: undefined }
      : message
  );
}

function makeSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function makeSessionTitle(list: Message[]): string {
  const firstUser = list.find((message) => message.role === "user");
  const text = (firstUser?.content || "").trim() || "New chat";
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

function timeLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) return `Aaj ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Kal ${time}`;

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Extract product array from backend response.
 */
function extractProducts(raw: unknown): Product[] | null {
  // Backend directly returns an array
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;

    const validProducts = raw.filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        item.name !== undefined &&
        item.price !== undefined &&
        item.image !== undefined
    );

    return validProducts.length > 0
      ? (validProducts as Product[])
      : null;
  }

  // Backend returns:
  // { products: [...] }
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as any).products)
  ) {
    const products = (raw as any).products;

    if (products.length === 0) return null;

    const validProducts = products.filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        item.name !== undefined &&
        item.price !== undefined &&
        item.image !== undefined
    );

    return validProducts.length > 0
      ? (validProducts as Product[])
      : null;
  }

  // Backend returns JSON as a string
  if (typeof raw === "string") {
    const text = raw.trim();

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return extractProducts(parsed);
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.products)
      ) {
        return extractProducts(parsed.products);
      }
    } catch {
      // Not JSON.
    }

    // Try to find JSON array inside text
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        const possibleJson = text.substring(start, end + 1);
        const parsed = JSON.parse(possibleJson);

        if (Array.isArray(parsed)) {
          return extractProducts(parsed);
        }
      } catch {
        // Not valid JSON.
      }
    }
  }

  return null;
}

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: (p: Product) => void;
}) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : 0;

  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-300 text-left"
    >
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-semibold px-2 py-1 rounded-full tracking-wide">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-[12px] text-gray-900 font-medium line-clamp-2 leading-[1.4]">
          {product.name}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              Rs.{product.oldPrice}
            </span>
          )}

          <span className="text-[12px] font-bold text-gray-950">
            Rs.{product.price}
          </span>
        </div>
      </div>
    </button>
  );
}

function ProductDetail({
  product,
  onBack,
}: {
  product: Product;
  onBack: () => void;
}) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-3 pt-3">
        <button
          onClick={onBack}
          className="text-[11px] text-gray-500 hover:text-black flex items-center gap-1.5 mb-3 cursor-pointer transition"
        >
          <span className="text-base">←</span>
          Back to results
        </button>
      </div>

      <div className="relative w-full max-w-[250px] mx-auto aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="p-4 text-center">
        <p className="text-sm font-semibold text-gray-950 leading-snug">
          {product.name}
        </p>

        {product.style && (
          <p className="text-[11px] text-gray-400 mt-1">
            Style: {product.style}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 mt-2">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              Rs.{product.oldPrice}
            </span>
          )}

          <span className="text-lg font-bold text-gray-950">
            Rs.{product.price}
          </span>
        </div>

        <button className="mt-4 w-full bg-black text-white text-xs font-semibold py-3 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Product | null>(null);

  if (selected) {
    return (
      <ProductDetail
        product={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      {products.map((product, index) => (
        <ProductCard
          key={product.id || index}
          product={product}
          onClick={setSelected}
        />
      ))}
    </div>
  );
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Attachment states
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [messages, setMessages] = useState<Message[]>(GREETING);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── CHAT HISTORY (sessions) ──
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const autoCreatedSessionRef = useRef(false);

  // Paging state: purani nayi batch (4) images neeche append karne ke liye.
  const lastQueryRef = useRef<string>("");
  const skipRef = useRef(0);

  const isMoreImagesRequest = (text: string) => {
    const t = text.trim().toLowerCase();

    if (
      /^(more|or|aur|zyada|zeiada|mazeed|mazid|kuch or|kuch aur|or images|or pics|more images|more pics|aur dikhao|or dikhao|aur dekhao|zyada dikhao|aur dikha|aur do|aur kuch|some more|4 or|4 aur|or 4|aur 4|phir or|phir aur|phir 4 or|phir 4 aur|next 4|next|aur 4 dikhao|or 4 dikhao|aur 4 dekhao|or 4 dekhao)$/i.test(
        t
      )
    ) {
      return true;
    }

    if (
      /\b(aur|more|or|zyada|zeiada|mazeed|mazid|kuch aur|kuch or|some more)\b/i.test(t) &&
      (/(images?|pics?|pictures?|tasveer|photos?|phot|img)/i.test(t) ||
        /\b(dikha|dikhao|dekha|dekhao|show|do|de|dekh)\b/i.test(t) ||
        /\b(suites?|suits?|kapre|kapde|kapra|kapray|cloth(es)?|dress(es)?|frock|shirt|ready|stitched|unstitched|product(s)?|design(s)?|color|rang|collection|naye|new|sab|complete|poori|puri)\b/i.test(t))
    ) {
      return true;
    }

    if (
      /\b(mujhe|mujha|mujhko|kuch)\b/i.test(t) &&
      /\b(kapre|kapde|kapra|kapray|clothes|clothing|cloth|pics?|images?|photos?|pictures?)\b/i.test(t) &&
      /\b(dikha|dikhao|dekha|dekhao|show|do|de|dekh)\b/i.test(t)
    ) {
      return true;
    }

    return false;
  };

  // Hidden file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── CAMERA (real webcam selfie) ──
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Camera stream cleanup: popup band hote / unmount hote hi band karo.
  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraOpen) {
      const videoEl = cameraVideoRef.current;
      void (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          cameraStreamRef.current = stream;
          requestAnimationFrame(() => {
            if (videoEl) {
              videoEl.srcObject = stream;
              videoEl.play().catch(() => undefined);
            }
          });
        } catch (err) {
          console.error("camera error:", err);
          setCameraError(
            "Camera access nahi mili — browser me camera allow karein, ya 'Add photos' use karein."
          );
        }
      })();
      return () => {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
        if (videoEl) {
          videoEl.srcObject = null;
        }
      };
    }
    return undefined;
  }, [cameraOpen]);

  const handleCameraClick = () => {
    setShowAttachMenu(false);
    setCameraError(null);
    setCameraOpen(true);
  };

  const capturePhoto = () => {
    const video = cameraVideoRef.current;
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
      const bstr = atob(dataUrl.split(",")[1]);
      const u8 = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
      const file = new File([u8], "webcam-selfie.jpg", {
        type: "image/jpeg",
      });
      handleFilesSelected({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      setCameraOpen(false);
    } catch (err) {
      console.error("capture error:", err);
      setCameraError("Selfie capture me error aaya — dobara try karein.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ── HISTORY: saved sessions localStorage se load karo ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as unknown;

      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as any).sessions)
      ) {
        const savedSessions = (parsed as any).sessions as ChatSession[];
        setSessions(savedSessions);

        const activeId = (parsed as any).activeSessionId as string | null;
        const restored = savedSessions.find(
          (session) => session.id === activeId
        );

        if (restored) {
          setMessages(
            restored.messages.length ? restored.messages : GREETING
          );
          setActiveSessionId(restored.id);
        }
      }
    } catch (error) {
      console.error("History load error:", error);
    }
  }, []);

  // ── HISTORY: pehle user message aate hi nayi session banao ──
  useEffect(() => {
    if (!hasUserMessage(messages)) {
      autoCreatedSessionRef.current = false;
      return;
    }

    if (activeSessionId) return;
    if (autoCreatedSessionRef.current) return;

    autoCreatedSessionRef.current = true;

    const session: ChatSession = {
      id: makeSessionId(),
      title: makeSessionTitle(messages),
      updatedAt: Date.now(),
      messages: sanitizeForHistory(messages),
    };

    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
  }, [messages, activeSessionId]);

  // ── HISTORY: active session ke messages ka live update + save ──
  useEffect(() => {
    if (!activeSessionId) return;
    if (!hasUserMessage(messages)) return;

    const sanitized = sanitizeForHistory(messages);

    setSessions((prev) => {
      const existing = prev.find(
        (session) => session.id === activeSessionId
      );

      if (!existing) return prev;
      if (JSON.stringify(existing.messages) === JSON.stringify(sanitized)) {
        return prev;
      }

      return prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              title:
                session.title === "New chat"
                  ? makeSessionTitle(messages)
                  : session.title,
              updatedAt: Date.now(),
              messages: sanitized,
            }
          : session
      );
    });
  }, [messages, activeSessionId]);

  // ── HISTORY: localStorage me persist karo ──
  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify({ sessions, activeSessionId })
      );
    } catch (error) {
      console.error("History save error:", error);
    }
  }, [sessions, activeSessionId]);

  // ==============================
  // ADD PHOTOS
  // ==============================
  const handlePhotosClick = () => {
    setShowAttachMenu(false);
    photoInputRef.current?.click();
  };

  // ==============================
  // ADD FILES
  // ==============================
  const handleFilesClick = () => {
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  };

  // ==============================
  // HANDLE SELECTED FILES
  // ==============================
  const handleFilesSelected = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const newAttachments: Attachment[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Allow selecting the same file again
    e.target.value = "";
  };

  // ==============================
  // REMOVE ATTACHMENT
  // ==============================
  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find(
        (attachment) => attachment.id === id
      );

      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }

      return prev.filter(
        (attachment) => attachment.id !== id
      );
    });
  };

  // ==============================
  // SEND MESSAGE
  // ==============================
  const sendMessage = async () => {
    const message = input.trim();

    // Allow sending attachment without text
    if ((!message && attachments.length === 0) || loading) {
      return;
    }

    const currentAttachments = [...attachments];

    setInput("");
    setAttachments([]);
    setShowAttachMenu(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message || "Attached file(s)",
        attachments: currentAttachments,
      },
    ]);

    setLoading(true);

    // ── Paging: "or images do / more / aur images" → purani query ki
    //    aagli 4 nayi images neeche dikhao. Baqi har message = nayi query.
    const isPaging = isMoreImagesRequest(message) && lastQueryRef.current.length > 0;
    const effectiveInput = isPaging ? lastQueryRef.current : message;
    const skip = isPaging ? skipRef.current + BATCH_SIZE : 0;
    skipRef.current = skip;
    if (!isPaging && message) {
      lastQueryRef.current = message;
    }

    try {
      /*
       * FormData is used so text + photos/files
       * can be sent together.
       */
      const formData = new FormData();

      formData.append("input", effectiveInput);

      currentAttachments.forEach((attachment) => {
        formData.append("files", attachment.file);
      });

      const response = await fetch(
        `https://zynex-ecommerce-backend-ai-new.vercel.app/Listing?input=${encodeURIComponent(effectiveInput)}&skip=${skip}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const responseObj = data.response;

      const products = extractProducts(responseObj);
      // Chatbot hamesha sirf 4 images dikhata hai (baqi next page par).
      const batch = products ? products.slice(0, BATCH_SIZE) : null;

      /*
       * Backend sends a FinalProductResponse object:
       * { found, products: [...], note: "..." }
       * `note` is the real assistant message (greeting, price summary,
       * etc.) — always show it ON TOP, and the products BELOW it.
       */
      const backendNote =
        responseObj &&
        typeof responseObj === "object" &&
        typeof responseObj.note === "string"
          ? responseObj.note.trim()
          : "";

      if (batch && batch.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              backendNote ||
              `Found ${batch.length} product${
                batch.length > 1 ? "s" : ""
              } for you:`,
            products: batch,
          },
        ]);
      } else {
        /*
         * IMPORTANT:
         * Never display raw backend data.
         * Never use JSON.stringify(data.response).
         */

        const isPlainText =
          typeof responseObj === "string" &&
          responseObj.trim().length > 0 &&
          !responseObj.trim().startsWith("[") &&
          !responseObj.trim().startsWith("{");

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              backendNote ||
              (isPlainText
                ? (responseObj as string)
                : "I couldn't find matching products. Please try another product name, category, or price."),
          },
        ]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the shopping assistant right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── CHAT HISTORY: handlers ──
  const startNewChat = () => {
    setMessages(GREETING);
    setActiveSessionId(null);
    setHistoryOpen(false);
  };

  const openSession = (session: ChatSession) => {
    setMessages(session.messages.length ? session.messages : GREETING);
    setActiveSessionId(session.id);
    setHistoryOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) =>
      prev.filter((session) => session.id !== id)
    );

    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages(GREETING);
    }
  };

  const clearAllHistory = () => {
    setSessions([]);
    setActiveSessionId(null);
    setMessages(GREETING);
    setHistoryOpen(false);
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return (
    <>
      {/* Hidden Photo Input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Hidden General File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* =====================================================
          FLOATING CHAT BUTTON
      ====================================================== */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-black text-white shadow-[0_12px_35px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_rgba(0,0,0,0.32)] active:scale-95"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            cursor={"pointer"}
          >
            <path
              fill="currentColor"
              d="M4 2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V4a2 2 0 0 1 2-2Z"
            />
            <circle cx="8.4" cy="9" r="1.2" fill="#000" stroke="none" />
            <circle cx="12" cy="9" r="1.2" fill="#000" stroke="none" />
            <circle cx="15.6" cy="9" r="1.2" fill="#000" stroke="none" />
          </svg>

          {/* Online dot */}
          <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
        </button>
      )}

      {/* =====================================================
          MAIN CHAT WINDOW
      ====================================================== */}
      {open && (
        <div className="fixed top-5 right-5 z-[60] w-[410px] max-w-[calc(100vw-24px)] h-[650px] max-h-[calc(100vh-90px)] bg-white rounded-[24px] shadow-[0_25px_70px_rgba(0,0,0,0.22)] border border-gray-200 overflow-hidden flex flex-col">

          {/* =================================================
              HEADER
          ================================================== */}
          <div className="relative bg-black text-white px-5 py-4 shrink-0">

            {/* Subtle header shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between">

              <div className="flex items-center gap-3">

                {/* AI Avatar */}
                <div className="relative h-11 w-11 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm">
                  AI

                  {/* Online indicator */}
                  <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
                </div>

                <div>
                  <h2 className="font-semibold text-[14px] tracking-tight">
                    Shopping Assistant
                  </h2>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                    <span className="text-[11px] text-gray-300">
                      Online & ready to help
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* History toggle button */}
                <button
                  onClick={() => setHistoryOpen((prev) => !prev)}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                  aria-label="Toggle chat history"
                  title="Chat history"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    cursor={"pointer"}
                  >
                    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </button>

                {/* Close button */}
                <button
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                  aria-label="Close chat"
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
          </div>

          {/* =================================================
              HISTORY PANEL (ChatGPT-style left drawer)
          ================================================== */}
          {historyOpen && (
            <>
              <div
                className="absolute inset-0 z-20 bg-black/35 backdrop-blur-[1px]"
                onClick={() => setHistoryOpen(false)}
              />

              <aside className="absolute inset-y-0 left-0 z-30 flex w-[252px] flex-col bg-white border-r border-gray-200 shadow-[8px_0_30px_rgba(0,0,0,0.14)]">
                <div className="bg-black text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      cursor="pointer"
                    >
                      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <p className="text-[12px] font-semibold tracking-tight">
                      Chat History
                    </p>
                  </div>

                  <button
                    onClick={() => setHistoryOpen(false)}
                    aria-label="Close history"
                    className="h-7 w-7 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {sortedSessions.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-[12px] text-gray-500 leading-relaxed">
                        Abhi koi chat history nahi hai. Pehla message bhejo —
                        yahan auto-save ho jayega.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-0.5 px-2">
                      {sortedSessions.map((session) => (
                        <li key={session.id}>
                          <div className="relative flex items-center">
                            <button
                              onClick={() => openSession(session)}
                              className={`flex-1 min-w-0 text-left px-3 pr-8 py-2.5 rounded-xl transition cursor-pointer ${
                                session.id === activeSessionId
                                  ? "bg-black text-white"
                                  : "hover:bg-gray-100 text-gray-800"
                              }`}
                            >
                              <p
                                className={`text-[12px] font-medium truncate ${
                                  session.id === activeSessionId
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {session.title}
                              </p>

                              <p
                                className={`text-[10px] mt-0.5 ${
                                  session.id === activeSessionId
                                    ? "text-gray-300"
                                    : "text-gray-400"
                                }`}
                              >
                                {timeLabel(session.updatedAt)}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteSession(session.id);
                              }}
                              aria-label={`Delete ${session.title}`}
                              title="Delete chat"
                              className={`absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                                session.id === activeSessionId
                                  ? "text-gray-300 hover:text-white hover:bg-white/15"
                                  : "text-gray-400 hover:bg-gray-200 hover:text-red-600"
                              }`}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-gray-100 p-2 space-y-1 shrink-0">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white text-[12px] font-medium hover:bg-gray-800 transition cursor-pointer"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    New chat
                  </button>

                  {sessions.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Clear all history
                    </button>
                  )}
                </div>
              </aside>
            </>
          )}

          {/* =================================================
              CHAT MESSAGES
          ================================================== */}
          <div className="flex-1 overflow-y-auto bg-[#f7f7f8] px-4 py-5 space-y-5">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                {/* Assistant avatar */}
                {message.role === "assistant" && (
                  <div className="shrink-0 h-7 w-7 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold mb-0.5">
                    AI
                  </div>
                )}

                <div
                  className={`${
                    message.products
                      ? "max-w-[91%]"
                      : "max-w-[79%]"
                  } ${
                    message.role === "user"
                      ? "bg-black text-white rounded-[20px] rounded-br-[6px] shadow-sm"
                      : "bg-white text-gray-800 rounded-[20px] rounded-bl-[6px] border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  } px-4 py-3`}
                >

                  {/* =========================================
                      ATTACHMENTS IN SENT MESSAGE
                  ========================================== */}
                  {message.attachments &&
                    message.attachments.length > 0 && (
                      <div className="mb-2.5 space-y-2">

                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="rounded-2xl overflow-hidden"
                          >

                            {attachment.preview ? (
                              <img
                                src={attachment.preview}
                                alt={attachment.file.name}
                                className="max-w-[200px] max-h-[200px] rounded-2xl object-cover border border-white/10"
                              />
                            ) : (
                              <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">

                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                  <path d="M14 2v6h6" />
                                </svg>

                                <span className="text-[11px] truncate max-w-[160px]">
                                  {attachment.file.name}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Message text */}
                  <div className="text-[13px] leading-[1.55]">
                    {message.content}
                  </div>

                  {/* =========================================
                      PRODUCT RESULTS
                  ========================================== */}
                  {message.products &&
                    message.products.length > 0 && (
                      <div className="mt-3">
                        <ProductGrid products={message.products} />
                      </div>
                    )}
                </div>
              </div>
            ))}

            {/* =================================================
                LOADING INDICATOR
            ================================================== */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">

                <div className="shrink-0 h-7 w-7 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">
                  AI
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-[20px] rounded-bl-[6px] px-4 py-3">

                  <div className="flex items-center gap-1.5">

                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />

                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />

                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />

                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* =================================================
              INPUT AREA
          ================================================== */}
          <div className="border-t border-gray-200 bg-white px-3.5 pt-3 pb-2.5 shrink-0">

            {/* ===============================================
                SELECTED ATTACHMENTS PREVIEW
            ================================================ */}
            {attachments.length > 0 && (
              <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">

                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative shrink-0"
                  >

                    {attachment.preview ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        className="h-16 w-16 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center px-1">

                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                          <path d="M14 2v6h6" />
                        </svg>

                        <span className="text-[8px] text-gray-500 truncate w-full text-center mt-1">
                          {attachment.file.name}
                        </span>
                      </div>
                    )}

                    {/* Remove attachment */}
                    <button
                      type="button"
                      onClick={() =>
                        removeAttachment(attachment.id)
                      }
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black text-white flex items-center justify-center shadow-md hover:bg-gray-800 transition"
                      aria-label="Remove attachment"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>

                  </div>
                ))}
              </div>
            )}

            {/* =================================================
                INPUT ROW
            ================================================== */}
            <div className="flex items-end gap-2">

              {/* ===============================================
                  PLUS BUTTON
              ================================================ */}
              <div className="relative shrink-0">

                <button
                  type="button"
                  onClick={() =>
                    setShowAttachMenu((prev) => !prev)
                  }
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                    showAttachMenu
                      ? "bg-black border-black text-white rotate-45"
                      : "bg-white border-gray-200 cursor-pointer text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  aria-label="Add photos and files"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>

                {/* ===========================================
                    ATTACHMENT MENU
                ============================================ */}
                {showAttachMenu && (
                  <div className="absolute bottom-14 left-0 w-[205px] bg-white border border-gray-200 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.16)] p-1.5 z-50">

                    {/* Add Photos */}
                    <button
                      type="button"
                      onClick={handlePhotosClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left"
                    >

                      <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">

                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          cursor={"pointer"}
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                          />

                          <circle
                            cx="8.5"
                            cy="8.5"
                            r="1.5"
                          />

                          <path d="m21 15-5-5L5 21" />
                        </svg>

                      </div>

                      <div>
                        <p className="text-[12px] font-semibold text-gray-900 cursor-pointer">
                          Add photos
                        </p>

                        <p className="text-[10px] text-gray-400 mt-0.5">
                          JPG, PNG, WEBP
                        </p>
                      </div>

                    </button>

                    {/* Add Files */}
                    <button
                      type="button"
                      onClick={handleFilesClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left"
                    >

                      <div className="h-9 w-9 cursor-pointer rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">

                        /

                      </div>

                      <div>
                        <p className="text-[12px] font-semibold text-gray-900 cursor-pointer">
                          Add files
                        </p>

                        <p className="text-[10px] text-gray-400 mt-0.5 cursor-pointer">
                          Documents & files
                        </p>
                      </div>

                    </button>

                    {/* Take Photo (Camera) */}
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left"
                    >

                      <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">

                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          cursor={"pointer"}
                        >
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>

                      </div>

                      <div>
                        <p className="text-[12px] font-semibold text-gray-900 cursor-pointer">
                          Take Photo / Camera
                        </p>

                        <p className="text-[10px] text-gray-400 mt-0.5 cursor-pointer">
                          Webcam se real selfie
                        </p>
                      </div>

                    </button>

                  </div>
                )}
              </div>

              {/* ===============================================
                  TEXT INPUT
              ================================================ */}
              <div className="flex-1 relative">

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about products..."
                  rows={1}
                  disabled={loading}
                  className="w-full resize-none max-h-28 min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-100 transition disabled:opacity-50"
                />

              </div>

              {/* ===============================================
                  SEND BUTTON
              ================================================ */}
              <button
                onClick={sendMessage}
                disabled={
                  (!input.trim() && attachments.length === 0) ||
                  loading
                }
                className="h-11 w-11 shrink-0 rounded-xl bg-black text-white flex items-center justify-center transition-all hover:bg-gray-800 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                aria-label="Send message"
              >

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  cursor={"pointer"}
                >
                  <path d="M22 2 11 13" />
                  <path d="m22 2-7 20-4-9-9-4Z" />
                </svg>

              </button>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">

              <span className="h-1 w-1 rounded-full bg-gray-300" />

              <p className="text-[9px] text-gray-400 tracking-wide">
                AI Shopping Assistant
              </p>

              <span className="h-1 w-1 rounded-full bg-gray-300" />

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          CAMERA MODAL (real webcam selfie)
      ====================================================== */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Take a selfie"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setCameraOpen(false)}
          />
          <div className="absolute bottom-0 sm:relative z-10 sm:mx-auto sm:mt-[6vh] w-full max-w-[480px] sm:rounded-[24px] rounded-t-[24px] bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold">
                Take Selfie — camera on
              </p>
              <button
                onClick={() => setCameraOpen(false)}
                aria-label="Close camera"
                className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Video preview + face guide */}
            <div className="relative bg-black aspect-[3/4] max-h-[62vh] overflow-hidden">
              <video
                ref={cameraVideoRef}
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
                onClick={capturePhoto}
                aria-label="Capture selfie"
                className="h-14 w-14 rounded-full bg-black border-4 border-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition"
              >
                <span className="h-6 w-6 rounded-full bg-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}