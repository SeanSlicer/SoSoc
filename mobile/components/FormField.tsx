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
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: errorText ? colors.danger : colors.border,
            color: colors.text,
          },
        ]}
      />
      {errorText ? (
        <Text style={{ color: colors.danger, fontSize: 12 }}>{errorText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
