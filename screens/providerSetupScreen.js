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
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import API_URL from "../config/api";

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
  const {
    userId,
    profiles = [],
    token,
    merchantName: initialMerchantName = "",
    activity: editingActivity = null,
  } = route.params || {};

  const isEditing = !!editingActivity;

  // Préparer les informations de l'activité à modifier
  const initialSpecialty = editingActivity?.specialty || "";
  const isKnownSpecialty = SPECIALTIES.includes(initialSpecialty);

  const initialSelectedSpecialties = editingActivity
    ? [isKnownSpecialty ? initialSpecialty : "Autre service"]
    : [];

  const initialOtherSpecialty =
    editingActivity && !isKnownSpecialty ? initialSpecialty : "";

  const initialActivitySettings = {};

  if (editingActivity) {
    const specialtyKey = isKnownSpecialty ? initialSpecialty : "Autre service";

    const deliveriesByCountry = {};

    (editingActivity.deliveries || []).forEach((delivery) => {
      deliveriesByCountry[delivery.country] = {
        type: delivery.type,
        minimumAmount:
          delivery.minimumAmount !== undefined
            ? String(delivery.minimumAmount)
            : "",
        fee: delivery.fee !== undefined ? String(delivery.fee) : "",
      };
    });

    initialActivitySettings[specialtyKey] = {
      countries: editingActivity.countries || [],
      frenchDepartments: (editingActivity.frenchDepartments || []).join(", "),
      frenchCities: (editingActivity.frenchCities || []).join(", "),
      madagascarCities: (editingActivity.madagascarCities || []).join(", "),
      parcelDirections: editingActivity.parcelDirections || [],
      deliveries: deliveriesByCountry,
    };
  }

  const [merchantName, setMerchantName] = useState(
    editingActivity?.name || initialMerchantName,
  );

  const [activitySettings, setActivitySettings] = useState(
    initialActivitySettings,
  );

  const [selectedSpecialties, setSelectedSpecialties] = useState(
    initialSelectedSpecialties,
  );

  const [otherSpecialty, setOtherSpecialty] = useState(initialOtherSpecialty);

  const [loading, setLoading] = useState(false);

  // Fenêtre de dialogue personnalisée
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
    setDialog((current) => ({
      ...current,
      visible: false,
    }));
  }

  function handleDialogButton(button) {
    closeDialog();

    if (button.onPress) {
      button.onPress();
    }
  }

  function toggleSpecialty(value) {
    setSelectedSpecialties((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function updateActivitySetting(specialty, field, value) {
    setActivitySettings((current) => ({
      ...current,
      [specialty]: {
        ...(current[specialty] || {}),
        [field]: value,
      },
    }));
  }

  function getActivitySetting(specialty, field, defaultValue = "") {
    return activitySettings[specialty]?.[field] ?? defaultValue;
  }

  function toggleActivityDirection(specialty, value) {
    const currentDirections =
      activitySettings[specialty]?.parcelDirections || [];

    const updatedDirections = currentDirections.includes(value)
      ? currentDirections.filter((item) => item !== value)
      : [...currentDirections, value];

    updateActivitySetting(specialty, "parcelDirections", updatedDirections);
  }

  function toggleActivityCountry(specialty, country) {
    const currentCountries = getActivitySetting(specialty, "countries", []);

    const updatedCountries = currentCountries.includes(country)
      ? currentCountries.filter((item) => item !== country)
      : [...currentCountries, country];

    updateActivitySetting(specialty, "countries", updatedCountries);
  }

  function updateCountryDelivery(specialty, country, field, value) {
    setActivitySettings((current) => ({
      ...current,
      [specialty]: {
        ...(current[specialty] || {}),
        deliveries: {
          ...(current[specialty]?.deliveries || {}),
          [country]: {
            ...(current[specialty]?.deliveries?.[country] || {}),
            [field]: value,
          },
        },
      },
    }));
  }

  function getCountryDelivery(specialty, country, field, defaultValue = "") {
    return (
      activitySettings[specialty]?.deliveries?.[country]?.[field] ??
      defaultValue
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
          style={[styles.optionText, selected && styles.optionTextSelected]}
        >
          {selected ? "✓ " : "○ "}
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  async function openMyOffers() {
    if (!userId || !token) {
      showDialog("Connexion nécessaire", "Reconnecte-toi puis réessaie.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/activities/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de récupérer tes activités.",
        );
      }

      const activities = data.activities || [];

      if (activities.length === 0) {
        showDialog(
          "Aucune activité disponible",
          "Tu n'as pas encore d'activité enregistrée.",
        );
        return;
      }

      navigation.navigate("Offers", {
        userId,
        profiles,
        token,
        activities,
      });
    } catch (error) {
      showDialog("Erreur", error.message);
    }
  }

  async function saveActivity() {
    if (!userId || !token) {
      showDialog(
        "Erreur",
        "Ta session a expiré. Reconnecte-toi puis réessaie.",
      );
      return;
    }

    if (selectedSpecialties.length === 0) {
      showDialog("Information manquante", "Choisis au moins une spécialité.");
      return;
    }

    if (!merchantName.trim()) {
      showDialog("Information manquante", "Indique ton nom commercial.");
      return;
    }

    if (
      selectedSpecialties.includes("Autre service") &&
      !otherSpecialty.trim()
    ) {
      showDialog("Information manquante", "Décris le service que tu proposes.");
      return;
    }

    // Préparer les données de chaque activité
    const activitiesToCreate = [];

    for (const item of selectedSpecialties) {
      const isParcel = item === "Envoi de colis France ↔ Madagascar";

      const finalSpecialty =
        item === "Autre service" ? otherSpecialty.trim() : item;

      const countries = isParcel
        ? ["France", "Madagascar"]
        : getActivitySetting(item, "countries", []);

      const directions = getActivitySetting(item, "parcelDirections", []);

      const deliveries = [];

      for (const country of countries) {
        const deliveryType = getCountryDelivery(item, country, "type");

        const minimumAmount = getCountryDelivery(
          item,
          country,
          "minimumAmount",
        );

        const deliveryFee = getCountryDelivery(item, country, "fee");

        if (!deliveryType) {
          showDialog(
            "Livraison manquante",
            `Choisis une condition de livraison pour ${country}, dans l'activité ${finalSpecialty}.`,
          );
          return;
        }

        let parsedMinimum;
        let parsedFee;

        if (deliveryType === "free_over_minimum") {
          parsedMinimum = Number(minimumAmount);

          if (
            String(minimumAmount).trim() === "" ||
            !Number.isFinite(parsedMinimum) ||
            parsedMinimum <= 0
          ) {
            showDialog(
              "Montant invalide",
              `Indique un montant minimum supérieur à zéro pour ${country}.`,
            );
            return;
          }
        }

        if (deliveryType === "flat_fee") {
          parsedFee = Number(deliveryFee);

          if (
            String(deliveryFee).trim() === "" ||
            !Number.isFinite(parsedFee) ||
            parsedFee < 0
          ) {
            showDialog(
              "Frais invalides",
              `Indique des frais de livraison valides pour ${country}.`,
            );
            return;
          }
        }

        deliveries.push({
          country,
          currency: country === "France" ? "EUR" : "MGA",
          type: deliveryType,
          ...(deliveryType === "free_over_minimum"
            ? { minimumAmount: parsedMinimum }
            : {}),
          ...(deliveryType === "flat_fee" ? { fee: parsedFee } : {}),
        });
      }

      const departments = splitValues(
        getActivitySetting(item, "frenchDepartments"),
      );

      const frenchCities = splitValues(
        getActivitySetting(item, "frenchCities"),
      );

      const madagascarCities = splitValues(
        getActivitySetting(item, "madagascarCities"),
      );

      activitiesToCreate.push({
        specialty: finalSpecialty,
        countries,
        frenchDepartments: countries.includes("France") ? departments : [],
        frenchCities: countries.includes("France") ? frenchCities : [],
        madagascarCities: countries.includes("Madagascar")
          ? madagascarCities
          : [],
        parcelDirections: isParcel ? directions : [],
        deliveries,
      });
    }

    try {
      setLoading(true);

      // MODE MODIFICATION
      if (isEditing) {
        const response = await fetch(
          `${API_URL}/activities/${editingActivity._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(activitiesToCreate[0]),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de modifier cette activité.",
          );
        }

        showDialog(
          "Modification enregistrée",
          data.message || "Ton activité a été modifiée.",
          [
            {
              text: "Continuer",
              style: "primary",
              onPress: () => navigation.goBack(),
            },
          ],
        );

        return;
      }

      // MODE CRÉATION : enregistrer le nom commercial si nécessaire
      if (!initialMerchantName) {
        const merchantResponse = await fetch(`${API_URL}/users/merchant-name`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            merchantName: merchantName.trim(),
          }),
        });

        const merchantData = await merchantResponse.json();

        if (!merchantResponse.ok) {
          showDialog(
            "Nom commercial non enregistré",
            merchantData.message ||
              "Impossible d'enregistrer ton nom commercial.",
          );
          return;
        }
      }

      // Créer une activité indépendante pour chaque spécialité
      const createdActivityIds = [];

      for (const activityData of activitiesToCreate) {
        const response = await fetch(`${API_URL}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(activityData),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log("Erreur activité :", response.status, data);

          showDialog(
            "Enregistrement interrompu",
            `L'activité « ${activityData.specialty} » n'a pas pu être enregistrée. ${
              createdActivityIds.length > 0
                ? `${createdActivityIds.length} activité(s) précédente(s) ont déjà été enregistrées.`
                : data.message || "Réessaie plus tard."
            }`,
          );
          return;
        }

        const activityId = data.activity?._id || data._id;

        if (activityId) {
          createdActivityIds.push(activityId);
        }
      }

      showDialog(
        "Activités enregistrées",
        `${createdActivityIds.length} activité(s) ont été enregistrées et attendent la validation de l'équipe NewZoma.`,
        [
          {
            text: "Continuer",
            style: "primary",
            onPress: () => {
              navigation.replace("Offers", {
                userId,
                profiles,
                token,
                activityId: createdActivityIds[0],
                activityIds: createdActivityIds,
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error("Erreur activités :", error);

      showDialog(
        "Erreur",
        error.message ||
          "Impossible de joindre le serveur. Vérifie que le backend fonctionne.",
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
          source={require("../assets/logo_paysage.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          {isEditing ? "Modifier mon activité" : "Présente ton activité"}
        </Text>

        <Text style={styles.subtitle}>
          {isEditing
            ? "Modifie les informations de ton activité."
            : "Complète les informations de ton activité."}
        </Text>

        <View style={styles.scrollHint}>
          <Text style={styles.scrollHintText}>
            ↓ Fais défiler vers le bas pour compléter toute la page
          </Text>
        </View>

        <Text style={styles.label}>Nom commercial *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex. : Chez Aina"
          placeholderTextColor="#777777"
          value={merchantName}
          onChangeText={setMerchantName}
          editable={!loading && !initialMerchantName && !isEditing}
        />

        <Text style={styles.label}>Ta spécialité *</Text>

        {SPECIALTIES.map((item) =>
          renderOption(item, selectedSpecialties.includes(item), () =>
            toggleSpecialty(item),
          ),
        )}

        {selectedSpecialties.includes("Autre service") && (
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Décris ton autre service *</Text>
            <TextInput
              style={styles.input}
              placeholder="Décris ta spécialité"
              placeholderTextColor="#777777"
              value={otherSpecialty}
              onChangeText={setOtherSpecialty}
              editable={!loading}
            />
          </View>
        )}

        {selectedSpecialties.map((item) => {
          const isParcel = item === "Envoi de colis France ↔ Madagascar";

          const selectedCountries = isParcel
            ? ["France", "Madagascar"]
            : getActivitySetting(item, "countries", []);

          const countries = selectedCountries;

          const directions = getActivitySetting(item, "parcelDirections", []);

          return (
            <View key={item} style={styles.fullWidth}>
              <Text style={styles.title}>
                {item === "Autre service" && otherSpecialty.trim()
                  ? otherSpecialty
                  : item}
              </Text>

              <Text style={styles.label}>Pays d'intervention *</Text>

              {isParcel ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>France et Madagascar</Text>
                </View>
              ) : (
                <>
                  {renderOption(
                    "France",
                    selectedCountries.includes("France"),
                    () => toggleActivityCountry(item, "France"),
                  )}

                  {renderOption(
                    "Madagascar",
                    selectedCountries.includes("Madagascar"),
                    () => toggleActivityCountry(item, "Madagascar"),
                  )}
                </>
              )}

              {countries.includes("France") && (
                <>
                  <Text style={styles.label}>Départements français</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex. : 75, 93, 94"
                    placeholderTextColor="#777777"
                    value={getActivitySetting(item, "frenchDepartments")}
                    onChangeText={(value) =>
                      updateActivitySetting(item, "frenchDepartments", value)
                    }
                    editable={!loading}
                  />

                  <Text style={styles.label}>Villes en France</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex. : Paris, Créteil, Saint-Denis"
                    placeholderTextColor="#777777"
                    value={getActivitySetting(item, "frenchCities")}
                    onChangeText={(value) =>
                      updateActivitySetting(item, "frenchCities", value)
                    }
                    editable={!loading}
                  />
                </>
              )}

              {countries.includes("Madagascar") && (
                <>
                  <Text style={styles.label}>Villes à Madagascar</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex. : Antananarivo, Toamasina"
                    placeholderTextColor="#777777"
                    value={getActivitySetting(item, "madagascarCities")}
                    onChangeText={(value) =>
                      updateActivitySetting(item, "madagascarCities", value)
                    }
                    editable={!loading}
                  />
                </>
              )}

              {isParcel && (
                <>
                  <Text style={styles.label}>Sens d'envoi *</Text>

                  {renderOption(
                    "France vers Madagascar",
                    directions.includes("france_to_madagascar"),
                    () => toggleActivityDirection(item, "france_to_madagascar"),
                  )}

                  {renderOption(
                    "Madagascar vers France",
                    directions.includes("madagascar_to_france"),
                    () => toggleActivityDirection(item, "madagascar_to_france"),
                  )}
                </>
              )}

              {countries.map((country) => {
                const currency = country === "France" ? "EUR (€)" : "MGA (Ar)";

                const deliveryValue = getCountryDelivery(item, country, "type");

                return (
                  <View key={country} style={styles.fullWidth}>
                    <Text style={styles.label}>
                      Livraison — {country} ({currency})
                    </Text>

                    {DELIVERY_OPTIONS.map((option) =>
                      renderOption(
                        option.label,
                        deliveryValue === option.value,
                        () =>
                          updateCountryDelivery(
                            item,
                            country,
                            "type",
                            option.value,
                          ),
                      ),
                    )}

                    {deliveryValue === "free_over_minimum" && (
                      <>
                        <Text style={styles.label}>
                          Montant minimum ({currency})
                        </Text>

                        <TextInput
                          style={styles.input}
                          placeholder="Indique le montant minimum"
                          placeholderTextColor="#777777"
                          value={String(
                            getCountryDelivery(item, country, "minimumAmount"),
                          )}
                          onChangeText={(value) =>
                            updateCountryDelivery(
                              item,
                              country,
                              "minimumAmount",
                              value,
                            )
                          }
                          keyboardType="decimal-pad"
                          editable={!loading}
                        />
                      </>
                    )}

                    {deliveryValue === "flat_fee" && (
                      <>
                        <Text style={styles.label}>
                          Frais de livraison ({currency})
                        </Text>

                        <TextInput
                          style={styles.input}
                          placeholder="Indique les frais"
                          placeholderTextColor="#777777"
                          value={String(
                            getCountryDelivery(item, country, "fee"),
                          )}
                          onChangeText={(value) =>
                            updateCountryDelivery(item, country, "fee", value)
                          }
                          keyboardType="decimal-pad"
                          editable={!loading}
                        />
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={saveActivity}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#003300" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing
                ? "Enregistrer les modifications"
                : "Enregistrer mon activité"}
            </Text>
          )}
        </TouchableOpacity>

        {!isEditing && (
          <TouchableOpacity
            style={styles.offersButton}
            onPress={openMyOffers}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.offersButtonText}>Accéder à mes offres</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footer}>
          {isEditing
            ? "Après modification, ton activité approuvée devra être validée à nouveau."
            : "Ton activité sera en attente de validation par NewZoma."}
        </Text>
      </ScrollView>

      {/* Fenêtre de dialogue compatible iOS, Android et Web */}
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
                    button.style === "secondary"
                      ? styles.dialogSecondary
                      : styles.dialogPrimary,
                  ]}
                  onPress={() => handleDialogButton(button)}
                >
                  <Text
                    style={[
                      styles.dialogButtonText,
                      button.style === "secondary"
                        ? styles.dialogSecondaryText
                        : styles.dialogPrimaryText,
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
  scrollHint: {
    alignItems: "center",
    marginBottom: 18,
    paddingVertical: 8,
  },
  scrollHintText: {
    color: "#269B72",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // Styles de la fenêtre personnalisée
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
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
