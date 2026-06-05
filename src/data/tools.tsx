import type { LucideIcon } from "lucide-react";
import {
  FilePlus2,
  Scissors,
  RotateCw,
  ArrowUpDown,
  Stamp,
  Hash,
  ImageIcon,
  ScanText,
  Lock,
  Unlock,
  Minimize2,
  FileText,
} from "lucide-react";

export type ToolStatus = "ready";

export type Tool = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: ToolStatus;
};

export const tools: Tool[] = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    href: "/tools/merge",
    icon: FilePlus2,
    status: "ready",
  },
  {
    title: "Split PDF",
    description: "Extract selected pages from a PDF file.",
    href: "/tools/split",
    icon: Scissors,
    status: "ready",
  },
  {
    title: "Rotate Pages",
    description: "Rotate all or selected PDF pages.",
    href: "/tools/rotate",
    icon: RotateCw,
    status: "ready",
  },
  {
    title: "Reorder Pages",
    description: "Rearrange PDF pages with a custom order.",
    href: "/tools/reorder",
    icon: ArrowUpDown,
    status: "ready",
  },
  {
    title: "Watermark PDF",
    description: "Add text watermark to PDF documents.",
    href: "/tools/watermark",
    icon: Stamp,
    status: "ready",
  },
  {
    title: "Page Numbers",
    description: "Add page numbers to PDF files.",
    href: "/tools/page-numbers",
    icon: Hash,
    status: "ready",
  },
  {
    title: "Image to PDF",
    description: "Convert images into one PDF file.",
    href: "/tools/image-to-pdf",
    icon: ImageIcon,
    status: "ready",
  },
  {
    title: "Extract Text",
    description: "Extract selectable text from PDF documents.",
    href: "/tools/extract-text",
    icon: FileText,
    status: "ready",
  },
  {
    title: "OCR PDF",
    description: "Read text from scanned PDF pages.",
    href: "/tools/ocr",
    icon: ScanText,
    status: "ready",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size for sharing.",
    href: "/tools/compress",
    icon: Minimize2,
    status: "ready",
  },
  {
    title: "Protect PDF",
    description: "Add password protection to PDF files.",
    href: "/tools/protect",
    icon: Lock,
    status: "ready",
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection from supported PDF files.",
    href: "/tools/unlock",
    icon: Unlock,
    status: "ready",
  },
];
