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
  Minimize2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const calculateReduction = (originalSize: number, newSize: number) => {
  if (originalSize <= 0) return 0;

  return Math.max(0, ((originalSize - newSize) / originalSize) * 100);
};

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      setCompressedBlob(null);
      setCompressedSize(0);

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
    setCompressedBlob(null);
    setCompressedSize(0);
    setError("");
  };

  const compressPdf = async () => {
    try {
      setError("");
      setCompressedBlob(null);
      setCompressedSize(0);

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

      setCompressedBlob(blob);
      setCompressedSize(blob.size);

      const url = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.pdf$/i, "");

      const link = document.createElement("a");
      link.href = url;
      link.download = `${originalName}-compressed-toolkitPDF.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
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
                Compress PDF
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Optimize your PDF file size directly in the browser. Best for
                PDFs with compressible internal structure.
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

                {compressedBlob && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="font-semibold text-emerald-900">
                      Compression completed
                    </h3>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
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
                      <p className="mt-4 text-sm leading-6 text-amber-700">
                        This PDF could not be reduced further with basic browser
                        optimization. Image-heavy PDFs need advanced image
                        recompression.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={downloadCompressedPdf}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Download size={16} />
                      Download again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="h-fit min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">Compress summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">File selected</span>
                <span className="font-semibold text-slate-950">
                  {file ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Original size</span>
                <span className="font-semibold text-slate-950">
                  {file ? formatFileSize(file.size) : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Result size</span>
                <span className="font-semibold text-slate-950">
                  {compressedSize ? formatFileSize(compressedSize) : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={compressPdf}
              disabled={isProcessing || !file}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Minimize2 size={18} />
                  Compress & Download
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Basic compression does not recompress embedded images. Some PDFs
              may not get smaller.
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
