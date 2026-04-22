import { useState } from "react";
import { View, Text, Dimensions, FlatList, type ViewToken } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "~/lib/theme";

interface Props {
  images: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function PostImageCarousel({ images }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const onViewable = (info: { viewableItems: ViewToken[] }) => {
    const first = info.viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  };

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(u, i) => `${i}:${u}`}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: colors.bgSubtle }}
            contentFit="cover"
          />
        )}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      />
      {images.length > 1 ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.55)",
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>
              {index + 1}/{images.length}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              paddingTop: 10,
              paddingBottom: 4,
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? colors.accent : colors.borderStrong,
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
