import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from "react-native-reanimated";
import { coverScale, type CropState, type NaturalSize } from "~/lib/cropImage";

export const CROP_VIEWPORT_SIZE = 320;

type Props = {
  uri: string;
  natural: NaturalSize;
  value: CropState;
  onChange: (crop: CropState) => void;
};

/** Drag to pan, pinch to zoom — interactive square crop, clamped so the image always fully covers the viewport. */
export function ImageCropper({ uri, natural, value, onChange }: Props) {
  const base = coverScale(natural, CROP_VIEWPORT_SIZE);
  const baseW = natural.width * base;
  const baseH = natural.height * base;

  const scale = useSharedValue(value.scale);
  const offsetX = useSharedValue(value.offsetX);
  const offsetY = useSharedValue(value.offsetY);
  const startScale = useSharedValue(value.scale);
  const startX = useSharedValue(value.offsetX);
  const startY = useSharedValue(value.offsetY);

  const commit = (s: number, ox: number, oy: number) => onChange({ scale: s, offsetX: ox, offsetY: oy });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      "worklet";
      const dispW = baseW * scale.value;
      const dispH = baseH * scale.value;
      const maxX = Math.max(0, (dispW - CROP_VIEWPORT_SIZE) / 2);
      const maxY = Math.max(0, (dispH - CROP_VIEWPORT_SIZE) / 2);
      offsetX.value = Math.min(maxX, Math.max(-maxX, startX.value + e.translationX));
      offsetY.value = Math.min(maxY, Math.max(-maxY, startY.value + e.translationY));
    })
    .onEnd(() => {
      runOnJS(commit)(scale.value, offsetX.value, offsetY.value);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      "worklet";
      const nextScale = Math.min(3, Math.max(1, startScale.value * e.scale));
      const dispW = baseW * nextScale;
      const dispH = baseH * nextScale;
      const maxX = Math.max(0, (dispW - CROP_VIEWPORT_SIZE) / 2);
      const maxY = Math.max(0, (dispH - CROP_VIEWPORT_SIZE) / 2);
      scale.value = nextScale;
      offsetX.value = Math.min(maxX, Math.max(-maxX, offsetX.value));
      offsetY.value = Math.min(maxY, Math.max(-maxY, offsetY.value));
    })
    .onEnd(() => {
      runOnJS(commit)(scale.value, offsetX.value, offsetY.value);
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }, { scale: scale.value }],
  }));

  return (
    <View
      style={{
        width: CROP_VIEWPORT_SIZE,
        height: CROP_VIEWPORT_SIZE,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#000",
        alignSelf: "center",
      }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: baseW,
              height: baseH,
              left: (CROP_VIEWPORT_SIZE - baseW) / 2,
              top: (CROP_VIEWPORT_SIZE - baseH) / 2,
            },
            animatedStyle,
          ]}
        >
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
