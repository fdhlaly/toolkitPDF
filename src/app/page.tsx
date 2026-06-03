import { tools } from "@/data/tools";
import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                toolkitPDF
              </h1>
              <p className="text-sm text-slate-500">
                Browser-based PDF toolkit
              </p>
            </div>

            <div className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 md:block">
              No upload. No cloud. Process locally.
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                PDF tools for daily work
              </p>

              <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                Handle your PDF files directly in your browser.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                Merge, split, rotate, reorder, convert, and extract PDF files
                without uploading sensitive documents to external servers.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">Privacy-first</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Files are processed locally on your device whenever possible.
                Perfect for internal documents, contracts, reports, and daily
                admin work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 lg:px-10">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">PDF Tools</h2>
            <p className="mt-1 text-sm text-slate-600">
              Start with Merge PDF. Other tools will be added step by step.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              href={tool.href}
              icon={tool.icon}
              status={tool.status}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
