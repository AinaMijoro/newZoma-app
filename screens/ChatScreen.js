
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { io } from "socket.io-client";
import API_URL from "../config/api";

export default function ChatScreen({ route }) {
  const conversation = route.params?.conversation || {};
  const token = route.params?.token;
  const userId = route.params?.userId;

  const conversationId = conversation._id || conversation.id;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const listRef = useRef(null);

  const addMessage = useCallback((newMessage) => {
    setMessages((previous) => {
      const alreadyExists = previous.some(
        (item) => String(item._id) === String(newMessage._id)
      );

      if (alreadyExists) return previous;
      return [...previous, newMessage];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!token || !conversationId) {
      setError("Conversation ou session introuvable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les messages.");
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des messages.");
    } finally {
      setLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!token || !conversationId) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinConversation", conversationId);
    });

    socket.on("newMessage", (newMessage) => {
      if (
        String(newMessage.conversationId) === String(conversationId)
      ) {
        addMessage(newMessage);
      }
    });

    socket.on("connect_error", (err) => {
      console.log("Erreur Socket.IO :", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, conversationId, addMessage]);

  const sendMessage = async () => {
    const content = message.trim();

    if (!content || sending) return;

    if (!token || !conversationId) {
      setError("Impossible d'envoyer ce message.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Échec de l'envoi du message.");
      }

      addMessage(data);
      setMessage("");
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const senderId =
      typeof item.senderId === "object"
        ? item.senderId?._id
        : item.senderId;

    const isMine = String(senderId) === String(userId);

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMine && styles.myMessageText,
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#237A57" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          data={messages}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderMessage}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aucun message pour le moment. Démarrez la conversation !
            </Text>
          }
        />
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Écrire un message..."
          multiline
          maxLength={2000}
          editable={!sending}
        />

        <Pressable
          style={[
            styles.sendButton,
            sending && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={sending || !message.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#237A57",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#222222",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 42,
    backgroundColor: "#F2F2F2",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#237A57",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#777777",
    marginTop: 30,
  },
  errorText: {
    color: "#B00020",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
  },
});
