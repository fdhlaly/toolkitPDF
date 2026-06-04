"use client";

import { useEffect, useState } from "react";

const RegisterServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const handleControllerChange = () => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      window.location.reload();
    };

    const registerWorker = async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");

      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
          }
        });
      });

      await registration.update();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    window.addEventListener("load", () => {
      void registerWorker();
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, [isRefreshing]);

  const handleUpdate = () => {
    if (!waitingWorker) return;

    waitingWorker.postMessage({
      type: "SKIP_WAITING",
    });
  };

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            New version available
          </p>
          <p className="text-xs text-slate-500">
            Refresh to use the latest toolkitPDF update.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUpdate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default RegisterServiceWorker;
