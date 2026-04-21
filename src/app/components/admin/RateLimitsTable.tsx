"use client";
import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { api } from "~/trpc/react";
import { DEFAULT_RATE_LIMITS } from "@queries/admin/rateLimitDefaults";

const WINDOW_OPTIONS = [
  { label: "1 minute",  ms: 60_000 },
  { label: "5 minutes", ms: 5 * 60_000 },
  { label: "15 minutes",ms: 15 * 60_000 },
  { label: "1 hour",    ms: 60 * 60_000 },
  { label: "6 hours",   ms: 6 * 60 * 60_000 },
  { label: "24 hours",  ms: 24 * 60 * 60_000 },
];

const ACTION_LABELS: Record<string, string> = {
  "post.create":  "Create post",
  "post.comment": "Add comment",
  "post.like":    "Like post",
  "message.send": "Send message",
  "user.follow":  "Follow user",
  "auth.signup":  "Sign up (per IP)",
};

type EditState = Record<string, { maxRequests: number; windowMs: number }>;

export default function RateLimitsTable() {
  const utils = api.useUtils();
  const { data: configs, isLoading } = api.admin.getRateLimits.useQuery();
  const [edits, setEdits] = useState<EditState>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { mutate: setLimit } = api.admin.setRateLimit.useMutation({
    onSuccess: (_, vars) => {
      setSaving(null);
      setEdits((e) => { const next = { ...e }; delete next[vars.action]; return next; });
      void utils.admin.getRateLimits.invalidate();
    },
    onError: () => setSaving(null),
  });

  const { mutate: resetLimit } = api.admin.resetRateLimit.useMutation({
    onSuccess: () => void utils.admin.getRateLimits.invalidate(),
  });

  const getEdit = (action: string, field: "maxRequests" | "windowMs", fallback: number) =>
    edits[action]?.[field] ?? fallback;

  const setEdit = (action: string, field: "maxRequests" | "windowMs", value: number) =>
    setEdits((e) => ({ ...e, [action]: { ...e[action], [field]: value } as { maxRequests: number; windowMs: number } }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Rate Limits</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Changes take effect within 60 seconds (cache TTL). Defaults shown when no override is set.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Max requests</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Window</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {configs?.map((cfg) => {
                const defaults = DEFAULT_RATE_LIMITS[cfg.action];
                const isDirty = !!edits[cfg.action];
                const currentMax = getEdit(cfg.action, "maxRequests", cfg.maxRequests);
                const currentWindow = getEdit(cfg.action, "windowMs", cfg.windowMs);

                return (
                  <tr key={cfg.action} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                      {ACTION_LABELS[cfg.action] ?? cfg.action}
                      <span className="ml-1.5 font-mono text-xs text-neutral-400">{cfg.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        value={currentMax}
                        onChange={(e) => setEdit(cfg.action, "maxRequests", Number(e.target.value))}
                        className="w-24 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={currentWindow}
                        onChange={(e) => setEdit(cfg.action, "windowMs", Number(e.target.value))}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {WINDOW_OPTIONS.map((o) => (
                          <option key={o.ms} value={o.ms}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        cfg.isCustom
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                      }`}>
                        {cfg.isCustom ? "Custom" : "Default"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {isDirty && (
                          <button
                            onClick={() => {
                              setSaving(cfg.action);
                              setLimit({ action: cfg.action, maxRequests: currentMax, windowMs: currentWindow });
                            }}
                            disabled={saving === cfg.action}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                          >
                            <Save size={12} />
                            Save
                          </button>
                        )}
                        {cfg.isCustom && (
                          <button
                            onClick={() => resetLimit({ action: cfg.action })}
                            title="Reset to default"
                            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <RotateCcw size={12} />
                            Reset
                          </button>
                        )}
                        {defaults && !cfg.isCustom && (
                          <span className="text-xs text-neutral-400">
                            {defaults.maxRequests} / {WINDOW_OPTIONS.find(o => o.ms === defaults.windowMs)?.label ?? `${defaults.windowMs}ms`}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
