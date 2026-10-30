
import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";

export default function CartScreen({ route }) {
    const { activityId, activityName, products = [], token } = route.params || {};
    const [submitting, setSubmitting] = useState(false);

    async function handleConfirmOrder() {
        if (!token) {
            Alert.alert("Connexion requise", "Veuillez vous reconnecter.");
            return;
        }

        if (!activityId || products.length === 0) {
            Alert.alert("Panier vide", "Ajoutez au moins une offre.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch("http://10.0.2.2:3000/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    activityId,
                    products: products.map((product) => ({
                        productId: product._id,
                        quantity: product.quantity,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Impossible de confirmer la commande.");
            }

            Alert.alert("Commande envoyée", "Votre commande a bien été enregistrée.");
        } catch (error) {
            Alert.alert("Erreur", error.message || "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    }

    const totalsByCurrency = products.reduce((totals, product) => {
        const currency = product.currency || "EUR";
        const price = Number(product.price) || 0;
        const quantity = Number(product.quantity) || 0;

        totals[currency] = (totals[currency] || 0) + price * quantity;

        return totals;
    }, {});

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mon panier</Text>

            <Text style={styles.activityName}>
                Prestataire : {activityName || "Non renseigné"}
            </Text>

            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={
                    <Text style={styles.message}>
                        Ton panier est vide.
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.productName}>{item.name}</Text>

                        <Text style={styles.detail}>
                            Prix unitaire : {item.price} {item.currency}
                        </Text>

                        <Text style={styles.detail}>
                            Quantité : {item.quantity}
                        </Text>

                        <Text style={styles.subtotal}>
                            Sous-total :{" "}
                            {(Number(item.price) * Number(item.quantity)).toFixed(2)}{" "}
                            {item.currency}
                        </Text>
                    </View>
                )}
            />

            <View style={styles.totalContainer}>
                <Text style={styles.totalTitle}>Total de la commande</Text>

                {Object.entries(totalsByCurrency).map(([currency, total]) => (
                    <Text style={styles.total} key={currency}>
                        {total.toFixed(2)} {currency}
                    </Text>
                ))}
            </View>
            <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmOrder}
                disabled={submitting || products.length === 0}
            >
                {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.confirmButtonText}>
                        Confirmer ma commande
                    </Text>
                )}
            </TouchableOpacity>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        padding: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#004000",
        textAlign: "center",
        marginBottom: 20,
    },
    activityName: {
        fontSize: 16,
        color: "#444",
        marginBottom: 15,
    },
    card: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
    },
    productName: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#222",
    },
    detail: {
        fontSize: 14,
        color: "#555",
        marginTop: 6,
    },
    subtotal: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#18864B",
        marginTop: 10,
    },
    totalContainer: {
        backgroundColor: "white",
        padding: 18,
        borderRadius: 10,
        marginTop: 12,
        marginBottom: 10,
    },
    totalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#004000",
        marginBottom: 8,
    },
    total: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#18864B",
        marginTop: 4,
    },
    message: {
        textAlign: "center",
        color: "#555",
        marginTop: 20,
    },
      confirmButton: {
    backgroundColor: "#004000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
