"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  Clipboard,
  Download,
  FileText,
  Loader2,
  ScanText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

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
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
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

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    };
  }, [originalPreviewUrl]);

  const resetOcrResult = () => {
    setExtractedText("");
    setIsCopied(false);
    setCurrentPage(0);
    setProgress(0);
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

      resetOcrResult();
      setFile(selectedFile);
      setOriginalPreviewUrl(previewUrl);
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
    resetOcrResult();
    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setPageMode("all");
    setPageRanges("");
    setLanguage("eng");
    setRenderScale(1.5);
    setError("");
  };

  const handleLanguageChange = (value: string) => {
    resetOcrResult();
    setLanguage(value);
  };

  const handleRenderScaleChange = (value: number) => {
    resetOcrResult();
    setRenderScale(value);
  };

  const handlePageModeChange = (value: PageMode) => {
    resetOcrResult();
    setPageMode(value);
  };

  const handlePageRangesChange = (value: string) => {
    resetOcrResult();
    setPageRanges(value);
  };

  const runOcr = async () => {
    try {
      setError("");
      resetOcrResult();

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

  const hasExtractedText = Boolean(extractedText);

  return (
    <AppShell
      title="OCR PDF"
      description="Extract text from scanned or image-based PDFs"
      activeHref="/tools/ocr"
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
                Drop or select scanned PDF
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Upload one scanned PDF, choose OCR settings, then run OCR.
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
                    <label className="text-sm font-semibold text-slate-950">
                      OCR language
                    </label>

                    <select
                      value={language}
                      onChange={(event) =>
                        handleLanguageChange(event.target.value)
                      }
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
                        handleRenderScaleChange(Number(event.target.value))
                      }
                      className="mt-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-950">
                      Pages
                    </label>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageModeChange("all")}
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
                        onClick={() => handlePageModeChange("custom")}
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
                        onChange={(event) =>
                          handlePageRangesChange(event.target.value)
                        }
                        placeholder="Example: 1-3, 5, 8-10"
                        className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        OCR can be slow. For large PDFs, process selected pages
                        first.
                      </p>
                    </div>
                  )}
                </div>
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

            <button
              type="button"
              onClick={hasExtractedText ? downloadText : runOcr}
              disabled={
                isProcessing ||
                (!hasExtractedText &&
                  (!file || (pageMode === "custom" && !pageRanges.trim())))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running OCR...
                </>
              ) : hasExtractedText ? (
                <>
                  <Download size={18} />
                  Download TXT
                </>
              ) : (
                <>
                  <ScanText size={18} />
                  Run OCR
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
                <p className="font-semibold uppercase text-slate-950">
                  {language}
                </p>
                <p className="mt-1 text-slate-500">Lang</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {hasExtractedText ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Text</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              OCR is heavier than normal text extraction. Large PDFs may take
              longer to process.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasExtractedText ? "OCR result" : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasExtractedText
                      ? "OCR text is ready"
                      : file.name
                    : "No file selected"}
                </p>
              </div>

              {hasExtractedText && (
                <button
                  type="button"
                  onClick={copyText}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <Clipboard size={15} />
                  {isCopied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-50">
              {hasExtractedText ? (
                <textarea
                  value={extractedText}
                  readOnly
                  className="h-full min-h-105 w-full resize-none border-0 bg-white p-5 text-sm leading-6 text-slate-700 outline-none"
                />
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
