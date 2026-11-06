
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConversationsScreen from "../screens/ConversationsScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

export default function MessagesStack({ route }) {
  const accountParams = route?.params || {};

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Conversations"
        options={{ title: "Messages" }}
      >
        {(props) => (
          <ConversationsScreen
            {...props}
            accountParams={accountParams}
          />
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
