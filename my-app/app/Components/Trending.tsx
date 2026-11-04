"use client";

import Link from "next/link";
import { useState } from "react";

const tabs = [
  { name: "READY TO WEAR", href: "/ReadyToWear" },
  { name: "UNSTITCHED", href: "/Unstitched" },
  { name: "WEST", href: "/Formals" },
  { name: "ONLY ON SALE", href: "/Footwear" },
];

export default function Trending() {
  const [active, setActive] = useState("READY TO WEAR");

  return (
    <section className="w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between md:gap-10 md:py-10 lg:px-8">

        {/* ================= LEFT ================= */}
        <div className="ml-[40px]">
          <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl md:text-[40px]">
            TRENDING
          </h2>
          <p className="mt-1 ml-[5px] text-[11px] tracking-[1.5px] text-gray-500 font-sans-serif sm:text-[12px]">
            DISCOVER THE BEST-SELLING STYLES
          </p>
        </div>

        {/* ================= RIGHT TABS ================= */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-6 md:gap-8  ">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={() => setActive(tab.name)}
              className={`
                text-[14px] tracking-wide transition  mt-[-30px]
                ${
                  active === tab.name
                    ? "font-medium text-gray-900 underline underline-offset-4 "
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}