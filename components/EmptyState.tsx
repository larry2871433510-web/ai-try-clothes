import { LinkButton } from "@/components/Button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-black/20 bg-white px-5 py-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/60">{description}</p>
      {actionHref && actionLabel ? (
        <LinkButton href={actionHref} className="mt-5">
          {actionLabel}
        </LinkButton>
      ) : null}
    </div>
  );
}
