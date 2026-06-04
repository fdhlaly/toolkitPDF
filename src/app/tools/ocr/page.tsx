"use client";

import PdfPreviewModal from "@/components/PdfPreviewModal";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import {
  ArrowLeft,
  Clipboard,
  Download,
  Eye,
  FileText,
  Loader2,
  ScanText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

type PageMode = "all" | "custom";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
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

        pageSet.add(page);
      }
    } else {
      const page = Number(part);

      if (!page || page < 1 || page > totalPages) {
        throw new Error(`Page ${part} is outside the document range.`);
      }

      pageSet.add(page);
    }
  }

  return Array.from(pageSet).sort((a, b) => a - b);
};

export default function OcrPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageMode, setPageMode] = useState<PageMode>("all");
  const [pageRanges, setPageRanges] = useState("");
  const [language, setLanguage] = useState("eng");
  const [renderScale, setRenderScale] = useState(1.5);
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      setExtractedText("");
      setIsCopied(false);
      setCurrentPage(0);
      setProgress(0);

      const selectedFile = event.target.files?.[0];

      if (!selectedFile) return;

      const isPdf =
        selectedFile.type === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setError("Only PDF files are allowed.");
        return;
      }

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      setFile(selectedFile);
      setPageCount(pdf.getPageCount());
      setPageMode("all");
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
    setPageMode("all");
    setPageRanges("");
    setLanguage("eng");
    setRenderScale(1.5);
    setCurrentPage(0);
    setProgress(0);
    setExtractedText("");
    setIsCopied(false);
    setError("");
  };

  const runOcr = async () => {
    try {
      setError("");
      setExtractedText("");
      setIsCopied(false);
      setCurrentPage(0);
      setProgress(0);

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      setIsProcessing(true);

      const selectedPages =
        pageMode === "all"
          ? Array.from({ length: pageCount }, (_, index) => index + 1)
          : parsePageRanges(pageRanges, pageCount);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const { recognize } = await import("tesseract.js");

      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
      });

      const pdf = await loadingTask.promise;
      const textParts: string[] = [];

      for (let index = 0; index < selectedPages.length; index++) {
        const pageNumber = selectedPages[index];

        setCurrentPage(pageNumber);
        setProgress(Math.round((index / selectedPages.length) * 100));

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Failed to prepare OCR canvas.");
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const imageDataUrl = canvas.toDataURL("image/png");
        const result = await recognize(imageDataUrl, language);
        const pageText = result.data.text.trim();

        textParts.push(`--- Page ${pageNumber} ---\n${pageText}`);
      }

      setProgress(100);

      const finalText = textParts.join("\n\n").trim();

      if (
        !finalText ||
        finalText.replace(/--- Page \d+ ---/g, "").trim() === ""
      ) {
        setError("No text could be recognized from this PDF.");
        return;
      }

      setExtractedText(finalText);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to run OCR on PDF.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = async () => {
    try {
      if (!extractedText) {
        setError("No OCR text to copy.");
        return;
      }

      await navigator.clipboard.writeText(extractedText);
      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch {
      setError("Failed to copy text.");
    }
  };

  const downloadText = () => {
    if (!extractedText || !file) {
      setError("No OCR text to download.");
      return;
    }

    const blob = new Blob([extractedText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const originalName = file.name.replace(/\.pdf$/i, "");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-ocr-toolkitPDF.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
                OCR PDF
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Extract text from scanned or image-based PDF files using OCR.
                Select all pages or only specific page ranges.
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
                  Upload scanned PDF
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Select one scanned or image-based PDF file from your device.
                </p>

                <p className="mt-4 text-xs font-medium text-slate-400">
                  PDF only • OCR processed in your browser
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
                      Total pages: {pageCount}
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

                <div className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-950">
                        OCR language
                      </label>

                      <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="eng">English</option>
                        <option value="ind">Indonesian</option>
                        <option value="eng+ind">English + Indonesian</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="renderScale"
                        className="text-sm font-semibold text-slate-950"
                      >
                        OCR quality: {renderScale.toFixed(1)}x
                      </label>

                      <input
                        id="renderScale"
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.5"
                        value={renderScale}
                        onChange={(event) =>
                          setRenderScale(Number(event.target.value))
                        }
                        className="mt-3 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-950">
                      Pages
                    </label>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPageMode("all")}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          pageMode === "all"
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        All pages
                      </button>

                      <button
                        type="button"
                        onClick={() => setPageMode("custom")}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          pageMode === "custom"
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {pageMode === "custom" && (
                    <div>
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
                        className="mt-2 block w-full max-w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        OCR can be slow. For large PDFs, process only selected
                        pages first.
                      </p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-900">
                          Processing page {currentPage || "-"}
                        </span>
                        <span className="font-semibold text-blue-700">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {extractedText && (
                    <div>
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            OCR result
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            You can copy or download the recognized text.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={copyText}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <Clipboard size={16} />
                            {isCopied ? "Copied" : "Copy"}
                          </button>

                          <button
                            type="button"
                            onClick={downloadText}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                          >
                            <Download size={16} />
                            Download TXT
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={extractedText}
                        readOnly
                        rows={16}
                        className="block w-full max-w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">OCR summary</h2>

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
                <span className="text-slate-500">Language</span>
                <span className="font-semibold uppercase text-slate-950">
                  {language}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={runOcr}
              disabled={isProcessing || !file}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running OCR...
                </>
              ) : (
                <>
                  <ScanText size={18} />
                  Run OCR
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              OCR is heavier than normal text extraction. Large PDFs may take
              longer to process.
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
