"use client";
import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import FittedImage from "~/app/components/ui/FittedImage";

type Props = {
  files: File[];
  onConfirm: (files: File[]) => void;
  onCancel: () => void;
};

/**
 * Pre-upload review step. Shows each selected photo exactly as it will post —
 * fully visible inside a square, blurred backdrop filling whatever the photo's
 * own aspect ratio doesn't cover — and lets the user drop any before continuing.
 */
export default function ImageEditStage({ files, onConfirm, onCancel }: Props) {
  const [items, setItems] = useState(files);
  const [index, setIndex] = useState(0);

  const urls = useMemo(() => items.map((file) => URL.createObjectURL(file)), [items]);
  useEffect(() => () => { urls.forEach((url) => URL.revokeObjectURL(url)); }, [urls]);

  useEffect(() => {
    if (items.length === 0) onCancel();
  }, [items.length, onCancel]);

  if (items.length === 0) return null;

  const clampedIndex = Math.min(index, items.length - 1);

  const removeAt = (i: number) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
    setIndex((prev) => Math.max(0, Math.min(prev, items.length - 2)));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
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
          <FittedImage
            src={urls[clampedIndex]!}
            alt={`Image ${clampedIndex + 1}`}
            className="aspect-square w-full rounded-xl"
          />
          <button
            onClick={() => removeAt(clampedIndex)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
            title="Remove this image"
          >
            <X size={14} />
          </button>
          {clampedIndex > 0 && (
            <button
              onClick={() => setIndex(clampedIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {clampedIndex < items.length - 1 && (
            <button
              onClick={() => setIndex(clampedIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Each photo posts exactly as shown — fully visible, with a soft blurred backdrop filling the edges.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(items)}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
