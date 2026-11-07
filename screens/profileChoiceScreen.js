import { useState } from "react";
import {
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../config/api";

export default function ProfileChoiceScreen({ route, navigation }) {
  const { userId, token } = route.params;
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });

  function showDialog(title, message) {
    setDialog({
      visible: true,
      title,
      message,
    });
  }

  function closeDialog() {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  function toggleProfile(profile) {
    setProfiles((current) =>
      current.includes(profile)
        ? current.filter((item) => item !== profile)
        : [...current, profile],
    );
  }

  async function saveProfiles() {
    if (profiles.length === 0) {
      showDialog("Choix nécessaire", "Sélectionne au moins une option.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profiles }),
      });

      const data = await response.json();

      if (!response.ok) {
        showDialog(
          "Erreur",
          data.message || "Impossible d'enregistrer tes choix.",
        );
        return;
      }

      if (profiles.includes("propose")) {
        navigation.replace("ProviderSetup", {
          userId,
          profiles,
          token,
          merchantName: data.user.merchantName || "",
        });
      } else {
        navigation.replace("ProspectTabs", {
          userId,
          profiles,
          token,
          activeSpace: "cherche",
          screen: "ProspectSearch",
          params: {
            userId,
            profiles,
            token,
          },
        });
      }
    } catch (error) {
      showDialog("Erreur de connexion", "Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../assets/logo_paysage.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Que souhaites-tu faire sur ZOMA ?</Text>

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
        activeOpacity={0.8}
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
        activeOpacity={0.8}
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
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#003300" />
        ) : (
          <Text style={styles.buttonText}>Enregistrer mon choix</Text>
        )}
      </TouchableOpacity>

      {/* Fenêtre de dialogue personnalisée */}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <Pressable style={styles.alertOverlay} onPress={closeDialog}>
          <Pressable
            style={styles.alertContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.alertTitle}>{dialog.title}</Text>

            <Text style={styles.alertMessage}>{dialog.message}</Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={closeDialog}
              activeOpacity={0.8}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  logo: {
    width: "100%",
    height: 130,
    marginBottom: 25,
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
    lineHeight: 23,
    marginBottom: 30,
  },
  button: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#CDAB82",
    borderWidth: 2,
    borderColor: "#CDAB82",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: "#66CC00",
    borderColor: "#FFFFFF",
  },
  saveButton: {
    marginTop: 12,
  },
  buttonText: {
    color: "#003300",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Styles de la fenêtre de dialogue
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  alertContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
  },
  alertTitle: {
    color: "#003300",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  alertMessage: {
    color: "#444444",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 22,
  },
  alertButton: {
    backgroundColor: "#66CC00",
    borderRadius: 9,
    minWidth: 110,
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertButtonText: {
    color: "#003300",
    fontSize: 15,
    fontWeight: "bold",
  },
});
