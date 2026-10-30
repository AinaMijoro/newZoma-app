
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect } from "react";

const API_URL = "http://10.0.2.2:3000";

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
                throw new Error(data.message || "Impossible de refuser l'activité.");
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
        <ActivityIndicator size="large" />
        <Text>Chargement des activités...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activités en attente</Text>

      <FlatList
        data={activities}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadActivities}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucune activité en attente de validation.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Spécialité : {item.specialty}</Text>
            <Text>
              Proposé par : {item.userId?.name || "Utilisateur"}
            </Text>
            <Text>Pays : {item.countries?.join(", ")}</Text>

            <Pressable
              style={styles.button}
              disabled={approvingId === item._id}
              onPress={() => approveActivity(item._id)}
            >
              <Text style={styles.buttonText}>
                {approvingId === item._id
                  ? "Validation..."
                  : "Approuver"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.rejectButton}
              disabled={approvingId === item._id || rejectingId === item._id}
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
    padding: 16,
    backgroundColor: "#003300",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003300",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#66CC00",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003300",
  },
  button: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#CDAB82",
    alignItems: "center",
  },
    rejectButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#CC3333",
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonText: {
    color: "#003300",
    fontWeight: "bold",
  },
  empty: {
    marginTop: 24,
    textAlign: "center",
    color: "#FFFFFF",
  },
});