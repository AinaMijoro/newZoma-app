import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = "http://10.0.2.2:3000";

const EMPTY_OFFER = {
    name: "",
    description: "",
    price: "",
    currency: "EUR",
};

export default function OffersScreen({ route }) {
    const { userId, activityId, token } = route.params || {};

    const [offers, setOffers] = useState([{ ...EMPTY_OFFER }]);
    const [savedOffers, setSavedOffers] = useState([]);
    const groupedOffers = savedOffers.reduce((groups, offer) => {
        const activityId =
            offer.activityId?._id || offer.activityId || "sans-activite";

        const activityName =
            typeof offer.activityId === "object"
                ? offer.activityId?.name || "Activité non renseignée"
                : "Activité non renseignée";

        if (!groups[activityId]) {
            groups[activityId] = {
                name: activityName,
                offers: [],
            };
        }

        groups[activityId].offers.push(offer);

        return groups;
    }, {});
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadOffers = useCallback(async () => {
        if (!userId) {
            Alert.alert(
                "Erreur",
                "Identifiant du prestataire introuvable. Reconnecte-toi puis réessaie."
            );
            return;
        }

        setLoadingOffers(true);

        try {
            const response = await fetch(
                `${API_URL}/products/user/${userId}`,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de charger les offres."
                );
            }

            setSavedOffers(data.products || []);
        } catch (error) {
            console.error("Erreur de chargement des offres :", error);
            Alert.alert("Erreur", error.message);
        } finally {
            setLoadingOffers(false);
        }
    }, [userId, token]);

    useFocusEffect(
        useCallback(() => {
            loadOffers();
        }, [loadOffers])
    );

    const updateOffer = (index, field, value) => {
        setOffers((current) =>
            current.map((offer, i) =>
                i === index ? { ...offer, [field]: value } : offer
            )
        );
    };

    const addOffer = () => {
        setOffers((current) => [...current, { ...EMPTY_OFFER }]);
    };

    const validateOffers = async () => {
        if (
            offers.some(
                (offer) =>
                    !offer.name.trim() ||
                    !offer.description.trim() ||
                    offer.price.trim() === "" ||
                    !Number.isFinite(Number(offer.price)) ||
                    Number(offer.price) < 0
            )
        ) {
            Alert.alert(
                "Informations manquantes",
                "Renseigne le nom, la description et un prix valide pour chaque nouvelle offre."
            );
            return;
        }

        if (!activityId || !userId) {
            Alert.alert(
                "Activité introuvable",
                "Pour enregistrer une nouvelle offre, il faut d'abord sélectionner ou créer une activité."
            );
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    activityId,
                    userId,
                    products: offers.map((offer) => ({
                        name: offer.name.trim(),
                        description: offer.description.trim(),
                        price: Number(offer.price),
                        currency: offer.currency,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible d'enregistrer les offres."
                );
            }

            setSavedOffers((current) => [
                ...(data.products || []),
                ...current,
            ]);

            setOffers([{ ...EMPTY_OFFER }]);

            Alert.alert(
                "Offres enregistrées",
                "Tes nouvelles offres ont été enregistrées avec succès."
            );
        } catch (error) {
            console.error("Erreur d'enregistrement des offres :", error);
            Alert.alert(
                "Erreur",
                error.message || "Impossible de joindre le serveur."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Mes offres</Text>

            <Text style={styles.subtitle}>
                Voici les produits et services que tu proposes.
            </Text>

            {loadingOffers && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator color="#7FE3A5" />
                    <Text style={styles.loadingText}>
                        Chargement de tes offres...
                    </Text>
                </View>
            )}

            {!loadingOffers && savedOffers.length === 0 && (
                <Text style={styles.emptyText}>
                    Tu n'as pas encore d'offre enregistrée.
                </Text>
            )}

            {Object.entries(groupedOffers).map(([activityId, group]) => (
                <View key={activityId} style={styles.activityGroup}>
                    <Text style={styles.activityLabel}>
                        {group.name}
                    </Text>

                    {group.offers[0]?.activityId?.specialty ? (
                        <Text style={styles.activitySpecialty}>
                            {group.offers[0].activityId.specialty}
                        </Text>
                    ) : null}

                    {group.offers.map((offer) => (
                        <View key={offer._id} style={styles.card}>
                            <Text style={styles.sectionTitle}>
                                {offer.name}
                            </Text>

                            <Text style={styles.savedDescription}>
                                {offer.description}
                            </Text>

                            <Text style={styles.savedPrice}>
                                {offer.price} {offer.currency === "MGA" ? "Ar" : "€"}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}

            <Text style={styles.formTitle}>Ajouter une offre</Text>

            {offers.map((offer, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Nouvelle offre {index + 1}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Nom du produit ou service"
                        placeholderTextColor="#777"
                        value={offer.name}
                        onChangeText={(value) =>
                            updateOffer(index, "name", value)
                        }
                    />

                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Description"
                        placeholderTextColor="#777"
                        multiline
                        value={offer.description}
                        onChangeText={(value) =>
                            updateOffer(index, "description", value)
                        }
                    />

                    <Text style={styles.label}>Devise</Text>

                    <View style={styles.currencyRow}>
                        <TouchableOpacity
                            style={[
                                styles.currencyButton,
                                offer.currency === "EUR" &&
                                styles.currencyButtonSelected,
                            ]}
                            onPress={() =>
                                updateOffer(index, "currency", "EUR")
                            }
                        >
                            <Text
                                style={[
                                    styles.currencyText,
                                    offer.currency === "EUR" &&
                                    styles.currencyTextSelected,
                                ]}
                            >
                                EUR (€)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.currencyButton,
                                offer.currency === "MGA" &&
                                styles.currencyButtonSelected,
                            ]}
                            onPress={() =>
                                updateOffer(index, "currency", "MGA")
                            }
                        >
                            <Text
                                style={[
                                    styles.currencyText,
                                    offer.currency === "MGA" &&
                                    styles.currencyTextSelected,
                                ]}
                            >
                                MGA (Ar)
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder={`Prix unitaire (${offer.currency})`}
                        placeholderTextColor="#777"
                        keyboardType="decimal-pad"
                        value={offer.price}
                        onChangeText={(value) =>
                            updateOffer(index, "price", value)
                        }
                    />
                </View>
            ))}

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={addOffer}
                disabled={saving}
            >
                <Text style={styles.buttonText}>
                    + Ajouter un autre produit
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    saving && styles.disabledButton,
                ]}
                onPress={validateOffers}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>
                        Enregistrer mes nouvelles offres
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#123C2D",
        padding: 20,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        color: "#FFFFFF",
        fontSize: 15,
        marginBottom: 20,
    },
    formTitle: {
        color: "#7FE3A5",
        fontSize: 21,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 14,
    },
    card: {
        backgroundColor: "#1B4B39",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
        color: "#222222",
    },
    descriptionInput: {
        minHeight: 90,
        textAlignVertical: "top",
    },
    currencyRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
    },
    currencyButton: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    currencyButtonSelected: {
        backgroundColor: "#2E9D62",
        borderColor: "#2E9D62",
    },
    currencyText: {
        color: "#123C2D",
        fontWeight: "bold",
    },
    currencyTextSelected: {
        color: "#FFFFFF",
    },
    primaryButton: {
        backgroundColor: "#2E9D62",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
        marginTop: 12,
        marginBottom: 24,
    },
    secondaryButton: {
        backgroundColor: "#26784B",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    savedDescription: {
        color: "#FFFFFF",
        fontSize: 14,
        marginBottom: 8,
    },
    savedPrice: {
        color: "#7FE3A5",
        fontSize: 18,
        fontWeight: "bold",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    loadingText: {
        color: "#FFFFFF",
    },
    emptyText: {
        color: "#FFFFFF",
        fontSize: 15,
        marginBottom: 18,
    },
    disabledButton: {
        opacity: 0.7,
    },
    activityLabel: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },

    activitySpecialty: {
        color: "#D8F3E3",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 10,
    },
    activityGroup: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: "#174432",
        borderRadius: 14,
    },
});