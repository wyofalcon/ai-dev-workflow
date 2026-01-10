import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext.js";

const WebLlmContext = createContext(null);

export const DEFAULT_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

// User preference for AI mode
const AI_MODE_KEY = "cvstomize_ai_mode"; // "local" | "server" | "auto"
const SERVER_CALL_COUNT_KEY = "cvstomize_server_ai_calls"; // Track server usage for nudges

export function WebLlmProvider({ children }) {
  const { createAuthAxios } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Model loading state
  const [isGenerating, setIsGenerating] = useState(false); // Inference state
  const [progress, setProgress] = useState(null); // { text: string, progress: number }
  const [error, setError] = useState(null);
  const [aiMode, setAiModeState] = useState(() => 
    localStorage.getItem(AI_MODE_KEY) || "auto"
  ); // "local" | "server" | "auto"
  const [hasDeclinedLocalAI, setHasDeclinedLocalAI] = useState(() =>
    localStorage.getItem("cvstomize_declined_local_ai") === "true"
  );
  const [serverCallCount, setServerCallCount] = useState(() =>
    parseInt(localStorage.getItem(SERVER_CALL_COUNT_KEY) || "0", 10)
  );
  const [lastUsedSource, setLastUsedSource] = useState(null); // "local" | "server" for UI feedback
  
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
          localStorage.setItem("cvstomize_llm_cached", "true"); // Mark as cached
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

  // Auto-initialize if previously cached AND user hasn't declined
  useEffect(() => {
    const isCached = localStorage.getItem("cvstomize_llm_cached") === "true";
    const declined = localStorage.getItem("cvstomize_declined_local_ai") === "true";
    if (isCached && !declined && workerRef.current && aiMode !== "server") {
        // Short delay to ensure worker is mounted
        setTimeout(() => initializeModel(), 500);
    }
  }, [initializeModel, aiMode]);

  // Set AI mode preference
  const setAiMode = useCallback((mode) => {
    setAiModeState(mode);
    localStorage.setItem(AI_MODE_KEY, mode);
    if (mode === "server") {
      setHasDeclinedLocalAI(true);
      localStorage.setItem("cvstomize_declined_local_ai", "true");
    }
  }, []);

  // Enable local AI (for when user changes their mind)
  const enableLocalAI = useCallback(() => {
    setHasDeclinedLocalAI(false);
    localStorage.removeItem("cvstomize_declined_local_ai");
    setAiModeState("auto");
    localStorage.setItem(AI_MODE_KEY, "auto");
    initializeModel();
  }, [initializeModel]);

  const generate = useCallback((messages, onUpdate, onDone, onError) => {
    if (!workerRef.current || !isReady) {
      onError?.("Model not ready");
      return;
    }

    setIsGenerating(true);
    setLastUsedSource("local");
    
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

  // Track server AI usage for nudges
  const incrementServerCallCount = useCallback(() => {
    setServerCallCount(prev => {
      const newCount = prev + 1;
      localStorage.setItem(SERVER_CALL_COUNT_KEY, String(newCount));
      return newCount;
    });
  }, []);

  /**
   * Generate with automatic fallback to server
   * Tries local WebLLM first, falls back to Vertex AI if not ready
   */
  const generateWithFallback = useCallback(async (messages, taskType, onUpdate, onDone, onError) => {
    // If local AI is ready AND user prefers local/auto, use it
    if (isReady && aiMode !== "server") {
      setLastUsedSource("local");
      generate(messages, onUpdate, onDone, onError);
      return { source: "local" };
    }

    // Otherwise, fall back to server
    try {
      setIsGenerating(true);
      setLastUsedSource("server");
      incrementServerCallCount();
      
      const authAxios = await createAuthAxios();
      
      const response = await authAxios.post('/ai/generate', {
        messages,
        taskType
      });

      const text = response.data.response;
      onDone?.(text);
      return { source: "server", response: text };
    } catch (err) {
      console.error("Server AI fallback failed:", err);
      onError?.(err.message || "AI generation failed");
      return { source: "error", error: err };
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, aiMode, generate, createAuthAxios, incrementServerCallCount]);

  /**
   * Organize skills with fallback
   * Uses dedicated endpoint for better structured output
   */
  const organizeSkillsWithFallback = useCallback(async (skills, onDone, onError) => {
    // If local AI is ready AND user prefers local/auto, use it
    if (isReady && aiMode !== "server") {
      const prompt = `You are an expert resume optimizer. 
Analyze the following list of skills and group them into logical professional categories.
Also, identify the 5 most high-impact/marketable skills from this list.

Return ONLY a valid JSON object with this structure:
{
  "categories": {
    "Category Name 1": ["Skill A", "Skill B"],
    "Category Name 2": ["Skill C", "Skill D"]
  },
  "topSkills": ["Skill A", "Skill C"]
}

Skills List: ${skills.join(", ")}`;

      generate(
        [{ role: 'user', content: prompt }],
        () => {}, // No streaming needed
        (finalText) => {
          try {
            const jsonMatch = finalText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              onDone?.({ ...result, source: "local" });
            } else {
              throw new Error("Failed to parse AI response");
            }
          } catch (err) {
            onError?.(err.message);
          }
        },
        onError
      );
      return { source: "local" };
    }

    // Server fallback
    try {
      setIsGenerating(true);
      const authAxios = await createAuthAxios();
      
      const response = await authAxios.post('/ai/organize-skills', { skills });
      onDone?.({ ...response.data, source: "server" });
      return { source: "server" };
    } catch (err) {
      console.error("Server skill organization failed:", err);
      onError?.(err.message || "Skill organization failed");
      return { source: "error", error: err };
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, aiMode, generate, createAuthAxios]);

  const resetChat = useCallback(() => {
     if(workerRef.current) {
        workerRef.current.postMessage({ type: "RESET" });
     }
  }, []);

  // Should we show the local AI setup prompt?
  const shouldShowLocalAISetup = !isReady && !isLoading && !hasDeclinedLocalAI && aiMode === "auto";

  // Should we nudge user to enable local AI? (after 3+ server calls)
  const shouldNudgeLocalAI = !isReady && !isLoading && serverCallCount >= 3 && !hasDeclinedLocalAI;

  // Dismiss the nudge (user clicked "maybe later")
  const dismissNudge = useCallback(() => {
    // Reset counter so nudge won't show again for a while
    setServerCallCount(0);
    localStorage.setItem(SERVER_CALL_COUNT_KEY, "0");
  }, []);

  return (
    <WebLlmContext.Provider
      value={{
        isReady,
        isLoading,
        isGenerating,
        progress,
        error,
        aiMode,
        setAiMode,
        hasDeclinedLocalAI,
        enableLocalAI,
        shouldShowLocalAISetup,
        shouldNudgeLocalAI,
        serverCallCount,
        lastUsedSource,
        dismissNudge,
        initializeModel,
        generate,
        generateWithFallback,
        organizeSkillsWithFallback,
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
