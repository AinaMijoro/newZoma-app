
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { StackActions } from "@react-navigation/native";

export default function MonCompteScreen({ route, navigation }) {
  const {
    userId,
    token,
    profiles = [],
    name = "",
    merchantName = "",
    activeSpace = "cherche",
  } = route.params || {};

  function switchSpace(space) {
    if (!profiles.includes(space)) {
      Alert.alert(
        "Espace indisponible",
        "Ce profil n'est pas activé sur ton compte."
      );
      return;
    }

    const destination =
      space === "propose" ? "MerchantTabs" : "ProspectTabs";

    const parentNavigation = navigation.getParent();

    if (!parentNavigation) {
      Alert.alert("Erreur", "Navigation principale introuvable.");
      return;
    }

    parentNavigation.dispatch(
      StackActions.replace(destination, {
        userId,
        token,
        profiles,
        name,
        merchantName,
        activeSpace: space,
      })
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo_paysage.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Mon compte</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{name || "Non renseigné"}</Text>

        <View style={styles.separator} />

        <Text style={styles.label}>Nom commercial</Text>
        <Text style={styles.value}>
          {merchantName || "Non renseigné"}
        </Text>

        <View style={styles.separator} />

        <Text style={styles.label}>Mes profils</Text>
        <Text style={styles.value}>
          {profiles.length > 0
            ? profiles
                .map((profile) =>
                  profile === "propose" ? "Marchand" : "Prospect"
                )
                .join(" et ")
            : "Aucun profil"}
        </Text>

        <View style={styles.separator} />

        <Text style={styles.label}>Espace actuel</Text>
        <Text style={styles.activeSpace}>
          {activeSpace === "propose" ? "Marchand" : "Prospect"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Changer d'espace</Text>

      {profiles.includes("cherche") && (
        <TouchableOpacity
          style={[
            styles.button,
            activeSpace === "cherche" && styles.currentButton,
          ]}
          onPress={() => switchSpace("cherche")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Accéder à l'espace Prospect
          </Text>
        </TouchableOpacity>
      )}

      {profiles.includes("propose") && (
        <TouchableOpacity
          style={[
            styles.button,
            activeSpace === "propose" && styles.currentButton,
          ]}
          onPress={() => switchSpace("propose")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Accéder à l'espace Marchand
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  logo: {
    width: "100%",
    height: 115,
    marginBottom: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    color: "#777777",
    fontSize: 14,
    marginTop: 8,
  },
  value: {
    color: "#003300",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 4,
  },
  activeSpace: {
    color: "#003300",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#E8D8C4",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#66CC00",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#CDAB82",
    minHeight: 50,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  currentButton: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buttonText: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
});
