import Link from "next/link";
import type { Tool } from "@/data/tools";

type ToolCardProps = {
  tool: Tool;
};

const ToolCard = ({ tool }: ToolCardProps) => {
  const Icon = tool.icon;

  const isReady = tool.status === "ready";
  return (
    <Link
      href={isReady ? tool.href : "#"}
      aria-disabled={!isReady}
      className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 ${!isReady ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-slate-600 transition group-hover:bg-slate-600 group-hover:text-white">
        <Icon size={24} strokeWidth={2} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>

        {tool.status !== "ready" && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Soon
          </span>
        )}
      </div>

      <p className="text-sm leading-6 text-slate-600">{tool.description}</p>
    </Link>
  );
};

export default ToolCard;
