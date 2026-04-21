"use client";
import { useState, useRef, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export type DropdownItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
};

export default function DropdownMenu({ items, label = "Options" }: { items: DropdownItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
        aria-label={label}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                item.variant === "danger"
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
