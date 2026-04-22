import { useState } from "react";
import { View, Dimensions, FlatList, type ViewToken } from "react-native";
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
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 }}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? colors.text : colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
