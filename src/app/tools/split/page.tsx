"use client";

import PdfPreviewModal from "@/components/PdfPreviewModal";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

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
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRanges, setPageRanges] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");

      const selectedFile = event.target.files?.[0];

      if (!selectedFile) return;

      const isPdf =
        selectedFile.type === "application/pdf" ||
        selectedFile.name.endsWith(".pdf");

      if (!isPdf) {
        setError("Only PDF files are allowed.");
        return;
      }

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

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
    setFile(null);
    setPreviewFile(null);
    setPageCount(0);
    setPageRanges("");
    setError("");
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
      const url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.pdf$/i, "");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${originalName}-extracted-toolkitPDF.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
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

  return (
    <>
      <main className="min-h-screen bg-slate-50">
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
                Split PDF
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Extract selected pages from one PDF file. Use page ranges like
                1-3, 5, 8-10.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
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
                  Upload PDF file
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Select one PDF file from your device.
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
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Selected file
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Total pages: {pageCount}
                    </p>
                  </div>

                  <button
                    onClick={clearFile}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
                    htmlFor="pageRanges"
                    className="text-sm font-semibold text-slate-950"
                  >
                    Page ranges
                  </label>

                  <input
                    id="pageRanges"
                    type="text"
                    value={pageRanges}
                    onChange={(event) => setPageRanges(event.target.value)}
                    placeholder="Example: 1-3, 5, 8-10"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Use comma for separate pages and dash for ranges. Example:
                    1-3, 5, 8-10.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">Split summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">File selected</span>
                <span className="font-semibold text-slate-950">
                  {file ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Total pages</span>
                <span className="font-semibold text-slate-950">
                  {pageCount || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={extractPages}
              disabled={isProcessing || !file}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Extract & Download
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Password-protected or corrupted PDF files may fail to process.
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
