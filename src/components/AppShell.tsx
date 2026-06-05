"use client";

import InstallPWAButton from "@/components/InstallPWAButton";
import { tools } from "@/data/tools";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  description?: string;
  activeHref?: string;
  children: ReactNode;
  contentClassName?: string;
  showMobileBackLink?: boolean;
};

const AppShell = ({
  title,
  description,
  activeHref,
  children,
  contentClassName = "flex-1 overflow-y-auto p-4 md:p-6",
  showMobileBackLink = false,
}: AppShellProps) => {
  return (
    <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden md:min-h-[calc(100vh-2rem)] lg:grid-cols-[260px_1fr]">
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

        <nav className="space-y-1 mb-4">
          {tools.map((tool) => {
            const isActive = tool.href === activeHref;
            const Icon = tool.icon;

            return (
              <Link
                key={tool.title}
                href={tool.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex justify-start items-center gap-3">
                  <Icon size={18} strokeWidth={2} />
                  <span>{tool.title}</span>
                </div>

                {tool.status === "ready" ? null : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${isActive ? "bg-slate-900 text-white" : "bg-white/10 text-slate-400"}`}
                  >
                    {tool.status}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Offline ready</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Files are processed locally in this browser.
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
          <div>
            {showMobileBackLink && (
              <Link
                href="/"
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-950 lg:hidden"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
            )}

            <h1 className="text-base font-bold text-slate-950 md:text-lg">
              {title}
            </h1>

            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>

          <InstallPWAButton />
        </header>

        <div className="border-b border-slate-200 px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {tools.map((tool) => {
              const isActive = tool.href === activeHref;

              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {tool.title}
                </Link>
              );
            })}
          </div>
        </div>

        <div className={contentClassName}>{children}</div>
      </section>
    </div>
  );
};

export default AppShell;
