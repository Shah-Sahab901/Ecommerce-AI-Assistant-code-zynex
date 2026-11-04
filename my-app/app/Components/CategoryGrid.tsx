"use client";

import Image from "next/image";
import Link from "next/link";

const items = [
  {
    src: "/images/27.png",
    title: "LAWN TOP PICKS",
    linkText: "SHOP SALE →",
    href: "/Footwear",
  },
  {
    src: "/images/24.png",
    title: "FORMAL",
    linkText: "SHOP SALE →",
    href: "/Formals",
  },
  {
    src: "/images/25.png",
    title: "LAWN TOP PICKS",
    linkText: "SHOP SALE →",
    href: "/Accesories",
  },
  {
    src: "/images/26.png",
    title: "FORMAL",
    linkText: "SHOP SALE →",
    href: "/NewIn",
  },
];

export default function CategoryGrid() {
  return (
    <section className="w-full bg-white mt-[-64px]">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1  sm:grid-cols-2">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group relative block overflow-hidden quality-[200px] "
            
          >
            {/* Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4] lg:aspect-[4/5]">
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 50vw"
                unoptimized
              />
            </div>

            {/* Text - light shadow for readability */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-center sm:p-6 md:p-8">
              <h3 className="text-lg font-medium tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-xl md:text-2xl">
                {item.title}
              </h3>
              <p className="mt-1 text-sm tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition group-hover:underline sm:text-[15px]">
                {item.linkText}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}