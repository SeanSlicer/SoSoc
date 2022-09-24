import React, { FC } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Expo from "expo";
import { LoginScreen } from "./Login";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";

const Stack = createNativeStackNavigator();

const Index = () => {
  const [screen, setScreen] = useState("");
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default Index;
