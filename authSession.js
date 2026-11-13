
import * as SecureStore from "expo-secure-store";
import API_URL from "../config/api";

const SESSION_KEY = "zoma_session";

let refreshPromise = null;

// Enregistrer la session
export async function saveSession(session) {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(session)
  );
}

// Lire la session
export async function getSession() {
  const value = await SecureStore.getItemAsync(SESSION_KEY);

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
