import React, { FC } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Expo from "expo";
import { Section } from "../components/section";

const Index = () => {
  return (
    <View>
      <Section title={"section.navigation.title"}>
        <Text>sosoc</Text>
      </Section>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({});
