"use client";

import { useEffect } from "react";

const RegisterServiceWorker = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const registerWorker = () => {
      void navigator.serviceWorker.register("/sw.js");
    };

    window.addEventListener("load", registerWorker);

    return () => {
      window.removeEventListener("load", registerWorker);
    };
  }, []);
  return null;
};

export default RegisterServiceWorker;
