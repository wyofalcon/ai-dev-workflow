import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const WebLlmContext = createContext(null);

export const DEFAULT_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

export function WebLlmProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Model loading state
  const [isGenerating, setIsGenerating] = useState(false); // Inference state
  const [progress, setProgress] = useState(null); // { text: string, progress: number }
  const [error, setError] = useState(null);
  
  const workerRef = useRef(null);
  const responseCallbacksRef = useRef({
    onUpdate: null,
    onDone: null,
    onError: null
  });

  useEffect(() => {
    // Initialize Worker
    // Note: We use the webpack-specific syntax for CRA 5
    const worker = new Worker(
      new URL("../workers/llm.worker.js", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case "PROGRESS":
          setProgress(payload); // payload is like { text: "Loading...", progress: 0.5 }
          break;
        case "READY":
          setIsReady(true);
          setIsLoading(false);
          setProgress(null);
          break;
        case "UPDATE":
          if (responseCallbacksRef.current.onUpdate) {
            responseCallbacksRef.current.onUpdate(payload);
          }
          break;
        case "DONE":
          setIsGenerating(false);
          if (responseCallbacksRef.current.onDone) {
            responseCallbacksRef.current.onDone(payload);
          }
          break;
        case "ERROR":
          setIsLoading(false);
          setIsGenerating(false);
          setError(payload);
          if (responseCallbacksRef.current.onError) {
            responseCallbacksRef.current.onError(payload);
          }
          break;
        default:
          break;
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const initializeModel = useCallback((modelId = DEFAULT_MODEL) => {
    if (!workerRef.current) return;
    setIsLoading(true);
    setError(null);
    workerRef.current.postMessage({
      type: "INIT",
      payload: { modelId }
    });
  }, []);

  const generate = useCallback((messages, onUpdate, onDone, onError) => {
    if (!workerRef.current || !isReady) {
      onError?.("Model not ready");
      return;
    }

    setIsGenerating(true);
    
    // Store callbacks for this generation request
    responseCallbacksRef.current = {
      onUpdate,
      onDone,
      onError
    };

    workerRef.current.postMessage({
      type: "GENERATE",
      payload: { messages }
    });
  }, [isReady]);

  const resetChat = useCallback(() => {
     if(workerRef.current) {
        workerRef.current.postMessage({ type: "RESET" });
     }
  }, []);

  return (
    <WebLlmContext.Provider
      value={{
        isReady,
        isLoading,
        isGenerating,
        progress,
        error,
        initializeModel,
        generate,
        resetChat
      }}
    >
      {children}
    </WebLlmContext.Provider>
  );
}

export const useWebLlm = () => {
  const context = useContext(WebLlmContext);
  if (!context) {
    throw new Error("useWebLlm must be used within a WebLlmProvider");
  }
  return context;
};
