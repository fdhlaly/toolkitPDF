"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  Clipboard,
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

export default function ExtractTextPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [pageCount, setPageCount] = useState(0);
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

  const resetExtractedResult = () => {
    setExtractedText("");
    setIsCopied(false);
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

      resetExtractedResult();
      setFile(selectedFile);
      setOriginalPreviewUrl(previewUrl);
      setPageCount(pdf.getPageCount());
    } catch {
      setError(
        "Failed to load PDF file. Make sure the file is valid and not password-protected.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const clearFile = () => {
    resetExtractedResult();

    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }

    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setError("");
  };

  const extractText = async () => {
    try {
      setError("");
      resetExtractedResult();

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      setIsProcessing(true);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
      });

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const textParts: string[] = [];

      setPageCount(totalPages);

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item) => {
            if ("str" in item && typeof item.str === "string") {
              return item.str;
            }

            return "";
          })
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        textParts.push(`--- Page ${pageNumber} ---\n${pageText}`);
      }

      const finalText = textParts.join("\n\n").trim();

      if (
        !finalText ||
        finalText.replace(/--- Page \d+ ---/g, "").trim() === ""
      ) {
        setError(
          "No readable text found. This PDF may be scanned or image-based. Use OCR PDF later.",
        );
        return;
      }

      setExtractedText(finalText);
    } catch {
      setError(
        "Failed to extract text. Make sure the PDF is valid and not password-protected.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = async () => {
    try {
      if (!extractedText) {
        setError("No extracted text to copy.");
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
      setError("No extracted text to download.");
      return;
    }

    const blob = new Blob([extractedText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const originalName = file.name.replace(/\.pdf$/i, "");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-text-toolkitPDF.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasExtractedText = Boolean(extractedText);

  return (
    <AppShell
      title="Extract Text"
      description="Extract selectable text from PDF files"
      activeHref="/tools/extract-text"
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
                Upload one text-based PDF, then extract the text.
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
                      {pageCount > 0
                        ? `Total pages: ${pageCount}`
                        : "Ready to extract"}
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
              </div>
            )}

            <button
              type="button"
              onClick={hasExtractedText ? downloadText : extractText}
              disabled={isProcessing || (!hasExtractedText && !file)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Extracting...
                </>
              ) : hasExtractedText ? (
                <>
                  <Download size={18} />
                  Download TXT
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Extract Text
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
                  {hasExtractedText ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Text</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-emerald-600">No</p>
                <p className="mt-1 text-slate-500">Upload</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              This tool only works for text-based PDFs. Scanned PDFs need OCR.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasExtractedText ? "Extracted text" : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasExtractedText
                      ? "Text extraction result is ready"
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
