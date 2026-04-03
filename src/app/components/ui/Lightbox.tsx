"use client";
import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  index: number;
  alt?: string;
  onClose: () => void;
  onNavigate?: (index: number) => void;
};

export default function Lightbox({ images, index, alt = "Image", onClose, onNavigate }: Props) {
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate?.(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate?.(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, index, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition-colors"
          onClick={(e) => { e.stopPropagation(); onNavigate?.(index - 1); }}
          aria-label="Previous image"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition-colors"
          onClick={(e) => { e.stopPropagation(); onNavigate?.(index + 1); }}
          aria-label="Next image"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(i); }}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
