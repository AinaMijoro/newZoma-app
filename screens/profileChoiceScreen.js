
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://10.0.2.2:3000";

export default function ProfileChoiceScreen({ route, navigation }) {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);

  async function chooseProfile(profile) {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/${userId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Erreur",
          data.message || "Impossible d'enregistrer ton choix."
        );
        return;
      }

      Alert.alert("Profil enregistré", "Ton choix a été sauvegardé dans Zoma.");
      navigation.navigate("SignIn");
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
      <Text style={styles.title}>Que souhaites-tu faire sur Zoma ?</Text>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => chooseProfile("cherche")}
      >
        <Text style={styles.buttonText}>Je cherche</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => chooseProfile("propose")}
      >
        <Text style={styles.buttonText}>Je propose</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color="#66CC00" />}
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
  },
  buttonText: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "bold",
  },
});
