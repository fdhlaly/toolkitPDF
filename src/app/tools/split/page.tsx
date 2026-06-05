"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const parsePageRanges = (input: string, totalPages: number) => {
  const cleanedInput = input.replace(/\s/g, "");

  if (!cleanedInput) {
    throw new Error("Please enter page ranges.");
  }

  const pageSet = new Set<number>();
  const parts = cleanedInput.split(",");

  for (const part of parts) {
    if (!part) continue;

    if (part.includes("-")) {
      const [startText, endText] = part.split("-");
      const start = Number(startText);
      const end = Number(endText);

      if (!start || !end || start > end) {
        throw new Error("Invalid page range format.");
      }

      for (let page = start; page <= end; page++) {
        if (page < 1 || page > totalPages) {
          throw new Error(`Page ${page} is outside the document range.`);
        }

        pageSet.add(page - 1);
      }
    } else {
      const page = Number(part);

      if (!page || page < 1 || page > totalPages) {
        throw new Error(`Page ${part} is outside the document range.`);
      }

      pageSet.add(page - 1);
    }
  }

  return Array.from(pageSet).sort((a, b) => a - b);
};

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl] = useState("");
  const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);
  const [extractedPreviewUrl, setExtractedPreviewUrl] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pageRanges, setPageRanges] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    };
  }, [originalPreviewUrl]);

  useEffect(() => {
    return () => {
      if (extractedPreviewUrl) {
        URL.revokeObjectURL(extractedPreviewUrl);
      }
    };
  }, [extractedPreviewUrl]);

  const resetExtractedResult = () => {
    if (extractedPreviewUrl) {
      URL.revokeObjectURL(extractedPreviewUrl);
    }

    setExtractedBlob(null);
    setExtractedPreviewUrl("");
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

      resetExtractedResult();
      setFile(selectedFile);
      setPageCount(pdf.getPageCount());
      setPageRanges("");
    } catch {
      setError(
        "Failed to read PDF file. Make sure the file is valid and not password-protected.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const clearFile = () => {
    resetExtractedResult();
    setFile(null);
    setPageCount(0);
    setPageRanges("");
    setError("");
  };

  const handlePageRangesChange = (value: string) => {
    resetExtractedResult();
    setPageRanges(value);
  };

  const extractPages = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      const selectedPageIndexes = parsePageRanges(pageRanges, pageCount);

      if (selectedPageIndexes.length === 0) {
        setError("Please enter valid page ranges.");
        return;
      }

      setIsProcessing(true);

      const sourceArrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceArrayBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(
        sourcePdf,
        selectedPageIndexes,
      );

      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();

      const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(pdfBytes);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);

      setExtractedBlob(blob);
      setExtractedPreviewUrl(previewUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to extract pages from PDF.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExtractedPdf = () => {
    if (!extractedBlob || !file) return;

    const originalName = file.name.replace(/\.pdf$/i, "");
    const url = URL.createObjectURL(extractedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-extracted-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const activePreviewUrl = extractedPreviewUrl || originalPreviewUrl;
  const hasExtractedResult = Boolean(extractedBlob);

  return (
    <AppShell
      title="Split PDF"
      description="Extract selected pages from one PDF"
      activeHref="/tools/split"
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
                Upload one PDF, enter page ranges, then extract.
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

                <div className="mt-5">
                  <label
                    htmlFor="pageRanges"
                    className="text-sm font-semibold text-slate-950"
                  >
                    Page ranges
                  </label>

                  <input
                    id="pageRanges"
                    type="text"
                    value={pageRanges}
                    onChange={(event) =>
                      handlePageRangesChange(event.target.value)
                    }
                    placeholder="Example: 1-3, 5, 8-10"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Use comma for separate pages and dash for ranges.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={hasExtractedResult ? downloadExtractedPdf : extractPages}
              disabled={
                isProcessing ||
                (!hasExtractedResult && (!file || !pageRanges.trim()))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Extracting...
                </>
              ) : hasExtractedResult ? (
                <>
                  <Download size={18} />
                  Download Extracted PDF
                </>
              ) : (
                <>
                  <Download size={18} />
                  Extract Pages
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
                <p className="font-semibold text-slate-950">
                  {hasExtractedResult ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-emerald-600">No</p>
                <p className="mt-1 text-slate-500">Upload</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Password-protected or corrupted PDF files may fail to process.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasExtractedResult
                    ? "Extracted preview"
                    : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasExtractedResult
                      ? "Extracted PDF is ready"
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
                    hasExtractedResult
                      ? "Extracted PDF preview"
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
