"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f8f8f8] text-gray-700">

      {/* ========== TOP ICONS ========== */}
      <div className="border-b border-gray-200">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col items-center gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m9-1h2a1 1 0 001-1v-3.38a1 1 0 00-.293-.707l-2.121-2.122A1 1 0 0013.121 8H11m-1 8h6" />
            </svg>
            <span className="text-[11px] font-medium tracking-wider text-gray-600">
              ORDER TRACKING
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[11px] font-medium tracking-wider text-gray-600">
              EXCHANGES & RETURNS
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[11px] font-medium tracking-wider text-gray-600">
              OUR STORES
            </span>
          </div>
        </div>
      </div>

      {/* ========== MAIN FOOTER ========== */}
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* CONTACT US */}
          <div>
            <h4 className="mb-5 text-[12px] font-semibold tracking-wider text-gray-800">
              CONTACT US
            </h4>
            <ul className="space-y-3 text-[12px] text-gray-600">
              <li className="flex items-start gap-2">
                <span>✉</span>
                <a href="mailto:wecare@sapphireonline.pk" className="hover:underline">
                  wecare@sapphireonline.pk
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>☎</span>
                <span>+92(0)42 323-882-45</span>
              </li>
              <li className="flex items-start gap-2">
                <span>☎</span>
                <span>+92(0)42 111-738-245</span>
              </li>
            </ul>
          </div>

          {/* CUSTOMER CARE */}
          <div>
            <h4 className="mb-5 text-[12px] font-semibold tracking-wider text-gray-800">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-3 text-[12px] text-gray-600">
              <li><Link href="#" className="hover:underline">FAQs</Link></li>
              <li><Link href="#" className="hover:underline">EXCHANGE & RETURN POLICY</Link></li>
              <li><Link href="#" className="hover:underline">CONTACT US</Link></li>
            </ul>
          </div>

          {/* INFORMATION */}
          <div>
            <h4 className="mb-5 text-[12px] font-semibold tracking-wider text-gray-800">
              INFORMATION
            </h4>
            <ul className="space-y-3 text-[12px] text-gray-600">
              <li><Link href="#" className="hover:underline">ABOUT US</Link></li>
              <li><Link href="#" className="hover:underline">PRIVACY POLICY</Link></li>
              <li><Link href="#" className="hover:underline">PAYMENTS</Link></li>
              <li><Link href="#" className="hover:underline">STORE LOCATOR</Link></li>
              <li><Link href="#" className="hover:underline">FABRIC GLOSSARY</Link></li>
              <li><Link href="#" className="hover:underline">BLOGS</Link></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h4 className="mb-5 text-[12px] font-semibold tracking-wider text-gray-800">
              NEWSLETTER SIGNUP
            </h4>
            <p className="mb-4 text-[11px] leading-relaxed text-gray-500">
              SUBSCRIBE TO OUR NEWSLETTER FOR EXCLUSIVE UPDATES
            </p>

            <div className="flex max-w-xs">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full border border-gray-300 bg-white px-3 py-2.5 text-[12px] outline-none placeholder:text-gray-400"
              />
              <button className="bg-black px-5 py-2.5 text-[11px] font-medium tracking-wider text-white transition hover:bg-gray-800">
                SUBSCRIBE
              </button>
            </div>

            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-4">
              <a href="#" className="text-gray-600 hover:text-black">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-black">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.41 3.92-2.14 6.05-1.89.08 1.48.02 2.96.01 4.44-.15-.02-.3-.04-.45-.04-1.19-.02-2.4.36-3.3 1.18-.79.71-1.2 1.81-1.05 2.89.2 1.4 1.27 2.48 2.65 2.7 1.33.2 2.83-.39 3.5-1.52.1-.17.16-.35.2-.54.18-1.56.17-3.13.15-4.7-.01-2.49.01-4.99-.01-7.48z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      
      {/* ========== BOTTOM ========== */}
<div className="border-t border-gray-200">
  <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
    <p className="text-[11px] text-gray-500">
      © COPYRIGHT 2026 SAPPHIRE
    </p>

    <div className="flex items-center gap-4">
      {/* Mastercard */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
        alt="Mastercard"
        className="h-6 w-auto object-contain"
      />

      {/* Visa - fixed */}
      <img
        src="/images/visa pic.png"
        alt="Visa"
        className="h-5 w-auto object-contain mix-blend-multiply"
      />
    </div>
  </div>
</div>
    </footer>
  );
}