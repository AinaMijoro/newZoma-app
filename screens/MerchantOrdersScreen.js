import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";

const STATUS = {
  pending: {
    label: "En attente",
    color: "#B7791F",
    background: "#FFF3CD",
    icon: "time-outline",
  },
  accepted: {
    label: "Acceptée",
    color: "#237A57",
    background: "#E2F3E9",
    icon: "checkmark-circle-outline",
  },
  rejected: {
    label: "Refusée",
    color: "#B42318",
    background: "#FDE8E7",
    icon: "close-circle-outline",
  },
  completed: {
    label: "Terminée",
    color: "#245A9B",
    background: "#E5F0FF",
    icon: "checkmark-done-circle-outline",
  },
};

function formatPrice(price) {
  return Number(price || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MerchantOrdersScreen({ navigation, route }) {
  const { token, userId } = route.params || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [contacting, setContacting] = useState(false);

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

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        showDialog(
          "Connexion nécessaire",
          "Reconnecte-toi pour consulter tes commandes.",
        );
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(`${API_URL}/orders/mine`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const responseText = await response.text();

        console.log("ORDERS STATUS :", response.status);
        console.log("ORDERS RESPONSE :", responseText);

        const data = JSON.parse(responseText);

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer tes commandes.",
          );
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        showDialog("Erreur", error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  async function contactClient(order) {
    if (contacting) return;

    if (!token || !userId) {
      showDialog(
        "Connexion nécessaire",
        "Ta session est introuvable. Reconnecte-toi.",
      );
      return;
    }

    try {
      setContacting(true);

      const response = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          orderId: order._id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'ouvrir la conversation.");
      }

      if (!data._id && !data.id) {
        throw new Error("Le serveur n'a pas retourné de conversation valide.");
      }

      const prospectName = order.prospectId?.name || "Client";

      setSelectedOrder(null);

      navigation.navigate("Chat", {
        conversation: {
          ...data,
          name: prospectName,
        },
        token,
        userId,
      });
    } catch (error) {
      showDialog("Erreur", error.message);
    } finally {
      setContacting(false);
    }
  }

  async function updateOrderStatus(order, newStatus) {
    const labels = {
      accepted: "accepter",
      rejected: "refuser",
      completed: "terminer",
    };

    const message = `Veux-tu vraiment ${labels[newStatus]} cette commande ?`;

    showDialog("Confirmer l'action", message, [
      {
        text: "Annuler",
        style: "secondary",
      },
      {
        text: "Confirmer",
        style: "primary",
        onPress: performUpdate,
      },
    ]);

    async function performUpdate() {
      setUpdating(true);

      try {
        const response = await fetch(`${API_URL}/orders/${order._id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de modifier la commande.",
          );
        }

        setSelectedOrder(null);

        showDialog("Succès", "Le statut de la commande a été mis à jour.");

        await loadOrders();
      } catch (error) {
        showDialog("Erreur", error.message);
      } finally {
        setUpdating(false);
      }
    }
  }

  function renderOrder({ item }) {
    const status = STATUS[item.status] || {
      label: "Statut inconnu",
      color: "#666666",
      background: "#EEEEEE",
      icon: "help-circle-outline",
    };

    const totalProducts = (item.products || []).reduce(
      (total, product) => total + Number(product.quantity || 0),
      0,
    );

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIcon}>
            <Ionicons name="receipt-outline" size={25} color="#003300" />
          </View>

          <View style={styles.cardTitleContainer}>
            <Text style={styles.orderTitle}>
              Commande #{String(item._id).slice(-6).toUpperCase()}
            </Text>

            <Text style={styles.clientName}>
              {item.prospectId?.name || "Client"}
            </Text>
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: status.background }]}
        >
          <Ionicons name={status.icon} size={17} color={status.color} />

          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        <View style={styles.separator} />

        <Text style={styles.detailLabel}>Activité</Text>
        <Text style={styles.detailValue}>
          {item.activityId?.name || "Activité non renseignée"}
        </Text>

        <Text style={styles.detailLabel}>Produits commandés</Text>
        <Text style={styles.detailValue}>{totalProducts} article(s)</Text>

        <Text style={styles.detailLabel}>Date de commande</Text>
        <Text style={styles.detailValue}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("fr-FR")
            : "Date inconnue"}
        </Text>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => setSelectedOrder(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailButtonText}>Voir la commande</Text>

          <Ionicons
            name="arrow-forward-circle-outline"
            size={20}
            color="#003300"
          />
        </TouchableOpacity>
      </View>
    );
  }

  function renderOrderDetails() {
    if (!selectedOrder) return null;

    const status = STATUS[selectedOrder.status] || {
      label: "Statut inconnu",
      color: "#666666",
      background: "#EEEEEE",
      icon: "help-circle-outline",
    };

    const totals = selectedOrder.totalsByCurrency || {};

    return (
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail de la commande</Text>

              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close-circle" size={29} color="#003300" />
              </TouchableOpacity>
            </View>

            <FlatList
              style={styles.modalScroll}
              data={[selectedOrder]}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View>
                  <Text style={styles.modalOrderTitle}>
                    Commande #{String(item._id).slice(-6).toUpperCase()}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: status.background,
                        marginBottom: 15,
                      },
                    ]}
                  >
                    <Ionicons
                      name={status.icon}
                      size={17}
                      color={status.color}
                    />

                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>

                  <Text style={styles.modalLabel}>Client</Text>
                  <Text style={styles.modalValue}>
                    {item.prospectId?.name || "Nom non renseigné"}
                  </Text>

                  <Text style={styles.modalLabel}>E-mail du client</Text>
                  <Text style={styles.modalValue}>
                    {item.prospectId?.email || "E-mail non renseigné"}
                  </Text>

                  <Text style={styles.modalLabel}>Activité</Text>
                  <Text style={styles.modalValue}>
                    {item.activityId?.name || "Activité non renseignée"}
                  </Text>

                  <Text style={styles.modalLabel}>Produits commandés</Text>

                  {(item.products || []).map((product, index) => (
                    <View
                      key={`${product.productId || index}`}
                      style={styles.productLine}
                    >
                      <Text style={styles.productName}>{product.name}</Text>

                      <Text style={styles.productDescription}>
                        {product.quantity} × {formatPrice(product.price)}{" "}
                        {product.currency}
                      </Text>

                      <Text style={styles.productSubtotal}>
                        Sous-total :{" "}
                        {formatPrice(product.price * product.quantity)}{" "}
                        {product.currency}
                      </Text>
                    </View>
                  ))}

                  <Text style={styles.modalLabel}>Total de la commande</Text>

                  {Object.entries(totals).map(([currency, total]) => (
                    <Text key={currency} style={styles.totalValue}>
                      {formatPrice(total)} {currency}
                    </Text>
                  ))}

                  <Text style={styles.modalLabel}>Date de commande</Text>

                  <Text style={styles.modalValue}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("fr-FR")
                      : "Date inconnue"}
                  </Text>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.contactButton}
                disabled={contacting}
                onPress={() => contactClient(selectedOrder)}
                activeOpacity={0.8}
              >
                {contacting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={21}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.contactButtonText}>
                  {contacting
                    ? "Ouverture de la conversation..."
                    : "Contacter le client"}
                </Text>
              </TouchableOpacity>

              {selectedOrder.status === "pending" && (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    disabled={updating}
                    onPress={() => updateOrderStatus(selectedOrder, "accepted")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={21}
                      color="#003300"
                    />

                    <Text style={styles.actionButtonText}>
                      Accepter la commande
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    disabled={updating}
                    onPress={() => updateOrderStatus(selectedOrder, "rejected")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text style={styles.rejectButtonText}>
                      Refuser la commande
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedOrder.status === "accepted" && (
                <TouchableOpacity
                  style={styles.acceptButton}
                  disabled={updating}
                  onPress={() => updateOrderStatus(selectedOrder, "completed")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={21}
                    color="#003300"
                  />

                  <Text style={styles.actionButtonText}>
                    Marquer comme terminée
                  </Text>
                </TouchableOpacity>
              )}

              {updating && (
                <ActivityIndicator
                  size="small"
                  color="#003300"
                  style={{ marginTop: 10 }}
                />
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedOrder(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor="#66CC00"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Image
              source={require("../assets/logo_paysage.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Mes commandes</Text>

            <Text style={styles.subtitle}>
              Consulte et gère les commandes reçues par ton commerce.
            </Text>

            <Text style={styles.sectionTitle}>
              Commandes reçues ({orders.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={55} color="#CDAB82" />

              <Text style={styles.emptyTitle}>
                Aucune commande pour le moment
              </Text>

              <Text style={styles.emptyText}>
                Les commandes passées par tes clients apparaîtront ici.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color="#66CC00"
              style={styles.loader}
            />
          ) : null
        }
      />

      {renderOrderDetails()}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 115,
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    color: "#66CC00",
    fontSize: RFPercentage(3),
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.9),
    textAlign: "center",
    marginTop: 7,
    marginBottom: 20,
  },
  sectionTitle: {
    alignSelf: "flex-start",
    color: "#66CC00",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 13,
    padding: 15,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E8F5DF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  orderTitle: {
    color: "#003300",
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
  },
  clientName: {
    color: "#555555",
    fontSize: RFPercentage(1.8),
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 14,
  },
  statusText: {
    fontSize: RFPercentage(1.7),
    fontWeight: "bold",
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 13,
  },
  detailLabel: {
    color: "#777777",
    fontSize: RFPercentage(1.6),
    fontWeight: "bold",
    marginTop: 8,
  },
  detailValue: {
    color: "#003300",
    fontSize: RFPercentage(1.8),
    marginTop: 3,
  },
  detailButton: {
    backgroundColor: "#E8F5DF",
    borderColor: "#66CC00",
    borderWidth: 1,
    borderRadius: 9,
    padding: 11,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detailButtonText: {
    color: "#003300",
    fontSize: RFPercentage(1.8),
    fontWeight: "bold",
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 35,
  },
  emptyTitle: {
    color: "#66CC00",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.8),
    textAlign: "center",
    marginTop: 8,
    lineHeight: 23,
  },
  loader: {
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 20,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#003300",
    fontSize: RFPercentage(2.4),
    fontWeight: "bold",
  },
  modalScroll: {
    flex: 1,
  },
  modalOrderTitle: {
    color: "#003300",
    fontSize: RFPercentage(2.5),
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalLabel: {
    color: "#777777",
    fontSize: RFPercentage(1.8),
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 4,
  },
  modalValue: {
    color: "#003300",
    fontSize: RFPercentage(1.8),
    lineHeight: 24,
  },
  productLine: {
    backgroundColor: "#F5F8F2",
    borderRadius: 9,
    padding: 11,
    marginTop: 8,
  },
  productName: {
    color: "#003300",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
  },
  productDescription: {
    color: "#555555",
    fontSize: RFPercentage(1.7),
    marginTop: 4,
  },
  productSubtotal: {
    color: "#003300",
    fontSize: RFPercentage(1.7),
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "right",
  },
  totalValue: {
    color: "#003300",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    marginTop: 5,
  },
  modalActions: {
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  contactButton: {
    backgroundColor: "#237A57",
    borderRadius: 10,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    padding: 12,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#66CC00",
    borderRadius: 10,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    padding: 12,
  },
  actionButtonText: {
    color: "#003300",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    marginLeft: 8,
  },
  rejectButton: {
    backgroundColor: "#B42318",
    borderRadius: 10,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: "#CDAB82",
    borderRadius: 10,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: "#003300",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
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
});
