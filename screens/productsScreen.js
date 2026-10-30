
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const API_URL = "http://10.0.2.2:3000";

export default function ProductsScreen({ route, navigation }) {
  const { activityId, activityName, token } = route.params || {};

  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/activity/${activityId}`
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer les offres.");
        }

        const data = await response.json();

        if (active) {
          const loadedProducts = Array.isArray(data.products)
            ? data.products
            : [];

          setProducts(loadedProducts);
          setQuantities({});
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Une erreur est survenue.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (activityId) {
      loadProducts();
    } else {
      setError("Activité introuvable.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [activityId]);

  function changeQuantity(productId, change) {
    setQuantities((previous) => {
      const current = previous[productId] || 0;
      const next = Math.max(0, current + change);

      return {
        ...previous,
        [productId]: next,
      };
    });
  }

  function goToCart() {
    const selectedProducts = products
      .filter((product) => (quantities[product._id] || 0) > 0)
      .map((product) => ({
        ...product,
        quantity: quantities[product._id],
      }));

    if (selectedProducts.length === 0) {
      return;
    }

   navigation.navigate("Cart", {
  activityId,
  activityName,
  products: selectedProducts,
  token,
});
  }

  const selectedCount = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Les offres de {activityName}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#18864B" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : (
        <>
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <Text style={styles.message}>
                Aucune offre disponible pour cette activité.
              </Text>
            }
            renderItem={({ item }) => {
              const quantity = quantities[item._id] || 0;

              return (
                <View style={styles.card}>
                  <Text style={styles.productName}>{item.name}</Text>

                  {!!item.description && (
                    <Text style={styles.description}>
                      {item.description}
                    </Text>
                  )}

                  <Text style={styles.price}>
                    {item.price} {item.currency}
                  </Text>

                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => changeQuantity(item._id, -1)}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantity}>{quantity}</Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => changeQuantity(item._id, 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />

          {selectedCount > 0 && (
            <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
              <Text style={styles.cartButtonText}>
                Voir mon panier ({selectedCount})
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#004000",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  description: {
    color: "#666",
    marginTop: 6,
  },
  price: {
    color: "#18864B",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  quantityButton: {
    backgroundColor: "#18864B",
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  quantity: {
    fontSize: 17,
    fontWeight: "bold",
    marginHorizontal: 18,
  },
  cartButton: {
    backgroundColor: "#18864B",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  cartButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  message: {
    textAlign: "center",
    color: "#555",
    marginTop: 20,
  },
});
