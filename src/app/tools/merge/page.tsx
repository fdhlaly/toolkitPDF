"use client";

import PdfPreviewModal from "@/components/PdfPreviewModal";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  Eye,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";

type PdfFileItem = {
  id: string;
  file: File;
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MergePdfPage() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    const pdfFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf"),
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setError("Only PDF files are allowed.");
    } else {
      setError("");
    }

    const mappedFiles = pdfFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));

    setFiles((prev) => [...prev, ...mappedFiles]);
    event.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
    setError("");
    setPreviewFile(null);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newFiles.length) {
        return prev;
      }

      [newFiles[index], newFiles[targetIndex]] = [
        newFiles[targetIndex],
        newFiles[index],
      ];

      return newFiles;
    });
  };

  const mergePdfFiles = async () => {
    try {
      setError("");

      if (files.length < 2) {
        setError("Please select at least 2 PDF files to merge.");
        return;
      }

      setIsMerging(true);

      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();

      const pdfArrayBuffer = new ArrayBuffer(mergedPdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(mergedPdfBytes);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "merged-toolkitPDF.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      setError(
        "Failed to merge PDF files. Make sure the files are valid and not password-protected.",
      );
    } finally {
      setIsMerging(false);
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
                Merge PDF
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Combine multiple PDF files into one document. Preview each file,
                arrange the file order first, then download the merged result.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UploadCloud size={32} />
              </div>

              <h2 className="text-lg font-semibold text-slate-950">
                Upload PDF files
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Click here to select multiple PDF files from your device.
              </p>

              <p className="mt-4 text-xs font-medium text-slate-400">
                PDF only • Processed locally in your browser
              </p>
            </label>

            {error && (
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>
                <button onClick={() => setError("")}>
                  <X size={18} />
                </button>
              </div>
            )}

            {files.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Selected files
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      The final PDF will follow this order.
                    </p>
                  </div>

                  <button
                    onClick={clearFiles}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>

                <div className="space-y-3">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-950">
                          {index + 1}. {item.file.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => setPreviewFile(item.file)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Preview file"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => moveFile(index, "up")}
                          disabled={index === 0}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp size={17} />
                        </button>

                        <button
                          onClick={() => moveFile(index, "down")}
                          disabled={index === files.length - 1}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown size={17} />
                        </button>

                        <button
                          onClick={() => removeFile(item.id)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove file"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-950">Merge summary</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Files selected</span>
                <span className="font-semibold text-slate-950">
                  {files.length}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Output</span>
                <span className="font-semibold text-slate-950">1 PDF</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Upload to server</span>
                <span className="font-semibold text-emerald-600">No</span>
              </div>
            </div>

            <button
              onClick={mergePdfFiles}
              disabled={isMerging || files.length < 2}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isMerging ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Merge & Download
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
