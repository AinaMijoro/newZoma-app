
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function ProviderDetailScreen({ route, navigation }) {
  const { activity, token } = route.params;

  const deliveryLabels = {
    free: "Livraison gratuite",
    free_over_minimum: "Livraison gratuite à partir d'un minimum d'achat",
    flat_fee: "Livraison avec frais fixes",
    none: "Aucune livraison proposée",
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{activity.name}</Text>
        <Text style={styles.specialty}>{activity.specialty}</Text>

        <Text style={styles.sectionTitle}>Pays desservis</Text>
        <Text style={styles.info}>
          {activity.countries?.join(", ") || "Non renseigné"}
        </Text>

        {activity.frenchCities?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Villes en France</Text>
            <Text style={styles.info}>
              {activity.frenchCities.join(", ")}
            </Text>
          </>
        )}

        {activity.frenchDepartments?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Départements en France</Text>
            <Text style={styles.info}>
              {activity.frenchDepartments.join(", ")}
            </Text>
          </>
        )}

        {activity.madagascarCities?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Villes à Madagascar</Text>
            <Text style={styles.info}>
              {activity.madagascarCities.join(", ")}
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Livraison</Text>
        <Text style={styles.info}>
          {deliveryLabels[activity.delivery?.type] || "Non renseignée"}
        </Text>

        {activity.delivery?.minimumAmount != null && (
          <Text style={styles.info}>
            Minimum d'achat : {activity.delivery.minimumAmount}
          </Text>
        )}

        {activity.delivery?.fee != null && (
          <Text style={styles.info}>
            Frais de livraison : {activity.delivery.fee}
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
           navigation.navigate("Products", {
  activityId: activity._id,
  activityName: activity.name,
  token,
})
          }
        >
          <Text style={styles.buttonText}>Voir mes offres</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  specialty: {
    fontSize: 17,
    color: "#777",
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginTop: 18,
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    color: "#555",
    lineHeight: 23,
  },
  button: {
    backgroundColor: "#18864B",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
