
import {
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function SignUpScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Zoma */}
      <Image
        source={require("../assets/logo_paysage.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Titre */}
      <Text style={styles.title}>Créer un compte</Text>

      {/* Bouton Je cherche */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          alert("Le formulaire « Je cherche » sera ajouté bientôt.")
        }
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Je cherche</Text>
      </TouchableOpacity>

      {/* Bouton Je propose */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          alert("Le formulaire « Je propose » sera ajouté bientôt.")
        }
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Je propose</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#003300",
  },

  logo: {
    width: "100%",
    height: 160,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: RFPercentage(3),
    color: "#66CC00",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  button: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#CDAB82",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 15,
  },

  buttonText: {
    color: "#003300",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
  },
});
