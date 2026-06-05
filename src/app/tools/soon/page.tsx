"use client";

import AppShell from "@/components/AppShell";
import { Clock3 } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <AppShell
      title="Coming Soon"
      activeHref="/tools/soon"
      showMobileBackLink
      contentClassName="flex-1"
    >
      <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-slate-600">
            <Clock3 size={30} strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Coming Soon</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            This PDF tool is currently under development. We are working to make
            it available in a future update.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
