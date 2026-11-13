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

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  function showDialog(title, message, buttons = []) {
    setDialog({
      visible: true,
      title,
      message,
      buttons:
        buttons.length > 0 ? buttons : [{ text: "OK", style: "primary" }],
    });
  }

  function closeDialog() {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  function enterSpace(space, user, token) {
    const params = {
      userId: user.id,
      token,
      profiles: user.profiles || [],
      name: user.name || "",
      merchantName: user.merchantName || "",
      activeSpace: space,
    };

    if (space === "propose" && !user.merchantName) {
      navigation.navigate("ProviderSetup", params);
      return;
    }

    navigation.navigate(
      space === "propose" ? "MerchantTabs" : "ProspectTabs",
      params,
    );
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      showDialog(
        "Champs manquants",
        "Veuillez saisir votre adresse e-mail et votre mot de passe.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showDialog(
          "Connexion impossible",
          data.message ||
          "Vérifiez votre adresse e-mail et votre mot de passe.",
        );
        return;
      }

      const user = data.user;
      const token = data.token;
      const refreshToken = data.refreshToken;

      if (!token || !refreshToken || !user) {
        showDialog(
          "Erreur de connexion",
          "Le serveur n'a pas renvoyé toutes les informations nécessaires. Réessayez.",
        );
        return;
      }

      // Enregistrer les tokens de manière sécurisée
      await saveSession({
        token,
        refreshToken,
        user,
      });

      if (user.role === "admin") {
        navigation.navigate("AdminActivities", { token });
        return;
      }

      const profiles = Array.isArray(user.profiles) ? user.profiles : [];

      if (profiles.length === 0) {
        navigation.navigate("ProfileChoice", {
          userId: user.id,
          token,
        });
        return;
      }

      if (profiles.includes("cherche") && profiles.includes("propose")) {
        showDialog(
          "Bienvenue sur Zoma !",
          `Bonjour ${user.name} ! Quel espace souhaites-tu utiliser ?`,
          [
            {
              text: "Espace Prospect",
              style: "secondary",
              onPress: () => enterSpace("cherche", user, token),
            },
            {
              text: "Espace Marchand",
              style: "primary",
              onPress: () => enterSpace("propose", user, token),
            },
          ],
        );
        return;
      }

      if (profiles.includes("propose")) {
        enterSpace("propose", user, token);
        return;
      }

      if (profiles.includes("cherche")) {
        enterSpace("cherche", user, token);
        return;
      }

      navigation.navigate("ProfileChoice", {
        userId: user.id,
        token,
      });
    } catch (error) {
      console.error("ERREUR CONNEXION ZOMA :", error);

      showDialog(
        "Erreur détectée",
        error?.message || String(error),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDialogButton(button) {
    closeDialog();

    if (button.onPress) {
      button.onPress();
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

          <Text style={styles.title}>Se connecter</Text>
          <Text style={styles.subtitle}>Bienvenue sur Zoma !</Text>

          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail"
            placeholderTextColor="#777777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          {/* Champ mot de passe avec bouton afficher/masquer */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              placeholderTextColor="#777777"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((previous) => !previous)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={23}
                color="#003300"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#003300" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              showDialog(
                "Bientôt disponible",
                "La récupération du mot de passe sera ajoutée plus tard.",
              )
            }
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("signup")}>
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.dialogTitle}>{dialog.title}</Text>

            <Text style={styles.dialogMessage}>{dialog.message}</Text>

            <View style={styles.dialogButtons}>
              {dialog.buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={[
                    styles.dialogButton,
                    button.style === "primary"
                      ? styles.dialogPrimary
                      : styles.dialogSecondary,
                  ]}
                  onPress={() => handleDialogButton(button)}
                >
                  <Text
                    style={[
                      styles.dialogButtonText,
                      button.style === "primary"
                        ? styles.dialogPrimaryText
                        : styles.dialogSecondaryText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logo: {
    width: "100%",
    height: 180,
    marginTop: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: RFPercentage(3.2),
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: RFPercentage(2.2),
    color: "#FFFFFF",
    marginBottom: 20,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CDAB82",
    borderRadius: 10,
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
  linkButton: {
    paddingVertical: 15,
  },
  linkText: {
    color: "#CDAB82",
    fontSize: RFPercentage(2),
    textDecorationLine: "underline",
  },
  signupContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  signupText: {
    color: "#FFFFFF",
    fontSize: RFPercentage(2),
  },
  signupLink: {
    color: "#CDAB82",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 8,
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
  dialogButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  dialogButton: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 46,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dialogPrimary: {
    backgroundColor: "#CDAB82",
  },
  dialogSecondary: {
    backgroundColor: "#E8E8E8",
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  dialogPrimaryText: {
    color: "#003300",
  },
  dialogSecondaryText: {
    color: "#333333",
  },
});
