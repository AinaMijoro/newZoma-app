
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  View,
} from "react-native";

import { useState } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
export default function HomeScreen({ navigation }) {

  const [email, setEmail] = useState("");

 
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

      <Text style={styles.text2}>
        Mandrosoa tompoko ô !
      </Text>

      <TextInput
        placeholder="Adresse e-mail"
        placeholderTextColor="#777777"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.inputBox}
        onChangeText={setEmail}
        value={email}
      />

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
    color: "#FFFFFF",
    fontWeight: "400",
    textAlign: "center",
  },

  inputBox: {
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 3,
    borderRadius: 10,
    fontSize: RFPercentage(2),
    color: "#003300",
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

 
bottomLink: {
  width: "100%",
  alignItems: "center",
  marginTop: 12,
  paddingBottom: 20,
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
