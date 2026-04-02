import Image from "next/image";

type AvatarUser = {
  username: string;
  displayName?: string | null;
  photo?: string | null;
};

type AvatarProps = {
  user: AvatarUser;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = { sm: 32, md: 40, lg: 56, xl: 88 };
const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" };

export default function Avatar({ user, size = "md" }: AvatarProps) {
  const px = sizes[size];
  const isDefault = !user.photo || user.photo === "default.png";
  const initials = (user.displayName ?? user.username).charAt(0).toUpperCase();

  // Generate a consistent color from username
  const colors = ["bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500", "bg-orange-500", "bg-sky-500"];
  const colorIndex = user.username.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex] ?? "bg-indigo-500";

  if (isDefault) {
    return (
      <div
        className={`${bgColor} ${textSizes[size]} flex items-center justify-center rounded-full font-semibold text-white shrink-0`}
        style={{ width: px, height: px }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={user.photo!}
      alt={user.displayName ?? user.username}
      width={px}
      height={px}
      className="rounded-full object-cover shrink-0"
      style={{ width: px, height: px }}
    />
  );
}
