"use client";

import PdfPreviewModal from "@/components/PdfPreviewModal";
import { createPdfBlobFromBytes, downloadBlob, runQpdf } from "@/lib/qpdf";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Unlock,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

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
    setFile(null);
    setPreviewFile(null);
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
    <>
      <main className="min-h-screen overflow-x-hidden bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              <ArrowLeft size={18} />
              Back to tools
            </Link>

            <div>
              <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                Ready tool
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Unlock PDF
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Remove password protection from supported PDF files. For files
                with an open password, enter the correct password first.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 overflow-hidden px-4 py-8 sm:px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            {!file && (
              <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <UploadCloud size={32} />
                </div>

                <h2 className="text-lg font-semibold text-slate-950">
                  Upload locked PDF
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Select one password-protected PDF file from your device.
                </p>

                <p className="mt-4 text-xs font-medium text-slate-400">
                  PDF only • Processed locally in your browser
                </p>
              </label>
            )}

            {error && (
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>
                <button onClick={() => setError("")}>
                  <X size={18} />
                </button>
              </div>
            )}

            {file && (
              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Selected file
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter password if this file requires one to open.
                    </p>
                  </div>

                  <button
                    onClick={clearFile}
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <FileText size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-950">
                      {file.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    onClick={() => setPreviewFile(file)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye size={17} />
                    Preview
                  </button>
                </div>

                <div className="mt-6">
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
                    placeholder="Leave empty for owner-restricted PDFs"
                    className="mt-2 block w-full max-w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Empty password may work only for permission-restricted PDFs.
                    PDFs with an open password need the correct password.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">Unlock summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">File selected</span>
                <span className="font-semibold text-slate-950">
                  {file ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Password entered</span>
                <span className="font-semibold text-slate-950">
                  {password ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={unlockPdf}
              disabled={isProcessing || !file}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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

            <p className="mt-4 text-xs leading-5 text-slate-500">
              This tool cannot recover unknown passwords. It only decrypts PDFs
              you can legally access.
            </p>
          </aside>
        </section>
      </main>

      <PdfPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
