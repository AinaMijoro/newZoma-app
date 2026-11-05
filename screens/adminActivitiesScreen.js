
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import API_URL from "../config/api";



export default function AdminActivitiesScreen({ route }) {
  const token = route.params?.token;

  console.log("ADMIN TOKEN PRESENT:", !!token);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const loadActivities = useCallback(async () => {
    if (!token) {
      Alert.alert(
        "Connexion requise",
        "Reconnecte-toi avec le compte administrateur."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/activities/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ADMIN RESPONSE STATUS:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les activités.");
      }

      setActivities(data.activities || []);
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const approveActivity = async (activityId) => {
    try {
      setApprovingId(activityId);

      const response = await fetch(
        `${API_URL}/activities/${activityId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d'approuver l'activité.");
      }

      setActivities((current) =>
        current.filter((activity) => activity._id !== activityId)
      );

      Alert.alert("Succès", "Activité approuvée.");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setApprovingId(null);
    }
  };

  const rejectActivity = (activityId) => {
    Alert.alert(
      "Refuser cette activité ?",
      "Cette activité sera marquée comme refusée.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            try {
              setRejectingId(activityId);

              const response = await fetch(
                `${API_URL}/activities/${activityId}/reject`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || "Impossible de refuser l'activité."
                );
              }

              setActivities((current) =>
                current.filter((activity) => activity._id !== activityId)
              );

              Alert.alert("Succès", "Activité refusée.");
            } catch (error) {
              Alert.alert("Erreur", error.message);
            } finally {
              setRejectingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && activities.length === 0) {
    return (
      <View style={styles.center}>
        <Image
          source={require("../assets/logo_paysage.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#66CC00" />
        <Text style={styles.loadingText}>Chargement des activités...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadActivities}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image
              source={require("../assets/logo_paysage.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Activités en attente</Text>
            <Text style={styles.subtitle}>
              Vérifie les activités proposées avant leur publication.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucune activité en attente de validation.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>

            <View style={styles.details}>
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Spécialité : </Text>
                {item.specialty || "Non renseignée"}
              </Text>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Proposé par : </Text>
                {item.userId?.name || "Utilisateur"}
              </Text>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Pays : </Text>
                {item.countries?.join(", ") || "Non renseigné"}
              </Text>
            </View>

            <Pressable
              style={[
                styles.button,
                approvingId === item._id && styles.disabledButton,
              ]}
              disabled={
                approvingId === item._id || rejectingId === item._id
              }
              onPress={() => approveActivity(item._id)}
            >
              <Text style={styles.buttonText}>
                {approvingId === item._id ? "Validation..." : "Approuver"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.rejectButton,
                (approvingId === item._id || rejectingId === item._id) &&
                  styles.disabledButton,
              ]}
              disabled={
                approvingId === item._id || rejectingId === item._id
              }
              onPress={() => rejectActivity(item._id)}
            >
              <Text style={styles.rejectButtonText}>
                {rejectingId === item._id ? "Refus..." : "Refuser"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003300",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003300",
    padding: 20,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: "100%",
    height: 115,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#66CC00",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
  },
  card: {
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderColor: "#CDAB82",
    borderWidth: 2,
    borderRadius: 12,
    gap: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#003300",
    marginBottom: 4,
  },
  details: {
    gap: 7,
    marginBottom: 6,
  },
  detail: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 20,
  },
  detailLabel: {
    color: "#003300",
    fontWeight: "bold",
  },
  button: {
    marginTop: 6,
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#CDAB82",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#003300",
    fontWeight: "bold",
    fontSize: 15,
  },
  rejectButton: {
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#CC3333",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  empty: {
    marginTop: 24,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
});
