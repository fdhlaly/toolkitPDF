import Link from "next/link";
import type { ReactNode } from "react";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  status?: "ready" | "soon";
};

const ToolCard = ({
  title,
  description,
  href,
  icon,
  status = "soon",
}: ToolCardProps) => {
  const isReady = status === "ready";

  if (!isReady) {
    return (
      <div className="group rounded-2xl border border-slate-200 bg-white p-5 opacity-70 shadow-sm">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Soon
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
          Ready
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
};

export default ToolCard;
