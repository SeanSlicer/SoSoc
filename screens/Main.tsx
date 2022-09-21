import React, { FC } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Expo from "expo";
import { registerRootComponent } from "expo";
import Index from "./Index";

export function Main() {
  return (
    <View>
      <Index />
    </View>
  );
}

registerRootComponent(Main);

const styles = StyleSheet.create({});
