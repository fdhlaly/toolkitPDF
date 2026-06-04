"use client";

import PdfPreviewModal from "@/components/PdfPreviewModal";
import Link from "next/link";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  ArrowLeft,
  Eye,
  FileText,
  Hash,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

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
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [prefix, setPrefix] = useState("Page");
  const [showTotalPages, setShowTotalPages] = useState(true);
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
    setPosition("bottom-center");
    setFontSize(12);
    setStartNumber(1);
    setPrefix("Page");
    setShowTotalPages(true);
    setError("");
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

        const label = showTotalPages
          ? `${prefix.trim()} ${currentNumber} of ${pageCount}`
          : `${prefix.trim()} ${currentNumber}`;

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
      const url = URL.createObjectURL(blob);

      const originalName = file.name.replace(/\.pdf$/i, "");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${originalName}-page-numbers-toolkitPDF.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to add page numbers to PDF.");
    } finally {
      setIsProcessing(false);
    }
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
                Page Numbers
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Add page numbers to your PDF file. Choose position, font size,
                start number, and numbering format.
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
                        onChange={(event) => setPrefix(event.target.value)}
                        placeholder="Example: Page"
                        className="mt-2 block w-full max-w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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
                          setStartNumber(Number(event.target.value))
                        }
                        className="mt-2 block w-full max-w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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
                        setFontSize(Number(event.target.value))
                      }
                      className="mt-3 w-full"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={showTotalPages}
                      onChange={(event) =>
                        setShowTotalPages(event.target.checked)
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

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {positionOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setPosition(item.value)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
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
          </div>

          <aside className="h-fit min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">
              Page number summary
            </h2>

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
                <span className="text-slate-500">Position</span>
                <span className="font-semibold capitalize text-slate-950">
                  {position.replace("-", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={addPageNumbers}
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
                  <Hash size={18} />
                  Add Page Numbers & Download
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Page numbers will be added to all PDF pages.
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
