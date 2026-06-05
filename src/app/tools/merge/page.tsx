"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

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
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (mergedPreviewUrl) {
        URL.revokeObjectURL(mergedPreviewUrl);
      }
    };
  }, [mergedPreviewUrl]);

  const resetMergedResult = () => {
    setMergedBlob(null);
    setMergedPreviewUrl("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
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

    if (mappedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    resetMergedResult();
    setFiles((prev) => [...prev, ...mappedFiles]);
    event.target.value = "";
  };

  const removeFile = (id: string) => {
    resetMergedResult();
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearFiles = () => {
    resetMergedResult();
    setFiles([]);
    setError("");
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

      resetMergedResult();
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
      const previewUrl = URL.createObjectURL(blob);

      setMergedBlob(blob);
      setMergedPreviewUrl(previewUrl);
    } catch {
      setError(
        "Failed to merge PDF files. Make sure the files are valid and not password-protected.",
      );
    } finally {
      setIsMerging(false);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedBlob) return;

    const url = URL.createObjectURL(mergedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "merged-toolkitPDF.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Merge PDF"
      description="Combine multiple PDFs into one file"
      activeHref="/tools/merge"
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
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <UploadCloud size={26} />
              </div>

              <h2 className="text-sm font-semibold text-slate-950">
                Drop or select PDFs
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add two or more PDF files, arrange them, then merge.
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

            {files.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                      Selected files
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Final PDF follows this order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearFiles}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                </div>

                <div className="space-y-2">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <FileText size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {index + 1}. {item.file.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatFileSize(item.file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => moveFile(index, "up")}
                          disabled={index === 0}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFile(index, "down")}
                          disabled={index === files.length - 1}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={mergedBlob ? downloadMergedPdf : mergePdfFiles}
              disabled={isMerging || (!mergedBlob && files.length < 2)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isMerging ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Merging...
                </>
              ) : mergedBlob ? (
                <>
                  <Download size={18} />
                  Download Merged PDF
                </>
              ) : (
                <>
                  <Download size={18} />
                  Merge PDF
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">{files.length}</p>
                <p className="mt-1 text-slate-500">Files</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {mergedBlob ? "Ready" : "-"}
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
                  Merged preview
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {mergedBlob ? "Merged PDF is ready" : "No merged PDF yet"}
                </p>
              </div>
            </div>

            <div className="flex-1 bg-slate-50">
              {mergedPreviewUrl ? (
                <iframe
                  src={mergedPreviewUrl}
                  title="Merged PDF preview"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full min-h-105 items-center justify-center p-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <FileText size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      Merged PDF preview will appear here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add at least two PDF files, arrange them, then click Merge
                      PDF.
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
