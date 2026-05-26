import { statusLabels } from "@/types/tryon";

const colors: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || colors.PENDING}`}>
      {statusLabels[status] || status}
    </span>
  );
}
