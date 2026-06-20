"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Shows an image fully, uncropped, inside a fixed-aspect box. Whatever space
 * isn't filled by the contained image is masked by a blurred, scaled-up copy
 * of the same image rather than empty bars.
 */
export default function FittedImage({ src, alt, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
      />
      <div className="absolute inset-0 bg-black/15" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}
