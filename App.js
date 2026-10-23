
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileChoiceScreen from "./screens/profileChoiceScreen";
import HomeScreen from "./screens/homeScreen";
import SignUpScreen from "./screens/signUpScreen";
import SignInScreen from "./screens/signInScreen";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
