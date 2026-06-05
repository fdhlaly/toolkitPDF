"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import {
  Download,
  FileText,
  Loader2,
  Stamp,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

type WatermarkPosition = "center" | "diagonal" | "bottom";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function WatermarkPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const [watermarkedPreviewUrl, setWatermarkedPreviewUrl] = useState("");
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2);
  const [position, setPosition] = useState<WatermarkPosition>("diagonal");
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
      if (watermarkedPreviewUrl) {
        URL.revokeObjectURL(watermarkedPreviewUrl);
      }
    };
  }, [watermarkedPreviewUrl]);

  const resetWatermarkedResult = () => {
    setWatermarkedBlob(null);
    setWatermarkedPreviewUrl("");
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

      resetWatermarkedResult();
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
    resetWatermarkedResult();
    setFile(null);
    setOriginalPreviewUrl("");
    setPageCount(0);
    setWatermarkText("CONFIDENTIAL");
    setFontSize(48);
    setOpacity(0.2);
    setPosition("diagonal");
    setError("");
  };

  const handleWatermarkTextChange = (value: string) => {
    resetWatermarkedResult();
    setWatermarkText(value);
  };

  const handleFontSizeChange = (value: number) => {
    resetWatermarkedResult();
    setFontSize(value);
  };

  const handleOpacityChange = (value: number) => {
    resetWatermarkedResult();
    setOpacity(value);
  };

  const handlePositionChange = (value: WatermarkPosition) => {
    resetWatermarkedResult();
    setPosition(value);
  };

  const addWatermark = async () => {
    try {
      setError("");

      if (!file) {
        setError("Please upload a PDF file first.");
        return;
      }

      if (!watermarkText.trim()) {
        setError("Please enter watermark text.");
        return;
      }

      setIsProcessing(true);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const text = watermarkText.trim();
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        if (position === "center") {
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(0.45, 0.45, 0.45),
            opacity,
          });
        }

        if (position === "diagonal") {
          page.drawText(text, {
            x: width * 0.12,
            y: height * 0.35,
            size: fontSize,
            font,
            color: rgb(0.45, 0.45, 0.45),
            opacity,
            rotate: degrees(35),
          });
        }

        if (position === "bottom") {
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: 40,
            size: fontSize,
            font,
            color: rgb(0.45, 0.45, 0.45),
            opacity,
          });
        }
      });

      const pdfBytes = await pdf.save();

      const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(pdfBytes);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);

      setWatermarkedBlob(blob);
      setWatermarkedPreviewUrl(previewUrl);
    } catch {
      setError("Failed to add watermark to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadWatermarkedPdf = () => {
    if (!watermarkedBlob || !file) {
      setError("No watermarked PDF available to download.");
      return;
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const url = URL.createObjectURL(watermarkedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${originalName}-watermarked-toolkitPDF.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasWatermarkedResult = Boolean(watermarkedBlob);
  const activePreviewUrl = watermarkedPreviewUrl || originalPreviewUrl;

  return (
    <AppShell
      title="Watermark PDF"
      description="Add text watermark to all PDF pages"
      activeHref="/tools/watermark"
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
                Upload one PDF, set watermark options, then apply.
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
                      htmlFor="watermarkText"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Watermark text
                    </label>

                    <input
                      id="watermarkText"
                      type="text"
                      value={watermarkText}
                      onChange={(event) =>
                        handleWatermarkTextChange(event.target.value)
                      }
                      placeholder="Example: CONFIDENTIAL"
                      className="mt-2 block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
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
                      min="16"
                      max="96"
                      value={fontSize}
                      onChange={(event) =>
                        handleFontSizeChange(Number(event.target.value))
                      }
                      className="mt-3 w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="opacity"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Opacity: {Math.round(opacity * 100)}%
                    </label>

                    <input
                      id="opacity"
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={opacity}
                      onChange={(event) =>
                        handleOpacityChange(Number(event.target.value))
                      }
                      className="mt-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-950">
                      Position
                    </label>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        { label: "Diagonal", value: "diagonal" },
                        { label: "Center", value: "center" },
                        { label: "Bottom", value: "bottom" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            handlePositionChange(
                              item.value as WatermarkPosition,
                            )
                          }
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
              onClick={
                hasWatermarkedResult ? downloadWatermarkedPdf : addWatermark
              }
              disabled={
                isProcessing ||
                (!hasWatermarkedResult && (!file || !watermarkText.trim()))
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Applying...
                </>
              ) : hasWatermarkedResult ? (
                <>
                  <Download size={18} />
                  Download Watermarked PDF
                </>
              ) : (
                <>
                  <Stamp size={18} />
                  Add Watermark
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
                  {position}
                </p>
                <p className="mt-1 text-slate-500">Position</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {hasWatermarkedResult ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Watermark will be added to all PDF pages.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasWatermarkedResult
                    ? "Watermarked preview"
                    : "Original preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {file
                    ? hasWatermarkedResult
                      ? "Watermarked PDF is ready"
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
                    hasWatermarkedResult
                      ? "Watermarked PDF preview"
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
