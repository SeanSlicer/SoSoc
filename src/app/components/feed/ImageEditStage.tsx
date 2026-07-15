"use client";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Crop, Maximize2 } from "lucide-react";
import type { Area, Point } from "react-easy-crop";
import FittedImage from "~/app/components/ui/FittedImage";
import ImageCropper from "./ImageCropper";
import { cropImageToFile, loadImage } from "~/lib/client/cropImage";

type Mode = "fit" | "crop";

/** A staged photo with its object URL already created by the caller — see CreatePost.tsx. */
export interface PendingImage {
  id: string;
  file: File;
  url: string;
}

interface EditableImage extends PendingImage {
  mode: Mode;
  zoom: number;
  position: Point;
  area: Area | null;
}

type Props = {
  images: PendingImage[];
  onConfirm: (files: File[]) => void;
  onCancel: () => void;
};

/**
 * Pre-upload review step. Each photo defaults to "Fit" — fully visible with a
 * blurred backdrop filling the edges, posted exactly as previewed, no pixel
 * changes needed. Switching a photo to "Crop" lets the user pan/zoom (via
 * react-easy-crop) to choose what fills the square instead; that photo is
 * rasterized to the chosen crop when the user continues.
 *
 * Object URLs belong to the caller (created in an event handler, not an
 * effect, so there's nothing here to race against StrictMode) — this
 * component only adds UI-only state (mode/zoom/position/area) on top.
 */
export default function ImageEditStage({ images, onConfirm, onCancel }: Props) {
  const [items, setItems] = useState<EditableImage[]>(() =>
    images.map((img) => ({ ...img, mode: "fit", zoom: 1, position: { x: 0, y: 0 }, area: null })),
  );
  const [index, setIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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
      const finalFiles = await Promise.all(
        items.map(async (item) => {
          if (item.mode !== "crop" || !item.area) return item.file;
          const img = await loadImage(item.url);
          return cropImageToFile(img, item.area, item.file.name);
        }),
      );
      onConfirm(finalFiles);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-4 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Edit photos</h2>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {clampedIndex + 1}/{items.length}
          </span>
        </div>

        <div className="relative">
          {current.mode === "crop" ? (
            <ImageCropper
              src={current.url}
              crop={current.position}
              zoom={current.zoom}
              onCropChange={(position) => updateCurrent({ position })}
              onZoomChange={(zoom) => updateCurrent({ zoom })}
              onCropComplete={(area) => updateCurrent({ area })}
            />
          ) : (
            <FittedImage
              src={current.url}
              alt={`Image ${clampedIndex + 1}`}
              className="aspect-square w-full rounded-xl"
            />
          )}
          <button
            onClick={() => removeAt(current.id)}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            title="Remove this image"
          >
            <X size={14} />
          </button>
          {clampedIndex > 0 && (
            <button
              onClick={() => setIndex(clampedIndex - 1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {clampedIndex < items.length - 1 && (
            <button
              onClick={() => setIndex(clampedIndex + 1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => updateCurrent({ mode: "fit" })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              current.mode === "fit"
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            <Maximize2 size={13} /> Fit
          </button>
          <button
            onClick={() => updateCurrent({ mode: "crop" })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              current.mode === "crop"
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            <Crop size={13} /> Crop
          </button>
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {current.mode === "fit"
            ? "Posts fully visible, with a soft blurred backdrop filling the edges."
            : "Drag to reposition, scroll or pinch to zoom — posts exactly as cropped."}
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={isProcessing}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {isProcessing ? "Processing…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
