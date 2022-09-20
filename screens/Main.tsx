import React, { FC } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Expo from "expo";
import { registerRootComponent } from "expo";

export function Main() {
  return (
    <View>
      <Text>SoSoc</Text>
    </View>
  );
}

registerRootComponent(Main);

const styles = StyleSheet.create({});
