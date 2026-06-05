type QpdfRuntime = {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
  };
  callMain: (args: string[]) => number | void;
};

type QpdfFactoryOptions = {
  locateFile: (path: string) => string;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
};

type QpdfFactory = (options: QpdfFactoryOptions) => Promise<unknown>;

type RunQpdfOptions = {
  inputBytes: Uint8Array;
  buildArgs: (paths: { inputPath: string; outputPath: string }) => string[];
};

let qpdfPromise: Promise<QpdfRuntime> | null = null;

const runWithMutedConsole = async <T>(callback: () => Promise<T> | T) => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  try {
    console.error = () => undefined;
    console.warn = () => undefined;
    console.log = () => undefined;

    return await callback();
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  }
};

const runSilently = <T>(callback: () => T) => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  try {
    console.error = () => undefined;
    console.warn = () => undefined;
    console.log = () => undefined;

    return callback();
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  }
};

export const getQpdfModule = async () => {
  if (!qpdfPromise) {
    qpdfPromise = runWithMutedConsole(async () => {
      const qpdfModule = await import("@neslinesli93/qpdf-wasm");
      const createQpdf = qpdfModule.default as unknown as QpdfFactory;

      const qpdf = await createQpdf({
        locateFile: (path: string) => {
          if (path.endsWith(".wasm")) {
            return "/wasm/qpdf.wasm";
          }

          return path;
        },
        print: () => undefined,
        printErr: () => undefined,
      });

      return qpdf as QpdfRuntime;
    });
  }

  return qpdfPromise;
};

const safeUnlink = (qpdf: QpdfRuntime, path: string) => {
  try {
    qpdf.FS.unlink(path);
  } catch {}
};

export const runQpdf = async ({ inputBytes, buildArgs }: RunQpdfOptions) => {
  const qpdf = await getQpdfModule();
  const id = crypto.randomUUID().replaceAll("-", "");

  const inputPath = `/input-${id}.pdf`;
  const outputPath = `/output-${id}.pdf`;

  qpdf.FS.writeFile(inputPath, inputBytes);

  try {
    const exitCode = runSilently(() =>
      qpdf.callMain(buildArgs({ inputPath, outputPath })),
    );

    if (typeof exitCode === "number" && exitCode !== 0) {
      throw new Error("PDF processing failed.");
    }

    return qpdf.FS.readFile(outputPath);
  } finally {
    safeUnlink(qpdf, inputPath);
    safeUnlink(qpdf, outputPath);
  }
};

export const createPdfBlobFromBytes = (bytes: Uint8Array) => {
  const pdfArrayBuffer = new ArrayBuffer(bytes.byteLength);
  const pdfView = new Uint8Array(pdfArrayBuffer);

  pdfView.set(bytes);

  return new Blob([pdfArrayBuffer], {
    type: "application/pdf",
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
