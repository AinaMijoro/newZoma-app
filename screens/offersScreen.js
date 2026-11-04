
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = "http://10.0.2.2:3000";

const EMPTY_OFFER = {
  name: "",
  description: "",
  price: "",
  currency: "EUR",
};

export default function OffersScreen({ route, navigation }) {
  const {
    userId,
    activityId: initialActivityId,
    activityIds = [],
    activities: initialActivities = [],
    token,
  } = route.params || {};

  const [offers, setOffers] = useState([{ ...EMPTY_OFFER }]);
  const [savedOffers, setSavedOffers] = useState([]);
  const [activities, setActivities] = useState(initialActivities);

  const [selectedActivityId, setSelectedActivityId] = useState(
    initialActivityId ||
      activityIds[0] ||
      initialActivities[0]?._id ||
      ""
  );

  const [editingProductId, setEditingProductId] = useState(null);

  // Charger les produits du commerçant
  const loadOffers = useCallback(async () => {
    if (!userId) {
      console.log("Identifiant utilisateur absent.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/products/user/${userId}`,
        {
          method: "GET",
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status} : ${responseText}`
        );
      }

      const data = JSON.parse(responseText);
      setSavedOffers(data.products || []);
    } catch (error) {
      console.log("Erreur de chargement des produits :", error);
      Alert.alert("Chargement des produits", error.message);
    }
  }, [userId, token]);

  // Charger toutes les activités du commerçant
  const loadActivities = useCallback(async () => {
    if (!userId || !token) {
      console.log("Identifiant utilisateur ou token absent.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/activities/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          `Réponse non JSON du serveur (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur de chargement des activités."
        );
      }

      const loadedActivities = data.activities || [];
      setActivities(loadedActivities);

      if (loadedActivities.length > 0) {
        setSelectedActivityId((currentId) =>
          currentId || loadedActivities[0]._id
        );
      }
    } catch (error) {
      console.log("Erreur de chargement des activités :", error);
      Alert.alert("Erreur", error.message);
    }
  }, [userId, token]);

  useFocusEffect(
    useCallback(() => {
      loadOffers();
      loadActivities();
    }, [loadOffers, loadActivities])
  );

  // Modifier un champ du formulaire
  function updateOffer(index, field, value) {
    setOffers((currentOffers) =>
      currentOffers.map((offer, i) =>
        i === index
          ? { ...offer, [field]: value }
          : offer
      )
    );
  }

  // Ajouter une ligne de produit
  function addOffer() {
    setOffers((currentOffers) => [
      ...currentOffers,
      { ...EMPTY_OFFER },
    ]);
  }

  // Supprimer une ligne du formulaire
  function removeOffer(index) {
    setOffers((currentOffers) =>
      currentOffers.filter((_, i) => i !== index)
    );
  }

  // Charger un produit dans le formulaire pour le modifier
  function editProduct(product) {
    const productActivityId =
      product.activityId?._id || product.activityId;

    setSelectedActivityId(productActivityId || "");

    setEditingProductId(product._id);

    setOffers([
      {
        name: product.name || "",
        description: product.description || "",
        price: String(product.price ?? ""),
        currency: product.currency || "EUR",
      },
    ]);

    Alert.alert(
      "Modification",
      "Modifie les informations du produit dans le formulaire situé plus bas."
    );
  }

  // Annuler la modification
  function cancelEdit() {
    setEditingProductId(null);
    setOffers([{ ...EMPTY_OFFER }]);
  }

  // Supprimer définitivement un produit
  function deleteProduct(product) {
    Alert.alert(
      "Supprimer le produit",
      `Veux-tu vraiment supprimer « ${product.name} » ? Cette action est définitive.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/products/${product._id}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token
                      ? { Authorization: `Bearer ${token}` }
                      : {}),
                  },
                  body: JSON.stringify({ userId }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || "Impossible de supprimer ce produit."
                );
              }

              if (editingProductId === product._id) {
                cancelEdit();
              }

              await loadOffers();

              Alert.alert(
                "Succès",
                "Le produit a bien été supprimé."
              );
            } catch (error) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  }

  // Enregistrer un nouveau produit ou modifier un produit existant
  async function validateOffers() {
    if (!userId || !selectedActivityId) {
      Alert.alert(
        "Information manquante",
        "Sélectionne une activité avant d'enregistrer tes produits."
      );
      return;
    }

    const validOffers = offers.filter(
      (offer) =>
        offer.name.trim() !== "" &&
        offer.description.trim() !== "" &&
        offer.price !== "" &&
        !Number.isNaN(Number(offer.price)) &&
        Number(offer.price) >= 0
    );

    if (validOffers.length !== 1 && editingProductId) {
      Alert.alert(
        "Information manquante",
        "Vérifie le nom, la description et le prix du produit."
      );
      return;
    }

    if (validOffers.length === 0) {
      Alert.alert(
        "Produits manquants",
        "Ajoute au moins un produit avec un nom, une description et un prix valide."
      );
      return;
    }

    try {
      let response;

      if (editingProductId) {
        const offer = validOffers[0];

        response = await fetch(
          `${API_URL}/products/${editingProductId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            },
            body: JSON.stringify({
              userId,
              name: offer.name.trim(),
              description: offer.description.trim(),
              price: Number(offer.price),
              currency: offer.currency,
            }),
          }
        );
      } else {
        response = await fetch(`${API_URL}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            activityId: selectedActivityId,
            userId,
            products: validOffers.map((offer) => ({
              name: offer.name.trim(),
              description: offer.description.trim(),
              price: Number(offer.price),
              currency: offer.currency,
            })),
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible d'enregistrer les produits."
        );
      }

      const wasEditing = Boolean(editingProductId);

      setEditingProductId(null);
      setOffers([{ ...EMPTY_OFFER }]);

      await loadOffers();

      Alert.alert(
        "Succès",
        wasEditing
          ? "Ton produit a bien été modifié."
          : "Tes produits ont bien été enregistrés."
      );
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require("../assets/logo_paysage.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Mes offres</Text>

      {/* SÉLECTION DE L'ACTIVITÉ */}
      <Text style={styles.label}>
        Sélectionner une activité
      </Text>

      {activities.length === 0 ? (
        <Text style={styles.info}>
          Aucune activité trouvée. Vérifie le chargement de tes activités.
        </Text>
      ) : (
        activities.map((activity) => (
          <TouchableOpacity
            key={activity._id}
            style={[
              styles.activityButton,
              selectedActivityId === activity._id &&
                styles.activitySelected,
            ]}
            onPress={() => setSelectedActivityId(activity._id)}
            activeOpacity={0.8}
          >
            <Text style={styles.activityName}>
              {activity.name}
            </Text>

            <Text style={styles.status}>
              Statut : {activity.status}
            </Text>

            {selectedActivityId === activity._id && (
              <Text style={styles.selectedText}>
                Activité sélectionnée
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}

      {/* PRODUITS DÉJÀ ENREGISTRÉS */}
      <Text style={styles.sectionTitle}>
        Mes produits enregistrés
      </Text>

      {savedOffers.length === 0 ? (
        <Text style={styles.info}>
          Aucun produit enregistré pour le moment.
        </Text>
      ) : (
        savedOffers.map((product) => (
          <View key={product._id} style={styles.savedCard}>
            <Text style={styles.productName}>
              {product.name}
            </Text>

            <Text style={styles.productDescription}>
              {product.description}
            </Text>

            <Text style={styles.price}>
              {product.price} {product.currency}
            </Text>

            {product.activityId?.name && (
              <Text style={styles.savedActivity}>
                Activité : {product.activityId.name}
              </Text>
            )}

            <View style={styles.productActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editProduct(product)}
                activeOpacity={0.8}
              >
                <Text style={styles.editButtonText}>
                  Modifier
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteProduct(product)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* FORMULAIRE */}
      <Text style={styles.sectionTitle}>
        {editingProductId
          ? "Modifier le produit"
          : "Ajouter des produits"}
      </Text>

      {editingProductId && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>
            Annuler la modification
          </Text>
        </TouchableOpacity>
      )}

      {offers.map((offer, index) => (
        <View key={index} style={styles.offerCard}>
          <Text style={styles.label}>Nom du produit</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom du produit"
            placeholderTextColor="#777777"
            value={offer.name}
            onChangeText={(value) =>
              updateOffer(index, "name", value)
            }
          />

          <Text style={styles.label}>Description</Text>

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Description du produit"
            placeholderTextColor="#777777"
            value={offer.description}
            onChangeText={(value) =>
              updateOffer(index, "description", value)
            }
            multiline
          />

          <Text style={styles.label}>Prix</Text>

          <TextInput
            style={styles.input}
            placeholder="Prix"
            placeholderTextColor="#777777"
            value={offer.price}
            keyboardType="decimal-pad"
            onChangeText={(value) =>
              updateOffer(index, "price", value)
            }
          />

          <Text style={styles.label}>Devise</Text>

          <View style={styles.currencyRow}>
            <TouchableOpacity
              style={[
                styles.currencyButton,
                offer.currency === "EUR" && styles.currencySelected,
              ]}
              onPress={() =>
                updateOffer(index, "currency", "EUR")
              }
            >
              <Text
                style={[
                  styles.currencyText,
                  offer.currency === "EUR" &&
                    styles.currencyTextSelected,
                ]}
              >
                EUR (€)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.currencyButton,
                offer.currency === "MGA" && styles.currencySelected,
              ]}
              onPress={() =>
                updateOffer(index, "currency", "MGA")
              }
            >
              <Text
                style={[
                  styles.currencyText,
                  offer.currency === "MGA" &&
                    styles.currencyTextSelected,
                ]}
              >
                MGA (Ar)
              </Text>
            </TouchableOpacity>
          </View>

          {!editingProductId && offers.length > 1 && (
            <TouchableOpacity
              onPress={() => removeOffer(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteText}>
                Supprimer cette ligne
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* AJOUTER UNE AUTRE LIGNE */}
      {!editingProductId && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={addOffer}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            + Ajouter un autre produit
          </Text>
        </TouchableOpacity>
      )}

      {/* ENREGISTRER */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={validateOffers}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {editingProductId
            ? "Enregistrer les modifications"
            : "Enregistrer mes produits"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 35,
  },
  logo: {
    width: "100%",
    height: 115,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#66CC00",
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: "#003300",
    fontSize: 15,
  },
  descriptionInput: {
    minHeight: 85,
    textAlignVertical: "top",
  },
  activityButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  activitySelected: {
    borderColor: "#66CC00",
    backgroundColor: "#F3F9EC",
  },
  activityName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#003300",
  },
  status: {
    marginTop: 5,
    color: "#666666",
  },
  selectedText: {
    color: "#237A57",
    fontWeight: "bold",
    marginTop: 7,
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  currencyButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#CDAB82",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  currencySelected: {
    backgroundColor: "#CDAB82",
    borderColor: "#003300",
  },
  currencyText: {
    color: "#003300",
    fontWeight: "600",
  },
  currencyTextSelected: {
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#CDAB82",
    minHeight: 52,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 15,
  },
  secondaryButtonText: {
    color: "#003300",
    fontWeight: "bold",
  },
  savedCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#003300",
  },
  productDescription: {
    color: "#444444",
    marginTop: 6,
  },
  savedActivity: {
    color: "#666666",
    marginTop: 8,
  },
  price: {
    fontWeight: "bold",
    color: "#003300",
    marginTop: 8,
  },
  info: {
    color: "#FFFFFF",
    marginVertical: 8,
  },
  productActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#CDAB82",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#003300",
    fontWeight: "bold",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FCE8E6",
    borderWidth: 1,
    borderColor: "#C62828",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#C62828",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CDAB82",
    borderRadius: 8,
    padding: 11,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButtonText: {
    color: "#003300",
    fontWeight: "bold",
  },
  deleteText: {
    color: "#C62828",
    fontWeight: "bold",
    marginTop: 10,
  },
});
