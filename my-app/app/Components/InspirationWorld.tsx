"use client";

import Image from "next/image";
import Link from "next/link";

const looks = [
  {
    src: "/images/w1.png",
    username: "@rabbyakhannn",
    href: "/world-pic",
  },
  {
    src: "/images/w2.png",
    username: "@rijamujaid",
    href: "/world-pic",
  },
  {
    src: "/images/w3.png",
    username: "@dahiyakanwal1",
    href: "/world-pic",
  },
  {
    src: "/images/w4.png",
    username: "@daria_shatova",
    href: "/world-pic",
  },
];

export default function InspirationLooks() {
  return (
    <section className="w-full bg-white py-6 md:py-10 mt-[-50px]">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-[2px] md:grid-cols-4">
        {looks.map((item, index) => (
          <Link
            key={index}
            href={"/WorldPic"}
            className="group relative block overflow-hidden"
          >
            <div className="relative w-full overflow-hidden bg-gray-50">
              <Image
                src={item.src}
                alt={item.username}
                width={500}
                height={650}
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
                quality={100}
                unoptimized
              />

              {/* Username */}
              <div className="absolute bottom-3 left-3 z-10">
                <span className="text-[12px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {item.username}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}