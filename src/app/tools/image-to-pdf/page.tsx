"use client";

import AppShell from "@/components/AppShell";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
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
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
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

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const resetPdfResult = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    setPdfBlob(null);
    setPdfPreviewUrl("");
  };

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

    if (mappedImages.length === 0) {
      event.target.value = "";
      return;
    }

    resetPdfResult();
    setImages((prev) => [...prev, ...mappedImages]);
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    resetPdfResult();

    setImages((prev) => {
      const targetImage = prev.find((item) => item.id === id);

      if (targetImage) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const clearImages = () => {
    resetPdfResult();

    images.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
    });

    setImages([]);
    setError("");
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    resetPdfResult();

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

  const handlePageModeChange = (value: PageMode) => {
    resetPdfResult();
    setPageMode(value);
  };

  const handleMarginChange = (value: number) => {
    resetPdfResult();
    setMargin(value);
  };

  const createPdfFromImages = async () => {
    try {
      setError("");
      resetPdfResult();

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
      const previewUrl = URL.createObjectURL(blob);

      setPdfBlob(blob);
      setPdfPreviewUrl(previewUrl);
    } catch {
      setError("Failed to convert images to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfBlob) {
      setError("No PDF available to download.");
      return;
    }

    const url = URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "images-toolkitPDF.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const hasPdfResult = Boolean(pdfBlob);

  return (
    <AppShell
      title="Image to PDF"
      description="Convert JPG, PNG, or WebP images into one PDF"
      activeHref="/tools/image-to-pdf"
      showMobileBackLink
      contentClassName="flex-1 overflow-hidden"
    >
      <div className="grid h-full overflow-hidden lg:grid-cols-[420px_1fr]">
        <section className="overflow-y-auto border-b border-slate-200 p-4 md:p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-4">
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <UploadCloud size={26} />
              </div>

              <h2 className="text-sm font-semibold text-slate-950">
                Drop or select images
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add JPG, PNG, or WebP images, arrange them, then convert.
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

            {images.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                      Selected images
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      The PDF follows this order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearImages}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                </div>

                <div className="space-y-2">
                  {images.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="size-14 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${item.previewUrl})`,
                          }}
                        />

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
                          onClick={() => moveImage(index, "up")}
                          disabled={index === 0}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, "down")}
                          disabled={index === images.length - 1}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(item.id)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove image"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-950">
                PDF settings
              </h2>

              <div className="mt-4 grid gap-2">
                {[
                  { label: "Fit to image", value: "fit-image" },
                  { label: "A4 Portrait", value: "a4-portrait" },
                  { label: "A4 Landscape", value: "a4-landscape" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handlePageModeChange(item.value as PageMode)}
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

              <div className="mt-5">
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
                  onChange={(event) =>
                    handleMarginChange(Number(event.target.value))
                  }
                  className="mt-3 w-full disabled:opacity-40"
                />

                {pageMode === "fit-image" && (
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Margin is disabled when page size follows the image.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={hasPdfResult ? downloadPdf : createPdfFromImages}
              disabled={isProcessing || (!hasPdfResult && images.length === 0)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Converting...
                </>
              ) : hasPdfResult ? (
                <>
                  <Download size={18} />
                  Download PDF
                </>
              ) : (
                <>
                  <FileImage size={18} />
                  Convert to PDF
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">{images.length}</p>
                <p className="mt-1 text-slate-500">Images</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-950">
                  {hasPdfResult ? "Ready" : "-"}
                </p>
                <p className="mt-1 text-slate-500">Result</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-emerald-600">No</p>
                <p className="mt-1 text-slate-500">Upload</p>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Each image will become one PDF page.
            </p>
          </div>
        </section>

        <section className="min-h-130 bg-slate-100 p-4 md:p-5">
          <div className="flex h-full min-h-120 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">
                  {hasPdfResult ? "PDF preview" : "Image preview"}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {hasPdfResult
                    ? "Generated PDF is ready"
                    : images.length > 0
                      ? `${images.length} image(s) selected`
                      : "No image selected"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title="Generated PDF preview"
                  className="h-full min-h-105 w-full rounded-2xl border border-slate-200 bg-white"
                />
              ) : images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {images.map((item, index) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div
                        className="aspect-4/3 bg-slate-100 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${item.previewUrl})`,
                        }}
                      />

                      <div className="border-t border-slate-100 p-3">
                        <p className="truncate text-xs font-semibold text-slate-950">
                          {index + 1}. {item.file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-105 items-center justify-center p-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <FileImage size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      Image preview will appear here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Upload images to preview them automatically.
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
