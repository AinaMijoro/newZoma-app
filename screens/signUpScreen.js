
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import API_URL from "../config/api";
import { saveSession } from "../services/authSession";

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });

  function showDialog(title, message) {
    setDialog({ visible: true, title, message });
  }

  function closeDialog() {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password) {
      showDialog("Champs manquants", "Remplis tous les champs.");
      return;
    }

    if (password.length < 8) {
      showDialog(
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
        showDialog(
          "Inscription impossible",
          data.message || "Une erreur est survenue."
        );
        return;
      }

      const user = data.user;
      const token = data.token;
      const refreshToken = data.refreshToken;

      // Vérifier les informations retournées par le backend
      if (!user || !token || !refreshToken) {
        showDialog(
          "Erreur d'inscription",
          "Le serveur n'a pas renvoyé toutes les informations nécessaires. Réessaie."
        );
        return;
      }

      // Enregistrer les tokens de manière sécurisée
      await saveSession({
        token,
        refreshToken,
        user,
      });

      // Rediriger vers le choix du profil
      navigation.navigate("ProfileChoice", {
        userId: user.id,
        token,
      });

    } catch (error) {
      showDialog(
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe (8 caractères minimum)"
              placeholderTextColor="#777"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() =>
                setShowPassword((previous) => !previous)
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={23}
                color="#003300"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#003300" />
            ) : (
              <Text style={styles.buttonText}>
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>
              {dialog.title}
            </Text>

            <Text style={styles.dialogMessage}>
              {dialog.message}
            </Text>

            <Pressable
              style={styles.dialogButton}
              onPress={closeDialog}
            >
              <Text style={styles.dialogButtonText}>
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  passwordContainer: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 15,
    fontSize: RFPercentage(2),
    color: "#003300",
  },
  eyeButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
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
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#003300",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#CDAB82",
    padding: 22,
  },
  dialogTitle: {
    color: "#003300",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  dialogMessage: {
    color: "#444444",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 22,
  },
  dialogButton: {
    minHeight: 46,
    backgroundColor: "#CDAB82",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  dialogButtonText: {
    color: "#003300",
    fontSize: 16,
    fontWeight: "bold",
  },
});
