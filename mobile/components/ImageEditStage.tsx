import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { Icon } from "./Icon";
import { FittedImage } from "./FittedImage";
import { ImageCropper, CROP_VIEWPORT_SIZE } from "./ImageCropper";
import { cropImageToUri, getImageSize, DEFAULT_CROP, type CropState, type NaturalSize } from "~/lib/cropImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Mode = "fit" | "crop";

interface EditableImage {
  id: string;
  uri: string;
  mode: Mode;
  crop: CropState;
  natural: NaturalSize | null;
}

type Props = {
  uris: string[];
  onConfirm: (uris: string[]) => void;
  onCancel: () => void;
};

/**
 * Pre-upload review step. Each photo defaults to "Fit" — fully visible with a
 * blurred backdrop filling the edges, posted exactly as previewed, no pixel
 * changes needed. Switching a photo to "Crop" lets the user pan/zoom to choose
 * what fills the square instead; that photo is rasterized to the chosen crop
 * when the user continues.
 */
export function ImageEditStage({ uris, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<EditableImage[]>(() =>
    uris.map((uri, i) => ({ id: `${i}:${uri}`, uri, mode: "fit", crop: DEFAULT_CROP, natural: null })),
  );
  const [index, setIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load each photo's natural size once so crop math has something to work with.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      items.map((item) => getImageSize(item.uri).then((natural) => ({ id: item.id, natural }))),
    ).then((loaded) => {
      if (cancelled) return;
      setItems((prev) =>
        prev.map((item) => {
          const match = loaded.find((l) => l.id === item.id);
          return match ? { ...item, natural: match.natural } : item;
        }),
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  useEffect(() => {
    if (items.length === 0) onCancel();
  }, [items.length, onCancel]);

  if (items.length === 0) return null;

  const clampedIndex = Math.min(index, items.length - 1);
  const current = items[clampedIndex]!;

  const removeAt = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setIndex((prev) => Math.max(0, Math.min(prev, items.length - 2)));
  };

  const updateCurrent = (patch: Partial<EditableImage>) => {
    setItems((prev) => prev.map((item) => (item.id === current.id ? { ...item, ...patch } : item)));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const finalUris = await Promise.all(
        items.map((item) =>
          item.mode === "crop" && item.natural
            ? cropImageToUri(item.uri, item.crop, item.natural, CROP_VIEWPORT_SIZE)
            : Promise.resolve(item.uri),
        ),
      );
      onConfirm(finalUris);
    } finally {
      setIsProcessing(false);
    }
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
          <Pressable onPress={() => void handleConfirm()} disabled={isProcessing} hitSlop={8}>
            <Text style={{ color: colors.accent, fontSize: 15, fontWeight: "700", opacity: isProcessing ? 0.5 : 1 }}>
              {isProcessing ? "Processing…" : "Continue"}
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ position: "relative" }}>
            {current.mode === "crop" && current.natural ? (
              <ImageCropper
                key={current.id}
                uri={current.uri}
                natural={current.natural}
                value={current.crop}
                onChange={(crop) => updateCurrent({ crop })}
              />
            ) : (
              <FittedImage
                uri={current.uri}
                style={{ width: SCREEN_WIDTH - 32, aspectRatio: 1, borderRadius: 14 }}
                bg={colors.bgSubtle}
              />
            )}
            <Pressable
              onPress={() => removeAt(current.id)}
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

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={() => updateCurrent({ mode: "fit" })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: current.mode === "fit" ? colors.bgSubtle : "transparent",
              }}
            >
              <Icon name="maximize" size={14} color={current.mode === "fit" ? colors.accent : colors.textMuted} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: current.mode === "fit" ? colors.accent : colors.textMuted,
                }}
              >
                Fit
              </Text>
            </Pressable>
            <Pressable
              onPress={() => updateCurrent({ mode: "crop" })}
              disabled={!current.natural}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: current.mode === "crop" ? colors.bgSubtle : "transparent",
                opacity: current.natural ? 1 : 0.4,
              }}
            >
              <Icon name="crop" size={14} color={current.mode === "crop" ? colors.accent : colors.textMuted} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: current.mode === "crop" ? colors.accent : colors.textMuted,
                }}
              >
                Crop
              </Text>
            </Pressable>
          </View>

          <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 10, textAlign: "center" }}>
            {clampedIndex + 1}/{items.length} —{" "}
            {current.mode === "fit"
              ? "posts fully visible, with a soft blurred backdrop filling the edges."
              : "drag to reposition, pinch to zoom — posts exactly as cropped."}
          </Text>
        </View>

        {items.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 16 }}
          >
            {items.map((item, i) => (
              <Pressable key={item.id} onPress={() => setIndex(i)}>
                <FittedImage
                  uri={item.uri}
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
