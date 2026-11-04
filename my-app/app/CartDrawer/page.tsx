"use client";

import { useCart } from "@/CartContext/cartcontexts";

const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    ToggleCart,
    DeleteCart,
    UpdateQuantity,
  } = useCart();

  if (!isCartOpen) {
    return null;
  }

  // Total Price
  const totalPrice = cart.reduce(
    (total: number, item: any) =>
      total +
      Number(item.price) * (item.quantity || 1),
    0
  );

  return (
    <div className="fixed inset-0 z-50">

      {/* Background */}
      <div
        onClick={ToggleCart}
        className="absolute inset-0 bg-black/40 "
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-5">

          <h2 className="text-lg font-medium">
            SHOPPING BAG
          </h2>

          <button
            onClick={ToggleCart}
            className="cursor-pointer text-2xl"
          >
            ×
          </button>

        </div>

        {/* Products */}
        <div className="h-[calc(100%-140px)] overflow-y-auto px-5">

          {cart.length === 0 ? (

            <div className="py-20 text-center text-gray-500">
              Your bag is empty
            </div>

          ) : (

            <div className="divide-y">

              {cart.map(
                (item: any, index: number) => (

                  <div
                    key={`${item.id}-${index}`}
                    className="flex gap-4 py-5"
                  >

                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-24 shrink-0 object-cover"
                    />

                    {/* Product Details */}
                    <div className="flex min-w-0 flex-1 flex-col">

                      {/* Product Name */}
                      <h3 className="text-sm font-medium uppercase leading-5">
                        {item.name}
                      </h3>

                      {/* SKU */}
                      <p className="mt-2 text-xs text-gray-500">
                        SKU: WBM-{item.id}
                      </p>

                      {/* Price */}
                      <div className="mt-2 flex items-center gap-2">

                        {item.oldPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            Rs.
                            {Number(
                              item.oldPrice
                            ).toLocaleString()}
                          </span>
                        )}

                        <span className="text-sm font-medium">
                          Rs.
                          {(
                            Number(item.price) *
                            (item.quantity || 1)
                          ).toLocaleString()}
                        </span>

                      </div>

                      {/* Quantity */}
                      <div className="mt-4 flex items-center">

                        {/* Quantity Text */}
                        <span className="text-[14px]">
                          Quantity:
                        </span>

                        {/* Quantity Controls */}
                        <div className="ml-5 flex h-7 items-center border border-gray-300">

                          {/* Minus */}
                          <button
                            onClick={() =>
                              UpdateQuantity(
                                item.id,
                                (item.quantity || 1) - 1
                              )
                            }
                            disabled={
                              (item.quantity || 1) <= 1
                            }
                            className="flex h-full w-8 cursor-pointer items-center justify-center text-lg leading-none transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>

                          {/* Count */}
                          <span className="flex h-full w-8 items-center justify-center border-x border-gray-300 text-sm">
                            {item.quantity || 1}
                          </span>

                          {/* Plus */}
                          <button
                            onClick={() =>
                              UpdateQuantity(
                                item.id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="flex h-full w-8 cursor-pointer items-center justify-center text-lg leading-none transition hover:bg-gray-100"
                          >
                            +
                          </button>

                        </div>

                      </div>

                      {/* Remove */}
                      <button
                        onClick={() =>
                          DeleteCart(item.id)
                        }
                        className="mt-3 w-fit cursor-pointer text-xs text-red-600 underline"
                      >
                        REMOVE
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* Bottom */}
        {cart.length > 0 && (

          <div className="absolute bottom-0 left-0 right-0 border-t bg-white px-5 py-5">

            {/* Total */}
            <div className="mb-4 flex justify-between text-sm">

              <span>
                TOTAL
              </span>

              <span className="font-medium">
                Rs.
                {totalPrice.toLocaleString()}
              </span>

            </div>

            {/* Checkout */}
            <button className="w-full cursor-pointer bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800">
              CHECKOUT
            </button>

          </div>

        )}

      </div>

    </div>
  );
};

export default CartDrawer;