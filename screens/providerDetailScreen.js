
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../config/api";



export default function ProviderDetailScreen({ route, navigation }) {
  const { activity, token } = route.params;

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
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

        const favoriteExists = (data.activities || []).some(
          (favorite) => favorite.activityId?._id === activity._id
        );

        if (active) {
          setIsFavorite(favoriteExists);
        }
      } catch (error) {
        if (active) {
          Alert.alert("Favoris", error.message);
        }
      } finally {
        if (active) {
          setFavoriteLoading(false);
        }
      }
    }

    if (token && activity?._id) {
      loadFavorites();
    } else {
      setFavoriteLoading(false);
    }

    return () => {
      active = false;
    };
  }, [activity._id, token]);

  async function toggleFavorite() {
    if (!token) {
      Alert.alert(
        "Connexion requise",
        "Connecte-toi pour ajouter cette activité à tes favoris."
      );
      return;
    }

    if (updatingFavorite) {
      return;
    }

    try {
      setUpdatingFavorite(true);

      const method = isFavorite ? "DELETE" : "POST";

      const response = await fetch(
        `${API_URL}/favorites/activity/${activity._id}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de modifier le favori."
        );
      }

      setIsFavorite(!isFavorite);

      Alert.alert(
        "Favoris",
        isFavorite
          ? "Marchand retiré des favoris."
          : "Marchand ajouté aux favoris."
      );
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setUpdatingFavorite(false);
    }
  }

  const deliveryLabels = {
    free: "Livraison gratuite",
    free_over_minimum:
      "Livraison gratuite à partir d'un minimum d'achat",
    flat_fee: "Livraison avec frais fixes",
    none: "Aucune livraison proposée",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/logo_paysage.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.content}>
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.name}>{activity.name}</Text>
                <Text style={styles.specialty}>
                  {activity.specialty}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
                disabled={favoriteLoading || updatingFavorite}
                activeOpacity={0.8}
              >
                {favoriteLoading || updatingFavorite ? (
                  <ActivityIndicator color="#E53935" />
                ) : (
                  <Text style={styles.favoriteIcon}>
                    {isFavorite ? "♥" : "♡"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Pays desservis</Text>
            <Text style={styles.info}>
              {activity.countries?.join(", ") || "Non renseigné"}
            </Text>

            {activity.frenchCities?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Villes en France
                </Text>
                <Text style={styles.info}>
                  {activity.frenchCities.join(", ")}
                </Text>
              </>
            )}

            {activity.frenchDepartments?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Départements en France
                </Text>
                <Text style={styles.info}>
                  {activity.frenchDepartments.join(", ")}
                </Text>
              </>
            )}

            {activity.madagascarCities?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Villes à Madagascar
                </Text>
                <Text style={styles.info}>
                  {activity.madagascarCities.join(", ")}
                </Text>
              </>
            )}

            <Text style={styles.sectionTitle}>Livraison</Text>
            <Text style={styles.info}>
              {deliveryLabels[activity.delivery?.type] ||
                "Non renseignée"}
            </Text>

            {activity.delivery?.minimumAmount != null && (
              <Text style={styles.info}>
                Minimum d'achat : {activity.delivery.minimumAmount}
              </Text>
            )}

            {activity.delivery?.fee != null && (
              <Text style={styles.info}>
                Frais de livraison : {activity.delivery.fee}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("Products", {
                activityId: activity._id,
                activityName: activity.name,
                token,
              })
            }
          >
            <Text style={styles.buttonText}>Voir les offres</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 25,
  },
  logo: {
    width: "100%",
    height: 105,
    marginBottom: 15,
  },
  content: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F0E8",
    borderWidth: 1,
    borderColor: "#CDAB82",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: {
    fontSize: 32,
    color: "#E53935",
  },
  name: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#003300",
    marginBottom: 8,
  },
  specialty: {
    fontSize: 16,
    color: "#666666",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 14,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003300",
    marginTop: 15,
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    color: "#444444",
    lineHeight: 23,
  },
  button: {
    backgroundColor: "#CDAB82",
    borderWidth: 2,
    borderColor: "#CDAB82",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: {
    color: "#003300",
    fontSize: 17,
    fontWeight: "bold",
  },
});
