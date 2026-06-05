"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  Download,
  FileText,
  Loader2,
  Minimize2,
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

const calculateReduction = (originalSize: number, newSize: number) => {
  if (originalSize <= 0 || newSize <= 0) return 0;

  return Math.max(0, ((originalSize - newSize) / originalSize) * 100);
};

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }

      if (compressedPreviewUrl) {
        URL.revokeObjectURL(compressedPreviewUrl);
      }
    };
  }, [originalPreviewUrl, compressedPreviewUrl]);

  const resetCompressedResult = () => {
    setCompressedBlob(null);
    setCompressedSize(0);
    setCompressedPreviewUrl("");
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

      resetCompressedResult();

      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }

      const previewUrl = URL.createObjectURL(selectedFile);

      setFile(selectedFile);
      setOriginalPreviewUrl(previewUrl);
      setPageCount(pdf.getPageCount());
    } catch {
      setError(
        "Failed to read PDF file. Make sure the file is valid and not password-protected.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const clearFile = () => {
    resetCompressedResult();

    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }

    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setError("");
  };

  const compressPdf = async () => {
    try {
      setError("");
      resetCompressedResult();

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      setIsProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
      });

      const pdfBytes = await pdf.save({
        useObjectStreams: true,
      });

      const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(pdfBytes);

      const blob = new Blob([pdfArrayBuffer], {
        type: "application/pdf",
      });

      const previewUrl = URL.createObjectURL(blob);

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setCompressedPreviewUrl(previewUrl);
    } catch {
      setError(
        "Failed to compress PDF. Make sure the file is valid and not password-protected.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCompressedPdf = () => {
    if (!compressedBlob || !file) {
      setError("No compressed PDF available to download.");
      return;
    }

    const url = URL.createObjectURL(compressedBlob);
    const originalName = file.name.replace(/\.pdf$/i, "");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-compressed-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const reduction = file ? calculateReduction(file.size, compressedSize) : 0;
  const hasCompressedResult = Boolean(compressedBlob);
  const activePreviewUrl = compressedPreviewUrl || originalPreviewUrl;

  return (
    <AppShell
      title="Compress PDF"
      description="Optimize PDF size directly in your browser"
      activeHref="/tools/compress"
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
                Upload one PDF, compress it, then download the result.
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

                {hasCompressedResult && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="text-sm font-semibold text-emerald-900">
                      Compression completed
                    </h3>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Original</p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Result</p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {formatFileSize(compressedSize)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Reduced</p>
                        <p className="mt-1 font-semibold text-emerald-700">
                          {reduction.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {compressedSize >= file.size && (
                      <p className="mt-3 text-xs leading-5 text-amber-700">
                        This PDF could not be reduced further with basic browser
                        optimization.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={
                hasCompressedResult ? downloadCompressedPdf : compressPdf
              }
              disabled={isProcessing || (!hasCompressedResult && !file)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Compressing...
                </>
              ) : hasCompressedResult ? (
                <>
                  <Download size={18} />
                  Download Compressed PDF
                </>
              ) : (
                <>
                  <Minimize2 size={18} />
                  Compress PDF
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {file ? formatFileSize(file.size) : "-"}
                </p>
                <p className="mt-1 text-slate-500">Original</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {compressedSize ? formatFileSize(compressedSize) : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-emerald-600">
                  {compressedSize ? `${reduction.toFixed(1)}%` : "-"}
                </p>
                <p className="mt-1 text-slate-500">Reduced</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Basic compression does not recompress embedded images. Some PDFs
              may not get smaller.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasCompressedResult
                    ? "Compressed preview"
                    : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasCompressedResult
                      ? "Compressed PDF is ready"
                      : file.name
                    : "No file selected"}
                </p>
              </div>
            </div>

            <div className="flex-1 bg-slate-50">
              {activePreviewUrl ? (
                <iframe
                  src={activePreviewUrl}
                  title={
                    hasCompressedResult
                      ? "Compressed PDF preview"
                      : "Original PDF preview"
                  }
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
