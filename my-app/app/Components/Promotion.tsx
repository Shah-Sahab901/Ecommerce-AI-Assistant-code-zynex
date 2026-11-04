"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const saleImages = [
  {
    src: "/images/7.png",
    title: "SHOP THE LOOK",
    subtitle: "FOR LESS",
    href: "/Footwear",
  },
  {
    src: "/images/8.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/Formals",
  },
  {
    src: "/images/9.png",
    title: "SUMMER PICKS",
    subtitle: "UP TO 50% OFF",
    href: "/NewIn",
  },
  {
    src: "/images/10.png",
    title: "EVERYTHING",
    subtitle: "UNDER Rs. 3,000",
    href: "/ReadyToWear",
  },
  {
    src: "/images/11.png",
    title: "EVERYTHING",
    subtitle: "UNDER Rs. 5,000",
    href: "/Unstitched",
  },
  {
    src: "/images/12.png",
    title: "SHOP THE LOOK",
    subtitle: "FOR LESS",
    href: "/Footwear",
  },
  {
    src: "/images/13.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/ReadyToWear",
  },
  {
    src: "/images/14.png",
    title: "SUMMER PICKS",
    subtitle: "UP TO 50% OFF",
    href: "/NewIn",
  },
  {
    src: "/images/15.png",
    title: "EVERYTHING",
    subtitle: "UNDER Rs. 3,000",
    href: "/Accesories",
  },
  {
    src: "/images/16.png",
    title: "EVERYTHING",
    subtitle: "UNDER Rs. 5,000",
    href: "/Formals",
  },
  {
    src: "/images/17.png",
    title: "SHOP THE LOOK",
    subtitle: "FOR LESS",
    href: "/Footwear",
  },
  {
    src: "/images/18.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/ReadyToWear",
  },
  {
    src: "/images/19.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/Accesories",
  },
  {
    src: "/images/20.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/Footwear",
  },
  {
    src: "/images/21.png",
    title: "WEST",
    subtitle: "UP TO 50% OFF",
    href: "/Accesories",
  },
];

export default function SaleSection() {
  const [slide, setSlide] = useState(0);
  const [current, setCurrent] = useState(0);

  const totalSlides = Math.ceil(saleImages.length / 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % saleImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-white py-12 md:py-16 lg:py-20">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-10 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-12 lg:px-8 xl:gap-16">

        {/* ================= LEFT TEXT ================= */}
        <div className="w-full max-w-md shrink-0 lg:w-[320px] xl:w-[360px] mt-[47px]">
          <p className="text-[15px] tracking-wide text-gray-500">
            26,000+ ITEMS
          </p>

          <h2 className="mt-2 text-4xl font-sans-serif tracking-tight text-red-700  sm:text-5xl">
            SALE
          </h2>

          <p className="mt-5 text-[18px] leading-relaxed text-gray-600">
            From wardrobe essentials to statement pieces and accessories for
            every occasion, shop your favourites at irresistible prices.
          </p>

          <Link
            href="/sale"
            className="mt-6 inline-block text-[15px] font-sans-serif tracking-wide underline underline-offset-4 transition hover:opacity-70"
          >
            SHOP SALE
          </Link>
        </div>

        {/* ================= RIGHT IMAGES ================= */}
        <div className="relative w-full flex-1 overflow-hidden">

          {/* ========== DESKTOP / TABLET ========== */}
          <div className="relative hidden overflow-hidden md:block">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="grid min-w-full grid-cols-3 gap-3 lg:gap-4"
                >
                  {saleImages
                    .slice(slideIndex * 3, slideIndex * 3 + 3)
                    .map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="group block"
                      >
                        <div className="relative aspect-[3/4.15] w-full overflow-hidden bg-gray-100">
                          <Image
                            src={item.src}
                            alt={item.title}
                            fill
                            className="object-cover  transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 1024px) 30vw, 25vw"
                            unoptimized
                            quality={100}
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-[12px] font-medium tracking-wide text-gray-800">
                            {item.title}
                          </p>
                          <p className="text-[12px] font-medium tracking-wide text-red-600">
                            {item.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slide === index ? "w-6 bg-gray-800" : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ========== MOBILE ========== */}
          <div className="relative md:hidden">
            <div className="relative aspect-[3/4.15] w-full overflow-hidden">
              {saleImages.map((item, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    current === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Link href={item.href} className="block h-full w-full">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={index === 0}
                      unoptimized
                      quality={100}
                    />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center">
              <p className="text-[12px] font-medium tracking-wide text-gray-800">
                {saleImages[current].title}
              </p>
              <p className="text-[12px] font-medium tracking-wide text-red-600">
                {saleImages[current].subtitle}
              </p>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {saleImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    current === index ? "w-6 bg-gray-800" : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}