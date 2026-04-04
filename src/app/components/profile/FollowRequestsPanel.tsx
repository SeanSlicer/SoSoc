"use client";
import { api } from "~/trpc/react";
import Avatar from "~/app/components/ui/Avatar";
import { Check, X } from "lucide-react";

type Props = {
  onUpdate: () => void;
};

export default function FollowRequestsPanel({ onUpdate }: Props) {
  const utils = api.useUtils();
  const { data: requests, isLoading } = api.user.getFollowRequests.useQuery();

  const invalidate = () => {
    void utils.user.getFollowRequests.invalidate();
    void utils.user.getProfile.invalidate();
    onUpdate();
  };

  const { mutate: accept } = api.user.acceptFollowRequest.useMutation({ onSuccess: invalidate });
  const { mutate: reject } = api.user.rejectFollowRequest.useMutation({ onSuccess: invalidate });

  if (isLoading) return null;
  if (!requests || requests.length === 0) return null;

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          Follow requests <span className="ml-1 text-indigo-600">{requests.length}</span>
        </h3>
      </div>
      <ul className="divide-y divide-neutral-100">
        {requests.map((req) => (
          <li key={req.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar user={req.requester} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {req.requester.displayName ?? req.requester.username}
              </p>
              <p className="truncate text-xs text-neutral-500">@{req.requester.username}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => accept({ requesterId: req.requester.id })}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                title="Accept"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => reject({ requesterId: req.requester.id })}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-red-300 hover:text-red-600 transition-colors"
                title="Decline"
              >
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
