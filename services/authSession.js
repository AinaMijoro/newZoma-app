
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import API_URL from "../config/api";

const SESSION_KEY = "zoma_session";

let refreshPromise = null;

// Enregistrer la session
export async function saveSession(session) {
  const value = JSON.stringify(session);

  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") {
      throw new Error("Stockage local indisponible sur le Web.");
    }

    localStorage.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}

// Lire la session
export async function getSession() {
  let value;

  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") {
      return null;
    }

    value = localStorage.getItem(SESSION_KEY);
  } else {
    value = await SecureStore.getItemAsync(SESSION_KEY);
  }

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    await clearSession();
    return null;
  }
}

// Supprimer la session locale
export async function clearSession() {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

// Renouveler les tokens
export async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const session = await getSession();

    if (!session?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/users/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await clearSession();
        }
        return null;
      }

      const updatedSession = {
        ...session,
        token: data.token,
        refreshToken: data.refreshToken,
      };

      await saveSession(updatedSession);

      return updatedSession;
    } catch (error) {
      console.error("Erreur renouvellement session :", error.message);
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
