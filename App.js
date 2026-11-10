import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { CartProvider } from "./context/CartContext";

// Écrans existants
import HomeScreen from "./screens/homeScreen";
import SignUpScreen from "./screens/signUpScreen";
import SignInScreen from "./screens/signInScreen";
import ForgotPasswordScreen from "./screens/forgotPasswordScreen";
import ResetPasswordScreen from "./screens/resetPasswordScreen";
import ProfileChoiceScreen from "./screens/profileChoiceScreen";
import ProviderSetupScreen from "./screens/providerSetupScreen";
import SearchHomeScreen from "./screens/searchHomeScreen";
import ProvidersScreen from "./screens/providersScreen";
import AdminActivitiesScreen from "./screens/adminActivitiesScreen";
import OffersScreen from "./screens/offersScreen";
import ProviderDetailScreen from "./screens/providerDetailScreen";
import ProductsScreen from "./screens/productsScreen";
import CartScreen from "./screens/cartScreen";
import ActivitiesScreen from "./screens/activitiesScreen";
import MerchantOrdersScreen from "./screens/MerchantOrdersScreen";
import ProspectOrdersScreen from "./screens/ProspectOrdersScreen";
import MonCompteScreen from "./screens/monCompteScreen";
import ProspectFavoritesScreen from "./screens/ProspectFavoritesScreen";
import MessagesStack from "./navigation/MessagesStack";
import ChatScreen from "./screens/ChatScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SearchStack = createNativeStackNavigator();

// Configuration des liens profonds
const linking = {
  prefixes: ["zoma://"],
  config: {
    screens: {
      ResetPassword: {
        path: "reset-password",
        parse: {
          token: (token) => token,
        },
      },
    },
  },
};

// Écran provisoire
function ComingSoonScreen({ route }) {
  const title = route.params?.screenTitle || "Fonctionnalité";

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderText}>
        Cet écran sera développé prochainement.
      </Text>
    </View>
  );
}

// Navigation interne de la recherche Prospect
function ProspectSearchStack({ route }) {
  const accountParams = route.params || {};

  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchHome"
        component={SearchHomeScreen}
        initialParams={accountParams}
        options={{ title: "Recherche", headerShown: false }}
      />

      <SearchStack.Screen
        name="Providers"
        component={ProvidersScreen}
        options={{ title: "Activités" }}
      />

      <SearchStack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={{ title: "Détail de l'activité" }}
      />

      <SearchStack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: "Nos offres" }}
      />

      <SearchStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.conversation?.name || "Discussion",
        })}
      />
    </SearchStack.Navigator>
  );
}

// Navigation Marchand
function MerchantTabs({ route }) {
  const accountParams = route.params || {};

  return (
    <Stack.Navigator>
      <Stack.Screen name="MerchantTabsHome" options={{ headerShown: false }}>
        {() => (
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: "#237A57",
              tabBarInactiveTintColor: "#777777",
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "600",
              },
            }}
          >
            <Tab.Screen
              name="MerchantAccount"
              component={MonCompteScreen}
              initialParams={{
                ...accountParams,
                activeSpace: "propose",
              }}
              options={{
                title: "Mon compte",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    name="person-circle-outline"
                    size={size}
                    color={color}
                  />
                ),
              }}
            />

            <Tab.Screen
              name="MerchantActivities"
              component={ActivitiesScreen}
              initialParams={accountParams}
              options={{
                title: "Activités",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    name="storefront-outline"
                    size={size}
                    color={color}
                  />
                ),
              }}
            />

            <Tab.Screen
              name="MerchantProducts"
              component={OffersScreen}
              initialParams={accountParams}
              options={{
                title: "Produits",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="cube-outline" size={size} color={color} />
                ),
              }}
            />

            <Tab.Screen
              name="MerchantOrders"
              component={MerchantOrdersScreen}
              initialParams={accountParams}
              options={{
                title: "Commandes",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="receipt-outline" size={size} color={color} />
                ),
              }}
            />

            <Tab.Screen
              name="MerchantMessages"
              component={MessagesStack}
              initialParams={accountParams}
              options={{
                title: "Messages",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    name="chatbubbles-outline"
                    size={size}
                    color={color}
                  />
                ),
              }}
            />
          </Tab.Navigator>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.conversation?.name || "Discussion",
        })}
      />
    </Stack.Navigator>
  );
}

// Navigation Prospect
function ProspectTabs({ route }) {
  const accountParams = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#237A57",
        tabBarInactiveTintColor: "#777777",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="ProspectAccount"
        component={MonCompteScreen}
        initialParams={{
          ...accountParams,
          activeSpace: "cherche",
        }}
        options={{
          title: "Mon compte",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProspectSearch"
        component={ProspectSearchStack}
        initialParams={accountParams}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("ProspectSearch", {
              screen: "SearchHome",
              params: accountParams,
            });
          },
        })}
        options={{
          title: "Recherche",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProspectFavorites"
        component={ProspectFavoritesScreen}
        initialParams={accountParams}
        options={{
          title: "Favoris",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProspectCart"
        component={CartScreen}
        initialParams={accountParams}
        options={{
          title: "Panier",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProspectOrders"
        component={ProspectOrdersScreen}
        initialParams={accountParams}
        options={{
          title: "Commandes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProspectMessages"
        component={MessagesStack}
        initialParams={accountParams}
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Navigation principale
export default function App() {
  return (
    <CartProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ title: "Se connecter" }}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: "Mot de passe oublié" }}
          />

          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ title: "Nouveau mot de passe" }}
          />

          <Stack.Screen
            name="signup"
            component={SignUpScreen}
            options={{ title: "Créer un compte" }}
          />

          <Stack.Screen
            name="ProfileChoice"
            component={ProfileChoiceScreen}
            options={{ title: "Choisir mon profil" }}
          />

          <Stack.Screen
            name="ProviderSetup"
            component={ProviderSetupScreen}
            options={{ title: "Mon activité" }}
          />

          <Stack.Screen
            name="MerchantTabs"
            component={MerchantTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ProspectTabs"
            component={ProspectTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="AdminActivities"
            component={AdminActivitiesScreen}
            options={{
              title: "Administration des activités",
              animation: "default",
            }}
          />

          <Stack.Screen
            name="Offers"
            component={OffersScreen}
            options={{ title: "Mes offres" }}
          />

          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: "Mon panier" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003300",
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
  },
});