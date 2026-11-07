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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";

const STATUS = {
  pending: {
    label: "En attente de validation",
    color: "#B7791F",
    background: "#FFF3CD",
    icon: "time-outline",
  },
  approved: {
    label: "Approuvée",
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
};

// Présentation lisible des conditions de livraison
function formatDeliveries(deliveries) {
  if (!deliveries) {
    return ["Aucune condition renseignée"];
  }

  const deliveryList = Array.isArray(deliveries) ? deliveries : [deliveries];

  if (deliveryList.length === 0) {
    return ["Aucune condition renseignée"];
  }

  return deliveryList.map((delivery) => {
    if (!delivery || typeof delivery !== "object") {
      return "Condition de livraison non précisée";
    }

    const country = delivery.country || "Pays non précisé";
    const currency = delivery.currency || "EUR";

    switch (delivery.type) {
      case "free":
        return `${country} : livraison gratuite`;

      case "free_over_minimum":
        return `${country} : livraison gratuite à partir de ${
          delivery.minimumAmount ?? "—"
        } ${currency}`;

      case "flat_fee":
        return `${country} : forfait de ${delivery.fee ?? "—"} ${currency}`;

      case "none":
        return `${country} : aucune livraison proposée`;

      default:
        return `${country} : condition de livraison non précisée`;
    }
  });
}

export default function ActivitiesScreen({ route, navigation }) {
  const { userId, token, profiles = [] } = route.params || {};

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // État de la boîte de dialogue personnalisée
  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showDialog = (title, message, buttons = []) => {
    setDialog({
      visible: true,
      title,
      message,
      buttons: buttons.length ? buttons : [{ text: "OK", style: "primary" }],
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  };

  const handleDialogButton = (button) => {
    closeDialog();

    if (button.onPress) {
      setTimeout(() => button.onPress(), 150);
    }
  };

  const loadActivities = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        showDialog(
          "Connexion nécessaire",
          "Reconnecte-toi pour consulter tes activités.",
        );
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(`${API_URL}/activities/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer tes activités.",
          );
        }

        setActivities(data.activities || []);
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
      loadActivities();
    }, [loadActivities]),
  );

  function addActivity() {
    navigation.navigate("ProviderSetup", {
      userId,
      token,
      profiles,
      merchantName: activities[0]?.name || "",
    });
  }

  function editActivity(activity) {
    setSelectedActivity(null);

    navigation.navigate("ProviderSetup", {
      userId,
      token,
      profiles,
      merchantName: activity.name || "",
      activity,
    });
  }

  function renderActivity({ item }) {
    const status = STATUS[item.status] || {
      label: "Statut inconnu",
      color: "#666666",
      background: "#EEEEEE",
      icon: "help-circle-outline",
    };

    return (
      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.activityIcon}>
            <Ionicons name="storefront-outline" size={25} color="#003300" />
          </View>

          <View style={styles.cardTitleContainer}>
            <Text style={styles.activityName}>
              {item.name || "Mon activité"}
            </Text>

            <Text style={styles.specialty}>
              {item.specialty || "Spécialité non renseignée"}
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

        <Text style={styles.detailLabel}>Pays d'intervention</Text>
        <Text style={styles.detailValue}>
          {item.countries?.join(" • ") || "Non renseignés"}
        </Text>

        {!!item.frenchCities?.length && (
          <>
            <Text style={styles.detailLabel}>Villes en France</Text>
            <Text style={styles.detailValue}>
              {item.frenchCities.join(", ")}
            </Text>
          </>
        )}

        {!!item.frenchDepartments?.length && (
          <>
            <Text style={styles.detailLabel}>Départements français</Text>
            <Text style={styles.detailValue}>
              {item.frenchDepartments.join(", ")}
            </Text>
          </>
        )}

        {!!item.madagascarCities?.length && (
          <>
            <Text style={styles.detailLabel}>Villes à Madagascar</Text>
            <Text style={styles.detailValue}>
              {item.madagascarCities.join(", ")}
            </Text>
          </>
        )}

        {!!item.parcelDirections?.length && (
          <>
            <Text style={styles.detailLabel}>Sens d'envoi</Text>
            {item.parcelDirections.map((direction) => (
              <Text key={direction} style={styles.detailValue}>
                {direction === "france_to_madagascar"
                  ? "France vers Madagascar"
                  : "Madagascar vers France"}
              </Text>
            ))}
          </>
        )}

        <Text style={styles.date}>
          Créée le{" "}
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("fr-FR")
            : "Date inconnue"}
        </Text>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => setSelectedActivity(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailButtonText}>Voir la fiche complète</Text>

          <Ionicons
            name="arrow-forward-circle-outline"
            size={20}
            color="#003300"
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item._id}
        renderItem={renderActivity}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadActivities(true)}
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

            <Text style={styles.title}>Mes activités</Text>

            <Text style={styles.subtitle}>
              Consulte et gère les activités de ton commerce.
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addActivity}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={22} color="#003300" />

              <Text style={styles.addButtonText}>Ajouter une activité</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>
              Mes activités enregistrées ({activities.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={55} color="#CDAB82" />

              <Text style={styles.emptyTitle}>
                Aucune activité pour le moment
              </Text>

              <Text style={styles.emptyText}>
                Ajoute ta première activité pour présenter tes services sur
                ZOMA.
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

      {/* FICHE DÉTAILLÉE */}
      <Modal
        visible={!!selectedActivity}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedActivity(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fiche de mon activité</Text>

              <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                <Ionicons name="close-circle" size={29} color="#003300" />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <>
                <FlatList
                  style={styles.modalScroll}
                  data={[selectedActivity]}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View>
                      <Text style={styles.modalActivityName}>{item.name}</Text>

                      <Text style={styles.modalSpecialty}>
                        {item.specialty}
                      </Text>

                      <Text style={styles.modalLabel}>Pays d'intervention</Text>

                      <Text style={styles.modalValue}>
                        {item.countries?.join(", ") || "Non renseignés"}
                      </Text>

                      {!!item.frenchCities?.length && (
                        <>
                          <Text style={styles.modalLabel}>
                            Villes en France
                          </Text>
                          <Text style={styles.modalValue}>
                            {item.frenchCities.join(", ")}
                          </Text>
                        </>
                      )}

                      {!!item.frenchDepartments?.length && (
                        <>
                          <Text style={styles.modalLabel}>
                            Départements français
                          </Text>
                          <Text style={styles.modalValue}>
                            {item.frenchDepartments.join(", ")}
                          </Text>
                        </>
                      )}

                      {!!item.madagascarCities?.length && (
                        <>
                          <Text style={styles.modalLabel}>
                            Villes à Madagascar
                          </Text>
                          <Text style={styles.modalValue}>
                            {item.madagascarCities.join(", ")}
                          </Text>
                        </>
                      )}

                      {!!item.parcelDirections?.length && (
                        <>
                          <Text style={styles.modalLabel}>
                            Sens d'envoi des colis
                          </Text>

                          <Text style={styles.modalValue}>
                            {item.parcelDirections
                              .map((direction) =>
                                direction === "france_to_madagascar"
                                  ? "France vers Madagascar"
                                  : "Madagascar vers France",
                              )
                              .join("\n")}
                          </Text>
                        </>
                      )}

                      <Text style={styles.modalLabel}>
                        Conditions de livraison
                      </Text>

                      {formatDeliveries(item.deliveries || item.delivery).map(
                        (condition, index) => (
                          <Text key={index} style={styles.modalValue}>
                            {"• "}
                            {condition}
                          </Text>
                        ),
                      )}

                      <Text style={styles.modalLabel}>Statut</Text>

                      <Text style={styles.modalValue}>
                        {STATUS[item.status]?.label || "Statut inconnu"}
                      </Text>

                      <Text style={styles.modalLabel}>Date de création</Text>

                      <Text style={styles.modalValue}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("fr-FR")
                          : "Date inconnue"}
                      </Text>
                    </View>
                  )}
                />

                {/* BOUTONS FIXES EN BAS DE LA FICHE */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => editActivity(selectedActivity)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={21} color="#003300" />

                    <Text style={styles.editButtonText}>
                      Modifier cette activité
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedActivity(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* BOÎTE DE DIALOGUE PERSONNALISÉE */}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContent}>
            <Text style={styles.dialogTitle}>{dialog.title}</Text>

            <Text style={styles.dialogMessage}>{dialog.message}</Text>

            <View style={styles.dialogActions}>
              {dialog.buttons.map((button, index) => (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.dialogButton,
                    button.style === "primary" && styles.dialogPrimaryButton,
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
          </View>
        </View>
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
  addButton: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#CDAB82",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  addButtonText: {
    color: "#003300",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionTitle: {
    alignSelf: "flex-start",
    color: "#66CC00",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
  },
  activityCard: {
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
  activityIcon: {
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
  activityName: {
    color: "#003300",
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
  },
  specialty: {
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
  date: {
    color: "#888888",
    fontSize: RFPercentage(1.5),
    marginTop: 15,
    textAlign: "right",
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

  // Fiche détaillée
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
  modalActivityName: {
    color: "#003300",
    fontSize: RFPercentage(2.5),
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSpecialty: {
    color: "#666666",
    fontSize: RFPercentage(2),
    marginBottom: 15,
  },
  modalLabel: {
    color: "#777777",
    fontSize: RFPercentage(1.8),
    fontWeight: "bold",
    marginTop: 13,
    marginBottom: 4,
  },
  modalValue: {
    color: "#003300",
    fontSize: RFPercentage(1.8),
    lineHeight: 24,
  },

  // Zone fixe des boutons
  modalActions: {
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  editButton: {
    backgroundColor: "#66CC00",
    borderRadius: 10,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    padding: 12,
  },
  editButtonText: {
    color: "#003300",
    fontSize: RFPercentage(2),
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

  // Boîte de dialogue
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
    elevation: 8,
  },
  dialogTitle: {
    color: "#003300",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dialogMessage: {
    color: "#333333",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  dialogButton: {
    minWidth: 90,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003300",
  },
  dialogPrimaryButton: {
    backgroundColor: "#003300",
  },
  dialogSecondaryButton: {
    backgroundColor: "#EEEEEE",
  },
  dialogDangerButton: {
    backgroundColor: "#CC3333",
  },
  dialogButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  dialogSecondaryButtonText: {
    color: "#333333",
  },
});
