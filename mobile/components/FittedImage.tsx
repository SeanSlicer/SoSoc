import { View, type ViewStyle, type StyleProp } from "react-native";
import { Image } from "expo-image";

type Props = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  bg: string;
};

/**
 * Shows an image fully, uncropped, inside a fixed-aspect box. Whatever space
 * isn't filled by the contained image is masked by a blurred, scaled-up copy
 * of the same image rather than empty bars.
 */
export function FittedImage({ uri, style, bg }: Props) {
  return (
    <View style={[{ overflow: "hidden", backgroundColor: bg }, style]}>
      <Image
        source={{ uri }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        blurRadius={45}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.15)",
        }}
      />
      <Image
        source={{ uri }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="contain"
      />
    </View>
  );
}
