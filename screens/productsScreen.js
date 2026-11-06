
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import API_URL from "../config/api";

export default function ProductsScreen({ route, navigation }) {
  const { activityId, activityName, token } = route.params || {};

  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingFavorites, setUpdatingFavorites] = useState([]);
  const { addToCart } = useCart();

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

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Impossible de récupérer les favoris.");
        }

        const data = await response.json();

        if (active) {
          const favoriteIds = (data.products || [])
            .map((favorite) => favorite.productId?._id)
            .filter(Boolean);

          setFavorites(favoriteIds);
        }
      } catch (e) {
        if (active) {
          Alert.alert("Favoris", e.message);
        }
      }
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [token]);

  async function toggleFavorite(productId) {
    if (!token) {
      Alert.alert(
        "Connexion requise",
        "Connecte-toi pour ajouter ce produit à tes favoris."
      );
      return;
    }

    if (updatingFavorites.includes(productId)) return;

    const isFavorite = favorites.includes(productId);

    try {
      setUpdatingFavorites((previous) => [...previous, productId]);

      const response = await fetch(
        `${API_URL}/favorites/product/${productId}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de modifier le favori.");
      }

      setFavorites((previous) =>
        isFavorite
          ? previous.filter((id) => id !== productId)
          : [...previous, productId]
      );

      Alert.alert(
        "Favoris",
        isFavorite
          ? "Produit retiré des favoris."
          : "Produit ajouté aux favoris."
      );
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setUpdatingFavorites((previous) =>
        previous.filter((id) => id !== productId)
      );
    }
  }

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
    const selectedProducts = products.filter(
      (product) => (quantities[product._id] || 0) > 0
    );

    if (selectedProducts.length === 0) {
      Alert.alert("Panier", "Sélectionne au moins un produit.");
      return;
    }

    selectedProducts.forEach((product) => {
      addToCart(
        product,
        quantities[product._id],
        activityId,
        activityName
      );
    });

    navigation.getParent()?.navigate("ProspectCart", {
      token,
    });
  }

  const selectedCount = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={require("../assets/logo_paysage.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Les offres de {activityName || "cette activité"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <ActivityIndicator size="large" color="#66CC00" />
        <Text style={styles.loadingText}>
          Chargement des produits...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.message}>
            Aucune offre disponible pour cette activité.
          </Text>
        }
        renderItem={({ item }) => {
          const quantity = quantities[item._id] || 0;
          const isFavorite = favorites.includes(item._id);
          const isUpdating = updatingFavorites.includes(item._id);

          const productImages = Array.isArray(item.images)
            ? item.images.filter(
                (image) => typeof image === "string" && image.trim() !== ""
              )
            : [];

          return (
            <View style={styles.card}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>

                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(item._id)}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#C62828" />
                  ) : (
                    <Text
                      style={[
                        styles.favoriteIcon,
                        !isFavorite && styles.favoriteInactive,
                      ]}
                    >
                      {isFavorite ? "♥" : "♡"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {productImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagesContainer}
                >
                  {productImages.map((image, index) => (
                    <Image
                      key={`${item._id}-${index}`}
                      source={{ uri: image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}

              {!!item.description && (
                <Text style={styles.description}>
                  {item.description}
                </Text>
              )}

              <Text style={styles.price}>
                {item.price} {item.currency}
              </Text>

              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantité :</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => changeQuantity(item._id, -1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.quantity}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => changeQuantity(item._id, 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          selectedCount > 0 ? (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={goToCart}
              activeOpacity={0.8}
            >
              <Text style={styles.cartButtonText}>
                Voir mon panier ({selectedCount})
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  center: {
    flex: 1,
    backgroundColor: "#003300",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: "100%",
    height: 115,
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 8,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
    color: "#003300",
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: {
    fontSize: 30,
    color: "#C62828",
  },
  favoriteInactive: {
    color: "#777777",
  },
  imagesContainer: {
    marginTop: 12,
    marginBottom: 5,
  },
  productImage: {
    width: 220,
    height: 170,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#EEEEEE",
  },
  description: {
    color: "#555555",
    marginTop: 7,
    lineHeight: 20,
  },
  price: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 12,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  quantityLabel: {
    color: "#003300",
    fontWeight: "600",
    marginRight: 12,
  },
  quantityButton: {
    backgroundColor: "#CDAB82",
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "#003300",
    fontSize: 23,
    fontWeight: "bold",
  },
  quantity: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#003300",
    marginHorizontal: 18,
  },
  cartButton: {
    backgroundColor: "#CDAB82",
    minHeight: 52,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  cartButtonText: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 16,
  },
  message: {
    textAlign: "center",
    color: "#FFFFFF",
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
  },
});
