"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Download,
  FileText,
  Hash,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

type PageNumberPosition =
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-left"
  | "top-center"
  | "top-right";

const positionOptions: { label: string; value: PageNumberPosition }[] = [
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Center", value: "bottom-center" },
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Top Left", value: "top-left" },
  { label: "Top Center", value: "top-center" },
  { label: "Top Right", value: "top-right" },
];

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getPageNumberCoordinates = ({
  position,
  pageWidth,
  pageHeight,
  textWidth,
  margin,
}: {
  position: PageNumberPosition;
  pageWidth: number;
  pageHeight: number;
  textWidth: number;
  margin: number;
}) => {
  const isTop = position.startsWith("top");
  const y = isTop ? pageHeight - margin : margin;

  if (position.endsWith("left")) {
    return { x: margin, y };
  }

  if (position.endsWith("right")) {
    return { x: pageWidth - textWidth - margin, y };
  }

  return { x: (pageWidth - textWidth) / 2, y };
};

export default function PageNumbersPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [numberedPreviewUrl, setNumberedPreviewUrl] = useState("");
  const [numberedBlob, setNumberedBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [prefix, setPrefix] = useState("Page");
  const [showTotalPages, setShowTotalPages] = useState(true);
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
      if (numberedPreviewUrl) {
        URL.revokeObjectURL(numberedPreviewUrl);
      }
    };
  }, [numberedPreviewUrl]);

  const resetNumberedResult = () => {
    setNumberedBlob(null);
    setNumberedPreviewUrl("");
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

      resetNumberedResult();
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
    resetNumberedResult();
    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setPosition("bottom-center");
    setFontSize(12);
    setStartNumber(1);
    setPrefix("Page");
    setShowTotalPages(true);
    setError("");
  };

  const handlePrefixChange = (value: string) => {
    resetNumberedResult();
    setPrefix(value);
  };

  const handleStartNumberChange = (value: number) => {
    resetNumberedResult();
    setStartNumber(value);
  };

  const handleFontSizeChange = (value: number) => {
    resetNumberedResult();
    setFontSize(value);
  };

  const handleShowTotalPagesChange = (value: boolean) => {
    resetNumberedResult();
    setShowTotalPages(value);
  };

  const handlePositionChange = (value: PageNumberPosition) => {
    resetNumberedResult();
    setPosition(value);
  };

  const addPageNumbers = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      if (startNumber < 1) {
        setError("Start number must be at least 1.");
        return;
      }

      setIsProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const currentNumber = startNumber + index;
        const cleanPrefix = prefix.trim();

        const label = showTotalPages
          ? `${cleanPrefix} ${currentNumber} of ${pageCount}`.trim()
          : `${cleanPrefix} ${currentNumber}`.trim();

        const textWidth = font.widthOfTextAtSize(label, fontSize);

        const { x, y } = getPageNumberCoordinates({
          position,
          pageWidth: width,
          pageHeight: height,
          textWidth,
          margin: 36,
        });

        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
      });

      const pdfBytes = await pdf.save();

      const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(pdfBytes);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);

      setNumberedBlob(blob);
      setNumberedPreviewUrl(previewUrl);
    } catch {
      setError("Failed to add page numbers to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadNumberedPdf = () => {
    if (!numberedBlob || !file) {
      setError("No page numbered PDF available to download.");
      return;
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const url = URL.createObjectURL(numberedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-page-numbers-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasNumberedResult = Boolean(numberedBlob);
  const activePreviewUrl = numberedPreviewUrl || originalPreviewUrl;

  return (
    <AppShell
      title="Page Numbers"
      description="Add page numbers to your PDF"
      activeHref="/tools/page-numbers"
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
                Upload one PDF, set numbering options, then apply.
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="prefix"
                        className="text-sm font-semibold text-slate-950"
                      >
                        Prefix
                      </label>

                      <input
                        id="prefix"
                        type="text"
                        value={prefix}
                        onChange={(event) =>
                          handlePrefixChange(event.target.value)
                        }
                        placeholder="Example: Page"
                        className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="startNumber"
                        className="text-sm font-semibold text-slate-950"
                      >
                        Start number
                      </label>

                      <input
                        id="startNumber"
                        type="number"
                        min="1"
                        value={startNumber}
                        onChange={(event) =>
                          handleStartNumberChange(Number(event.target.value))
                        }
                        className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="fontSize"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Font size: {fontSize}px
                    </label>

                    <input
                      id="fontSize"
                      type="range"
                      min="8"
                      max="32"
                      value={fontSize}
                      onChange={(event) =>
                        handleFontSizeChange(Number(event.target.value))
                      }
                      className="mt-3 w-full"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={showTotalPages}
                      onChange={(event) =>
                        handleShowTotalPagesChange(event.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      Show total pages, example: Page 1 of {pageCount}
                    </span>
                  </label>

                  <div>
                    <label className="text-sm font-semibold text-slate-950">
                      Position
                    </label>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {positionOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handlePositionChange(item.value)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                            position === item.value
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={hasNumberedResult ? downloadNumberedPdf : addPageNumbers}
              disabled={
                isProcessing ||
                (!hasNumberedResult && (!file || startNumber < 1))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Applying...
                </>
              ) : hasNumberedResult ? (
                <>
                  <Download size={18} />
                  Download Numbered PDF
                </>
              ) : (
                <>
                  <Hash size={18} />
                  Add Page Numbers
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
                <p className="font-semibold capitalize text-slate-950">
                  {position.replace("-", " ")}
                </p>
                <p className="mt-1 text-slate-500">Position</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {hasNumberedResult ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Page numbers will be added to all PDF pages.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasNumberedResult ? "Numbered preview" : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasNumberedResult
                      ? "Page numbered PDF is ready"
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
                    hasNumberedResult
                      ? "Page numbered PDF preview"
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
