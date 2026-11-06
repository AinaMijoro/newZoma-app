
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View,
} from "react-native";

import { RFPercentage } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Tout le contenu sous le logo */}
      <View style={styles.mainContent}>
        <Text style={styles.text1}>
  Bienvenue sur Zoma
</Text>

<Text style={styles.tagline}>
  Découvrez, partagez et faites grandir
  les talents et les bonnes affaires
  de la communauté malagasy.
</Text>

<Text style={styles.text2}>
  Mandrosoa tompoko ô !
</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SignIn")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Se connecter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("signup")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Créer un compte
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate("SignIn")}
          activeOpacity={0.8}
        >
          <Text style={styles.pressableText}>
            Mot de passe oublié
          </Text>
        </TouchableOpacity>
      </View>
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
    height: 220,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  mainContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingBottom: 12,
  },

  text1: {
    fontSize: RFPercentage(2.8),
    color: "#66CC00",
    fontWeight: "bold",
    textAlign: "center",
  },

  text2: {
  fontSize: RFPercentage(2.6),
  color: "#66CC00",
  fontWeight: "400",
  textAlign: "center",
},

tagline: {
  fontSize: RFPercentage(2.1),
  color: "#FFFFFF",
  textAlign: "center",
  lineHeight: RFPercentage(3.1),
  paddingHorizontal: 8,
  fontWeight: "400",
},
  button: {
    width: "100%",
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#CDAB82",
    borderColor: "#CDAB82",
    borderWidth: 3,
    borderRadius: 10,
  },

  buttonText: {
    color: "#003300",
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    textAlign: "center",
  },

  pressableText: {
    textDecorationLine: "underline",
    color: "#CDAB82",
    fontSize: RFPercentage(2),
  },

  forgotPassword: {
    alignSelf: "center",
    marginTop: 2,
    paddingVertical: 4,
  },
});
