import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Ajouter un produit ou augmenter sa quantité
  function addToCart(product, quantity = 1, activityId, activityName) {
    setCartItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) =>
          item.productId === product._id &&
          item.activityId === activityId
      );

      if (existingIndex !== -1) {
        return previous.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...previous,
        {
          productId: product._id,
          name: product.name,
          description: product.description || "",
          price: Number(product.price),
          currency: product.currency,
          quantity,
          activityId,
          activityName,
          sellerId: product.userId,
        },
      ];
    });
  }

  // Modifier la quantité
  function updateQuantity(productId, activityId, quantity) {
    setCartItems((previous) => {
      if (quantity <= 0) {
        return previous.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.activityId === activityId
            )
        );
      }

      return previous.map((item) =>
        item.productId === productId && item.activityId === activityId
          ? { ...item, quantity }
          : item
      );
    });
  }

  // Retirer un produit
  function removeFromCart(productId, activityId) {
    setCartItems((previous) =>
      previous.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.activityId === activityId
          )
      )
    );
  }

  // Vider complètement le panier
  function clearCart() {
    setCartItems([]);
  }

  // Nombre total d'articles
  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart doit être utilisé dans CartProvider.");
  }

  return context;
}