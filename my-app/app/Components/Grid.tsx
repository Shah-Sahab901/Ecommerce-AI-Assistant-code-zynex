"use client";

import Image from "next/image";
import Link from "next/link";

export default function ReadyToWear() {
  return (
    <section className="w-full bg-white py-10 md:py-14 lg:py-16 mt-0 lg:mt-[-77px]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8 xl:gap-14">

        {/* ================= LEFT IMAGE ================= */}
        <div className="w-full flex-1 ml-0 lg:ml-[-34px]">
          <div className="relative w-full overflow-hidden lg:w-[810px]">
            <Image
              src="/images/22.png"
              alt="Ready To Wear Collection"
              width={800}
              height={930}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
              quality={90}
            />
          </div>
        </div>

        {/* ================= RIGHT TEXT ================= */}
        <div className="w-full max-w-md shrink-0 lg:w-[380px] xl:w-[420px]">
          <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl lg:text-[42px]">
            READY TO WEAR
          </h2>

          <p className="mt-5 text-[16px] leading-relaxed text-[#565656] sm:text-[17px]">
            From standout silhouettes to festive looks and everyday
            staples—style your favourites on a budget.
          </p>

          <div className="mt-8 flex flex-wrap gap-6">
            <Link
              href="/collections/shirts"
              className="text-[13px] font-medium tracking-wide underline underline-offset-4 transition hover:opacity-70"
            >
              SHIRTS
            </Link>

            <Link
              href="/collections/bottoms"
              className="text-[13px] font-medium tracking-wide underline underline-offset-4 transition hover:opacity-70"
            >
              BOTTOMS
            </Link>

            <Link
              href="/collections/dupattas"
              className="text-[13px] font-medium tracking-wide underline underline-offset-4 transition hover:opacity-70"
            >
              DUPATTAS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}