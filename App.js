
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileChoiceScreen from "./screens/profileChoiceScreen";
import HomeScreen from "./screens/homeScreen";
import SignUpScreen from "./screens/signUpScreen";
import SignInScreen from "./screens/signInScreen";
import SearchHomeScreen from "./screens/searchHomeScreen";
import ProviderSetupScreen from "./screens/providerSetupScreen";
import ProvidersScreen from "./screens/providersScreen";
import AdminActivitiesScreen from "./screens/adminActivitiesScreen";
import OffersScreen from "./screens/offersScreen";
import ProviderDetailScreen from "./screens/providerDetailScreen";
import ProductsScreen from "./screens/productsScreen";
import CartScreen from "./screens/cartScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
          name="SearchHome"
          component={SearchHomeScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Providers"
          component={ProvidersScreen}
          options={{ title: "Activités" }}
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
          name="ProviderDetail"
          component={ProviderDetailScreen}
          options={{ title: "Détail de l'activité" }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={{ title: "Nos offres" }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: "Mon panier" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
