"use client";
import { useState, useEffect } from "react";
import Modal from "~/app/components/ui/Modal";
import { api } from "~/trpc/react";

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  photo: string | null;
  isPrivate: boolean;
  hideFollowLists: boolean;
};

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSaved: () => void;
};

export default function EditProfileModal({ isOpen, onClose, profile, onSaved }: EditProfileModalProps) {
  const [form, setForm] = useState({
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    username: profile.username,
    isPrivate: profile.isPrivate,
    hideFollowLists: profile.hideFollowLists,
  });

  useEffect(() => {
    setForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      username: profile.username,
      isPrivate: profile.isPrivate,
      hideFollowLists: profile.hideFollowLists,
    });
  }, [profile]);

  const { mutate: updateProfile, isPending, error } = api.user.updateProfile.useMutation({
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({
            displayName: form.displayName || undefined,
            bio: form.bio || undefined,
            username: form.username !== profile.username ? form.username : undefined,
            isPrivate: form.isPrivate,
            hideFollowLists: form.hideFollowLists,
          });
        }}
        className="space-y-4"
      >
        {error && (
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{error.message}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Display name</label>
          <input
            type="text"
            maxLength={50}
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Username</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">@</span>
            <input
              type="text"
              maxLength={25}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl border border-neutral-200 pl-7 pr-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Bio <span className="text-neutral-400">({160 - form.bio.length} left)</span>
          </label>
          <textarea
            rows={3}
            maxLength={160}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none transition-colors"
            placeholder="Tell people about yourself"
          />
        </div>

        {/* Privacy settings */}
        <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100">
          <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-neutral-800">Private account</p>
              <p className="text-xs text-neutral-500">Only approved followers can see your posts</p>
            </div>
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center justify-between px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-neutral-800">Hide follow lists</p>
              <p className="text-xs text-neutral-500">Others can&apos;t see who you follow or your followers</p>
            </div>
            <input
              type="checkbox"
              checked={form.hideFollowLists}
              onChange={(e) => setForm((f) => ({ ...f, hideFollowLists: e.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
