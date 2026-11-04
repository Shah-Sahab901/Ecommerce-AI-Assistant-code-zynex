"use client";

import Navbar from "@/app/Components/Navbar";
import Footer from "@/app/Components/Footer";
import { useCart } from "@/CartContext/cartcontexts";
import { use, useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  quantity?: number;

  // Extra product details
  sku?: string;
  color?: string;
  fabric?: string;
  discount?: number;
  sizes?: string[];
}

const ProductDetail = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  // Dynamic URL se id lena
  const { id } = use(params);

  console.log("Dynamic ID:", id);

  const { AddToCart, item, quantity } = useCart();

  // Product state
  const [product, setProduct] = useState<Product | null>(null);

  // Selected size
  const [selectedSize, setSelectedSize] = useState("L");

  // Quantity
  const [count, setCount] = useState(1);

  // Increase quantity
  const Increament = () => {
    setCount((prev) => prev + 1);
  };

  // Decrease quantity
  const Decreament = () => {
    setCount((prev) => {
      if (prev > 1) {
        return prev - 1;
      }

      return 1;
    });
  };

  // API se products fetch karna
  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await fetch("/api/Ecom");

        const datas: Product[] = await response.json();

        // API ke product ke id ke saath URL wali id compare
        const foundProduct = datas.find(
          (item) => item.id === Number(id)
        );

        setProduct(foundProduct || null);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    getProducts();
  }, [id]);

  // Product loading
  if (!product) {
    return (
      <div>
        <Navbar />

        <div className="py-20 text-center text-xl">
          Product not found
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">

          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />

            {/* Discount Badge */}
            {product.discount && (
              <div className="absolute right-2 top-2 bg-[#c41e3a] px-5 py-2 text-xs font-medium text-white">
                {product.discount}% OFF
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">

            {/* Product Name */}
            <h1 className="text-2xl font-medium uppercase tracking-wide">
              {product.name}
            </h1>

            {/* Category */}
            <p className="mt-2 text-sm text-gray-500">
              WEST
            </p>

            {/* Price */}
            <div className="mt-4 flex items-center gap-3">

              {product.oldPrice && (
                <span className="text-lg text-gray-400 line-through">
                  Rs.{product.oldPrice.toLocaleString()}
                </span>
              )}

              <span className="text-xl font-medium text-[#c41e3a]">
                Rs.{product.price.toLocaleString()}
              </span>

            </div>

            {/* SKU */}
            <p className="mt-3 text-xs text-gray-500">
              SKU: {product.sku || `WBM-${product.id}`}
            </p>

            {/* Colour */}
            <div className="mt-5">
              <p className="text-xs font-medium uppercase">
                Colour
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-5 w-5 border border-gray-300 bg-[#77795c]" />

                <span className="text-xs text-gray-600">
                  {product.color || "Green Khaki"}
                </span>
              </div>
            </div>

            {/* Size */}
            <div className="mt-5">

              <div className="flex items-center justify-between">

                {/* Selected Size */}
                <p className="text-xs font-medium uppercase">
                  Size: {selectedSize}
                </p>

                <button className="text-xs underline">
                  SIZE CHART
                </button>

              </div>

              {/* Size Buttons */}
              <div className="mt-3 flex gap-2">

                {(product.sizes || [
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                ]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`relative cursor-pointer h-8 min-w-[38px] border px-3 text-xs transition hover:border-black ${
                      selectedSize === size
                        ? "border-black font-medium"
                        : "border-gray-300"
                    }`}
                  >
                    {size}

                    {/* Small red dot on XL */}
                    {size === "XL" && (
                      <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#c41e3a]" />
                    )}
                  </button>
                ))}

              </div>
            </div>

            {/* ================= QUANTITY ================= */}

            <div className="mt-6">

              <p className="text-xs font-medium uppercase">
                Quantity
              </p>

              <div className="mt-3 flex h-10 w-[120px] items-center justify-between border border-gray-300">

                {/* Minus */}
                <button
                  type="button"
                  onClick={Decreament}
                  className="flex cursor-pointer h-full w-10 items-center justify-center text-lg transition hover:bg-gray-100"
                >
                  −
                </button>

                {/* Quantity */}
                <span className="text-sm font-medium">
                  {count}
                </span>

                {/* Plus */}
                <button
                  type="button"
                  onClick={Increament}
                  className="flex h-full cursor-pointer w-10 items-center justify-center text-lg transition hover:bg-gray-100"
                >
                  +
                </button>

              </div>

            </div>

            {/* Add To Bag */}
            <button
              onClick={() =>
                AddToCart(product.id, {
                  ...product,
                  quantity: count,
                })
              }
              className="mt-8 cursor-pointer w-full max-w-xs bg-black py-3 text-sm font-medium tracking-wide text-white transition hover:bg-gray-800"
            >
              ADD TO BAG
            </button>

            {/* Information Tabs */}
            <div className="mt-8 flex gap-3 text-xs uppercase">
              <button className="underline underline-offset-4">
                DETAILS
              </button>

              <span>|</span>

              <button>
                DESCRIPTION
              </button>

              <span>|</span>

              <button>
                SIZE GUIDE
              </button>
            </div>

            {/* Product Information */}
            <div className="mt-6 space-y-3 text-xs text-gray-600">

              <p>
                <span className="font-medium text-black">
                  Colour:
                </span>{" "}
                {product.color || "Green Khaki"}
              </p>

              <p>
                <span className="font-medium text-black">
                  Fabric:
                </span>{" "}
                {product.fabric || "97% Cotton, 3% Elastane"}
              </p>

            </div>

            {/* Product Note */}
            <p className="mt-6 text-[11px] uppercase leading-5 text-gray-600">
              NOTE: ACTUAL PRODUCT COLOR MAY VARY SLIGHTLY FROM THE IMAGE.
            </p>

            {/* Share */}
            <div className="mt-5">

              <p className="text-xs font-medium uppercase">
                SHARE THIS LOOK
              </p>

              <div className="mt-3 flex gap-2">

                {/* WhatsApp */}
                <button
                  aria-label="Share on WhatsApp"
                  className="flex h-7 w-7 items-center justify-center border border-gray-300 transition hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 11.5a8.5 8.5 0 0 1-12.7 7.4L4 20l1.2-3.1A8.5 8.5 0 1 1 20 11.5Z" />
                    <path d="M8.5 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.5c.1.2.1.4-.1.6l-.6.7c.7 1.2 1.7 2.1 2.9 2.7l.7-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.3.6-.1.5-.4 1.1-.8 1.3-.4.3-1 .3-1.5.1-2.8-.9-5.2-3.1-6.3-5.8-.2-.5-.2-1.1.1-1.6l.8-1.5Z" />
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  aria-label="Share on Facebook"
                  className="flex h-7 w-7 items-center justify-center border border-gray-300 transition hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h2.2l.5-3H13V9c0-.6.4-1 1-1Z" />
                  </svg>
                </button>

                {/* Copy Link */}
                <button
                  aria-label="Copy product link"
                  className="flex h-7 w-7 items-center justify-center border border-gray-300 transition hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                    <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1-7.1l1.1-1.1" />
                  </svg>
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;