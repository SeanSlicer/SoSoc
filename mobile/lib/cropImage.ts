import { Image } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export interface CropState {
  /** Zoom multiplier on top of the minimum "cover" scale. 1 = no extra zoom. */
  scale: number;
  /** Pan offset in viewport pixels, relative to the centered position. */
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_CROP: CropState = { scale: 1, offsetX: 0, offsetY: 0 };

export interface NaturalSize {
  width: number;
  height: number;
}

/** Minimum scale at which the image fully covers a `size`x`size` viewport. */
export function coverScale(natural: NaturalSize, size: number): number {
  return Math.max(size / natural.width, size / natural.height);
}

/** Clamp pan/zoom so the image always fully covers the viewport — no edges exposed. */
export function clampCrop(crop: CropState, natural: NaturalSize, size: number): CropState {
  const scale = Math.min(3, Math.max(1, crop.scale));
  const base = coverScale(natural, size);
  const dispW = natural.width * base * scale;
  const dispH = natural.height * base * scale;
  const maxX = Math.max(0, (dispW - size) / 2);
  const maxY = Math.max(0, (dispH - size) / 2);
  return {
    scale,
    offsetX: Math.min(maxX, Math.max(-maxX, crop.offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, crop.offsetY)),
  };
}

export function getImageSize(uri: string): Promise<NaturalSize> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Rasterizes the visible region of `uri` for the given crop into a new square
 * JPEG file. `viewportSize` must match the px size the crop's offsets/scale
 * were authored against (see `ImageCropper`).
 */
export async function cropImageToUri(
  uri: string,
  crop: CropState,
  natural: NaturalSize,
  viewportSize: number,
  outputSize = 1080,
): Promise<string> {
  const effectiveScale = coverScale(natural, viewportSize) * crop.scale;
  const dispW = natural.width * effectiveScale;
  const dispH = natural.height * effectiveScale;
  const imgTopLeftX = viewportSize / 2 + crop.offsetX - dispW / 2;
  const imgTopLeftY = viewportSize / 2 + crop.offsetY - dispH / 2;

  const srcX = clamp((0 - imgTopLeftX) / effectiveScale, 0, natural.width);
  const srcY = clamp((0 - imgTopLeftY) / effectiveScale, 0, natural.height);
  const srcSize = clamp(viewportSize / effectiveScale, 1, Math.min(natural.width, natural.height));

  const rendered = await ImageManipulator.manipulate(uri)
    .crop({
      originX: Math.round(srcX),
      originY: Math.round(srcY),
      width: Math.round(srcSize),
      height: Math.round(srcSize),
    })
    .resize({ width: outputSize, height: outputSize })
    .renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.92, format: SaveFormat.JPEG });
  return saved.uri;
}
