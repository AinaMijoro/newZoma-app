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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignIn() {
    // La connexion réelle sera ajoutée plus tard.
    if (!email.trim() || !password) {
      alert("Veuillez saisir votre adresse e-mail et votre mot de passe.");
      return;
    }

    alert("Les champs sont remplis. La connexion sera bientôt activée.");
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
          <Text style={styles.subtitle}>
            Bienvenue sur Zoma !
          </Text>

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
            style={styles.button}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => alert("La récupération du mot de passe sera ajoutée plus tard.")}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Pas encore de compte ?
            </Text>

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