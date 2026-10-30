
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

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
              return specialty.includes("TRAITEUR") || name.includes("TRAITEUR");
            }

            if (selectedCategory === "ENVOI COLIS") {
              return specialty.includes("COLIS") || name.includes("COLIS");
            }

            if (selectedCategory === "SERASERA") {
              return specialty.includes("SERASERA") || name.includes("SERASERA");
            }

            if (selectedCategory === "MAINS D’ŒUVRE") {
              return specialty.includes("MAIN") || name.includes("MAIN");
            }

            if (selectedCategory === "PRODUITS MALGACHES") {
              return specialty.includes("PRODUIT") || name.includes("PRODUIT");
            }

            if (selectedCategory === "AMBIANCE") {
              return specialty.includes("AMBIANCE") || name.includes("AMBIANCE");
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
    <View style={styles.container}>
      <Text style={styles.title}>{category}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#65D600" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <Text style={styles.message}>
              Aucune activité approuvée dans cette catégorie pour le moment.
            </Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#004000",
    padding: 18,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
  },
  name: {
    color: "#004000",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 6,
  },
  detail: {
    color: "#333",
    fontSize: 13,
    marginTop: 3,
  },
  openText: {
    color: "#18864B",
    fontWeight: "bold",
    marginTop: 12,
  },
  message: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
});
