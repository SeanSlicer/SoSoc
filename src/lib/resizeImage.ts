/**
 * Resize an image file using the browser Canvas API and convert it to JPEG.
 * This handles large photos and non-standard formats (e.g. HEIC from iPhone/Mac)
 * that browsers can display but may not upload cleanly.
 *
 * @param file - Original file from <input type="file">
 * @param maxDimension - Maximum width or height in pixels
 * @returns A new File object (always JPEG) at most maxDimension × maxDimension
 */
export async function resizeImage(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Only resize if the image actually exceeds the max dimension
      if (width <= maxDimension && height <= maxDimension && file.type === "image/jpeg") {
        resolve(file);
        return;
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for resizing"));
    };

    img.src = objectUrl;
  });
}
