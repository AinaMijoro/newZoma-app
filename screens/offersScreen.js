
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
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import API_URL from "../config/api";

const CLOUD_NAME = "dd4tggepy";
const UPLOAD_PRESET = "zoma_products";
const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

const EMPTY_OFFER = {
  name: "",
  description: "",
  price: "",
  currency: "EUR",
  images: [],
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export default function OffersScreen({ route }) {
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
  const [uploading, setUploading] = useState(false);

  const loadOffers = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/products/user/${userId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const loadActivities = useCallback(async () => {
    if (!userId || !token) return;

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
      } catch {
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

  function updateOffer(index, field, value) {
    setOffers((currentOffers) =>
      currentOffers.map((offer, i) =>
        i === index ? { ...offer, [field]: value } : offer
      )
    );
  }

  function addOffer() {
    setOffers((currentOffers) => [
      ...currentOffers,
      { ...EMPTY_OFFER, images: [] },
    ]);
  }

  function removeOffer(index) {
    setOffers((currentOffers) =>
      currentOffers.filter((_, i) => i !== index)
    );
  }

  // Sélection des photos
  async function pickImages(index) {
    const currentImages = offers[index]?.images || [];
    const remaining = MAX_IMAGES - currentImages.length;

    if (remaining <= 0) {
      Alert.alert(
        "Limite atteinte",
        "Tu peux ajouter au maximum 5 photos par produit."
      );
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Autorisation nécessaire",
          "Autorise l'accès à tes photos pour sélectionner des images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 1,
      });

      if (result.canceled) return;

      const selectedAssets = result.assets || [];
      const validAssets = [];

      for (const asset of selectedAssets) {
        if (
          asset.fileSize != null &&
          asset.fileSize > MAX_SIZE
        ) {
          Alert.alert(
            "Photo trop volumineuse",
            "Chaque photo doit peser 5 Mo maximum."
          );
          continue;
        }

        const type = asset.mimeType?.toLowerCase();

        if (type && !ALLOWED_TYPES.includes(type)) {
          Alert.alert(
            "Format non accepté",
            "Choisis une photo JPG, JPEG, PNG, WebP ou AVIF."
          );
          continue;
        }

        validAssets.push(asset);
      }

      const available = validAssets.slice(0, remaining);

      if (available.length === 0) return;

      setOffers((currentOffers) =>
        currentOffers.map((offer, i) =>
          i === index
            ? {
                ...offer,
                images: [
                  ...(offer.images || []),
                  ...available.map((asset) => ({
                    uri: asset.uri,
                    file: asset.file || null,
                    type: asset.mimeType || "image/jpeg",
                    size: asset.fileSize,
                    isNew: true,
                  })),
                ],
              }
            : offer
        )
      );
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  }

  // Retirer une photo du formulaire
  function removeImage(offerIndex, imageIndex) {
    setOffers((currentOffers) =>
      currentOffers.map((offer, i) =>
        i === offerIndex
          ? {
              ...offer,
              images: offer.images.filter(
                (_, j) => j !== imageIndex
              ),
            }
          : offer
      )
    );
  }

  // Compression et envoi d'une photo vers Cloudinary
  async function uploadImage(image) {
    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.75,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const formData = new FormData();

    if (Platform.OS === "web") {
      // Sur le Web, envoyer le JPEG converti et non le fichier AVIF original.
      const blob = await fetch(manipulated.uri).then((res) => {
        if (!res.ok) {
          throw new Error("Impossible de préparer la photo convertie.");
        }
        return res.blob();
      });

      const jpegFile = new File(
        [blob],
        `zoma_${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      formData.append("file", jpegFile);
    } else {
      // Sur Android, utiliser l'URI du JPEG converti.
      formData.append("file", {
        uri: manipulated.uri,
        name: `zoma_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }

    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const responseText = await response.text();

    console.log(
      "Réponse Cloudinary :",
      response.status,
      responseText
    );

    let cloudinaryData;

    try {
      cloudinaryData = JSON.parse(responseText);
    } catch {
      throw new Error("Réponse invalide de Cloudinary.");
    }

    if (!response.ok || !cloudinaryData.secure_url) {
      throw new Error(
        cloudinaryData.error?.message ||
          "Erreur lors de l'envoi d'une photo."
      );
    }

    return cloudinaryData.secure_url;
  }

  // Récupérer les URL des photos
  async function getImageUrls(images = []) {
    const urls = [];

    for (const image of images) {
      if (typeof image === "string") {
        urls.push(image);
      } else if (image.isNew) {
        const url = await uploadImage(image);
        urls.push(url);
      }
    }

    return urls;
  }

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
        images: Array.isArray(product.images)
          ? product.images.map((uri) => ({
              uri,
              isNew: false,
            }))
          : [],
      },
    ]);

    Alert.alert(
      "Modification",
      "Modifie les informations du produit dans le formulaire situé plus bas."
    );
  }

  function cancelEdit() {
    setEditingProductId(null);
    setOffers([{ ...EMPTY_OFFER, images: [] }]);
  }

  function deleteProduct(product) {
    Alert.alert(
      "Supprimer le produit",
      `Veux-tu vraiment supprimer « ${product.name} » ? Cette action est définitive.`,
      [
        { text: "Annuler", style: "cancel" },
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
              Alert.alert("Succès", "Le produit a bien été supprimé.");
            } catch (error) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  }

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

    if (editingProductId && validOffers.length !== 1) {
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

    setUploading(true);

    try {
      let response;

      if (editingProductId) {
        const offer = validOffers[0];
        const imageUrls = await getImageUrls(offer.images);
        console.log("URLS PHOTOS À ENREGISTRER :", imageUrls);

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
              images: imageUrls,
            }),
          }
        );
      } else {
        const products = [];

        for (const offer of validOffers) {
          const imageUrls = await getImageUrls(offer.images);

          products.push({
            name: offer.name.trim(),
            description: offer.description.trim(),
            price: Number(offer.price),
            currency: offer.currency,
            images: imageUrls,
          });
        }

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
            products,
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
      setOffers([{ ...EMPTY_OFFER, images: [] }]);

      await loadOffers();

      Alert.alert(
        "Succès",
        wasEditing
          ? "Ton produit a bien été modifié."
          : "Tes produits ont bien été enregistrés."
      );
    } catch (error) {
      console.log("Erreur enregistrement produit :", error);
      Alert.alert("Erreur", error.message);
    } finally {
      setUploading(false);
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

      <Text style={styles.label}>Sélectionner une activité</Text>

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
            <Text style={styles.activityName}>{activity.name}</Text>
            <Text style={styles.status}>Statut : {activity.status}</Text>

            {selectedActivityId === activity._id && (
              <Text style={styles.selectedText}>
                Activité sélectionnée
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}

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
            <Text style={styles.productName}>{product.name}</Text>

            {Array.isArray(product.images) &&
              product.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {product.images.map((uri, index) => (
                    <Image
                      key={`${product._id}-${index}`}
                      source={{ uri }}
                      style={styles.productImage}
                    />
                  ))}
                </ScrollView>
              )}

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
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteProduct(product)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>
        {editingProductId ? "Modifier le produit" : "Ajouter des produits"}
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
            onChangeText={(value) => updateOffer(index, "name", value)}
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
            onChangeText={(value) => updateOffer(index, "price", value)}
          />

          <Text style={styles.label}>Devise</Text>

          <View style={styles.currencyRow}>
            {["EUR", "MGA"].map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyButton,
                  offer.currency === currency && styles.currencySelected,
                ]}
                onPress={() => updateOffer(index, "currency", currency)}
              >
                <Text
                  style={[
                    styles.currencyText,
                    offer.currency === currency &&
                      styles.currencyTextSelected,
                  ]}
                >
                  {currency === "EUR" ? "EUR (€)" : "MGA (Ar)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Photos du produit (facultatif)</Text>

          <Text style={styles.photoInfo}>
            Jusqu'à 5 photos. JPG, JPEG, PNG ou WebP. 5 Mo maximum par photo.
            Les photos seront redimensionnées et compressées avant l'envoi.
          </Text>

          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => pickImages(index)}
            activeOpacity={0.8}
          >
            <Text style={styles.photoButtonText}>
              + Ajouter des photos ({offer.images?.length || 0}/5)
            </Text>
          </TouchableOpacity>

          {offer.images?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {offer.images.map((image, imageIndex) => (
                <View
                  key={`${index}-${imageIndex}`}
                  style={styles.previewContainer}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                  />

                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index, imageIndex)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {!editingProductId && offers.length > 1 && (
            <TouchableOpacity
              onPress={() => removeOffer(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteText}>Supprimer cette ligne</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

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

      <TouchableOpacity
        style={[
          styles.primaryButton,
          uploading && styles.disabledButton,
        ]}
        onPress={validateOffers}
        disabled={uploading}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {uploading
            ? "Envoi des photos et enregistrement..."
            : editingProductId
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
  photoInfo: {
    color: "#444444",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: "#F3F9EC",
    borderColor: "#66CC00",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  photoButtonText: {
    color: "#003300",
    fontWeight: "bold",
  },
  previewContainer: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 105,
    height: 105,
    borderRadius: 8,
    backgroundColor: "#EEEEEE",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#C62828",
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 23,
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
  disabledButton: {
    opacity: 0.6,
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
    textAlign: "center",
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
  productImage: {
    width: 130,
    height: 110,
    borderRadius: 8,
    marginTop: 10,
    marginRight: 8,
  },
});
