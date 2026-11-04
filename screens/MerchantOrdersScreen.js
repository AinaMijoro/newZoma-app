
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://10.0.2.2:3000";

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

export default function MerchantOrdersScreen({ route }) {
  const { token } = route.params || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      Alert.alert(
        "Connexion nécessaire",
        "Reconnecte-toi pour consulter tes commandes."
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
          data.message || "Impossible de récupérer tes commandes."
        );
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  async function updateOrderStatus(order, newStatus) {
    const labels = {
      accepted: "accepter",
      rejected: "refuser",
      completed: "terminer",
    };

    Alert.alert(
      "Confirmer l'action",
      `Veux-tu vraiment ${labels[newStatus]} cette commande ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: async () => {
            setUpdating(true);

            try {
              const response = await fetch(
                `${API_URL}/orders/${order._id}/status`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    status: newStatus,
                  }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || "Impossible de modifier la commande."
                );
              }

              Alert.alert(
                "Succès",
                "Le statut de la commande a été mis à jour."
              );

              setSelectedOrder(null);
              await loadOrders();
            } catch (error) {
              Alert.alert("Erreur", error.message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
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
      0
    );

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIcon}>
            <Ionicons
              name="receipt-outline"
              size={25}
              color="#003300"
            />
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
          style={[
            styles.statusBadge,
            { backgroundColor: status.background },
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

        <View style={styles.separator} />

        <Text style={styles.detailLabel}>Activité</Text>
        <Text style={styles.detailValue}>
          {item.activityId?.name || "Activité non renseignée"}
        </Text>

        <Text style={styles.detailLabel}>Produits commandés</Text>
        <Text style={styles.detailValue}>
          {totalProducts} article(s)
        </Text>

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
          <Text style={styles.detailButtonText}>
            Voir la commande
          </Text>

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
              <Text style={styles.modalTitle}>
                Détail de la commande
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={29}
                  color="#003300"
                />
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

                    <Text
                      style={[
                        styles.statusText,
                        { color: status.color },
                      ]}
                    >
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

                  <Text style={styles.modalLabel}>
                    Produits commandés
                  </Text>

                  {(item.products || []).map((product, index) => (
                    <View
                      key={`${product.productId || index}`}
                      style={styles.productLine}
                    >
                      <Text style={styles.productName}>
                        {product.name}
                      </Text>

                      <Text style={styles.productDescription}>
                        {product.quantity} × {formatPrice(product.price)}{" "}
                        {product.currency}
                      </Text>

                      <Text style={styles.productSubtotal}>
                        Sous-total :{" "}
                        {formatPrice(
                          product.price * product.quantity
                        )}{" "}
                        {product.currency}
                      </Text>
                    </View>
                  ))}

                  <Text style={styles.modalLabel}>Total de la commande</Text>

                  {Object.entries(totals).map(([currency, total]) => (
                    <Text
                      key={currency}
                      style={styles.totalValue}
                    >
                      {formatPrice(total)} {currency}
                    </Text>
                  ))}

                  <Text style={styles.modalLabel}>
                    Date de commande
                  </Text>

                  <Text style={styles.modalValue}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("fr-FR")
                      : "Date inconnue"}
                  </Text>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              {selectedOrder.status === "pending" && (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    disabled={updating}
                    onPress={() =>
                      updateOrderStatus(selectedOrder, "accepted")
                    }
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
                    onPress={() =>
                      updateOrderStatus(selectedOrder, "rejected")
                    }
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
                  onPress={() =>
                    updateOrderStatus(selectedOrder, "completed")
                  }
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
              <Ionicons
                name="receipt-outline"
                size={55}
                color="#CDAB82"
              />

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
});
