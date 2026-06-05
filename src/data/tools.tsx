export type ToolStatus = "ready";

export type Tool = {
  title: string;
  description: string;
  href: string;
  status: ToolStatus;
};

export const tools: Tool[] = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    href: "/tools/merge",
    status: "ready",
  },
  {
    title: "Split PDF",
    description: "Extract selected pages from a PDF file.",
    href: "/tools/split",
    status: "ready",
  },
  {
    title: "Rotate Pages",
    description: "Rotate all or selected PDF pages.",
    href: "/tools/rotate",
    status: "ready",
  },
  {
    title: "Reorder Pages",
    description: "Rearrange PDF pages with a custom order.",
    href: "/tools/reorder",
    status: "ready",
  },
  {
    title: "Watermark PDF",
    description: "Add text watermark to PDF documents.",
    href: "/tools/watermark",
    status: "ready",
  },
  {
    title: "Page Numbers",
    description: "Add page numbers to PDF files.",
    href: "/tools/page-numbers",
    status: "ready",
  },
  {
    title: "Image to PDF",
    description: "Convert images into one PDF file.",
    href: "/tools/image-to-pdf",
    status: "ready",
  },
  {
    title: "Extract Text",
    description: "Extract selectable text from PDF documents.",
    href: "/tools/extract-text",
    status: "ready",
  },
  {
    title: "OCR PDF",
    description: "Read text from scanned PDF pages.",
    href: "/tools/ocr",
    status: "ready",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size for sharing.",
    href: "/tools/compress",
    status: "ready",
  },
  {
    title: "Protect PDF",
    description: "Add password protection to PDF files.",
    href: "/tools/protect",
    status: "ready",
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection from supported PDF files.",
    href: "/tools/unlock",
    status: "ready",
  },
];
