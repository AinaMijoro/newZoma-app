import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";

import { useCart } from "../context/CartContext";
import API_URL from "../config/api";

export default function CartScreen({ route, navigation }) {
  const { token } = route.params || {};

  const { cartItems, cartCount, updateQuantity, removeFromCart, clearCart } =
    useCart();

  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const requestLock = useRef(false);

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

  // Confirmer les commandes
  async function handleConfirmOrder() {
    if (requestLock.current || orderConfirmed) {
      return;
    }

    if (!token) {
      showDialog(
        "Connexion requise",
        "Veuillez vous reconnecter pour confirmer votre commande.",
      );
      return;
    }

    if (cartItems.length === 0) {
      showDialog("Panier vide", "Ajoutez au moins un produit.");
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
          throw new Error("Le serveur a renvoyé une réponse invalide.");
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
            `Impossible d'envoyer la commande pour ${group.activityName}.`,
          );
        }
      }

      setOrderConfirmed(true);
      clearCart();

      showDialog(
        "Commandes envoyées !",
        `Vos ${activityGroups.length} commande(s) ont bien été enregistrées. Vous pourrez suivre leur évolution dans Mes commandes.`,
        [
          {
            text: "Voir mes commandes",
            style: "primary",
            onPress: () => {
              navigation.navigate("ProspectTabs", {
                screen: "ProspectOrders",
                params: { token },
              });
            },
          },
        ],
      );
    } catch (error) {
      showDialog(
        "Erreur",
        error.message ||
        "Une erreur est survenue lors de l'envoi des commandes.",
      );

      // Le verrou reste actif pour éviter les doublons
      // si certaines commandes ont déjà été enregistrées.
    } finally {
      setSubmitting(false);
    }
  }

  // Retirer un produit du panier
  function handleRemoveProduct(item) {
    if (submitting) {
      return;
    }

    showDialog(
      "Retirer le produit",
      `Voulez-vous vraiment retirer "${item.name}" de votre panier ?`,
      [
        {
          text: "Annuler",
          style: "secondary",
        },
        {
          text: "Retirer",
          style: "danger",
          onPress: () => removeFromCart(item.productId, item.activityId),
        },
      ]
    );
  }

  // Afficher un produit
  function renderProduct({ item }) {
    const subtotal = Number(item.price) * Number(item.quantity);

    return (
      <View style={styles.card}>
        <Text style={styles.productName}>{item.name}</Text>

        {/* Catégorie de l'activité */}
        {!!item.specialty && (
          <Text style={styles.productCategory}>
            Catégorie : {item.specialty}
          </Text>
        )}

        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <Text style={styles.detail}>
          Prix unitaire : {item.price} {item.currency}
        </Text>

        <View style={styles.quantityRow}>
          <Text style={styles.detail}>Quantité :</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            disabled={submitting}
            onPress={() => {
              if (item.quantity <= 1) {
                handleRemoveProduct(item);
              } else {
                updateQuantity(
                  item.productId,
                  item.activityId,
                  item.quantity - 1
                );
              }
            }}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            disabled={submitting}
            onPress={() =>
              updateQuantity(item.productId, item.activityId, item.quantity + 1)
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
          onPress={() => handleRemoveProduct(item)}
        >
          <Text style={styles.removeButtonText}>Retirer du panier</Text>
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
                <Text style={styles.totalTitle}>Total du panier</Text>

                {Object.entries(totalsByCurrency).map(([currency, total]) => (
                  <Text style={styles.total} key={currency}>
                    {total.toFixed(2)} {currency}
                  </Text>
                ))}

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

      {/* Fenêtre de dialogue personnalisée */}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <Pressable style={styles.dialogOverlay} onPress={closeDialog}>
          <Pressable
            style={styles.dialogContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.dialogTitle}>{dialog.title}</Text>

            <Text style={styles.dialogMessage}>{dialog.message}</Text>

            <View style={styles.dialogActions}>
              {dialog.buttons.map((button, index) => (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.dialogButton,
                    button.style === "secondary" &&
                    styles.dialogSecondaryButton,
                    button.style === "danger" && styles.dialogDangerButton,
                  ]}
                  onPress={() => handleDialogButton(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dialogButtonText,
                      button.style === "secondary" &&
                      styles.dialogSecondaryButtonText,
                      button.style === "danger" &&
                      styles.dialogDangerButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  productCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: "#668844",
    marginTop: 5,
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

  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  dialogContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    elevation: 8,
  },

  dialogTitle: {
    color: "#003300",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  dialogMessage: {
    color: "#444444",
    fontSize: 16,
    lineHeight: 23,
  },

  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 22,
    gap: 10,
  },

  dialogButton: {
    minWidth: 95,
    minHeight: 42,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#66CC00",
    alignItems: "center",
    justifyContent: "center",
  },

  dialogSecondaryButton: {
    backgroundColor: "#EEEEEE",
  },

  dialogDangerButton: {
    backgroundColor: "#B42318",
  },

  dialogButtonText: {
    color: "#003300",
    fontSize: 15,
    fontWeight: "bold",
  },

  dialogSecondaryButtonText: {
    color: "#444444",
  },

  dialogDangerButtonText: {
    color: "#FFFFFF",
  },
});
