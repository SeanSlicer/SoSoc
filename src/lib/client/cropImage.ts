"use client";

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Rasterizes `area` (in natural image pixels, as reported by react-easy-crop's
 * `onCropComplete`) into a new square JPEG File.
 */
export function cropImageToFile(
  img: HTMLImageElement,
  area: CropArea,
  fileName: string,
  outputSize = 1080,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas not supported"));
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outputSize, outputSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        const baseName = fileName.replace(/\.[^.]+$/, "");
        resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}
