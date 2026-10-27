
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://10.0.2.2:3000";

export default function ProfileChoiceScreen({ route, navigation }) {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);

  function toggleProfile(profile) {
    setProfiles((current) =>
      current.includes(profile)
        ? current.filter((item) => item !== profile)
        : [...current, profile]
    );
  }

  async function saveProfiles() {
    if (profiles.length === 0) {
      Alert.alert(
        "Choix nécessaire",
        "Sélectionne au moins une option."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/${userId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profiles }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Erreur",
          data.message || "Impossible d'enregistrer tes choix."
        );
        return;
      }

     if (profiles.includes("propose")) {
  navigation.replace("ProviderSetup", {
    userId,
    profiles,
  });
} else {
  navigation.replace("SearchHome");
}
    } catch (error) {
      Alert.alert(
        "Erreur de connexion",
        "Impossible de joindre le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Que souhaites-tu faire sur Zoma ?
      </Text>

      <Text style={styles.subtitle}>
        Tu peux sélectionner une ou deux options.
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          profiles.includes("cherche") && styles.selectedButton,
        ]}
        disabled={loading}
        onPress={() => toggleProfile("cherche")}
      >
        <Text style={styles.buttonText}>
          {profiles.includes("cherche") ? "✓ " : ""}
          Je cherche
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          profiles.includes("propose") && styles.selectedButton,
        ]}
        disabled={loading}
        onPress={() => toggleProfile("propose")}
      >
        <Text style={styles.buttonText}>
          {profiles.includes("propose") ? "✓ " : ""}
          Je propose
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        disabled={loading}
        onPress={saveProfiles}
      >
        {loading ? (
          <ActivityIndicator color="#003300" />
        ) : (
          <Text style={styles.buttonText}>
            Enregistrer mon choix
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#66CC00",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#CDAB82",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: "#66CC00",
  },
  saveButton: {
    marginTop: 10,
  },
  buttonText: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
