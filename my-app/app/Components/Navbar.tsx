"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/CartContext/cartcontexts";
import CartDrawer from "../CartDrawer/page";
import { GET } from "../api/Ecom/route";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { cart, ToggleCart } = useCart();

  // ================= SEARCH STATES =================
  const [searchQuery, setSearchQuery] = useState("");
  const [datas, setDatas] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // ================= FETCH API DATA =================
  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await GET(
          "/api/Ecom"
        );

        const data = await response.json();

        setDatas(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    getProducts();
  }, []);

  // ================= SEARCH PRODUCTS =================
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    const filteredProducts = datas.filter((item: any) =>
      item.name?.toLowerCase().includes(query)
    );

    setSearchResults(filteredProducts);
  }, [searchQuery, datas]);

  const categories = [
    {
      name: "NEW IN",
      link: "/NewIn",
    },
    {
      name: "READY TO WEAR",
      link: "/ReadyToWear",
    },
    {
      name: "UNSTITCHED",
      link: "/Unstitched",
    },
    {
      name: "FORMALS",
      link: "/Formals",
    },
    {
      name: "FOOTWEAR",
      link: "/Footwear",
    },
    {
      name: "ACCESSORIES",
      link: "/Accesories",
    },
  ];

  // Close mobile menu & search when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white text-black">
      <CartDrawer />

      {/* =====================================
          TOP HEADER
      ====================================== */}

      <div className="relative h-14 border-b border-gray-200 sm:h-[60px]">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* ================= MOBILE / TABLET MENU BUTTON ================= */}

          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSearchOpen(false);
            }}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span
              className={`h-[1.5px] w-5 origin-center bg-black transition-all duration-300 ${
                menuOpen
                  ? "translate-y-[6.5px] rotate-45"
                  : ""
              }`}
            />

            <span
              className={`h-[1.5px] w-5 bg-black transition-all duration-300 ${
                menuOpen
                  ? "scale-x-0 opacity-0"
                  : ""
              }`}
            />

            <span
              className={`h-[1.5px] w-5 origin-center bg-black transition-all duration-300 ${
                menuOpen
                  ? "-translate-y-[6.5px] -rotate-45"
                  : ""
              }`}
            />
          </button>

          {/* ================= DESKTOP LEFT LINKS ================= */}

          <div className="hidden items-center gap-3 xl:gap-5 lg:flex">

            <div
            
              className="text-[11px] font-medium underline underline-offset-2 transition hover:opacity-70"
            >
              <div className="text-[12px] font-semibold">
                WOMEN
              </div>
            </div>

            <div
              
              className="text-[11px] transition hover:underline hover:opacity-70"
            >
              <div className="text-[12px] font-semibold">
                MEN
              </div>
            </div>

            <div
              className="text-[11px] transition hover:underline hover:opacity-70">
              <div className="text-[12px] font-semibold">
                TEENS
              </div>
            </div>

            <div
            
              className="whitespace-nowrap text-[11px] transition hover:underline hover:opacity-70"
            >
              <div className="text-[12px] font-semibold">
                FRAGRANCE & BEAUTY
              </div>
            </div>

            <div
            
              className="whitespace-nowrap text-[11px] text-red-600 transition hover:opacity-80"
            >
              <div className="text-[12px] font-semibold">

                <span className="mr-1 font-semibold text-yellow-500">
                  ★
                </span>

                25TH ANNIVERSARY

                <span className="ml-1 mt-[-90px]">
                  B1G1
                </span>

              </div>
            </div>

          </div>

          {/* ================= LOGO ================= */}

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

            <Link
              href="/"
              className="font-serif text-[36px] font-bold leading-none tracking-[-4px] sm:text-[42px] sm:tracking-[-5px] md:text-[46px]"
            >
              z

              <span className="ml-[1px] text-[50px] sm:ml-[10px] sm:text-[26px]">
                .
              </span>

            </Link>

          </div>

          {/* ================= RIGHT ACTIONS ================= */}

          <div className="ml-auto flex items-center gap-3 sm:gap-5 md:gap-6">

            {/* SEARCH */}

            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMenuOpen(false);
              }}
              className="text-[10px] transition hover:underline cursor-pointer sm:text-[11px]"
              aria-label="Search"
            >
              SEARCH
            </button>

            {/* Wishlist – tablet & up */}

            <button className="hidden text-[11px] transition hover:underline md:block">
              WISHLIST
            </button>

            {/* BAG */}

            <button
              onClick={ToggleCart}
              className="relative cursor-pointer text-[10px] transition hover:underline sm:text-[11px]"
            >
              BAG

              {cart.length > 0 && (
                <span className="absolute -right-4 -top-2 flex h-3 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {cart.reduce(
                    (total: number, item: any) =>
                      total + (item.quantity || 1),
                    0
                  )}
                </span>
              )}

            </button>

          </div>

        </div>
      </div>

      {/* =====================================
          SEARCH BAR
      ====================================== */}

      <div
        className={`relative overflow-visible border-b border-gray-200 transition-all duration-300 ease-in-out ${
          searchOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 overflow-hidden opacity-0"
        }`}
      >

        <div className="px-4 py-4 sm:px-6 lg:px-8">

          <div className="mx-auto w-full max-w-2xl">

            <div className="relative">

              {/* Search Input */}

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                autoFocus={searchOpen}
                placeholder="Search products..."
                className="w-full border-b border-black bg-transparent py-2.5 pr-16 text-sm outline-none placeholder:text-gray-400"
              />

              {/* Close */}

              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-500 transition hover:text-black"
                aria-label="Close search"
              >
                CLOSE
              </button>

            </div>

            {/* ================= SEARCH RESULTS ================= */}

            {searchQuery.trim() && (

              <div className="mt-4 max-h-[350px] overflow-y-auto bg-white">

                {searchResults.length > 0 ? (

                  <div className="divide-y border border-gray-100">

                    {searchResults.map(
                      (item: any) => (

                        <Link
                          key={item.id}
                          href={`/WorldPic/${item.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex gap-4 p-3 transition hover:bg-gray-50"
                        >

                          {/* Product Image */}

                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-14 object-cover"
                          />

                          {/* Product Details */}

                          <div className="flex flex-1 flex-col justify-center">

                            <h3 className="text-xs font-medium uppercase">
                              {item.name}
                            </h3>

                            <div className="mt-1 flex items-center gap-2">

                              {item.oldPrice && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  Rs.
                                  {Number(
                                    item.oldPrice
                                  ).toLocaleString()}
                                </span>
                              )}

                              <span className="text-xs font-medium">
                                Rs.
                                {Number(
                                  item.price
                                ).toLocaleString()}
                              </span>

                            </div>

                          </div>

                        </Link>

                      )
                    )}

                  </div>

                ) : (

                  <div className="border border-gray-100 px-4 py-6 text-center text-sm text-gray-500">
                    No products found
                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </div>

      {/* =====================================
          DESKTOP SECOND NAVBAR
      ====================================== */}

      <nav className="hidden h-10 border-b border-gray-200 lg:block">

        <div className="relative mx-auto flex h-full max-w-[1600px] items-center px-6 lg:px-8">

          {/* Country */}

          <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
            <span className="text-sm">🇵🇰</span>
            <span>PAK</span>
          </div>

          {/* Categories – centered */}

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4 xl:gap-7 2xl:gap-9">

            {categories.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className="whitespace-nowrap text-[10px] transition hover:underline xl:text-[11px]"
              >
                {item.name}
              </Link>
            ))}

          </div>

        </div>

      </nav>

      {/* =====================================
          MOBILE / TABLET MENU OVERLAY
      ====================================== */}

      {/* Backdrop */}

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          menuOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Slide-in panel */}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-[min(100%,320px)] transform bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Header of menu */}

        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-5 sm:h-[60px]">

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-sm">🇵🇰</span>
            <span>PAK</span>
          </div>

          <button
            onClick={() => setMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center text-lg"
            aria-label="Close menu"
          >
            ✕
          </button>

        </div>

        {/* Scrollable content */}

        <div className="h-[calc(100%-3.5rem)] overflow-y-auto sm:h-[calc(100%-60px)]">

          {/* Main gender links */}

          <div className="flex gap-6 border-b border-gray-100 px-5 py-5">

            <a
              href="#"
              className="text-[12px] font-medium underline underline-offset-2"
              onClick={() => setMenuOpen(false)}
            >
              WOMEN
            </a>

            <a
              href="#"
              className="text-[12px] transition hover:underline"
              onClick={() => setMenuOpen(false)}
            >
              MEN
            </a>

            <a
              href="#"
              className="text-[12px] transition hover:underline"
              onClick={() => setMenuOpen(false)}
            >
              TEENS
            </a>

          </div>

          {/* Categories */}

          <div className="flex flex-col">

            {categories.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                onClick={() => setMenuOpen(false)}
                className="border-b border-gray-100 px-5 py-4 text-[12px] transition hover:bg-gray-50 active:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}

          </div>

          {/* Fragrance link */}

          <div className="border-b border-gray-100 px-5 py-4">

            <a
              href="#"
              className="text-[12px] transition hover:underline"
              onClick={() => setMenuOpen(false)}
            >
              FRAGRANCE & BEAUTY
            </a>

          </div>

          {/* Anniversary */}

          <div className="px-5 py-5">

            <a
              href="#"
              className="text-[12px] font-medium text-red-600"
              onClick={() => setMenuOpen(false)}
            >

              <span className="mr-1 text-yellow-500">
                ★
              </span>

              25TH ANNIVERSARY B1G1

            </a>

          </div>

          {/* Wishlist for mobile */}

          <div className="border-t border-gray-100 px-5 py-4 md:hidden">

            <button className="text-[12px] transition hover:underline">
              WISHLIST
            </button>

          </div>

        </div>

      </div>

    </header>
  );
}