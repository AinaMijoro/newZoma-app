
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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

const API_URL = "http://10.0.2.2:3000";

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Champs manquants",
        "Veuillez saisir votre adresse e-mail et votre mot de passe."
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
        Alert.alert(
          "Connexion impossible",
          data.message || "Vérifiez votre adresse e-mail et votre mot de passe."
        );
        return;
      }

      Alert.alert("Bienvenue sur Zoma !", `Bonjour ${data.user.name} !`);
      if (data.user.role === "admin") {
        navigation.navigate("AdminActivities", { token: data.token });
        return;
      }


      if (
        Array.isArray(data.user.profiles) &&
        data.user.profiles.length > 0
      ) {
        if (data.user.profiles.includes("propose")) {
          navigation.navigate("ProviderSetup", {
            userId: data.user.id,
            profiles: data.user.profiles,
            token: data.token,
          });
        } else {
          navigation.navigate("SearchHome", {
  token: data.token,
});
        }
      } else {
        navigation.navigate("ProfileChoice", {
          userId: data.user.id,
        });
      }

    } catch (error) {
      Alert.alert(
        "Erreur réseau",
        "Impossible de contacter le serveur. Vérifiez que le backend fonctionne et réessayez."
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

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#777777"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />

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
              Alert.alert(
                "Bientôt disponible",
                "La récupération du mot de passe sera ajoutée plus tard."
              )
            }
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("signup")}
            >
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
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
});
