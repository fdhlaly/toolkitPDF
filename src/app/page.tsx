import Link from "next/link";
import { tools } from "@/data/tools";
import InstallPWAButton from "@/components/InstallPWAButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-950 md:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:min-h-[calc(100vh-2rem)] lg:grid-cols-[260px_1fr]">
        {/* SIDEBAR */}
        <aside className="hidden border-r border-slate-200 bg-slate-950 p-4 text-white lg:flex lg:flex-col">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
                PDF
              </div>

              <div>
                <h1 className="text-base font-bold leading-none">toolkitPDF</h1>
                <p className="mt-1 text-xs text-slate-400">Local PDF tools</p>
              </div>
            </Link>
          </div>

          <nav className="space-y-1">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <span>{tool.title}</span>

                {tool.status && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    {tool.status}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Offline ready</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Files are processed locally and are not uploaded.
            </p>
          </div>
        </aside>

        {/* CONTENT */}
        <section className="flex min-w-0 flex-col">
          {/* TOPBAR */}
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
            <div>
              <h1 className="text-base font-bold text-slate-950 md:text-lg">
                toolkitPDF
              </h1>
              <p className="text-xs text-slate-500">
                Simple PDF tools for daily work
              </p>
            </div>

            <InstallPWAButton />
          </header>

          {/* MOBILE TOOL NAV */}
          <div className="border-b border-slate-200 px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {tool.title}
                </Link>
              ))}
            </div>
          </div>

          {/* MAIN PANEL */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Choose a tool
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload, process, and download. No unnecessary steps.
                </p>
              </div>

              <div className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
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
          </div>
        </section>
      </div>
    </main>
  );
}
