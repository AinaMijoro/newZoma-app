import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useCart } from "../context/CartContext";

const API_URL = "http://10.0.2.2:3000";

export default function CartScreen({ route, navigation }) {
  const { token } = route.params || {};

  const {
    cartItems,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const requestLock = useRef(false);

  // Regrouper les produits par activité
  const groupedItems = cartItems.reduce((groups, item) => {
    const activityId = item.activityId;

    if (!groups[activityId]) {
      groups[activityId] = {
        activityId,
        activityName: item.activityName,
        products: [],
      };
    }

    groups[activityId].products.push(item);

    return groups;
  }, {});

  const activityGroups = Object.values(groupedItems);

  // Calculer les totaux par devise
  const totalsByCurrency = cartItems.reduce((totals, item) => {
    const currency = item.currency || "EUR";
    const subtotal = Number(item.price) * Number(item.quantity);

    totals[currency] = (totals[currency] || 0) + subtotal;

    return totals;
  }, {});

  async function handleConfirmOrder() {
    if (requestLock.current || orderConfirmed) {
      return;
    }

    if (!token) {
      Alert.alert(
        "Connexion requise",
        "Veuillez vous reconnecter pour confirmer votre commande."
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Panier vide", "Ajoutez au moins un produit.");
      return;
    }

    requestLock.current = true;
    setSubmitting(true);

    try {
      // Une commande distincte par activité
      for (const group of activityGroups) {
        const response = await fetch(`${API_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activityId: group.activityId,
            products: group.products.map((product) => ({
              productId: product.productId,
              quantity: product.quantity,
            })),
          }),
        });

        const responseText = await response.text();

        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "Le serveur a renvoyé une réponse invalide."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Impossible d'envoyer la commande pour ${group.activityName}.`
          );
        }
      }

      setOrderConfirmed(true);
      clearCart();

      Alert.alert(
        "Commandes envoyées !",
        `Vos ${activityGroups.length} commande(s) ont bien été enregistrées. Vous pourrez suivre leur évolution dans Mes commandes.`,
        [
          {
            text: "Voir mes commandes",
            onPress: () => {
              navigation.navigate("ProspectTabs", {
                screen: "ProspectOrders",
                params: { token },
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.message ||
          "Une erreur est survenue lors de l'envoi des commandes."
      );

      // Attention : si certaines commandes ont déjà été enregistrées,
      // ne pas relancer automatiquement toutes les commandes.
      // Le verrou reste actif pour éviter les doublons.
    } finally {
      setSubmitting(false);
    }
  }

  function renderProduct({ item }) {
    const subtotal = Number(item.price) * Number(item.quantity);

    return (
      <View style={styles.card}>
        <Text style={styles.productName}>{item.name}</Text>

        {!!item.description && (
          <Text style={styles.description}>
            {item.description}
          </Text>
        )}

        <Text style={styles.detail}>
          Prix unitaire : {item.price} {item.currency}
        </Text>

        <View style={styles.quantityRow}>
          <Text style={styles.detail}>Quantité :</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            disabled={submitting}
            onPress={() =>
              updateQuantity(
                item.productId,
                item.activityId,
                item.quantity - 1
              )
            }
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            disabled={submitting}
            onPress={() =>
              updateQuantity(
                item.productId,
                item.activityId,
                item.quantity + 1
              )
            }
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtotal}>
          Sous-total : {subtotal.toFixed(2)} {item.currency}
        </Text>

        <TouchableOpacity
          style={styles.removeButton}
          disabled={submitting}
          onPress={() =>
            Alert.alert(
              "Retirer le produit",
              `Retirer ${item.name} du panier ?`,
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Retirer",
                  style: "destructive",
                  onPress: () =>
                    removeFromCart(item.productId, item.activityId),
                },
              ]
            )
          }
        >
          <Text style={styles.removeButtonText}>
            Retirer du panier
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activityGroups}
        keyExtractor={(item) => String(item.activityId)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image
              source={require("../assets/logo_paysage.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Mon panier</Text>

            <Text style={styles.activityName}>
              {cartCount} article(s) dans votre panier
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.message}>
            Ton panier est vide. Découvre nos offres pour ajouter des produits !
          </Text>
        }
        renderItem={({ item: group }) => (
          <View style={styles.activityGroup}>
            <Text style={styles.activityTitle}>
              {group.activityName || "Activité"}
            </Text>

            {group.products.map((product) => (
              <View key={`${group.activityId}-${product.productId}`}>
                {renderProduct({ item: product })}
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={
          cartItems.length > 0 ? (
            <View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalTitle}>
                  Total du panier
                </Text>

                {Object.entries(totalsByCurrency).map(
                  ([currency, total]) => (
                    <Text style={styles.total} key={currency}>
                      {total.toFixed(2)} {currency}
                    </Text>
                  )
                )}

                <Text style={styles.totalNote}>
                  Les commandes seront envoyées séparément à chaque vendeur.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  submitting && styles.disabledButton,
                ]}
                onPress={handleConfirmOrder}
                disabled={submitting || orderConfirmed}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#003300" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirmer mes commandes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: "100%",
    height: 115,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 10,
  },
  activityName: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
  },
  activityGroup: {
    marginBottom: 18,
  },
  activityTitle: {
    color: "#66CC00",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#003300",
  },
  description: {
    fontSize: 14,
    color: "#555555",
    marginTop: 6,
  },
  detail: {
    fontSize: 14,
    color: "#444444",
    marginTop: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  quantityButton: {
    backgroundColor: "#CDAB82",
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  quantityButtonText: {
    color: "#003300",
    fontSize: 22,
    fontWeight: "bold",
  },
  quantity: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 16,
    marginHorizontal: 12,
  },
  subtotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#003300",
    marginTop: 12,
  },
  removeButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#C62828",
  },
  removeButtonText: {
    color: "#C62828",
    fontWeight: "bold",
  },
  totalContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003300",
    marginBottom: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003300",
    marginTop: 4,
  },
  totalNote: {
    fontSize: 13,
    color: "#555555",
    marginTop: 12,
    lineHeight: 19,
  },
  message: {
    textAlign: "center",
    color: "#FFFFFF",
    marginTop: 25,
    fontSize: 15,
    lineHeight: 22,
  },
  confirmButton: {
    backgroundColor: "#CDAB82",
    minHeight: 52,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#003300",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
});