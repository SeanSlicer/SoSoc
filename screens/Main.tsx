import React, { FC } from "react";
import { AppState, AppStateStatus, Platform, StatusBar } from "react-native";
import Expo from "expo";
import { registerRootComponent } from "expo";
import { NavigationContainer } from "@react-navigation/native";
import Index from "./Index";

const Main = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />

      <Index />
    </NavigationContainer>
  );
};

registerRootComponent(Main);
