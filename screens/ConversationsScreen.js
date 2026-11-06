
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";

export default function ConversationsScreen({
  navigation,
  route,
  accountParams: passedAccountParams,
}) {
  const accountParams =
    passedAccountParams || route?.params?.accountParams || route?.params || {};

  const token = accountParams.token;
  const userId = accountParams.userId;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    if (!token) {
      setError("Session introuvable. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = `${API_URL}/conversations/mine`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

 

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Le serveur a renvoyé du HTML ou une réponse non JSON.\nHTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Erreur serveur HTTP ${response.status}`
        );
      }

      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const renderConversation = ({ item }) => {
    const prospect = item.prospectId || {};
    const merchant = item.merchantId || {};

    const otherParticipant =
      String(prospect._id) === String(userId) ? merchant : prospect;

    const name =
      otherParticipant.merchantName ||
      otherParticipant.name ||
      "Conversation";

    const time = item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Pressable
        style={styles.conversation}
        onPress={() =>
          navigation.navigate("Chat", {
            conversation: {
              ...item,
              name,
            },
            token,
            userId,
          })
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={25} color="#237A57" />
        </View>

        <View style={styles.details}>
          <View style={styles.topRow}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>

          <Text style={styles.message} numberOfLines={1}>
            {item.lastMessage || "Démarrer la conversation"}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#237A57" />
        <Text style={styles.status}>Chargement des conversations…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.status}>{error}</Text>
        <Pressable onPress={loadConversations} style={styles.retry}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucune conversation pour le moment.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  status: {
    marginTop: 12,
    color: "#666666",
    textAlign: "center",
  },
  retry: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#237A57",
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  conversation: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8F2E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003300",
  },
  time: {
    fontSize: 12,
    color: "#888888",
  },
  message: {
    fontSize: 14,
    color: "#666666",
  },
  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#777777",
  },
  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 77,
  },
});
