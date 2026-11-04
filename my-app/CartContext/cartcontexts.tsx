// 'use client';

// import { createContext, useContext, useState } from "react";

// const CartCreation = createContext<any>(null);

// export const Creator = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {

//   const [cart, setCart] = useState<any[]>([]);
//   const [isCartOpen, setIsCartOpen] = useState(false);

//   const AddToCart = (id: number, item: any) => {
//   const product = item.id === id ? item : null;

//   if (product) {
//     setCart((prev) => {
//       const existingProduct = prev.find(
//         (cartItem) => cartItem.id === id
//       );

//       if (existingProduct) {
//         return prev.map((cartItem) =>
//           cartItem.id === id
//             ? {
//                 ...cartItem,
//                 quantity:
//                   (cartItem.quantity || 1) + 
//                   (product.quantity || 1),
//               }
//             : cartItem
//         );
//       }

//       return [
//         ...prev,
//         {
//           ...product,
//           quantity: product.quantity || 1,
//         },
//       ];
//     });
//   }
// };

//   const DeleteCart = (id: number) => {
//     setCart((prev) =>
//       prev.filter((item) => item.id !== id)
//     );
//   };

//   const ToggleCart = () => {
//     setIsCartOpen((prev) => !prev);
//   };

//   return (
//     <CartCreation.Provider
//       value={{
//         cart,
//         AddToCart,
//         DeleteCart,
//         isCartOpen,
//         ToggleCart,
//       }}
//     >
//       {children}
//     </CartCreation.Provider>
//   );
// };

// export const useCart = () => {
//   return useContext(CartCreation);
// };


'use client';

import { createContext, useContext, useState } from "react";

const CartCreation = createContext<any>(null);

export const Creator = ({
  children,
}: {
  children: React.ReactNode;
}) => {

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const AddToCart = (id: number, item: any) => {
    const product = item.id === id ? item : null;

    if (product) {
      setCart((prev) => {
        const existingProduct = prev.find(
          (cartItem) => cartItem.id === id
        );

        if (existingProduct) {
          return prev.map((cartItem) =>
            cartItem.id === id
              ? {
                  ...cartItem,
                  quantity:
                    (cartItem.quantity || 1) +
                    (product.quantity || 1),
                }
              : cartItem
          );
        }

        return [
          ...prev,
          {
            ...product,
            quantity: product.quantity || 1,
          },
        ];
      });
    }
  };

  // Update product quantity
  const UpdateQuantity = (id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, quantity),
            }
          : item
      )
    );
  };

  const DeleteCart = (id: number) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const ToggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  return (
    <CartCreation.Provider
      value={{
        cart,
        AddToCart,
        DeleteCart,
        UpdateQuantity,
        isCartOpen,
        ToggleCart,
      }}
    >
      {children}
    </CartCreation.Provider>
  );
};

export const useCart = () => {
  return useContext(CartCreation);
};