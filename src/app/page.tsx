import AppShell from "@/components/AppShell";
import { tools } from "@/data/tools";
import ToolCard from "@/components/ToolCard";

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
          <ToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </AppShell>
  );
}
