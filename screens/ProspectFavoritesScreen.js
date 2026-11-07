import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";

export default function ProspectFavoritesScreen({ route, navigation }) {
  const { token } = route.params || {};
  const { addToCart } = useCart();

  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  function showDialog(title, message, buttons = []) {
    setDialog({
      visible: true,
      title,
      message,
      buttons: buttons.length ? buttons : [{ text: "OK", style: "primary" }],
    });
  }

  function closeDialog() {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  function handleDialogButton(button) {
    closeDialog();

    if (button.onPress) {
      setTimeout(() => button.onPress(), 150);
    }
  }

  const loadFavorites = useCallback(async () => {
    try {
      if (!token) {
        throw new Error("Connexion requise pour consulter tes favoris.");
      }

      const response = await fetch(`${API_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les favoris.");
      }

      setActivities(data.activities || []);
      setProducts(data.products || []);
    } catch (error) {
      showDialog("Favoris", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  async function removeFavorite(type, id) {
    try {
      const response = await fetch(`${API_URL}/favorites/${type}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de retirer ce favori.");
      }

      if (type === "activity") {
        setActivities((previous) =>
          previous.filter((item) => item.activityId?._id !== id),
        );
      } else {
        setProducts((previous) =>
          previous.filter((item) => item.productId?._id !== id),
        );
      }
    } catch (error) {
      showDialog("Erreur", error.message);
    }
  }

  function confirmRemove(type, id, name) {
    if (!id) {
      showDialog("Information", "Cet élément n'est plus disponible.");
      return;
    }

    showDialog(
      "Retirer des favoris",
      `Veux-tu retirer « ${name} » de tes favoris ?`,
      [
        {
          text: "Annuler",
          style: "secondary",
        },
        {
          text: "Retirer",
          style: "danger",
          onPress: () => removeFavorite(type, id),
        },
      ],
    );
  }

  function openActivity(activity) {
    navigation.navigate("ProspectSearch", {
      screen: "ProviderDetail",
      params: {
        activity,
        token,
      },
    });
  }

  function openProducts(activity) {
    if (!activity?._id) {
      showDialog("Information", "Cette activité n'est plus disponible.");
      return;
    }

    navigation.navigate("ProspectSearch", {
      screen: "Products",
      params: {
        activityId: activity._id,
        activityName: activity.name,
        token,
      },
    });
  }

  function addProductToCart(product) {
    const activity = product.activityId;

    if (!activity?._id) {
      showDialog("Information", "L'activité de ce produit est introuvable.");
      return;
    }

    addToCart(product, 1, activity._id, activity.name);

    showDialog("Panier", `${product.name} a été ajouté à ton panier.`, [
      {
        text: "Continuer",
        style: "secondary",
      },
      {
        text: "Voir mon panier",
        style: "primary",
        onPress: () =>
          navigation.navigate("ProspectCart", {
            token,
          }),
      },
    ]);
  }

  function formatPrice(price, currency) {
    return `${Number(price || 0).toLocaleString("fr-FR")} ${currency || ""}`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#66CC00" />
          <Text style={styles.loadingText}>Chargement des favoris...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={(_, index) => String(index)}
        renderItem={null}
        ListHeaderComponent={
          <View>
            <Image
              source={require("../assets/logo_paysage.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.pageTitle}>Mes favoris</Text>

            {/* MARCHANDS FAVORIS */}
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={23} color="#66CC00" />
              <Text style={styles.sectionTitle}>Mes marchands favoris</Text>
              <Text style={styles.counter}>{activities.length}</Text>
            </View>

            {activities.length === 0 ? (
              <Text style={styles.emptyText}>
                Tu n'as pas encore de marchand favori.
              </Text>
            ) : (
              activities.map((item) => {
                const activity = item.activityId;

                return (
                  <View style={styles.card} key={item._id}>
                    <Text style={styles.itemName}>
                      {activity?.name || "Marchand"}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {activity?.specialty || "Spécialité non renseignée"}
                    </Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => openActivity(activity)}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={18}
                          color="#003300"
                        />
                        <Text style={styles.primaryButtonText}>Voir</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => openProducts(activity)}
                      >
                        <Text style={styles.secondaryButtonText}>
                          Voir les offres
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          confirmRemove(
                            "activity",
                            activity?._id,
                            activity?.name || "ce marchand",
                          )
                        }
                      >
                        <Ionicons
                          name="heart-dislike-outline"
                          size={21}
                          color="#E53935"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* PRODUITS FAVORIS */}
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={23} color="#66CC00" />
              <Text style={styles.sectionTitle}>Mes produits favoris</Text>
              <Text style={styles.counter}>{products.length}</Text>
            </View>

            {products.length === 0 ? (
              <Text style={styles.emptyText}>
                Tu n'as pas encore de produit favori.
              </Text>
            ) : (
              products.map((item) => {
                const product = item.productId;
                const activity = product?.activityId;

                return (
                  <View style={styles.card} key={item._id}>
                    <Text style={styles.itemName}>
                      {product?.name || "Produit"}
                    </Text>

                    {!!product?.description && (
                      <Text style={styles.itemSubtitle}>
                        {product.description}
                      </Text>
                    )}

                    <Text style={styles.price}>
                      {formatPrice(product?.price, product?.currency)}
                    </Text>

                    <Text style={styles.activityName}>
                      Activité : {activity?.name || "Non renseignée"}
                    </Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => addProductToCart(product)}
                      >
                        <Ionicons
                          name="cart-outline"
                          size={19}
                          color="#003300"
                        />
                        <Text style={styles.primaryButtonText}>
                          Ajouter au panier
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          confirmRemove(
                            "product",
                            product?._id,
                            product?.name || "ce produit",
                          )
                        }
                      >
                        <Ionicons
                          name="heart-dislike-outline"
                          size={21}
                          color="#E53935"
                        />
                      </TouchableOpacity>
                    </View>

                    {!!activity?._id && (
                      <TouchableOpacity
                        style={styles.offersButton}
                        onPress={() => openProducts(activity)}
                      >
                        <Text style={styles.offersButtonText}>
                          Voir les autres offres de ce marchand
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}

            {activities.length === 0 && products.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={48} color="#CDAB82" />
                <Text style={styles.emptyTitle}>
                  Aucun favori pour le moment
                </Text>
                <Text style={styles.emptyText}>
                  Ajoute des marchands ou des produits à tes favoris depuis la
                  recherche.
                </Text>
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFavorites();
            }}
            tintColor="#66CC00"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FENÊTRE DE DIALOGUE PERSONNALISÉE */}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <Pressable style={styles.alertOverlay} onPress={closeDialog}>
          <Pressable
            style={styles.alertContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.alertTitle}>{dialog.title}</Text>

            <Text style={styles.alertMessage}>{dialog.message}</Text>

            <View style={styles.alertButtons}>
              {dialog.buttons.map((button, index) => {
                const buttonStyle =
                  button.style === "danger"
                    ? styles.alertDangerButton
                    : button.style === "secondary"
                      ? styles.alertSecondaryButton
                      : styles.alertPrimaryButton;

                const textStyle =
                  button.style === "danger"
                    ? styles.alertDangerText
                    : button.style === "secondary"
                      ? styles.alertSecondaryText
                      : styles.alertPrimaryText;

                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[styles.alertButton, buttonStyle]}
                    onPress={() => handleDialogButton(button)}
                    activeOpacity={0.8}
                  >
                    <Text style={textStyle}>{button.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
  },
  logo: {
    width: "100%",
    height: 95,
    marginBottom: 10,
  },
  pageTitle: {
    color: "#66CC00",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  counter: {
    color: "#003300",
    backgroundColor: "#CDAB82",
    borderRadius: 15,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
  },
  itemName: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemSubtitle: {
    color: "#555555",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  price: {
    color: "#237A57",
    fontSize: 17,
    fontWeight: "bold",
    marginVertical: 7,
  },
  activityName: {
    color: "#666666",
    fontSize: 13,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#CDAB82",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryButtonText: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#003300",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#CDAB82",
    backgroundColor: "#F8F4EF",
    alignItems: "center",
    justifyContent: "center",
  },
  offersButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5D8C8",
  },
  offersButtonText: {
    color: "#237A57",
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    marginTop: 12,
  },
  emptyTitle: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 12,
    marginBottom: 7,
  },
  emptyText: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 15,
  },

  // Fenêtre de dialogue
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  alertContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
  },
  alertTitle: {
    color: "#003300",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  alertMessage: {
    color: "#444444",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 22,
  },
  alertButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },
  alertButton: {
    minWidth: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  alertPrimaryButton: {
    backgroundColor: "#66CC00",
  },
  alertPrimaryText: {
    color: "#003300",
    fontSize: 14,
    fontWeight: "bold",
  },
  alertSecondaryButton: {
    backgroundColor: "#EDEFEA",
  },
  alertSecondaryText: {
    color: "#003300",
    fontSize: 14,
    fontWeight: "bold",
  },
  alertDangerButton: {
    backgroundColor: "#E53935",
  },
  alertDangerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
