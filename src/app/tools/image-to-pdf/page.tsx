"use client";

import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileImage,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type ImageFileItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type PageMode = "fit-image" | "a4-portrait" | "a4-landscape";

const A4_PORTRAIT = {
  width: 595.28,
  height: 841.89,
};

const A4_LANDSCAPE = {
  width: 841.89,
  height: 595.28,
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isSupportedImage = (file: File) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const fileName = file.name.toLowerCase();

  return (
    allowedTypes.includes(file.type) ||
    allowedExtensions.some((extension) => fileName.endsWith(extension))
  );
};

const convertImageToPngBytes = async (file: File) => {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to process image.");
  }

  context.drawImage(imageBitmap, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Failed to convert image."));
        return;
      }

      resolve(result);
    }, "image/png");
  });

  const arrayBuffer = await blob.arrayBuffer();

  return new Uint8Array(arrayBuffer);
};

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [pageMode, setPageMode] = useState<PageMode>("fit-image");
  const [margin, setMargin] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const imagesRef = useRef<ImageFileItem[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const imageFiles = selectedFiles.filter(isSupportedImage);

    if (imageFiles.length !== selectedFiles.length) {
      setError("Only JPG, PNG, and WebP images are allowed.");
    } else {
      setError("");
    }

    const mappedImages = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mappedImages]);
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const targetImage = prev.find((item) => item.id === id);

      if (targetImage) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const clearImages = () => {
    images.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
    });

    setImages([]);
    setError("");
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newImages.length) {
        return prev;
      }

      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];

      return newImages;
    });
  };

  const createPdfFromImages = async () => {
    try {
      setError("");

      if (images.length === 0) {
        setError("Please upload at least one image.");
        return;
      }

      setIsProcessing(true);

      const pdf = await PDFDocument.create();

      for (const item of images) {
        const fileName = item.file.name.toLowerCase();
        const isJpg =
          item.file.type === "image/jpeg" ||
          fileName.endsWith(".jpg") ||
          fileName.endsWith(".jpeg");
        const isPng =
          item.file.type === "image/png" || fileName.endsWith(".png");

        const imageBytes =
          isJpg || isPng
            ? new Uint8Array(await item.file.arrayBuffer())
            : await convertImageToPngBytes(item.file);

        const embeddedImage = isJpg
          ? await pdf.embedJpg(imageBytes)
          : await pdf.embedPng(imageBytes);

        let pageWidth = embeddedImage.width;
        let pageHeight = embeddedImage.height;

        if (pageMode === "a4-portrait") {
          pageWidth = A4_PORTRAIT.width;
          pageHeight = A4_PORTRAIT.height;
        }

        if (pageMode === "a4-landscape") {
          pageWidth = A4_LANDSCAPE.width;
          pageHeight = A4_LANDSCAPE.height;
        }

        const page = pdf.addPage([pageWidth, pageHeight]);

        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;

        const scale = Math.min(
          availableWidth / embeddedImage.width,
          availableHeight / embeddedImage.height,
        );

        const imageWidth =
          pageMode === "fit-image"
            ? embeddedImage.width
            : embeddedImage.width * scale;
        const imageHeight =
          pageMode === "fit-image"
            ? embeddedImage.height
            : embeddedImage.height * scale;

        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });
      }

      const pdfBytes = await pdf.save();

      const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
      const pdfView = new Uint8Array(pdfArrayBuffer);
      pdfView.set(pdfBytes);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "images-toolkitPDF.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to convert images to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
              Image to PDF
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Convert JPG, PNG, or WebP images into one PDF file. Arrange the
              image order before downloading.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 overflow-hidden px-4 py-8 sm:px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UploadCloud size={32} />
            </div>

            <h2 className="text-lg font-semibold text-slate-950">
              Upload images
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Select one or more images from your device.
            </p>

            <p className="mt-4 text-xs font-medium text-slate-400">
              JPG, PNG, WebP • Processed locally in your browser
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

          {images.length > 0 && (
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Selected images
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The PDF will follow this order.
                  </p>
                </div>

                <button
                  onClick={clearImages}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div
                      className="h-20 w-full shrink-0 rounded-xl bg-slate-100 bg-cover bg-center sm:w-20"
                      style={{ backgroundImage: `url(${item.previewUrl})` }}
                    />

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
                        onClick={() => moveImage(index, "up")}
                        disabled={index === 0}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp size={17} />
                      </button>

                      <button
                        onClick={() => moveImage(index, "down")}
                        disabled={index === images.length - 1}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown size={17} />
                      </button>

                      <button
                        onClick={() => removeImage(item.id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove image"
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

        <aside className="h-fit min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold text-slate-950">Image PDF summary</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Images selected</span>
              <span className="font-semibold text-slate-950">
                {images.length}
              </span>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-slate-500">Page size</span>

              <div className="mt-3 grid gap-2">
                {[
                  { label: "Fit to image", value: "fit-image" },
                  { label: "A4 Portrait", value: "a4-portrait" },
                  { label: "A4 Landscape", value: "a4-landscape" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPageMode(item.value as PageMode)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      pageMode === item.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <label
                htmlFor="margin"
                className="text-sm font-medium text-slate-500"
              >
                Margin: {margin}px
              </label>

              <input
                id="margin"
                type="range"
                min="0"
                max="72"
                value={margin}
                disabled={pageMode === "fit-image"}
                onChange={(event) => setMargin(Number(event.target.value))}
                className="mt-3 w-full disabled:opacity-40"
              />

              {pageMode === "fit-image" && (
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Margin is disabled when page size follows the image.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Upload to server</span>
              <span className="font-semibold text-emerald-600">No</span>
            </div>
          </div>

          <button
            onClick={createPdfFromImages}
            disabled={isProcessing || images.length === 0}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={18} />
                Convert & Download
              </>
            )}
          </button>

          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <FileImage size={16} className="mt-0.5 shrink-0" />
            <p>Each image will become one PDF page.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
