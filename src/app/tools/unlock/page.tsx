"use client";

import InstallPWAButton from "@/components/InstallPWAButton";
import { tools } from "@/data/tools";
import { createPdfBlobFromBytes, downloadBlob, runQpdf } from "@/lib/qpdf";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Trash2,
  Unlock,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [unlockedPreviewUrl, setUnlockedPreviewUrl] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (unlockedPreviewUrl) {
        URL.revokeObjectURL(unlockedPreviewUrl);
      }
    };
  }, [unlockedPreviewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPassword("");
    event.target.value = "";
  };

  const clearFile = () => {
    if (unlockedPreviewUrl) {
      URL.revokeObjectURL(unlockedPreviewUrl);
    }

    setFile(null);
    setUnlockedPreviewUrl("");
    setPassword("");
    setError("");
  };

  const unlockPdf = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      setIsProcessing(true);

      const inputBytes = new Uint8Array(await file.arrayBuffer());
      const passwordValue = password.trim();

      const outputBytes = await runQpdf({
        inputBytes,
        buildArgs: ({ inputPath, outputPath }) => {
          if (passwordValue) {
            return [
              `--password=${passwordValue}`,
              "--decrypt",
              inputPath,
              outputPath,
            ];
          }

          return ["--decrypt", inputPath, outputPath];
        },
      });

      const blob = createPdfBlobFromBytes(outputBytes);
      const originalName = file.name.replace(/\.pdf$/i, "");

      if (unlockedPreviewUrl) {
        URL.revokeObjectURL(unlockedPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(blob);
      setUnlockedPreviewUrl(previewUrl);

      downloadBlob(blob, `${originalName}-unlocked-toolkitPDF.pdf`);
    } catch {
      setError(
        "Failed to unlock PDF. Make sure the password is correct. Some encrypted PDFs cannot be unlocked without the correct open password.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-950 md:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:min-h-[calc(100vh-2rem)] lg:grid-cols-[260px_1fr]">
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
            {tools.map((tool) => {
              const isActive = tool.href === "/tools/unlock";

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
                  <span>{tool.title}</span>

                  {tool.status && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                        isActive
                          ? "bg-slate-100 text-slate-500"
                          : "bg-white/10 text-slate-400"
                      }`}
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
              Your PDF is processed locally in this browser.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
            <div>
              <Link
                href="/"
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-950 lg:hidden"
              >
                <ArrowLeft size={14} />
                Back
              </Link>

              <h1 className="text-base font-bold text-slate-950 md:text-lg">
                Unlock PDF
              </h1>
              <p className="text-xs text-slate-500">
                Remove password protection from supported PDFs
              </p>
            </div>

            <InstallPWAButton />
          </header>

          <div className="grid flex-1 overflow-hidden lg:grid-cols-[380px_1fr]">
            <section className="border-b border-slate-200 p-4 md:p-5 lg:border-b-0 lg:border-r">
              <div className="space-y-4">
                <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <UploadCloud size={26} />
                  </div>

                  <h2 className="text-sm font-semibold text-slate-950">
                    Drop or select PDF
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Preview appears automatically after upload.
                  </p>
                </label>

                {error && (
                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{error}</p>
                    <button type="button" onClick={() => setError("")}>
                      <X size={18} />
                    </button>
                  </div>
                )}

                {file && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <FileText size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={clearFile}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Clear selected file"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-950"
                  >
                    PDF password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Leave empty if not required"
                    className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Open-password PDFs need the correct password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={unlockPdf}
                  disabled={isProcessing || !file}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Unlock size={18} />
                      Unlock & Download
                    </>
                  )}
                </button>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-950">
                      {file ? "Yes" : "No"}
                    </p>
                    <p className="mt-1 text-slate-500">File</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-950">
                      {password ? "Yes" : "No"}
                    </p>
                    <p className="mt-1 text-slate-500">Password</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-emerald-600">No</p>
                    <p className="mt-1 text-slate-500">Upload</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="min-h-130 bg-slate-100 p-4 md:p-5">
              <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                      Preview
                    </h2>
                    <p className="text-xs text-slate-500">
                      {file ? file.name : "No file selected"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 bg-slate-50">
                  {unlockedPreviewUrl ? (
                    <iframe
                      src={unlockedPreviewUrl}
                      title="Unlocked PDF preview"
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full min-h-105 items-center justify-center p-6">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                          <FileText size={28} />
                        </div>
                        <p className="text-sm font-semibold text-slate-950">
                          Preview appears after unlock
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload a PDF, enter the password if needed, then
                          unlock it.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
