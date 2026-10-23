
import { useState } from "react";
import {
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

const API_URL = "http://10.0.2.2:3000";

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Champs manquants", "Remplis tous les champs.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Mot de passe trop court",
        "Utilise au moins 8 caractères."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Inscription impossible", data.message || "Une erreur est survenue.");
        return;
      }

      Alert.alert(
        "Compte créé",
        "Ton compte est créé. Tu peux maintenant choisir ton profil.",
        [
          {
            text: "Continuer",
            onPress: () => navigation.navigate("ProfileChoice", {
              userId: data.user.id,
            }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Erreur de connexion",
        "Impossible de joindre le serveur. Vérifie que le backend est lancé."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Créer un compte</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#777"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe (8 caractères minimum)"
            placeholderTextColor="#777"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#003300" />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logo: {
    width: "100%",
    height: 160,
    marginBottom: 15,
  },
  title: {
    fontSize: RFPercentage(3),
    color: "#66CC00",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: RFPercentage(2),
    color: "#003300",
  },
  button: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#CDAB82",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 5,
  },
  buttonText: {
    color: "#003300",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
  },
});
