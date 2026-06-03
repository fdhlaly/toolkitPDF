"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";

type PdfPreviewModalProps = {
  file: File | null;
  onClose: () => void;
};

const PdfPreviewModal = ({ file, onClose }: PdfPreviewModalProps) => {
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    // Defer setting state to avoid synchronous setState inside the effect
    Promise.resolve().then(() => setFileUrl(objectUrl));

    return () => {
      URL.revokeObjectURL(objectUrl);
      setFileUrl("");
    };
  }, [file]);

  if (!file || !fileUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-950">
              Preview PDF
            </h2>
            <p className="truncate text-sm text-slate-500">{file.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <ExternalLink size={16} />
              Open
            </a>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Close preview"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          <iframe src={fileUrl} title="PDF Preview" className="h-full w-full" />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
