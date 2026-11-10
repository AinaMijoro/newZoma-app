
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../config/api";

export default function ProvidersScreen({ route, navigation }) {
  const {
    category = "",
    token,
    searchTerm = "",
  } = route.params || {};

  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isProductSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError("");
        setActivities([]);
        setProducts([]);

        // RECHERCHE LIBRE DANS LES PRODUITS
        if (isProductSearch) {
          const response = await fetch(
            `${API_URL}/products/search?query=${encodeURIComponent(
              searchTerm.trim(),
            )}`,
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Impossible de rechercher les produits.",
            );
          }

          if (active) {
            setProducts(
              Array.isArray(data.products) ? data.products : [],
            );
          }

          return;
        }

        // AFFICHAGE HABITUEL DES PRESTATAIRES PAR CATÉGORIE
        const response = await fetch(`${API_URL}/activities`);

        if (!response.ok) {
          throw new Error("Impossible de récupérer les activités.");
        }

        const data = await response.json();

        if (active) {
          const allActivities = Array.isArray(data.activities)
            ? data.activities
            : [];

          const selectedCategory = category.trim().toUpperCase();

          const filtered = allActivities.filter((activity) => {
            const specialty = (activity.specialty || "").toUpperCase();
            const name = (activity.name || "").toUpperCase();

            if (selectedCategory === "TRAITEURS") {
              return (
                specialty.includes("TRAITEUR") ||
                name.includes("TRAITEUR")
              );
            }

            if (selectedCategory === "ENVOI COLIS") {
              return (
                specialty.includes("COLIS") ||
                name.includes("COLIS")
              );
            }

            // BONNES AFFAIRES et SERASERA correspondent à la même catégorie.
            if (
              selectedCategory === "SERASERA" ||
              selectedCategory === "BONNES AFFAIRES"
            ) {
              return (
                specialty.includes("SERASERA") ||
                name.includes("SERASERA")
              );
            }

            if (selectedCategory === "MAINS D’ŒUVRE") {
              return (
                specialty.includes("MAIN") ||
                name.includes("MAIN")
              );
            }

            if (selectedCategory === "PRODUITS MALGACHES") {
              return (
                specialty.includes("PRODUIT") ||
                name.includes("PRODUIT")
              );
            }

            if (selectedCategory === "AMBIANCE") {
              return (
                specialty.includes("AMBIANCE") ||
                name.includes("AMBIANCE")
              );
            }

            return false;
          });

          setActivities(filtered);
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

    loadActivities();

    return () => {
      active = false;
    };
  }, [category, searchTerm, isProductSearch]);

  const openProvider = (activity) => {
    if (!activity || !activity._id) {
      setError("La fiche de ce prestataire est indisponible.");
      return;
    }

    navigation.navigate("ProviderDetail", {
      activity,
      token,
    });
  };

  const formatPrice = (price, currency) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "Prix non renseigné";
    }

    return `${amount.toLocaleString("fr-FR")} ${
      currency === "MGA" ? "Ar" : "€"
    }`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={isProductSearch ? products : activities}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Image
              source={require("../assets/logo_paysage.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              {isProductSearch
                ? `Résultats pour « ${searchTerm.trim()} »`
                : category}
            </Text>

            {loading && (
              <ActivityIndicator
                size="large"
                color="#66CC00"
                style={styles.loader}
              />
            )}

            {!loading && error ? (
              <Text style={styles.message}>{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.message}>
              {isProductSearch
                ? "Aucun produit ne correspond à votre recherche."
                : "Aucune activité approuvée dans cette catégorie pour le moment."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          // RÉSULTAT D'UNE RECHERCHE DE PRODUIT
          if (isProductSearch) {
            const activity = item.activityId;
            const firstImage = Array.isArray(item.images)
              ? item.images[0]
              : null;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => openProvider(activity)}
              >
                {firstImage ? (
                  <Image
                    source={{ uri: firstImage }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>
                      Aucune photo
                    </Text>
                  </View>
                )}

                <Text style={styles.name}>{item.name}</Text>

                <Text style={styles.price}>
                  {formatPrice(item.price, item.currency)}
                </Text>

                <Text style={styles.detail}>
                  {item.description}
                </Text>

                <Text style={styles.detail}>
                  Vendeur : {item.merchantName || "Prestataire"}
                </Text>

                {item.specialty ? (
                  <Text style={styles.detail}>
                    Catégorie : {item.specialty}
                  </Text>
                ) : null}

                <Text style={styles.openText}>
                  Voir le prestataire →
                </Text>
              </TouchableOpacity>
            );
          }

          // RÉSULTAT HABITUEL : ACTIVITÉ / PRESTATAIRE
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => openProvider(item)}
            >
              <Text style={styles.name}>{item.name}</Text>

              <Text style={styles.detail}>
                Spécialité : {item.specialty || "Non précisée"}
              </Text>

              <Text style={styles.detail}>
                Pays :{" "}
                {(item.countries || []).join(", ") || "Non précisé"}
              </Text>

              <Text style={styles.detail}>
                Villes :{" "}
                {(item.frenchCities || []).join(", ") ||
                  "Non précisées"}
              </Text>

              <Text style={styles.openText}>Voir le détail →</Text>
            </TouchableOpacity>
          );
        }}
      />
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
    paddingTop: 15,
    paddingBottom: 25,
    flexGrow: 1,
  },
  logo: {
    width: "100%",
    height: 105,
    marginBottom: 15,
  },
  title: {
    color: "#66CC00",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  loader: {
    marginTop: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    padding: 16,
    marginBottom: 14,
    borderRadius: 12,
  },
  name: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detail: {
    color: "#444444",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 21,
  },
  price: {
    color: "#003300",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#EEEEEE",
  },
  imagePlaceholder: {
    width: "100%",
    height: 130,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#777777",
    fontSize: 14,
  },
  openText: {
    color: "#003300",
    fontWeight: "bold",
    marginTop: 14,
    fontSize: 15,
  },
  message: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 25,
    fontSize: 15,
    lineHeight: 22,
  },
});
