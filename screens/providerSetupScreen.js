import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";

const API_URL = "http://10.0.2.2:3000";

const SPECIALTIES = [
  "Traiteurs",
  "Envoi de colis France ↔ Madagascar",
  "Serasera — Bonnes affaires",
  "Main-d’œuvre",
  "Produits malgaches",
  "Ambiance",
  "Autre service",
];

const DELIVERY_OPTIONS = [
  { value: "free", label: "Livraison gratuite" },
  {
    value: "free_over_minimum",
    label: "Gratuite à partir d'un montant minimum",
  },
  { value: "flat_fee", label: "Frais de livraison fixes" },
  { value: "none", label: "Pas de livraison" },
];

function splitValues(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProviderSetupScreen({ route, navigation }) {
  const { userId, profiles = [], token } = route.params || {};

  const [activityName, setActivityName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [otherSpecialty, setOtherSpecialty] = useState("");

  const [country, setCountry] = useState("");
  const [frenchDepartments, setFrenchDepartments] = useState("");
  const [frenchCities, setFrenchCities] = useState("");
  const [madagascarCities, setMadagascarCities] = useState("");

  const [parcelDirections, setParcelDirections] = useState([]);

  const [deliveryType, setDeliveryType] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const [loading, setLoading] = useState(false);

  const isParcelService =
    specialty === "Envoi de colis France ↔ Madagascar";

  const selectedCountries = isParcelService
    ? ["France", "Madagascar"]
    : country
      ? [country]
      : [];

  function chooseSpecialty(value) {
    setSpecialty(value);
    setCountry("");
    setParcelDirections([]);
  }

  function toggleDirection(value) {
    setParcelDirections((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function renderOption(label, selected, onPress) {
    return (
      <TouchableOpacity
        key={label}
        style={[styles.option, selected && styles.optionSelected]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.optionText,
            selected && styles.optionTextSelected,
          ]}
        >
          {selected ? "✓ " : "○ "}
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function openMyOffers() {
    if (!userId) {
      Alert.alert(
        "Connexion nécessaire",
        "L'identifiant utilisateur est introuvable. Reconnecte-toi puis réessaie."
      );
      return;
    }

    navigation.navigate("Offers", {
      userId,
      profiles,
      token,
    });
  }

  async function saveActivity() {
    const finalSpecialty =
      specialty === "Autre service"
        ? otherSpecialty.trim()
        : specialty;

    if (!userId) {
      Alert.alert(
        "Erreur",
        "Identifiant utilisateur introuvable. Reconnecte-toi puis réessaie."
      );
      return;
    }

    if (!activityName.trim()) {
      Alert.alert(
        "Information manquante",
        "Indique le nom de ton activité."
      );
      return;
    }

    if (!specialty || !finalSpecialty) {
      Alert.alert(
        "Information manquante",
        "Choisis une spécialité."
      );
      return;
    }

    if (selectedCountries.length === 0) {
      Alert.alert(
        "Information manquante",
        "Choisis un pays d'intervention."
      );
      return;
    }

    if (isParcelService && parcelDirections.length === 0) {
      Alert.alert(
        "Information manquante",
        "Choisis au moins un sens d'envoi."
      );
      return;
    }

    if (!deliveryType) {
      Alert.alert(
        "Information manquante",
        "Choisis une option de livraison."
      );
      return;
    }

    let parsedMinimum;
    let parsedFee;

    if (deliveryType === "free_over_minimum") {
      parsedMinimum = Number(minimumAmount);

      if (
        minimumAmount.trim() === "" ||
        !Number.isFinite(parsedMinimum) ||
        parsedMinimum < 0
      ) {
        Alert.alert(
          "Montant invalide",
          "Indique un montant minimum valide."
        );
        return;
      }
    }

    if (deliveryType === "flat_fee") {
      parsedFee = Number(deliveryFee);

      if (
        deliveryFee.trim() === "" ||
        !Number.isFinite(parsedFee) ||
        parsedFee < 0
      ) {
        Alert.alert(
          "Frais invalides",
          "Indique des frais de livraison valides."
        );
        return;
      }
    }

    const departments = splitValues(frenchDepartments);
    const frenchCityList = splitValues(frenchCities);
    const madagascarCityList = splitValues(madagascarCities);

    if (
      !selectedCountries.includes("France") &&
      (departments.length > 0 || frenchCityList.length > 0)
    ) {
      Alert.alert(
        "Vérifie les zones",
        "Les départements et villes français nécessitent la sélection de la France."
      );
      return;
    }

    if (
      !selectedCountries.includes("Madagascar") &&
      madagascarCityList.length > 0
    ) {
      Alert.alert(
        "Vérifie les zones",
        "Les villes malgaches nécessitent la sélection de Madagascar."
      );
      return;
    }

    const activityData = {
      userId,
      name: activityName.trim(),
      specialty: finalSpecialty,
      countries: selectedCountries,
      frenchDepartments: selectedCountries.includes("France")
        ? departments
        : [],
      frenchCities: selectedCountries.includes("France")
        ? frenchCityList
        : [],
      madagascarCities: selectedCountries.includes("Madagascar")
        ? madagascarCityList
        : [],
      parcelDirections: isParcelService ? parcelDirections : [],
      delivery: {
        type: deliveryType,
        ...(deliveryType === "free_over_minimum"
          ? { minimumAmount: parsedMinimum }
          : {}),
        ...(deliveryType === "flat_fee"
          ? { fee: parsedFee }
          : {}),
      },
    };

    console.log(
      "Données envoyées :",
      JSON.stringify(activityData, null, 2)
    );

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(activityData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Erreur activité :", response.status, data);
        Alert.alert(
          "Enregistrement impossible",
          `${response.status} — ${data.message || "Erreur inconnue"}`
        );
        return;
      }

      Alert.alert(
        "Activité enregistrée",
        data.message ||
          "Ton activité a été enregistrée et attend la validation de l'équipe NewZoma.",
        [
          {
            text: "Continuer",
            onPress: () => {
              if (profiles.includes("propose")) {
                navigation.replace("Offers", {
                  userId,
                  profiles,
                  token,
                  activityId: data.activity?._id,
                });
              } else if (profiles.includes("cherche")) {
                navigation.replace("SearchHome");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Erreur activité :", error);
      Alert.alert(
        "Erreur de connexion",
        "Impossible de joindre le serveur. Vérifie que le backend fonctionne."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Présente ton activité</Text>

        <Text style={styles.subtitle}>
          Complète les informations de ton activité.
        </Text>

        <Text style={styles.label}>Nom de ton activité *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex. : Traiteur malgache"
          placeholderTextColor="#777777"
          value={activityName}
          onChangeText={setActivityName}
          editable={!loading}
        />

        <Text style={styles.label}>Ta spécialité *</Text>

        {SPECIALTIES.map((item) =>
          renderOption(
            item,
            specialty === item,
            () => chooseSpecialty(item)
          )
        )}

        {specialty === "Autre service" && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>
              Décris le service que tu proposes *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Décris ta spécialité"
              placeholderTextColor="#777777"
              value={otherSpecialty}
              onChangeText={setOtherSpecialty}
              editable={!loading}
            />

            <Text style={styles.helper}>
              Ce service pourra être examiné par l'équipe NewZoma.
            </Text>
          </View>
        )}

        {!!specialty && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Pays d'intervention *</Text>

            {isParcelService ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  France et Madagascar
                </Text>
                <Text style={styles.helper}>
                  Cette activité concerne les deux pays.
                </Text>
              </View>
            ) : (
              <>
                {renderOption(
                  "France",
                  country === "France",
                  () => setCountry("France")
                )}

                {renderOption(
                  "Madagascar",
                  country === "Madagascar",
                  () => setCountry("Madagascar")
                )}
              </>
            )}
          </View>
        )}

        {selectedCountries.includes("France") && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Départements français</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex. : 75, 93, 94"
              placeholderTextColor="#777777"
              value={frenchDepartments}
              onChangeText={setFrenchDepartments}
              editable={!loading}
            />

            <Text style={styles.label}>Villes en France</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex. : Paris, Créteil, Saint-Denis"
              placeholderTextColor="#777777"
              value={frenchCities}
              onChangeText={setFrenchCities}
              editable={!loading}
            />

            <Text style={styles.helper}>
              Sépare les départements et les villes par des virgules.
              Ces champs sont facultatifs.
            </Text>
          </View>
        )}

        {selectedCountries.includes("Madagascar") && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Villes à Madagascar</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex. : Antananarivo, Toamasina"
              placeholderTextColor="#777777"
              value={madagascarCities}
              onChangeText={setMadagascarCities}
              editable={!loading}
            />

            <Text style={styles.helper}>
              Tu peux indiquer plusieurs villes, séparées par des virgules.
            </Text>
          </View>
        )}

        {isParcelService && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Sens d'envoi *</Text>

            {renderOption(
              "France vers Madagascar",
              parcelDirections.includes("france_to_madagascar"),
              () => toggleDirection("france_to_madagascar")
            )}

            {renderOption(
              "Madagascar vers France",
              parcelDirections.includes("madagascar_to_france"),
              () => toggleDirection("madagascar_to_france")
            )}

            <Text style={styles.helper}>
              Tu peux sélectionner un sens ou les deux.
            </Text>
          </View>
        )}

        {!!specialty && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>
              Conditions de livraison *
            </Text>

            {DELIVERY_OPTIONS.map((item) =>
              renderOption(
                item.label,
                deliveryType === item.value,
                () => setDeliveryType(item.value)
              )
            )}

            {deliveryType === "free_over_minimum" && (
              <>
                <Text style={styles.label}>Montant minimum *</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex. : 50"
                  placeholderTextColor="#777777"
                  value={minimumAmount}
                  onChangeText={setMinimumAmount}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </>
            )}

            {deliveryType === "flat_fee" && (
              <>
                <Text style={styles.label}>Frais de livraison *</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex. : 5"
                  placeholderTextColor="#777777"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </>
            )}

            <Text style={styles.helper}>
              Les montants sont enregistrés sous forme numérique.
              La devise n'est pas encore précisée dans ce formulaire.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            loading && styles.disabledButton,
          ]}
          onPress={saveActivity}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#003300" />
          ) : (
            <Text style={styles.saveButtonText}>
              Enregistrer mon activité
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.offersButton}
          onPress={openMyOffers}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.offersButtonText}>
            Accéder à mes offres
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Ton activité sera en attente de validation par NewZoma.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  fullWidth: {
    width: "100%",
  },
  logo: {
    width: "100%",
    height: 150,
    marginTop: 10,
    marginBottom: 15,
  },
  title: {
    color: "#66CC00",
    fontSize: RFPercentage(3),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: RFPercentage(2),
    textAlign: "center",
    marginBottom: 25,
  },
  label: {
    alignSelf: "flex-start",
    color: "#FFFFFF",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#003300",
    fontSize: RFPercentage(2),
    marginBottom: 12,
  },
  option: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 10,
    padding: 13,
    marginBottom: 9,
  },
  optionSelected: {
    backgroundColor: "#E8F5DF",
    borderColor: "#66CC00",
  },
  optionText: {
    color: "#003300",
    fontSize: RFPercentage(1.9),
  },
  optionTextSelected: {
    fontWeight: "bold",
  },
  helper: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.7),
    lineHeight: 21,
    marginBottom: 12,
  },
  notice: {
    width: "100%",
    backgroundColor: "#164D16",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  noticeText: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    marginBottom: 5,
  },
  saveButton: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#66CC00",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    padding: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#003300",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    textAlign: "center",
  },
  offersButton: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderColor: "#66CC00",
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 12,
  },
  offersButtonText: {
    color: "#003300",
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    color: "#FFFFFF",
    fontSize: RFPercentage(1.7),
    textAlign: "center",
    marginTop: 15,
  },
});
