"use client";
import Cropper, { type Area, type Point } from "react-easy-crop";

const CROP_VIEWPORT_SIZE = 320;

type Props = {
  src: string;
  crop: Point;
  zoom: number;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: Area) => void;
};

/** Drag to pan, scroll or pinch to zoom — square crop powered by react-easy-crop. */
export default function ImageCropper({ src, crop, zoom, onCropChange, onZoomChange, onCropComplete }: Props) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl bg-neutral-900"
      style={{ width: CROP_VIEWPORT_SIZE, height: CROP_VIEWPORT_SIZE }}
    >
      <Cropper
        image={src}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={(_area, areaPixels) => onCropComplete(areaPixels)}
      />
    </div>
  );
}
