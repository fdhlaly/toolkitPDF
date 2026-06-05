"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  ArrowUpDown,
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

const parsePageOrder = (input: string, totalPages: number) => {
  const cleanedInput = input.replace(/\s/g, "");

  if (!cleanedInput) {
    throw new Error("Please enter the new page order.");
  }

  const pageIndexes: number[] = [];
  const parts = cleanedInput.split(",");

  for (const part of parts) {
    if (!part) continue;

    if (part.includes("-")) {
      const [startText, endText] = part.split("-");
      const start = Number(startText);
      const end = Number(endText);

      if (!start || !end) {
        throw new Error("Invalid page order format.");
      }

      if (start <= end) {
        for (let page = start; page <= end; page++) {
          if (page < 1 || page > totalPages) {
            throw new Error(`Page ${page} is outside the document range.`);
          }

          pageIndexes.push(page - 1);
        }
      } else {
        for (let page = start; page >= end; page--) {
          if (page < 1 || page > totalPages) {
            throw new Error(`Page ${page} is outside the document range.`);
          }

          pageIndexes.push(page - 1);
        }
      }
    } else {
      const page = Number(part);

      if (!page || page < 1 || page > totalPages) {
        throw new Error(`Page ${part} is outside the document range.`);
      }

      pageIndexes.push(page - 1);
    }
  }

  if (pageIndexes.length === 0) {
    throw new Error("Please enter a valid page order.");
  }

  return pageIndexes;
};

const createDefaultPageOrder = (totalPages: number) => {
  return Array.from({ length: totalPages }, (_, index) => index + 1).join(", ");
};

const createReversePageOrder = (totalPages: number) => {
  return Array.from(
    { length: totalPages },
    (_, index) => totalPages - index,
  ).join(", ");
};

export default function ReorderPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [reorderedPreviewUrl, setReorderedPreviewUrl] = useState("");
  const [reorderedBlob, setReorderedBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState("");
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
      if (reorderedPreviewUrl) {
        URL.revokeObjectURL(reorderedPreviewUrl);
      }
    };
  }, [reorderedPreviewUrl]);

  const resetReorderedResult = () => {
    setReorderedBlob(null);
    setReorderedPreviewUrl("");
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
      const totalPages = pdf.getPageCount();
      const previewUrl = URL.createObjectURL(selectedFile);

      resetReorderedResult();
      setFile(selectedFile);
      setOriginalPreviewUrl(previewUrl);
      setPageCount(totalPages);
      setPageOrder(createDefaultPageOrder(totalPages));
    } catch {
      setError(
        "Failed to read PDF file. Make sure the file is valid and not password-protected.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const clearFile = () => {
    resetReorderedResult();
    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setPageOrder("");
    setError("");
  };

  const reverseOrder = () => {
    if (!pageCount) return;

    resetReorderedResult();
    setPageOrder(createReversePageOrder(pageCount));
  };

  const resetOrder = () => {
    if (!pageCount) return;

    resetReorderedResult();
    setPageOrder(createDefaultPageOrder(pageCount));
  };

  const handlePageOrderChange = (value: string) => {
    resetReorderedResult();
    setPageOrder(value);
  };

  const reorderPdf = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      const selectedPageIndexes = parsePageOrder(pageOrder, pageCount);

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

      setReorderedBlob(blob);
      setReorderedPreviewUrl(previewUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reorder PDF pages.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReorderedPdf = () => {
    if (!reorderedBlob || !file) {
      setError("No reordered PDF available to download.");
      return;
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const url = URL.createObjectURL(reorderedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-reordered-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasReorderedResult = Boolean(reorderedBlob);
  const activePreviewUrl = reorderedPreviewUrl || originalPreviewUrl;

  return (
    <AppShell
      title="Reorder Pages"
      description="Rearrange PDF pages with a custom order"
      activeHref="/tools/reorder"
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
                Upload one PDF, edit page order, then reorder.
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
                    htmlFor="pageOrder"
                    className="text-sm font-semibold text-slate-950"
                  >
                    New page order
                  </label>

                  <textarea
                    id="pageOrder"
                    value={pageOrder}
                    onChange={(event) =>
                      handlePageOrderChange(event.target.value)
                    }
                    placeholder="Example: 3, 1, 2, 4-6"
                    rows={5}
                    className="mt-2 block w-full max-w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Example: 3, 1, 2 means page 3 becomes first. Use 5-1 to
                    reverse a range.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={resetOrder}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      Reset order
                    </button>

                    <button
                      type="button"
                      onClick={reverseOrder}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      Reverse order
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={hasReorderedResult ? downloadReorderedPdf : reorderPdf}
              disabled={
                isProcessing ||
                (!hasReorderedResult && (!file || !pageOrder.trim()))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Reordering...
                </>
              ) : hasReorderedResult ? (
                <>
                  <Download size={18} />
                  Download Reordered PDF
                </>
              ) : (
                <>
                  <ArrowUpDown size={18} />
                  Reorder PDF
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
                  {hasReorderedResult ? "Ready" : "-"}
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
                  {hasReorderedResult
                    ? "Reordered preview"
                    : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasReorderedResult
                      ? "Reordered PDF is ready"
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
                    hasReorderedResult
                      ? "Reordered PDF preview"
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
