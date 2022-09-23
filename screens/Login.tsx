import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";

import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export const LoginScreen = () => {
  const [passwordHide, setPasswordHide] = useState(true);

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize: 36,
          fontWeight: "bold",
          marginBottom: 18,
        }}
      >
        Sign In
      </Text>

      <View style={styles.inputContainer}>
        <Text>Email</Text>

        <TextInput style={styles.input} textContentType="emailAddress" />
      </View>

      <View style={styles.inputContainer}>
        <Text>Password</Text>

        <View style={styles.input}>
          <TextInput
            secureTextEntry={passwordHide}
            textContentType="password"
            style={{ flex: 1 }}
          />
          <Icon
            style={{ marginTop: 10 }}
            name={passwordHide ? "eye-off" : "eye"}
            size={20}
            onPress={() => setPasswordHide(!passwordHide)}
          />
        </View>
      </View>

      <Button title="Submit" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    position: "relative",
  },
  input: {
    flexDirection: "row",
    height: 40,
    width: 300,
    paddingHorizontal: 5,
    backgroundColor: "white",
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  error: {
    marginBottom: 20,
    height: 17.5,
  },
});
