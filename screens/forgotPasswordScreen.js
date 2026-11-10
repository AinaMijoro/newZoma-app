
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import API_URL from "../config/api";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showDialog(
        "Adresse email manquante",
        "Veuillez saisir votre adresse email."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      showDialog(
        "Adresse email invalide",
        "Veuillez vérifier votre adresse email."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showDialog(
          "Indisponible",
          data.message ||
            "La récupération du mot de passe est momentanément indisponible."
        );
        return;
      }

      showDialog(
        "Demande enregistrée",
        data.message ||
          "Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé."
      );

      setEmail("");
    } catch (error) {
      console.error("Erreur récupération mot de passe :", error);

      showDialog(
        "Erreur",
        "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          Mot de passe oublié ?
        </Text>

        <Text style={styles.description}>
          Saisissez l'adresse email associée à votre compte ZOMA.
          Vous pourrez recevoir un lien pour créer un nouveau mot de passe.
        </Text>

        <Text style={styles.label}>
          Adresse email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Votre adresse email"
          placeholderTextColor="#888888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleForgotPassword}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#003300" />
          ) : (
            <Text style={styles.buttonText}>
              Envoyer le lien
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("SignIn")}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            Retour à la connexion
          </Text>
        </TouchableOpacity>
      </View>

      {/* Boîte de dialogue personnalisée */}
      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDialogVisible(false)}
        >
          <Pressable
            style={styles.dialog}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.dialogTitle}>
              {dialogTitle}
            </Text>

            <Text style={styles.dialogMessage}>
              {dialogMessage}
            </Text>

            <TouchableOpacity
              style={styles.dialogButton}
              onPress={() => setDialogVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.dialogButtonText}>
                OK
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  content: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    elevation: 3,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#003300",
    textAlign: "center",
    marginBottom: 18,
  },

  description: {
    fontSize: 15,
    color: "#555555",
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 28,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#003300",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#CDAB82",
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#222222",
    backgroundColor: "#FFFFFF",
    marginBottom: 22,
  },

  button: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#CDAB82",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#003300",
    fontSize: 16,
    fontWeight: "bold",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 8,
  },

  backText: {
    color: "#003300",
    fontSize: 15,
    textDecorationLine: "underline",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  dialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
  },

  dialogTitle: {
    color: "#003300",
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  dialogMessage: {
    color: "#444444",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 22,
  },

  dialogButton: {
    backgroundColor: "#003300",
    borderRadius: 8,
    minWidth: 110,
    paddingVertical: 11,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  dialogButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
