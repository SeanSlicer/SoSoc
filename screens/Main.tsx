import React, { FC } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "react-query";
import { AppState, AppStateStatus, Platform, StatusBar } from "react-native";
import Expo from "expo";
import { registerRootComponent } from "expo";
import Index from "./Index";

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export function Main() {
  const queryClient = new QueryClient();

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" />
      <Index />
    </QueryClientProvider>
  );
}

registerRootComponent(Main);
