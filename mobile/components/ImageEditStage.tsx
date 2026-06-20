import { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { Icon } from "./Icon";
import { FittedImage } from "./FittedImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  uris: string[];
  onConfirm: (uris: string[]) => void;
  onCancel: () => void;
};

/**
 * Pre-upload review step. Shows each selected photo exactly as it will post —
 * fully visible inside a square, blurred backdrop filling whatever the photo's
 * own aspect ratio doesn't cover — and lets the user drop any before continuing.
 */
export function ImageEditStage({ uris, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState(uris);
  const [index, setIndex] = useState(0);

  const clampedIndex = Math.min(index, Math.max(0, items.length - 1));

  const removeAt = (i: number) => {
    if (items.length <= 1) {
      onCancel();
      return;
    }
    setItems((prev) => prev.filter((_, j) => j !== i));
    setIndex((prev) => Math.max(0, Math.min(prev, items.length - 2)));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={{ color: colors.textMuted, fontSize: 15 }}>Cancel</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>Edit photos</Text>
          <Pressable onPress={() => onConfirm(items)} hitSlop={8}>
            <Text style={{ color: colors.accent, fontSize: 15, fontWeight: "700" }}>Continue</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ position: "relative" }}>
            <FittedImage
              uri={items[clampedIndex]!}
              style={{ width: SCREEN_WIDTH - 32, aspectRatio: 1, borderRadius: 14 }}
              bg={colors.bgSubtle}
            />
            <Pressable
              onPress={() => removeAt(clampedIndex)}
              hitSlop={8}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 14,
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={14} color="#ffffff" />
            </Pressable>
          </View>

          <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 10 }}>
            {clampedIndex + 1}/{items.length} — each photo posts fully visible, with a soft blurred
            backdrop filling the edges.
          </Text>
        </View>

        {items.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 16 }}
          >
            {items.map((uri, i) => (
              <Pressable key={uri} onPress={() => setIndex(i)}>
                <FittedImage
                  uri={uri}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    borderWidth: i === clampedIndex ? 2 : 0,
                    borderColor: colors.accent,
                  }}
                  bg={colors.bgSubtle}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
