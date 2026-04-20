import Link from "next/link";
import { ChevronRight, ShieldOff } from "lucide-react";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Settings — sosoc" };

const sections = [
  {
    title: "Privacy & Safety",
    items: [
      {
        href: "/settings/blocked",
        icon: ShieldOff,
        label: "Blocked accounts",
        description: "Manage accounts you've blocked",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <h1 className="font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {section.title}
            </p>
            <ul>
              {section.items.map(({ href, icon: Icon, label, description }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
