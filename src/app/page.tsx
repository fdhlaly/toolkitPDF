import AppShell from "@/components/AppShell";
import { tools } from "@/data/tools";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell title="toolkitPDF" description="Simple PDF tools for daily work">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Choose a tool</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload, process, and download. No unnecessary steps.
          </p>
        </div>

        <div className="w-fit rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
          No upload to server
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                PDF
              </div>

              {tool.status && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {tool.status}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-950 group-hover:text-blue-600">
              {tool.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
