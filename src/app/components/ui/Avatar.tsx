"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AvatarUser = {
  username: string;
  displayName?: string | null;
  photo?: string | null;
};

type AvatarProps = {
  user: AvatarUser;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  href?: string;
};

const sizes = { sm: 32, md: 40, lg: 56, xl: 88 };
const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" };
const colors = ["bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500", "bg-orange-500", "bg-sky-500"];

function InitialsAvatar({ user, size }: AvatarProps) {
  const px = sizes[size ?? "md"];
  const initials = (user.displayName ?? user.username).charAt(0).toUpperCase();
  const colorIndex = user.username.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex] ?? "bg-indigo-500";

  return (
    <div
      className={`${bgColor} ${textSizes[size ?? "md"]} flex items-center justify-center rounded-full font-semibold text-white shrink-0`}
      style={{ width: px, height: px }}
    >
      {initials}
    </div>
  );
}

export default function Avatar({ user, size = "md", onClick, href }: AvatarProps) {
  const px = sizes[size];
  const [imgError, setImgError] = useState(false);
  const hasPhoto = !!user.photo && user.photo !== "default.png";
  const clickable = !!onClick;

  const inner = (!hasPhoto || imgError) ? (
    <div onClick={onClick} className={clickable ? "cursor-pointer" : undefined}>
      <InitialsAvatar user={user} size={size} />
    </div>
  ) : (
    <Image
      src={user.photo!}
      alt={user.displayName ?? user.username}
      width={px}
      height={px}
      className={`rounded-full object-cover shrink-0 ${clickable ? "cursor-pointer" : ""}`}
      style={{ width: px, height: px }}
      onError={() => setImgError(true)}
      onClick={onClick}
    />
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {inner}
      </Link>
    );
  }

  return inner;
}
