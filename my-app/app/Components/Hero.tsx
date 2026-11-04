"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="
          relative
          w-full
          h-[280px]
          sm:h-[330px]
          md:h-[380px]
          lg:h-[430px]
          xl:h-[480px]
          2xl:h-[520px]
          bg-[#0b0d12]
          overflow-hidden
        "
      >
        <Image
          src="/images/new4.webp"
          alt="NOYA Collection"
          fill
          priority
          unoptimized
          quality={100}
          sizes="100vw"
          className="object-cover object-[60%_0%]"
        />

        {/* SUKOON / UNSTITCHED / Shop now — image ke bottom-center par overlay. */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            flex
            flex-col
            items-center
            justify-end
            text-center
            px-4
            pb-5
            pt-14
            sm:pb-7
            sm:pt-16
            bg-gradient-to-t
            from-black/70
            via-black/25
            to-transparent
          "
        >
          <h2
            className="
              font-medium
              leading-none
              tracking-[0.18em]
              text-white
              drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]
              text-[34px]
              sm:text-[44px]
              lg:text-[50px]
              2xl:text-[58px]
            "
          >
            SUKOON
          </h2>

          <p
            className="
              mt-1.5
              font-medium
              tracking-[0.42em]
              text-white/85
              drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]
              text-[9px]
              sm:mt-2
              sm:text-[11px]
              lg:text-[13px]
            "
          >
            UNSTITCHED
          </p>

          <a
            href="/Unstitched"
            aria-label="Shop now"
            className="
              pointer-events-auto
              mt-3
              sm:mt-4
              inline-flex
              items-center
              justify-center
              rounded-full
              bg-white
              px-6
              py-2
              sm:px-8
              sm:py-2.5
              text-[11px]
              sm:text-xs
              font-semibold
              tracking-[0.2em]
              uppercase
              text-black
              shadow-[0_6px_20px_rgba(0,0,0,0.28)]
              transition-transform
              duration-200
              hover:scale-[1.04]
              active:scale-95
            "
          >
            Shop now
          </a>
        </div>
      </div>

      {/* Ask with AI Advisor — chatbot/voice icons ke upar wali clickable pill.
          Click par AI Business Advisor ki website nayi tab me khulti hai. */}
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      <a
        href="https://zynex-ecommerce-fashion-ai-advisor.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ask with AI Advisor"
        className="fixed bottom-44 right-6 z-50 flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 text-black shadow-[0_8px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)] active:scale-95"
        style={{ animation: "hero-float 3s ease-in-out infinite" }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3z" />
          </svg>
        </span>
        <span className="text-sm font-semibold tracking-wide">
          Ask with AI Advisor
        </span>
      </a>
    </section>
  );
}