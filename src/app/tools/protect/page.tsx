"use client";

import AppShell from "@/components/AppShell";
import { createPdfBlobFromBytes, runQpdf } from "@/lib/qpdf";
import { PDFDocument } from "pdf-lib";
import {
  Download,
  FileText,
  Loader2,
  Lock,
  Trash2,
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

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [protectedBlob, setProtectedBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [openPassword, setOpenPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    };
  }, [originalPreviewUrl]);

  const resetProtectedResult = () => {
    setProtectedBlob(null);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
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

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const previewUrl = URL.createObjectURL(selectedFile);

      resetProtectedResult();
      setFile(selectedFile);
      setOriginalPreviewUrl(previewUrl);
      setPageCount(pdf.getPageCount());
      setOpenPassword("");
      setOwnerPassword("");
    } catch {
      setError(
        "Failed to read PDF file. Make sure the file is valid and not already password-protected.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const clearFile = () => {
    resetProtectedResult();

    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }

    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setOpenPassword("");
    setOwnerPassword("");
    setError("");
  };

  const handleOpenPasswordChange = (value: string) => {
    resetProtectedResult();
    setOpenPassword(value);
  };

  const handleOwnerPasswordChange = (value: string) => {
    resetProtectedResult();
    setOwnerPassword(value);
  };

  const protectPdf = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      if (openPassword.trim().length < 4) {
        setError("Open password must be at least 4 characters.");
        return;
      }

      setIsProcessing(true);

      const inputBytes = new Uint8Array(await file.arrayBuffer());
      const finalOwnerPassword = ownerPassword.trim() || openPassword.trim();

      const outputBytes = await runQpdf({
        inputBytes,
        buildArgs: ({ inputPath, outputPath }) => [
          "--encrypt",
          openPassword.trim(),
          finalOwnerPassword,
          "256",
          "--",
          inputPath,
          outputPath,
        ],
      });

      const blob = createPdfBlobFromBytes(outputBytes);

      setProtectedBlob(blob);
    } catch {
      setError(
        "Failed to protect PDF. Make sure the file is valid and not password-protected.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProtectedPdf = () => {
    if (!protectedBlob || !file) {
      setError("No protected PDF available to download.");
      return;
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const url = URL.createObjectURL(protectedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-protected-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasProtectedResult = Boolean(protectedBlob);

  return (
    <AppShell
      title="Protect PDF"
      description="Add password protection to your PDF"
      activeHref="/tools/protect"
      showMobileBackLink
      contentClassName="flex-1 overflow-hidden"
    >
      <div className="grid h-full overflow-hidden lg:grid-cols-[420px_1fr]">
        <section className="overflow-y-auto border-b border-slate-200 p-4 md:p-5 lg:border-b-0 lg:border-r">
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
                Upload one unprotected PDF, set password, then protect.
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
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                      Selected file
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Total pages: {pageCount}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearFile}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
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
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="openPassword"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Open password
                    </label>

                    <input
                      id="openPassword"
                      type="password"
                      value={openPassword}
                      onChange={(event) =>
                        handleOpenPasswordChange(event.target.value)
                      }
                      placeholder="Required to open the PDF"
                      className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Minimum 4 characters.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="ownerPassword"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Owner password
                    </label>

                    <input
                      id="ownerPassword"
                      type="password"
                      value={ownerPassword}
                      onChange={(event) =>
                        handleOwnerPasswordChange(event.target.value)
                      }
                      placeholder="Optional"
                      className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Leave empty to use the same value as open password.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={hasProtectedResult ? downloadProtectedPdf : protectPdf}
              disabled={
                isProcessing ||
                (!hasProtectedResult &&
                  (!file || openPassword.trim().length < 4))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Protecting...
                </>
              ) : hasProtectedResult ? (
                <>
                  <Download size={18} />
                  Download Protected PDF
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Protect PDF
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {pageCount || "-"}
                </p>
                <p className="mt-1 text-slate-500">Pages</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">AES-256</p>
                <p className="mt-1 text-slate-500">Encrypt</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {hasProtectedResult ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Keep your password safe. Lost PDF passwords cannot always be
              recovered.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasProtectedResult ? "Protected result" : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasProtectedResult
                      ? "Protected PDF is ready to download"
                      : file.name
                    : "No file selected"}
                </p>
              </div>
            </div>

            <div className="flex-1 bg-slate-50">
              {hasProtectedResult ? (
                <div className="flex h-full min-h-105 items-center justify-center p-6">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                      <Lock size={30} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      Protected PDF is ready
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      The result is password-protected. Preview is disabled to
                      avoid the browser password prompt. Use the download button
                      to save the protected file.
                    </p>
                  </div>
                </div>
              ) : originalPreviewUrl ? (
                <iframe
                  src={originalPreviewUrl}
                  title="Original PDF preview"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full min-h-105 items-center justify-center p-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <FileText size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      PDF preview will appear here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Upload a PDF to preview it automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
