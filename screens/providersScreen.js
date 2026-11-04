
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

const API_URL = "http://10.0.2.2:3000";

export default function ProvidersScreen({ route, navigation }) {
  const { category = "", token } = route.params || {};

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError("");

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

            if (selectedCategory === "SERASERA") {
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
  }, [category]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activities}
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

            <Text style={styles.title}>{category}</Text>

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
              Aucune activité approuvée dans cette catégorie pour le moment.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("ProviderDetail", {
                activity: item,
                token,
              })
            }
          >
            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.detail}>
              Spécialité : {item.specialty || "Non précisée"}
            </Text>

            <Text style={styles.detail}>
              Pays : {(item.countries || []).join(", ") || "Non précisé"}
            </Text>

            <Text style={styles.detail}>
              Villes : {(item.frenchCities || []).join(", ") || "Non précisées"}
            </Text>

            <Text style={styles.openText}>Voir le détail →</Text>
          </TouchableOpacity>
        )}
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
