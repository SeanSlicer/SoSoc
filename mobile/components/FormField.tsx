import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { useTheme } from "~/lib/theme";

interface Props extends Omit<TextInputProps, "style"> {
  label: string;
  errorText?: string | null;
}

export function FormField({ label, errorText, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: errorText ? colors.danger : "transparent",
            color: colors.text,
          },
        ]}
      />
      {errorText ? (
        <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "500" }}>{errorText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
});
