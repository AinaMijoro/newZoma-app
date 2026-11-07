import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Modal,
  Pressable,
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

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;

  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });

  function showDialog(title, message) {
    setDialog({
      visible: true,
      title,
      message,
    });
  }

  function closeDialog() {
    setDialog((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  function switchSpace(space) {
    if (!profiles.includes(space)) {
      showDialog(
        "Espace indisponible",
        "Ce profil n'est pas activé sur ton compte.",
      );
      return;
    }

    const destination = space === "propose" ? "MerchantTabs" : "ProspectTabs";

    const parentNavigation = navigation.getParent();

    if (!parentNavigation) {
      showDialog("Erreur", "Navigation principale introuvable.");
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
      }),
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={require("../assets/logo_paysage.png")}
            style={[styles.logo, isSmallScreen && styles.smallLogo]}
            resizeMode="contain"
          />

          <Text style={[styles.title, isSmallScreen && styles.smallTitle]}>
            Mon compte
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{name || "Non renseigné"}</Text>

            <View style={styles.separator} />

            <Text style={styles.label}>Nom commercial</Text>
            <Text style={styles.value}>{merchantName || "Non renseigné"}</Text>

            <View style={styles.separator} />

            <Text style={styles.label}>Mes profils</Text>
            <Text style={styles.value}>
              {profiles.length > 0
                ? profiles
                    .map((profile) =>
                      profile === "propose" ? "Marchand" : "Prospect",
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
              <Text style={styles.buttonText}>Accéder à l'espace Prospect</Text>
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
              <Text style={styles.buttonText}>Accéder à l'espace Marchand</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDialog}>
          <Pressable
            style={styles.dialogBox}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.dialogTitle}>{dialog.title}</Text>

            <Text style={styles.dialogMessage}>{dialog.message}</Text>

            <TouchableOpacity
              style={styles.dialogButton}
              onPress={closeDialog}
              activeOpacity={0.8}
            >
              <Text style={styles.dialogButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#003300",
  },

  scrollView: {
    flex: 1,
    width: "100%",
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  content: {
    width: "100%",
    maxWidth: 600,
    minWidth: 0,
    alignSelf: "center",
  },

  logo: {
    width: "100%",
    height: 100,
    marginBottom: 8,
  },

  smallLogo: {
    height: 75,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 22,
  },

  smallTitle: {
    fontSize: 24,
    marginBottom: 18,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    padding: 18,
    borderRadius: 14,
    marginBottom: 28,
  },

  label: {
    color: "#777777",
    fontSize: 15,
    marginTop: 8,
  },

  value: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
    flexShrink: 1,
  },

  activeSpace: {
    color: "#003300",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: "#E8D8C4",
    marginTop: 12,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#66CC00",
    marginBottom: 14,
    textAlign: "center",
  },

  button: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#CDAB82",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
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
    fontSize: 16,
    textAlign: "center",
    flexShrink: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  dialogBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
    borderWidth: 2,
    borderColor: "#CDAB82",
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
    marginBottom: 20,
  },

  dialogButton: {
    backgroundColor: "#003300",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9,
    alignItems: "center",
  },

  dialogButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
